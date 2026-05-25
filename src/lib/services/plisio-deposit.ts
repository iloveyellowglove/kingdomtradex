import { createHash } from 'crypto';
import { PlisioClient } from './plisio-client';
import { createServiceClient } from '../supabase/service';
import { getUserById, getUserByPlisioUid, updateUser } from '../db/users';
import { creditUserBalanceWithDepositTotal } from '../db/atomic';

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

    await supabase.from('deposits').insert({
      user_id: user.id,
      txn_id: txnId,
      txid: txnId,
      currency: ourCurrency,
      amount: amount,
      address: walletHash,
      status: 'completed',
      created_at: new Date().toISOString(),
    });

    const { newTotalDeposited } = await creditUserBalanceWithDepositTotal(user.id, amount);

    const updates: Record<string, unknown> = {};

    if (!user.first_deposit_time) {
      updates.first_deposit_time = new Date().toISOString();
    }

    if (user.bonus_locked && newTotalDeposited >= Number(user.minimum_deposit_to_unlock || 100)) {
      updates.bonus_locked = false;
      updates.bonus_unlocked_at = new Date().toISOString();
    }

    if (Object.keys(updates).length > 0) {
      await updateUser(user.id, updates);
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

            const { newTotalDeposited } = await creditUserBalanceWithDepositTotal(user.id, amount);

            const updates: Record<string, unknown> = {};
            if (!user.first_deposit_time) {
              updates.first_deposit_time = new Date().toISOString();
            }
            if (user.bonus_locked && newTotalDeposited >= Number(user.minimum_deposit_to_unlock || 100)) {
              updates.bonus_locked = false;
              updates.bonus_unlocked_at = new Date().toISOString();
            }

            if (Object.keys(updates).length > 0) {
              await updateUser(user.id, updates);
            }

            await supabase.from('deposits').insert({
              user_id: user.id,
              txn_id: txnId,
              txid: txnId,
              currency: ourCurrency,
              amount: amount,
              address: postData.wallet_hash || 'invoice',
              status: 'completed',
              created_at: new Date().toISOString(),
            });
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
