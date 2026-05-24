import { NextResponse } from 'next/server';

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache: Record<string, CacheEntry> = {};
const CACHE_TTL = 10000;

async function cachedFetch(url: string): Promise<unknown> {
  const now = Date.now();
  const entry = cache[url];
  if (entry && now - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  cache[url] = { data, timestamp: now };
  return data;
}

export async function GET() {
  try {
    const [tickerBtc, tickerEth, tradesBtc, depthBtc, depthEth, coingecko] = await Promise.all([
      cachedFetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT'),
      cachedFetch('https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT'),
      cachedFetch('https://api.binance.com/api/v3/trades?symbol=BTCUSDT&limit=20'),
      cachedFetch('https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=10'),
      cachedFetch('https://api.binance.com/api/v3/depth?symbol=ETHUSDT&limit=10'),
      cachedFetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true'),
    ]);

    return NextResponse.json({
      success: true,
      btcTicker: tickerBtc,
      ethTicker: tickerEth,
      btcTrades: tradesBtc,
      btcDepth: depthBtc,
      ethDepth: depthEth,
      coingecko,
      cachedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[market] fetch error:', err);
    return NextResponse.json({
      success: false,
      error: 'Market data unavailable',
    }, { status: 502 });
  }
}
