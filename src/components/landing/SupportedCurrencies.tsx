'use client';

import { DEPOSIT_CURRENCIES } from '@/lib/currencies';

const ICON_CDN = 'https://assets.coingecko.com/coins/images';

const iconMap: Record<string, string> = {
  'tether': '325/small/Tether.png',
  'usd-coin': '6319/small/usdc.png',
  'bitcoin': '1/small/bitcoin.png',
  'ethereum': '279/small/ethereum.png',
  'solana': '4128/small/solana.png',
  'dogecoin': '5/small/dogecoin.png',
  'litecoin': '2/small/litecoin.png',
  'ripple': '44/small/xrp.png',
  'cardano': '975/small/cardano.png',
  'tron': '1094/small/tron.png',
  'polygon-ecosystem-token': '4713/small/polygon.png',
  'polkadot': '12171/small/polkadot.png',
  'bitcoin-cash': '780/small/bitcoin-cash.png',
  'shiba-inu': '11939/small/shiba.png',
  'avalanche-2': '12559/small/avalanche.png',
  'chainlink': '877/small/chainlink.png',
  'uniswap': '12504/small/uniswap.png',
  'kaspa': '25701/small/kaspa.png',
};

function coinIconUrl(slug: string): string {
  const path = iconMap[slug];
  if (path) return `${ICON_CDN}/${path}`;
  return `https://cryptologos.cc/logos/${slug}-logo.png`;
}

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
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
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
