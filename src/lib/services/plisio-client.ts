import crypto from 'crypto';

const PLISIO_API = 'https://api.plisio.net/api/v1';

export class PlisioClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async get(endpoint: string, params: Record<string, string> = {}) {
    params.api_key = this.apiKey;
    const qs = new URLSearchParams(params).toString();
    const url = `${PLISIO_API}${endpoint}?${qs}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    return res.json();
  }

  verifyCallback(postData: Record<string, string>): boolean {
    const providedHash = postData.verify_hash;
    if (!providedHash) return false;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { verify_hash: _vh, ...rest } = postData;
    const sorted: Record<string, string> = {};
    Object.keys(rest).sort().forEach((k) => {
      sorted[k] = rest[k];
    });

    const dataString = JSON.stringify(sorted);

    // Try SHA1 first (Plisio legacy), then SHA256 (current Plisio default)
    for (const algo of ['sha1', 'sha256']) {
      const computedHash = crypto
        .createHmac(algo, this.apiKey)
        .update(dataString)
        .digest('hex');
      if (timingSafeEqual(computedHash, providedHash)) return true;
    }

    return false;
  }

  async createDepositAddresses(uid: string, currencies: string[]) {
    const result = await this.get('/shops/deposit/new', {
      uid,
      psys_cid: currencies.join(','),
    });

    if (result.status !== 'success') {
      return { success: false, error: result.data?.message || 'Unknown error' };
    }

    let data = result.data;
    if (data.hash) {
      data = [data];
    }

    const addresses: Record<string, string> = {};
    for (const entry of data) {
      addresses[entry.psys_cid] = entry.hash;
    }

    return { success: true, addresses };
  }

  async withdraw(currency: string, address: string, amount: number, feePlan = 'normal') {
    return this.get('/operations/withdraw', {
      currency,
      type: 'cash_out',
      to: address,
      amount: amount.toFixed(8),
      feePlan,
    });
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
