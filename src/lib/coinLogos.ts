export interface CoinLogoInfo {
  name: string;
  logo: string;
}

export const COIN_LOGOS: Record<string, CoinLogoInfo> = {
  BTC:  { name: 'Bitcoin',  logo: 'https://assets.coingecko.com/coins/images/1/standard/bitcoin.png' },
  ETH:  { name: 'Ethereum', logo: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png' },
  USDT: { name: 'Tether',   logo: 'https://assets.coingecko.com/coins/images/325/standard/Tether.png' },
  SOL:  { name: 'Solana',   logo: 'https://assets.coingecko.com/coins/images/4128/standard/solana.png' },
  BNB:  { name: 'BNB',      logo: 'https://assets.coingecko.com/coins/images/825/standard/bnb-icon2_2x.png' },
  XRP:  { name: 'XRP',      logo: 'https://assets.coingecko.com/coins/images/44/standard/xrp-symbol-white-128.png' },
};

export const COINGECKO_ID_MAP: Record<string, string> = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  solana: 'SOL',
  ripple: 'XRP',
  binancecoin: 'BNB',
  tether: 'USDT',
};
