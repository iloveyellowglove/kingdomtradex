import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyNowPaymentsIPNRaw } from '@/lib/nowpayments-verify';
import { processCompletedDeposit } from '@/lib/deposit-processing';
import { executeConversion, createPayout } from '@/lib/nowpayments-custody';
import { createDepositSplit, updateDepositSplit, getDepositSplitByDepositId, getColdWalletXmr } from '@/lib/db/deposit-splits';

function mapStatus(npStatus: string): string {
  switch (npStatus) {
    case 'waiting': return 'pending';
    case 'confirming':
    case 'confirmed':
    case 'sending': return 'confirming';
    case 'finished': return 'completed';
    case 'partially_paid': return 'partial';
    case 'failed':
    case 'refunded':
    case 'expired': return 'failed';
    default: return 'pending';
  }
}

function isUsdtDeposit(payCurrency: string): boolean {
  const upper = payCurrency.toUpperCase();
  return upper.includes('USDT') || upper.includes('UST') || upper === 'USDT.TRC20' || upper === 'USDTTRC20';
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  let body: Record<string, unknown>;

  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Verify HMAC signature
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
  const paymentStatus = String(body.payment_status ?? '').toLowerCase();
  const payCurrency = String(body.pay_currency ?? '');
  const actuallyPaid = parseFloat(String(body.actually_paid ?? '0'));

  if (!paymentId) {
    return NextResponse.json({ error: 'Missing payment_id' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const internalStatus = mapStatus(paymentStatus);

  // Find deposit by provider_payment_id
  const { data: deposits } = await supabase
    .from('deposits')
    .select('id, user_id, txn_id, currency, amount, status, payment_provider, provider_payment_id')
    .eq('provider_payment_id', paymentId)
    .eq('payment_provider', 'nowpayments')
    .limit(1);

  if (!deposits || deposits.length === 0) {
    console.warn('[nowpayments-ipn] No deposit found for payment_id:', paymentId);
    return NextResponse.json({ success: false, error: 'Deposit not found' }, { status: 404 });
  }

  const deposit = deposits[0];
  const depositAmount = actuallyPaid > 0 ? actuallyPaid : Number(deposit.amount);

  // Update deposit status
  if (deposit.status !== 'completed') {
    await supabase
      .from('deposits')
      .update({
        status: internalStatus,
        ...(internalStatus === 'completed' ? { completed_at: new Date().toISOString() } : {}),
      })
      .eq('id', deposit.id);
  }

  // Process completed deposits (credit user, create lock, distribute commissions)
  let depositResult;
  if (internalStatus === 'completed') {
    depositResult = await processCompletedDeposit({
      userId: deposit.user_id,
      txnId: deposit.txn_id,
      currency: deposit.currency,
      amount: depositAmount,
      address: payCurrency,
      paymentProvider: 'nowpayments',
      providerPaymentId: paymentId,
    });
  }

  // --- 70/30 USDT-to-XMR Auto-Split ---
  // Only run for USDT deposits that are completed
  if (internalStatus === 'completed' && isUsdtDeposit(payCurrency)) {
    // Idempotency check — skip if already split
    const existingSplit = await getDepositSplitByDepositId(deposit.id);
    if (!existingSplit) {
      try {
        await processUsdtToXmrSplit(deposit.id, depositAmount);
      } catch (splitErr) {
        console.error('[nowpayments-ipn] XMR split failed for deposit', deposit.id, ':', splitErr);
        return NextResponse.json({
          ...(depositResult || { success: true }),
          split_error: splitErr instanceof Error ? splitErr.message : 'Split failed',
        });
      }
    }
  }

  // --- Trigger referral deposit bonus commission ---
  if (internalStatus === 'completed' && depositResult?.success) {
    try {
      await triggerReferralCommission(deposit.user_id, depositAmount);
    } catch (refErr) {
      console.error('[nowpayments-ipn] Referral commission trigger failed for deposit', deposit.id, ':', refErr);
      // Non-fatal: deposit already credited
    }
  }

  return NextResponse.json(depositResult || { success: true, message: 'Status: ' + internalStatus });
}

async function processUsdtToXmrSplit(depositId: number, totalAmount: number): Promise<void> {
  const xmrAmount = Math.round(totalAmount * 0.7 * 1e8) / 1e8; // 70% to XMR
  const usdtRetained = Math.round(totalAmount * 0.3 * 1e8) / 1e8; // 30% retained

  const coldWallet = await getColdWalletXmr();
  if (!coldWallet) {
    throw new Error('XMR cold wallet not configured. Set COLD_WALLET_XMR env var or cold_wallet_xmr in settings.');
  }

  // Log pending split
  const split = await createDepositSplit({
    deposit_id: depositId,
    total_amount: totalAmount,
    xmr_amount: xmrAmount,
    usdt_retained: usdtRetained,
    cold_wallet_address: coldWallet,
  });

  console.log('[nowpayments-ipn] Created deposit_split id:', split.id);

  // Step 1: Convert USDT to XMR via Custody API
  await updateDepositSplit(split.id, { status: 'converting' });

  let conversion;
  try {
    conversion = await executeConversion('USDT', 'XMR', xmrAmount);
    console.log('[nowpayments-ipn] USDT→XMR conversion executed:', conversion.conversion_id, 'amount:', xmrAmount);
  } catch (convErr) {
    const errMsg = convErr instanceof Error ? convErr.message : 'Conversion failed';
    await updateDepositSplit(split.id, { status: 'failed', error_message: errMsg });
    throw convErr;
  }

  // Step 2: Payout XMR to cold wallet
  let payout;
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    payout = await createPayout({
      address: coldWallet,
      currency: 'XMR',
      amount: conversion.to_amount,
      ipnCallbackUrl: `${appUrl}/api/webhooks/nowpayments-ipn`,
    });
    console.log('[nowpayments-ipn] XMR payout created:', payout.payout_id, 'tx_hash:', payout.tx_hash);
  } catch (payoutErr) {
    const errMsg = payoutErr instanceof Error ? payoutErr.message : 'Payout failed';
    await updateDepositSplit(split.id, {
      status: 'failed',
      error_message: errMsg,
    });
    throw payoutErr;
  }

  // Mark complete
  await updateDepositSplit(split.id, {
    status: 'completed',
    xmr_tx_hash: payout.tx_hash || null,
    completed_at: new Date().toISOString(),
  });

  console.log('[nowpayments-ipn] Split complete for deposit', depositId,
    '| XMR:', xmrAmount, '→', coldWallet,
    '| USDT retained:', usdtRetained);
}

async function triggerReferralCommission(sourceUserId: number, depositAmount: number): Promise<void> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc('credit_referral_commission', {
    p_source_user_id: sourceUserId,
    p_referral_type: 'deposit_bonus',
    p_source_amount: depositAmount,
  });

  if (error) {
    console.error('[nowpayments-ipn] credit_referral_commission RPC error:', error.message);
    throw new Error(error.message);
  }

  const result = (data as Array<{ commissions_created: number; total_paid_out: number }>)?.[0];
  if (result) {
    console.log('[nowpayments-ipn] Referral commissions:', result.commissions_created, 'created, total:', result.total_paid_out);
  }
}
