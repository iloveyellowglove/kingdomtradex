import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { getNowPaymentStatus } from '@/lib/nowpayments';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ txnId: string }> }
) {
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
  const { txnId } = await params;

  const { data: deposits } = await supabase
    .from('deposits')
    .select('id, txn_id, currency, amount, status, created_at, confirmed_at, payment_provider, provider_payment_id')
    .eq('txn_id', txnId)
    .eq('user_id', userId)
    .limit(1);

  if (!deposits || deposits.length === 0) {
    return NextResponse.json({ success: false, error: 'Deposit not found.' }, { status: 404 });
  }

  const deposit = deposits[0];

  // For NOWPayments, fetch live status from provider
  if (deposit.payment_provider === 'nowpayments' && deposit.provider_payment_id) {
    try {
      const paymentId = parseInt(deposit.provider_payment_id);
      if (!isNaN(paymentId)) {
        const status = await getNowPaymentStatus(paymentId);
        const statusMap: Record<string, string> = {
          waiting: 'pending',
          confirming: 'confirming',
          confirmed: 'confirming',
          sending: 'confirming',
          finished: 'completed',
          partially_paid: 'partial',
          failed: 'failed',
          refunded: 'failed',
          expired: 'failed',
        };
        deposit.status = statusMap[status.payment_status] || status.payment_status;
      }
    } catch {
      // Return stored status if API call fails
    }
  }

  return NextResponse.json({
    success: true,
    deposit: {
      id: deposit.id,
      txn_id: deposit.txn_id,
      currency: deposit.currency,
      amount: deposit.amount,
      status: deposit.status,
      created_at: deposit.created_at,
      confirmed_at: deposit.confirmed_at,
    },
  });
}
