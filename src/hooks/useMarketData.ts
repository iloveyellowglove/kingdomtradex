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
      try {
        const res = await fetch('/api/market');
        const json = await res.json();
        if (!json.success || !mountedRef.current) return;

        const ticker = symbol === 'BTC' ? json.btcTicker : json.ethTicker;
        const depth = symbol === 'BTC' ? json.btcDepth : json.ethDepth;
        const tradesArr = symbol === 'BTC' ? (json.btcTrades || []) : [];

        const price = parseFloat(ticker?.lastPrice || '0');
        const asks: OrderBookLevel[] = (depth?.asks || []).map((a: string[]) => ({
          price: parseFloat(a[0]), amount: parseFloat(a[1]),
        }));
        const bids: OrderBookLevel[] = (depth?.bids || []).map((b: string[]) => ({
          price: parseFloat(b[0]), amount: parseFloat(b[1]),
        }));

        const bestAsk = asks.length > 0 ? asks[0].price : 0;
        const bestBid = bids.length > 0 ? bids[0].price : 0;
        const spread = bestAsk - bestBid;
        const spreadPct = bestBid > 0 ? (spread / bestBid) * 100 : 0;

        setData({
          price,
          change24h: parseFloat(ticker?.priceChangePercent || '0'),
          high24h: parseFloat(ticker?.highPrice || '0'),
          low24h: parseFloat(ticker?.lowPrice || '0'),
          volume24h: parseFloat(ticker?.quoteVolume || '0'),
          recentTrades: tradesArr,
          orderBook: { asks, bids },
          spread,
          spreadPct,
          loading: false,
          error: null,
        });
      } catch {
        if (mountedRef.current) {
          setData((prev) => ({ ...prev, error: 'Market data unavailable', loading: false }));
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
