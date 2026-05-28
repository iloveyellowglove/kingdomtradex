import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { PlisioClient } from '@/lib/services/plisio-client';
import { PlisioDepositService } from '@/lib/services/plisio-deposit';
import { createNowPayment } from '@/lib/nowpayments';
import { getMinDeposit, getCurrencyById } from '@/lib/currencies';

const VALID_TIERS: Record<string, number> = {
  growth: 60,
  builder: 90,
  kingdom: 120,
  legacy: 180,
};

export async function POST(request: NextRequest) {
  const token = cookies().get('kingdom_session')?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id')
    .eq('session_token', token)
    .limit(1);

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ success: false, error: 'Session expired.' }, { status: 401 });
  }

  const userId = sessions[0].user_id;

  // Fetch user for role-based minimum check
  const { data: users } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .limit(1);

  const userRole = users?.[0]?.role || 'member';

  const { currency, amount, tier, lock_days } = await request.json();
  const currencyId = (currency || 'USDT_TRX').trim();

  const currencyConfig = getCurrencyById(currencyId);
  if (!currencyConfig) {
    return NextResponse.json({ success: false, error: 'Invalid currency.' }, { status: 400 });
  }

  const amt = parseFloat(amount || '0');
  if (!amt || amt <= 0) {
    return NextResponse.json({ success: false, error: 'Amount must be positive.' }, { status: 400 });
  }

  // Validate tier selection
  const tierStr = (tier || '').trim();
  if (!tierStr || !(tierStr in VALID_TIERS)) {
    return NextResponse.json({
      success: false,
      error: `Invalid lock tier. Must be one of: ${Object.keys(VALID_TIERS).join(', ')}.`,
    }, { status: 400 });
  }
  const expectedLockDays = VALID_TIERS[tierStr];
  const lockDaysVal = parseInt(String(lock_days ?? '0'), 10);
  if (lockDaysVal !== expectedLockDays) {
    return NextResponse.json({
      success: false,
      error: `Lock days ${lockDaysVal} does not match tier ${tierStr} (expected ${expectedLockDays}).`,
    }, { status: 400 });
  }

  const minDeposit = getMinDeposit(currencyId, userRole);
  if (amt < minDeposit) {
    return NextResponse.json({
      success: false,
      error: `Minimum deposit is $${minDeposit} USD for ${userRole === 'pastor' ? 'pastors' : 'members'}.`,
    }, { status: 400 });
  }

  const displaySymbol = currencyConfig.symbol;
  const now = new Date().toISOString();

  // Try NOWPayments first
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const orderId = `inv_${userId}_${Date.now()}`;

    const payment = await createNowPayment({
      priceAmount: amt,
      priceCurrency: 'USD',
      payCurrency: currencyConfig.nowpaymentsTicker,
      orderId,
      ipnCallbackUrl: `${appUrl}/api/webhooks/nowpayments`,
    });

    const txnId = `nowpay_${payment.payment_id}`;

    const { data: deposits } = await supabase
      .from('deposits')
      .insert({
        user_id: userId,
        txn_id: txnId,
        txid: txnId,
        currency: displaySymbol,
        amount: amt,
        address: payment.pay_address,
        status: 'pending',
        payment_provider: 'nowpayments',
        provider_payment_id: String(payment.payment_id),
        tier: tierStr,
        lock_days: lockDaysVal,
        created_at: now,
      })
      .select();

    return NextResponse.json({
      success: true,
      deposit_id: deposits?.[0]?.id ?? 0,
      txn_id: txnId,
      address: payment.pay_address,
      pay_amount: payment.pay_amount,
      pay_currency: payment.pay_currency,
      currency: displaySymbol,
      amount: amt,
      expiration: payment.expiration_estimate_date,
    });
  } catch (nowpayErr) {
    console.warn('[create-invoice] NOWPayments failed, trying Plisio fallback:', nowpayErr);

    // Fallback to Plisio
    if (!currencyConfig.plisioCurrency) {
      return NextResponse.json({
        success: false,
        error: 'Payment service temporarily unavailable. Please try again.',
      }, { status: 500 });
    }

    const plisioApiKey = process.env.PLISIO_API_KEY;
    if (!plisioApiKey) {
      return NextResponse.json({
        success: false,
        error: 'Payment service not configured.',
      }, { status: 500 });
    }

    const client = new PlisioClient(plisioApiKey);
    const depositService = new PlisioDepositService(client);

    const addressResult = await depositService.generateUserAddresses(userId);
    if (!addressResult.success || !addressResult.addresses) {
      return NextResponse.json({
        success: false,
        error: (addressResult as { error?: string }).error || 'Failed to generate deposit address.',
      }, { status: 500 });
    }

    const displayCurrency = displaySymbol;
    const address = addressResult.addresses?.[displayCurrency];
    if (!address) {
      return NextResponse.json({
        success: false,
        error: `No deposit address available for ${displayCurrency}.`,
      }, { status: 500 });
    }

    const txnId = `inv_${userId}_${Date.now()}`;

    const { data: plisioDep } = await supabase
      .from('deposits')
      .insert({
        user_id: userId,
        txn_id: txnId,
        txid: txnId,
        currency: displayCurrency,
        amount: amt,
        address,
        status: 'pending',
        payment_provider: 'plisio',
        provider_payment_id: txnId,
        tier: tierStr,
        lock_days: lockDaysVal,
        created_at: now,
      })
      .select();

    return NextResponse.json({
      success: true,
      deposit_id: plisioDep?.[0]?.id ?? 0,
      txn_id: txnId,
      address,
      currency: displayCurrency,
      amount: amt,
    });
  }
}
