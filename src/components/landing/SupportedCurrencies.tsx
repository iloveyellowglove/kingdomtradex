'use client';

import { DEPOSIT_CURRENCIES, coinIconUrl } from '@/lib/currencies';

export default function SupportedCurrencies() {
  const uniqueCoins = DEPOSIT_CURRENCIES.reduce((acc, c) => {
    if (!acc.find(x => x.iconSlug === c.iconSlug)) {
      acc.push(c);
    }
    return acc;
  }, [] as typeof DEPOSIT_CURRENCIES);

  return (
    <section className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Deposit in 21+ Cryptocurrencies</h2>
        <p className="text-text-muted">Fund your account with any of these supported cryptocurrencies</p>
      </div>

      <div className="card max-w-3xl mx-auto p-8">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-6">
          {uniqueCoins.map((coin) => (
            <div key={coin.iconSlug} className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coinIconUrl(coin.iconSlug)}
                alt={coin.name}
                width={40}
                height={40}
                className="rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const next = target.nextElementSibling as HTMLElement | null;
                  if (next) next.style.display = 'flex';
                }}
              />
              <div className="hidden w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                {coin.symbol}
              </div>
              <span className="text-xs text-text-muted text-center">{coin.symbol}</span>
            </div>
          ))}
        </div>

        <p className="text-text-muted text-xs text-center mt-6">
          Deposit in any supported currency. Minimum $100 for members. Pastors: deposit $200 to unlock your $100 bonus (50% instant return).
        </p>
      </div>

      {/* Section divider */}
      <div className="mx-auto mt-12 max-w-lg" style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.15), transparent)' }} />
    </section>
  );
}
