const BASE_URL = 'https://api.nowpayments.io/v1';

interface CreatePaymentResponse {
  payment_id: number;
  payment_status: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  price_amount: number;
  price_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: number;
  created_at: string;
  expiration_estimate_date: string;
}

interface PaymentStatusResponse {
  payment_id: number;
  payment_status: string;
  pay_address: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  price_amount: number;
  price_currency: string;
  order_id: string;
  outcome_amount: number;
  outcome_currency: string;
}

export async function createNowPayment(params: {
  priceAmount: number;
  priceCurrency: string;
  payCurrency: string;
  orderId: string;
  orderDescription?: string;
  ipnCallbackUrl: string;
}): Promise<CreatePaymentResponse> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) throw new Error('NOWPAYMENTS_API_KEY not configured');

  const res = await fetch(`${BASE_URL}/payment`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      price_amount: params.priceAmount,
      price_currency: params.priceCurrency,
      pay_currency: params.payCurrency,
      order_id: params.orderId,
      order_description: params.orderDescription || 'KingdomTradex Deposit',
      ipn_callback_url: params.ipnCallbackUrl,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`NOWPayments API error ${res.status}: ${errBody}`);
  }

  return res.json();
}

export async function getNowPaymentStatus(paymentId: number): Promise<PaymentStatusResponse> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) throw new Error('NOWPAYMENTS_API_KEY not configured');

  const res = await fetch(`${BASE_URL}/payment/${paymentId}`, {
    headers: { 'x-api-key': apiKey },
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`NOWPayments status error ${res.status}: ${errBody}`);
  }

  return res.json();
}

export async function getMinimumPaymentAmount(currencyFrom: string, currencyTo: string): Promise<{ min_amount: number }> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) throw new Error('NOWPAYMENTS_API_KEY not configured');

  const res = await fetch(
    `${BASE_URL}/min-amount?currency_from=${currencyFrom}&currency_to=${currencyTo}`,
    { headers: { 'x-api-key': apiKey } }
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`NOWPayments min-amount error ${res.status}: ${errBody}`);
  }

  return res.json();
}
