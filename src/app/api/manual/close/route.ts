import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { creditDummyBalance } from '@/lib/db/dummy-atomic';
import { timingSafeEqual } from '@/lib/auth/csrf';
import { PAIRS } from '@/lib/pairs';

const BINANCE = 'https://api.binance.com/api/v3';

export async function POST(request: NextRequest) {
  const token = cookies().get('__Host-kingdom_session')?.value;
  if (!token || token.length !== 64) {
    return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id, csrf_token')
    .eq('session_token', token)
    .limit(1);

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ success: false, error: 'Session expired.' }, { status: 401 });
  }

  const session = sessions[0];
  const csrfHeader = request.headers.get('x-csrf-token');
  if (!csrfHeader || !timingSafeEqual(csrfHeader, session.csrf_token)) {
    return NextResponse.json({ success: false, error: 'Invalid CSRF token.' }, { status: 403 });
  }

  const { tradeId } = await request.json();
  if (!tradeId) {
    return NextResponse.json({ success: false, error: 'tradeId required.' }, { status: 400 });
  }

  // Fetch the open trade
  const { data: trades } = await supabase
    .from('manual_trades')
    .select('*')
    .eq('id', tradeId)
    .eq('user_id', session.user_id)
    .eq('status', 'open')
    .limit(1);

  if (!trades || trades.length === 0) {
    return NextResponse.json({ success: false, error: 'Open position not found.' }, { status: 404 });
  }

  const trade = trades[0];

  // Fetch current market price
  const pairKey = Object.entries(PAIRS).find(([, info]) => info.display === trade.pair)?.[0];
  if (!pairKey) {
    return NextResponse.json({ success: false, error: 'Pair not found.' }, { status: 400 });
  }
  const binanceSymbol = PAIRS[pairKey].binance;

  let currentPrice: number;
  try {
    const priceRes = await fetch(`${BINANCE}/ticker/price?symbol=${binanceSymbol}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!priceRes.ok) throw new Error(`Binance HTTP ${priceRes.status}`);
    const priceData = await priceRes.json();
    currentPrice = parseFloat(priceData.price);
    if (!currentPrice || currentPrice <= 0) throw new Error('Invalid price');
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch market price.' }, { status: 502 });
  }

  const amount = Number(trade.amount);
  const entryPrice = Number(trade.entry_price);
  const grossProceeds = amount * currentPrice;
  const fee = Math.round(grossProceeds * 0.001 * 1e8) / 1e8;
  const proceeds = Math.round((grossProceeds - fee) * 1e8) / 1e8;
  const pnl = Math.round((proceeds - (amount * entryPrice)) * 1e8) / 1e8;

  // Credit dummy balance
  try {
    await creditDummyBalance(session.user_id, proceeds);
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to update balance.' }, { status: 500 });
  }

  // Update trade as closed
  await supabase
    .from('manual_trades')
    .update({
      status: 'closed',
      exit_price: currentPrice,
      pnl,
      fee: Number(trade.fee) + fee,
      closed_at: new Date().toISOString(),
    })
    .eq('id', trade.id);

  return NextResponse.json({ success: true });
}
