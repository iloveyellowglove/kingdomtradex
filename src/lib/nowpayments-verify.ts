import crypto from 'crypto';

export function verifyNowPaymentsIPN(
  body: Record<string, unknown>,
  signature: string
): boolean {
  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!ipnSecret) throw new Error('NOWPAYMENTS_IPN_SECRET not configured');

  const sorted = sortObject(body);
  const jsonString = JSON.stringify(sorted);

  const hmac = crypto.createHmac('sha512', ipnSecret);
  hmac.update(jsonString);
  const computedSig = hmac.digest('hex');

  if (computedSig.length !== signature.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(computedSig, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

function sortObject(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(obj)
    .sort()
    .reduce((result: Record<string, unknown>, key: string) => {
      const val = obj[key];
      result[key] =
        val && typeof val === 'object' && !Array.isArray(val)
          ? sortObject(val as Record<string, unknown>)
          : val;
      return result;
    }, {});
}
