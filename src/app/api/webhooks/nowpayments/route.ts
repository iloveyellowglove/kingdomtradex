import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyNowPaymentsIPNRaw } from '@/lib/nowpayments-verify';
import { processCompletedDeposit } from '@/lib/deposit-processing';

// Map NOWPayments status to our internal status
function mapStatus(npStatus: string): string {
  switch (npStatus) {
    case 'waiting':
      return 'pending';
    case 'confirming':
    case 'confirmed':
    case 'sending':
      return 'confirming';
    case 'finished':
      return 'completed';
    case 'partially_paid':
      return 'partial';
    case 'failed':
    case 'refunded':
    case 'expired':
      return 'failed';
    default:
      return 'pending';
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  let body: Record<string, unknown>;

  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const signature = request.headers.get('x-nowpayments-sig');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  let validSignature: boolean;
  try {
    validSignature = verifyNowPaymentsIPNRaw(rawBody, signature);
  } catch {
    return NextResponse.json({ error: 'Signature verification unavailable' }, { status: 500 });
  }

  if (!validSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  const paymentId = String(body.payment_id ?? '');
  const paymentStatus = String(body.payment_status ?? '');
  const payCurrency = String(body.pay_currency ?? '');
  const actuallyPaid = parseFloat(String(body.actually_paid ?? '0'));

  if (!paymentId) {
    return NextResponse.json({ error: 'Missing payment_id' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Find deposit by provider_payment_id
  const { data: deposits } = await supabase
    .from('deposits')
    .select('id, user_id, txn_id, currency, amount, status, payment_provider, provider_payment_id')
    .eq('provider_payment_id', paymentId)
    .eq('payment_provider', 'nowpayments')
    .limit(1);

  if (!deposits || deposits.length === 0) {
    return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
  }

  const deposit = deposits[0];
  const internalStatus = mapStatus(paymentStatus);

  // If already completed, skip
  if (deposit.status === 'completed') {
    return NextResponse.json({ success: true, message: 'Already completed.' });
  }

  // Update deposit status
  await supabase
    .from('deposits')
    .update({
      status: internalStatus,
      ...(internalStatus === 'completed' ? { completed_at: new Date().toISOString() } : {}),
    })
    .eq('id', deposit.id);

  // Process completed deposits
  if (internalStatus === 'completed') {
    // Check for duplicate processing via existing deposit_lock
    const { data: existingLock } = await supabase
      .from('deposit_locks')
      .select('id')
      .eq('deposit_id', deposit.id)
      .limit(1);

    if (existingLock && existingLock.length > 0) {
      return NextResponse.json({ success: true, message: 'Already processed.' });
    }

    const result = await processCompletedDeposit({
      userId: deposit.user_id,
      txnId: deposit.txn_id,
      currency: deposit.currency,
      amount: actuallyPaid > 0 ? actuallyPaid : Number(deposit.amount),
      address: payCurrency,
      paymentProvider: 'nowpayments',
      providerPaymentId: paymentId,
    });

    return NextResponse.json(result);
  }

  return NextResponse.json({
    success: true,
    message: 'Status updated to: ' + internalStatus,
  });
}
