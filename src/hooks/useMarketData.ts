'use client';

import { useState, useEffect, useRef } from 'react';

interface Trade {
  id: number;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
}

interface OrderBookLevel {
  price: number;
  amount: number;
}

interface MarketData {
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  recentTrades: Trade[];
  orderBook: { asks: OrderBookLevel[]; bids: OrderBookLevel[] };
  spread: number;
  spreadPct: number;
  loading: boolean;
  error: string | null;
}

const BINANCE = 'https://api.binance.com/api/v3';
const POLL_INTERVAL = 10000;

export function useMarketData(symbol: string): MarketData {
  const [data, setData] = useState<MarketData>({
    price: 0, change24h: 0, high24h: 0, low24h: 0, volume24h: 0,
    recentTrades: [], orderBook: { asks: [], bids: [] },
    spread: 0, spreadPct: 0, loading: true, error: null,
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    async function fetchData() {
      const p = symbol === 'BTC' ? 'BTCUSDT' : 'ETHUSDT';

      try {
        const [tickerRes, tradesRes, depthRes] = await Promise.all([
          fetch(`${BINANCE}/ticker/24hr?symbol=${p}`),
          fetch(`${BINANCE}/trades?symbol=${p}&limit=20`),
          fetch(`${BINANCE}/depth?symbol=${p}&limit=10`),
        ]);

        if (!tickerRes.ok) throw new Error('Failed to fetch ticker');

        const ticker = await tickerRes.json();
        const tradesArr: Trade[] = tradesRes.ok ? await tradesRes.json() : [];
        const depth = depthRes.ok ? await depthRes.json() : { asks: [], bids: [] };

        const asks: OrderBookLevel[] = (depth.asks || []).map((a: string[]) => ({
          price: parseFloat(a[0]), amount: parseFloat(a[1]),
        }));
        const bids: OrderBookLevel[] = (depth.bids || []).map((b: string[]) => ({
          price: parseFloat(b[0]), amount: parseFloat(b[1]),
        }));

        const bestAsk = asks.length > 0 ? asks[0].price : 0;
        const bestBid = bids.length > 0 ? bids[0].price : 0;
        const spread = bestAsk - bestBid;
        const spreadPct = bestBid > 0 ? (spread / bestBid) * 100 : 0;

        setData({
          price: parseFloat(ticker.lastPrice || '0'),
          change24h: parseFloat(ticker.priceChangePercent || '0'),
          high24h: parseFloat(ticker.highPrice || '0'),
          low24h: parseFloat(ticker.lowPrice || '0'),
          volume24h: parseFloat(ticker.quoteVolume || '0'),
          recentTrades: tradesArr,
          orderBook: { asks, bids },
          spread,
          spreadPct,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error('[useMarketData] fetch error:', err);
        if (mountedRef.current) {
          setData((prev) => prev.loading
            ? { ...prev, error: 'Market data unavailable', loading: false }
            : prev
          );
        }
      }
    }

    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [symbol]);

  return data;
}
