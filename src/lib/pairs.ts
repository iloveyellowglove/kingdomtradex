export interface PairInfo {
  binance: string;    // Binance REST API symbol (e.g. BTCUSDT)
  tvSymbol: string;   // TradingView symbol (e.g. BINANCE:BTCUSDT)
  coin: string;       // Base asset (e.g. BTC)
  quote: string;      // Quote asset (e.g. USDT)
  display: string;    // Display label (e.g. BTC/USDT)
}

export const PAIRS: Record<string, PairInfo> = {
  BTC:   { binance: 'BTCUSDT',  tvSymbol: 'BINANCE:BTCUSDT',  coin: 'BTC', quote: 'USDT', display: 'BTC/USDT' },
  ETH:   { binance: 'ETHUSDT',  tvSymbol: 'BINANCE:ETHUSDT',  coin: 'ETH', quote: 'USDT', display: 'ETH/USDT' },
  SOL:   { binance: 'SOLUSDT',  tvSymbol: 'BINANCE:SOLUSDT',  coin: 'SOL', quote: 'USDT', display: 'SOL/USDT' },
  BNB:   { binance: 'BNBUSDT',  tvSymbol: 'BINANCE:BNBUSDT',  coin: 'BNB', quote: 'USDT', display: 'BNB/USDT' },
  XRP:   { binance: 'XRPUSDT',  tvSymbol: 'BINANCE:XRPUSDT',  coin: 'XRP', quote: 'USDT', display: 'XRP/USDT' },
  ETHBTC: { binance: 'ETHBTC',  tvSymbol: 'BINANCE:ETHBTC',   coin: 'ETH', quote: 'BTC',  display: 'ETH/BTC' },
};

export const PAIR_LIST = Object.entries(PAIRS).map(([key, info]) => ({ key, ...info }));
