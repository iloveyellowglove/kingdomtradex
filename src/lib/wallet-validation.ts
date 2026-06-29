const WALLET_PATTERNS: Record<string, RegExp> = {
  BTC: /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/,
  ETH: /^0x[0-9a-fA-F]{40}$/,
  USDT_TRC20: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
  USDT_ERC20: /^0x[0-9a-fA-F]{40}$/,
  XMR: /^[48][0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/,
  LTC: /^(L|M|ltc1)[a-zA-HJ-NP-Z0-9]{25,62}$/,
  SOL: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  TRX: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
  DOGE: /^D[1-9A-HJ-NP-Za-km-z]{33}$/,
};

export function validateWalletAddress(address: string, currency: string): boolean {
  const pattern = WALLET_PATTERNS[currency.toUpperCase()];
  if (!pattern) {
    // Unknown currency: require reasonable length
    return address.length >= 20 && address.length <= 128;
  }
  return pattern.test(address);
}
