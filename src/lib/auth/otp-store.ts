import crypto from 'crypto';

export interface OTPEntry {
  code: string;
  userId: number;
  email: string;
  purpose: 'login' | 'withdrawal';
  expiresAt: number;
  attempts: number;
  resends: number;
}

const g = globalThis as Record<string, unknown>;
const otpStore = (g.__otpStore as Map<string, OTPEntry>)
  ?? (g.__otpStore = new Map<string, OTPEntry>());

const TOKEN_BYTES = 32;
const OTP_DIGITS = 6;
const EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const MAX_RESENDS = 3;

function generateCode(): string {
  return crypto.randomInt(100000, 1000000).toString().padStart(OTP_DIGITS, '0');
}

function generateToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString('hex');
}

/** Timing-safe string comparison */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/** Clean up expired entries (older than 15 minutes) */
function cleanExpired(): void {
  const cutoff = Date.now() - 15 * 60 * 1000;
  const toDelete: string[] = [];
  otpStore.forEach((entry, token) => {
    if (entry.expiresAt < cutoff) toDelete.push(token);
  });
  toDelete.forEach(t => otpStore.delete(t));
}

/**
 * Create a new OTP entry. Returns the token (for the client to reference)
 * and the code (to send via email). Token and code are independent.
 */
export function createOTP(
  userId: number,
  email: string,
  purpose: 'login' | 'withdrawal'
): { token: string; code: string } {
  cleanExpired();
  const token = generateToken();
  const code = generateCode();
  otpStore.set(token, {
    code,
    userId,
    email,
    purpose,
    expiresAt: Date.now() + EXPIRY_MS,
    attempts: 0,
    resends: 0,
  });
  return { token, code };
}

/**
 * Verify an OTP code against a stored entry.
 * Returns userId on success for session creation.
 */
export function verifyOTP(
  token: string,
  code: string
): { valid: boolean; error?: string; userId?: number } {
  cleanExpired();
  const entry = otpStore.get(token);
  if (!entry) {
    return { valid: false, error: 'Invalid or expired verification token. Please try again.' };
  }
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(token);
    return { valid: false, error: 'Verification code has expired. Please request a new one.' };
  }
  entry.attempts++;
  if (entry.attempts > MAX_ATTEMPTS) {
    otpStore.delete(token);
    return { valid: false, error: 'Too many failed attempts. Please log in again.' };
  }
  if (!safeCompare(code.trim(), entry.code)) {
    return { valid: false, error: 'Invalid code. Please try again.' };
  }
  // Valid — delete entry (single-use) and return userId
  const userId = entry.userId;
  otpStore.delete(token);
  return { valid: true, userId };
}

/**
 * Resend a new OTP code for an existing token.
 * Returns the new code to send via email.
 */
export function resendOTP(
  token: string
): { success: boolean; newCode?: string; error?: string } {
  cleanExpired();
  const entry = otpStore.get(token);
  if (!entry) {
    return { success: false, error: 'Invalid or expired verification token.' };
  }
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(token);
    return { success: false, error: 'Verification token has expired.' };
  }
  if (entry.resends >= MAX_RESENDS) {
    return { success: false, error: 'Maximum resends reached. Please log in again.' };
  }
  entry.resends++;
  entry.attempts = 0; // reset attempts on resend
  entry.code = generateCode();
  return { success: true, newCode: entry.code };
}

/**
 * Remove an OTP entry by token.
 */
export function deleteOTP(token: string): void {
  otpStore.delete(token);
}

/**
 * Find and verify a withdrawal OTP for a given user.
 * Returns the valid entry if found and verified, null otherwise.
 */
export function verifyWithdrawalOTP(
  userId: number,
  code: string
): { valid: boolean; error?: string } {
  cleanExpired();
  let foundToken: string | null = null;
  let result: { valid: boolean; error?: string } = { valid: false, error: 'No active verification code found. Please request a new one.' };

  otpStore.forEach((entry, token) => {
    if (foundToken) return; // already found
    if (entry.userId === userId && entry.purpose === 'withdrawal') {
      if (Date.now() > entry.expiresAt) {
        otpStore.delete(token);
        return;
      }
      entry.attempts++;
      if (entry.attempts > MAX_ATTEMPTS) {
        otpStore.delete(token);
        result = { valid: false, error: 'Too many failed attempts.' };
        return;
      }
      if (!safeCompare(code.trim(), entry.code)) {
        result = { valid: false, error: 'Invalid code.' };
        return;
      }
      foundToken = token;
      result = { valid: true };
    }
  });

  if (foundToken) {
    otpStore.delete(foundToken);
  }
  return result;
}
