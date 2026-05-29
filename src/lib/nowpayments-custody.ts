const BASE_URL = 'https://api.nowpayments.io/v1';

interface AuthResponse {
  token: string;
}

interface ConversionEstimate {
  estimated_amount: number;
  fee: number;
  rate: number;
}

interface ConversionResult {
  conversion_id: string;
  from_currency: string;
  to_currency: string;
  from_amount: number;
  to_amount: number;
  fee: number;
  status: string;
}

interface PayoutResult {
  payout_id: string;
  status: string;
  amount: number;
  currency: string;
  address: string;
  tx_hash?: string;
  created_at: string;
}

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getAuthToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const email = process.env.NOWPAYMENTS_EMAIL;
  const password = process.env.NOWPAYMENTS_PASSWORD;

  if (!email || !password) {
    throw new Error('NOWPAYMENTS_EMAIL and NOWPAYMENTS_PASSWORD required for custody API');
  }

  const res = await fetch(`${BASE_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`NOWPayments auth failed (${res.status}): ${errBody}`);
  }

  const data: AuthResponse = await res.json();
  cachedToken = data.token;
  tokenExpiry = Date.now() + 4 * 60 * 1000; // 4 min TTL (API gives 5 min)
  return cachedToken;
}

export async function estimateConversion(
  fromCurrency: string,
  toCurrency: string,
  amount: number
): Promise<ConversionEstimate> {
  const token = await getAuthToken();

  const res = await fetch(
    `${BASE_URL}/currency-convert/estimate?from_currency=${fromCurrency}&to_currency=${toCurrency}&from_amount=${amount}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`NOWPayments estimate conversion failed (${res.status}): ${errBody}`);
  }

  return res.json();
}

export async function executeConversion(
  fromCurrency: string,
  toCurrency: string,
  amount: number
): Promise<ConversionResult> {
  const token = await getAuthToken();

  const res = await fetch(`${BASE_URL}/currency-convert`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from_currency: fromCurrency,
      to_currency: toCurrency,
      from_amount: amount,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`NOWPayments conversion failed (${res.status}): ${errBody}`);
  }

  return res.json();
}

export async function createPayout(params: {
  address: string;
  currency: string;
  amount: number;
  ipnCallbackUrl?: string;
}): Promise<PayoutResult> {
  const token = await getAuthToken();

  const res = await fetch(`${BASE_URL}/payout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      address: params.address,
      currency: params.currency,
      amount: params.amount,
      ipn_callback_url: params.ipnCallbackUrl,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`NOWPayments payout failed (${res.status}): ${errBody}`);
  }

  return res.json();
}
