import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { debitDummyBalance } from '@/lib/db/dummy-atomic';
import { timingSafeEqual } from '@/lib/auth/csrf';
import { PAIRS } from '@/lib/pairs';

const ALLOWED_PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
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

  const { pair, usdtAmount } = await request.json();

  if (!pair || !ALLOWED_PAIRS.includes(pair)) {
    return NextResponse.json({ success: false, error: 'Invalid pair. Allowed: BTC/USDT, ETH/USDT, SOL/USDT.' }, { status: 400 });
  }

  const amt = parseFloat(usdtAmount || '0');
  if (!amt || amt <= 0) {
    return NextResponse.json({ success: false, error: 'Amount must be positive.' }, { status: 400 });
  }

  // Fetch current price from Binance
  const pairKey = Object.entries(PAIRS).find(([, info]) => info.display === pair)?.[0];
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

  const fee = Math.round(amt * 0.001 * 1e8) / 1e8;
  const cryptoAmount = Math.round(((amt - fee) / currentPrice) * 1e8) / 1e8;

  if (cryptoAmount <= 0) {
    return NextResponse.json({ success: false, error: 'Amount too small after fees.' }, { status: 400 });
  }

  // Atomic debit from dummy balance
  try {
    await debitDummyBalance(session.user_id, amt);
  } catch {
    return NextResponse.json({ success: false, error: 'Insufficient trading funds.' }, { status: 400 });
  }

  // Insert manual trade
  const { error: insertErr } = await supabase.from('manual_trades').insert({
    user_id: session.user_id,
    pair,
    side: 'BUY',
    amount: cryptoAmount,
    entry_price: currentPrice,
    status: 'open',
    fee,
  });

  if (insertErr) {
    return NextResponse.json({ success: false, error: 'Failed to record trade.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
