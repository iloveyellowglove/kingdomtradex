'use client';

import { useEffect, useState, useRef } from 'react';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
}

const COINS = ['bitcoin', 'ethereum', 'solana', 'ripple', 'binancecoin'];
const FALLBACK: Coin[] = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 87250.32, price_change_percentage_24h: 2.15 },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 4120.18, price_change_percentage_24h: 1.83 },
  { id: 'solana', symbol: 'sol', name: 'Solana', current_price: 185.64, price_change_percentage_24h: -0.72 },
  { id: 'ripple', symbol: 'xrp', name: 'XRP', current_price: 2.48, price_change_percentage_24h: 3.91 },
  { id: 'binancecoin', symbol: 'bnb', name: 'BNB', current_price: 642.10, price_change_percentage_24h: 0.55 },
];

function PriceCard({ coin }: { coin: Coin }) {
  const prevPrice = useRef(coin.current_price);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (coin.current_price > prevPrice.current) setFlash('up');
    else if (coin.current_price < prevPrice.current) setFlash('down');
    prevPrice.current = coin.current_price;
    const t = setTimeout(() => setFlash(null), 600);
    return () => clearTimeout(t);
  }, [coin.current_price]);

  const change = coin.price_change_percentage_24h;
  const isPositive = change >= 0;

  return (
    <div className="card p-5 text-center transition-all hover:border-temple-gold" style={{ transition: 'border-color 0.3s' }}>
      <p className="text-text-muted text-xs uppercase tracking-wider mb-2">{coin.name}</p>
      <p className={`text-xl font-bold mb-1 transition-colors ${
        flash === 'up' ? 'text-success' : flash === 'down' ? 'text-danger' : 'text-white'
      }`}>
        ${coin.current_price.toLocaleString('en-US', coin.current_price < 10 ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <span className={`text-sm font-semibold ${isPositive ? 'text-success' : 'text-danger'}`}>
        {isPositive ? '+' : ''}{change.toFixed(2)}%
      </span>
    </div>
  );
}

export default function LiveMarkets() {
  const [coins, setCoins] = useState<Coin[]>(FALLBACK);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchPrices = async () => {
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COINS.join(',')}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`,
          { cache: 'no-store' }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && Array.isArray(data)) setCoins(data);
      } catch { /* keep fallback */ }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return (
    <section ref={sectionRef} className={`mb-12 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Live Market Prices</h2>
        <p className="text-text-muted">Real-time cryptocurrency prices from CoinGecko</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {coins.map((coin) => (
          <PriceCard key={coin.id} coin={coin} />
        ))}
      </div>
    </section>
  );
}
