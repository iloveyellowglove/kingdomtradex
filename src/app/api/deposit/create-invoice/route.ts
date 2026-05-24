import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { PlisioClient } from '@/lib/services/plisio-client';
import { PlisioDepositService } from '@/lib/services/plisio-deposit';

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
  const { currency, amount } = await request.json();

  const currencyUpper = (currency || 'USDT').toUpperCase();
  if (!['BTC', 'ETH', 'USDT'].includes(currencyUpper)) {
    return NextResponse.json({ success: false, error: 'Invalid currency.' }, { status: 400 });
  }

  const amt = parseFloat(amount || '0');
  if (!amt || amt <= 0) {
    return NextResponse.json({ success: false, error: 'Amount must be positive.' }, { status: 400 });
  }

  const apiKey = process.env.PLISIO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'Payment service not configured.' }, { status: 500 });
  }

  const client = new PlisioClient(apiKey);
  const depositService = new PlisioDepositService(client);

  const addressResult = await depositService.generateUserAddresses(userId);
  if (!addressResult.success || !addressResult.addresses) {
    return NextResponse.json({ success: false, error: (addressResult as { error?: string }).error || 'Failed to generate deposit address.' }, { status: 500 });
  }

  const address = addressResult.addresses?.[currencyUpper];
  if (!address) {
    return NextResponse.json({ success: false, error: `No deposit address available for ${currencyUpper}.` }, { status: 500 });
  }

  const txnId = `inv_${userId}_${Date.now()}`;
  const now = new Date().toISOString();

  const { data: deposit } = await supabase
    .from('deposits')
    .insert({
      user_id: userId,
      txn_id: txnId,
      txid: txnId,
      currency: currencyUpper,
      amount: amt,
      address,
      status: 'pending',
      created_at: now,
    })
    .select();

  return NextResponse.json({
    success: true,
    deposit_id: deposit?.[0]?.id ?? 0,
    txn_id: txnId,
    address,
    currency: currencyUpper,
    amount: amt,
  });
}
