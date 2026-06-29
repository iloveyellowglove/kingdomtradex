import { createHmac, timingSafeEqual } from 'crypto';

const SHARE_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes
const SHARE_MIN_DELAY_MS = 3 * 1000; // Must wait 3 seconds after share

function getSecret(): string {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error('CRON_SECRET environment variable is required');
  return secret;
}

export function signShareToken(userId: number, testimonyId: string | null, platform: string): string {
  const timestamp = Date.now();
  const payload = `${userId}:${testimonyId || 'generic'}:${platform}:${timestamp}`;
  const signature = createHmac('sha256', getSecret())
    .update(payload)
    .digest('hex');
  const token = `${payload}:${signature}`;
  return Buffer.from(token).toString('base64url');
}

export function verifyShareToken(token: string): {
  valid: boolean;
  userId?: number;
  testimonyId?: string | null;
  platform?: string;
  timestamp?: number;
  error?: string;
} {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 5) {
      return { valid: false, error: 'Invalid token format' };
    }

    const [userIdStr, testimonyIdRaw, platform, timestampStr, signature] = parts;
    const userId = parseInt(userIdStr, 10);
    const timestamp = parseInt(timestampStr, 10);
    const testimonyId = testimonyIdRaw === 'generic' ? null : testimonyIdRaw;

    if (!userId || !timestamp || !platform) {
      return { valid: false, error: 'Invalid token payload' };
    }

    // Check expiry
    if (Date.now() - timestamp > SHARE_TOKEN_TTL_MS) {
      return { valid: false, error: 'Token expired' };
    }

    // Check minimum delay (token must be at least 3 seconds old)
    if (Date.now() - timestamp < SHARE_MIN_DELAY_MS) {
      return { valid: false, error: 'Share too recent. Please wait a few seconds.' };
    }

    // Verify signature
    const payload = `${userId}:${testimonyIdRaw}:${platform}:${timestamp}`;
    const expectedSig = createHmac('sha256', getSecret())
      .update(payload)
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'hex');
    const expectedBuf = Buffer.from(expectedSig, 'hex');

    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      return { valid: false, error: 'Invalid signature' };
    }

    return { valid: true, userId, testimonyId, platform, timestamp };
  } catch {
    return { valid: false, error: 'Token malformed' };
  }
}
