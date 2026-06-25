// ============================================================================
// 2FA Service — TOTP authenticator + Email OTP
// Uses Node.js crypto (no external deps). RFC 6238 / RFC 4226 compliant.
// ============================================================================

import crypto from 'crypto';

// ── TOTP / Authenticator App ─────────────────────────────────────────────────

const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30;      // seconds
const TOTP_DRIFT = 1;        // allow ±1 period for clock skew
const SECRET_LENGTH = 20;    // 160 bits, as recommended
const BACKUP_CODE_COUNT = 8;
const BACKUP_CODE_LENGTH = 10;

export interface TOTPSetup {
  secret: string;            // base32-encoded secret for storage
  otpauthUri: string;        // URI for QR code
  backupCodes: string[];     // plaintext backup codes (show once)
}

/**
 * Generate a new TOTP secret + QR URI + backup codes.
 */
export function generateTOTPSetup(accountName: string, issuer = 'KingdomTradex'): TOTPSetup {
  const secret = generateBase32Secret(SECRET_LENGTH);
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  const otpauthUri = `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
  const backupCodes = generateBackupCodes(BACKUP_CODE_COUNT, BACKUP_CODE_LENGTH);

  return { secret, otpauthUri, backupCodes };
}

/**
 * Verify a TOTP code against a stored secret.
 * Allows ±1 period drift to account for clock skew.
 */
export function verifyTOTP(secret: string, code: string): boolean {
  if (!secret || !code || code.length !== TOTP_DIGITS) return false;

  const key = base32ToBuffer(secret);
  const now = Math.floor(Date.now() / 1000);

  // Check current period and ±1 neighboring periods
  for (let offset = -TOTP_DRIFT; offset <= TOTP_DRIFT; offset++) {
    const counter = Math.floor(now / TOTP_PERIOD) + offset;
    if (counter < 0) continue;
    const expected = generateTOTP(key, counter);
    if (timingSafeCompare(code, expected)) return true;
  }

  return false;
}

/**
 * Hash backup codes with SHA-256 for storage. Returns hashed codes.
 */
export function hashBackupCodes(codes: string[]): string[] {
  return codes.map(c => crypto.createHash('sha256').update(c).digest('hex'));
}

/**
 * Verify a backup code against hashed codes. Returns the index (to mark as used) or -1.
 */
export function verifyBackupCode(code: string, hashedCodes: string[]): number {
  const hash = crypto.createHash('sha256').update(code.trim()).digest('hex');
  return hashedCodes.findIndex(h => timingSafeCompare(h, hash));
}

// ── Email OTP ────────────────────────────────────────────────────────────────

const OTP_LENGTH = 6;
const OTP_RATE_LIMIT = 5;               // max requests per hour
const OTP_RATE_WINDOW_MS = 60 * 60 * 1000;

// In-memory store for OTP rate limiting (per user, not per IP)
const otpRateMap = new Map<number, number[]>();

// Shared OTP code store (shared across API routes in same process)
export const otpStore = new Map<number, { code: string; expiresAt: number; used: boolean }>();

export interface EmailOTP {
  code: string;
  expiresAt: number;    // Date.now() + 5min
  used: boolean;
}

/**
 * Generate a 6-digit OTP.
 */
export function generateOTP(): string {
  return crypto.randomInt(0, 1000000).toString().padStart(OTP_LENGTH, '0');
}

/**
 * Check if user is rate-limited for OTP requests. Returns remaining requests.
 */
export function checkOTPRateLimit(userId: number): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const timestamps = otpRateMap.get(userId) ?? [];

  // Prune old entries
  const recent = timestamps.filter(t => now - t < OTP_RATE_WINDOW_MS);
  otpRateMap.set(userId, recent);

  const remaining = Math.max(0, OTP_RATE_LIMIT - recent.length);
  return {
    allowed: recent.length < OTP_RATE_LIMIT,
    remaining,
    retryAfterMs: recent.length > 0 ? OTP_RATE_WINDOW_MS - (now - recent[0]) : 0,
  };
}

/**
 * Record an OTP request for rate limiting.
 */
export function recordOTPRequest(userId: number): void {
  const timestamps = otpRateMap.get(userId) ?? [];
  timestamps.push(Date.now());
  otpRateMap.set(userId, timestamps);
}

/**
 * Verify an OTP code against a stored OTP object.
 */
export function verifyOTP(stored: EmailOTP, code: string): boolean {
  if (stored.used) return false;
  if (Date.now() > stored.expiresAt) return false;
  return timingSafeCompare(code.trim(), stored.code);
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function generateBase32Secret(length: number): string {
  const bytes = crypto.randomBytes(length);
  return bufferToBase32(bytes);
}

function generateTOTP(key: Buffer, counter: number): string {
  // RFC 4226: HMAC-SHA-1(key, counter as 8-byte big-endian)
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigInt64BE(BigInt(counter), 0);

  const hmac = crypto.createHmac('sha1', key).update(counterBuf).digest();

  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  // Modulo 10^digits
  const otp = binary % Math.pow(10, TOTP_DIGITS);
  return otp.toString().padStart(TOTP_DIGITS, '0');
}

function bufferToBase32(buf: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      output += alphabet[(value >>> bits) & 0x1f];
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 0x1f];
  }
  return output;
}

function base32ToBuffer(encoded: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const char of clean) {
    value = (value << 5) | alphabet.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      output.push((value >>> bits) & 0xff);
    }
  }
  return Buffer.from(output);
}

function generateBackupCodes(count: number, length: number): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
    codes.push(code);
  }
  return codes;
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a dummy comparison to avoid length-based timing
    crypto.timingSafeEqual?.(Buffer.from(a), Buffer.from(a));
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
