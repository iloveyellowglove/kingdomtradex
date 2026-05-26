import { createHash } from 'crypto';
import { PlisioClient } from './plisio-client';
import { createServiceClient } from '../supabase/service';
import { getUserById, getUserByPlisioUid, updateUser } from '../db/users';
import { processDepositAtomic } from '../db/atomic';
import { distributeCommissions } from '../db/commissions';

export class PlisioDepositService {
  private client: PlisioClient;

  constructor(client: PlisioClient) {
    this.client = client;
  }

  async generateUserAddresses(userId: number) {
    const user = await getUserById(userId);
    if (!user) {
      return { success: false, error: 'User not found.' };
    }

    const uid = user.plisio_uid || `user_${userId}_${createHash('md5').update(user.email).digest('hex').substring(0, 8)}`;
    if (!user.plisio_uid) {
      await updateUser(userId, { plisio_uid: uid });
    }

    if (user.plisio_btc_address && user.plisio_eth_address && user.plisio_usdt_address) {
      return {
        success: true,
        addresses: {
          BTC: user.plisio_btc_address,
          ETH: user.plisio_eth_address,
          USDT: user.plisio_usdt_address,
        },
        from_cache: true,
      };
    }

    const result = await this.client.createDepositAddresses(uid, ['BTC', 'ETH', 'USDT_TRX']);
    if (!result.success) return result;

    const updates: Record<string, string> = {};
    const addressMap: Record<string, string> = {
      BTC: 'plisio_btc_address',
      ETH: 'plisio_eth_address',
      USDT_TRX: 'plisio_usdt_address',
    };

    const addresses: Record<string, string> = {};
    for (const [psysCid, hash] of Object.entries(result.addresses!)) {
      if (addressMap[psysCid]) {
        updates[addressMap[psysCid]] = hash;
        const displayCurrency = psysCid === 'USDT_TRX' ? 'USDT' : psysCid;
        addresses[displayCurrency] = hash;
      }
    }

    if (Object.keys(updates).length > 0) {
      await updateUser(userId, updates);
    }

    return { success: true, addresses, from_cache: false };
  }

  async handleCallback(postData: Record<string, string>) {
    if (!this.client.verifyCallback(postData)) {
      return { success: false, error: 'Invalid callback signature.' };
    }

    const ipnType = postData.ipn_type || '';
    if (ipnType !== 'pay_in') {
      return { success: false, error: `Not a deposit callback (ipn_type=${ipnType}).` };
    }

    const status = postData.status || '';
    if (status !== 'completed') {
      return { success: true, message: 'Deposit not yet completed. Status: ' + status };
    }

    const uid = postData.deposit_uid || '';
    const txnId = postData.txn_id || '';
    const currency = postData.currency || '';
    const amount = parseFloat(postData.amount || '0');
    const walletHash = postData.wallet_hash || '';

    if (!uid || !txnId) {
      return { success: false, error: 'Missing uid or txn_id in callback.' };
    }

    const user = await getUserByPlisioUid(uid);
    if (!user) {
      return { success: false, error: 'User not found for uid: ' + uid };
    }

    const supabase = createServiceClient();
    const { data: existing } = await supabase
      .from('deposits')
      .select('id')
      .eq('txn_id', txnId)
      .limit(1);

    if (existing && existing.length > 0) {
      return { success: true, message: 'Duplicate transaction. Already processed.' };
    }

    const ourCurrency = mapCurrency(currency);

    // UNIQUE constraint on txn_id provides defense-in-depth against race conditions
    const { data: depositRows, error: insertErr } = await supabase.from('deposits').insert({
      user_id: user.id,
      txn_id: txnId,
      txid: txnId,
      currency: ourCurrency,
      amount: amount,
      address: walletHash,
      status: 'completed',
      created_at: new Date().toISOString(),
    }).select();

    // If constraint violation (race condition), treat as duplicate
    if (insertErr || !depositRows || depositRows.length === 0) {
      return { success: true, message: 'Duplicate transaction. Already processed.' };
    }

    const depositId = depositRows[0].id as number | undefined;

    await processDepositAtomic(user.id, amount);

    if (depositId) {
      try {
        await distributeCommissions(user.id, amount, depositId);
      } catch (commErr) {
        console.error('[plisio-deposit] commission distribution failed:', commErr);
      }
    }

    return {
      success: true,
      message: 'Deposit credited.',
      user_id: user.id,
      amount,
      currency: ourCurrency,
    };
  }

  async handleInvoiceCallback(postData: Record<string, string>) {
    if (!this.client.verifyCallback(postData)) {
      return { success: false, error: 'Invalid callback signature.' };
    }

    const status = postData.status || '';
    const orderNumber = postData.order_number || '';
    const txnId = postData.txn_id || '';
    const amount = parseFloat(postData.amount || '0');
    const currency = postData.currency || '';

    if (status === 'completed') {
      const m = orderNumber.match(/^inv_(\d+)_/);
      if (m) {
        const userId = parseInt(m[1]);
        const user = await getUserById(userId);
        if (user) {
          const supabase = createServiceClient();
          const { data: existing } = await supabase
            .from('deposits')
            .select('id')
            .eq('txn_id', txnId)
            .limit(1);

          if (!existing || existing.length === 0) {
            const ourCurrency = mapCurrency(currency);

            // Insert deposit record first (UNIQUE constraint prevents duplicates)
            const { data: invDepRows, error: invInsertErr } = await supabase.from('deposits').insert({
              user_id: user.id,
              txn_id: txnId,
              txid: txnId,
              currency: ourCurrency,
              amount: amount,
              address: postData.wallet_hash || 'invoice',
              status: 'completed',
              created_at: new Date().toISOString(),
            }).select();

            if (invInsertErr || !invDepRows || invDepRows.length === 0) {
              return { success: true, message: 'Duplicate transaction. Already processed.' };
            }

            const invDepositId = invDepRows[0].id as number | undefined;

            await processDepositAtomic(user.id, amount);

            if (invDepositId) {
              try {
                await distributeCommissions(user.id, amount, invDepositId);
              } catch (commErr) {
                console.error('[plisio-deposit] invoice commission distribution failed:', commErr);
              }
            }
          }
        }
      }
    }

    return { success: true, message: 'Invoice callback processed. Status: ' + status };
  }
}

function mapCurrency(plisioCurrency: string): string {
  const map: Record<string, string> = { BTC: 'BTC', ETH: 'ETH', USDT_TRX: 'USDT', USDT: 'USDT' };
  for (const [key, val] of Object.entries(map)) {
    if (plisioCurrency.startsWith(key)) return val;
  }
  return plisioCurrency;
}
