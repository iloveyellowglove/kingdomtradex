import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/service';
import { createOTP } from '@/lib/auth/otp-store';
import { sendEmail } from '@/lib/services/email';

// In-memory account-level brute force lockout (per email)
const g = globalThis as Record<string, unknown>;
const accountLockMap = (g.__accountLockMap as Map<string, { attempts: number; lockedUntil: number | null }>)
  ?? (g.__accountLockMap = new Map<string, { attempts: number; lockedUntil: number | null }>());

export async function POST(request: NextRequest) {
  // Rate limit: 5 attempts per IP per 60 seconds
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const rateLimitKey = `login:${ip}`;
  const rateLimitMap = (g.__loginRateLimitMap as Map<string, { count: number; resetAt: number }>)
    ?? (g.__loginRateLimitMap = new Map<string, { count: number; resetAt: number }>());
  const now = Date.now();
  const entry = rateLimitMap.get(rateLimitKey);
  if (entry && now < entry.resetAt && entry.count >= 5) {
    return NextResponse.json({ success: false, error: 'Too many login attempts. Try again later.' }, { status: 429 });
  }
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(rateLimitKey, { count: 1, resetAt: now + 60000 });
  } else {
    entry.count++;
  }

  const { email, password } = await request.json();

  const emailClean = (email || '').toLowerCase().trim();
  if (!emailClean || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailClean)) {
    return NextResponse.json({ success: false, error: 'Invalid credentials.' }, { status: 401 });
  }

  // Account-level brute force lockout (per email, not just IP)
  const lockEntry = accountLockMap.get(emailClean);
  const nowMs = Date.now();
  if (lockEntry?.lockedUntil && nowMs < lockEntry.lockedUntil) {
    return NextResponse.json({ success: false, error: 'Account temporarily locked. Try again in 15 minutes.' }, { status: 429 });
  }

  const supabase = createServiceClient();
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .eq('email', emailClean)
    .limit(1);

  const user = users?.[0];

  if (!user) {
    console.warn('[login] failed attempt', { ip: request.headers.get('x-forwarded-for') || 'unknown', timestamp: new Date().toISOString() });
    return NextResponse.json({ success: false, error: 'Invalid credentials.' }, { status: 401 });
  }

  if (user.status === 'banned') {
    return NextResponse.json({ success: false, error: 'Account is banned.' }, { status: 403 });
  }
  if (user.status === 'suspended') {
    return NextResponse.json({ success: false, error: 'Account is suspended.' }, { status: 403 });
  }

  const pwOk = verifyPassword(password, user.password_hash);
  if (!pwOk) {
    console.warn('[login] failed attempt', { ip: request.headers.get('x-forwarded-for') || 'unknown', timestamp: new Date().toISOString() });

    // Track account-level failures for brute force protection
    const existing = accountLockMap.get(emailClean);
    const attempts = (existing?.attempts ?? 0) + 1;
    if (attempts >= 10) {
      accountLockMap.set(emailClean, { attempts, lockedUntil: nowMs + 15 * 60 * 1000 });
    } else {
      accountLockMap.set(emailClean, { attempts, lockedUntil: null });
    }

    return NextResponse.json({ success: false, error: 'Invalid credentials.' }, { status: 401 });
  }

  // Successful password — reset account lockout counter
  accountLockMap.delete(emailClean);

  await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);

  const kycLevel = Number(user.kyc_level ?? 0);
  const totpEnabled = Boolean(user.two_factor_enabled);

  // Users without verified email (kyc_level = 0): skip OTP, create session directly
  // They have limited access (no withdrawals) so this is acceptable
  if (kycLevel < 1) {
    let sessionToken: string;
    try {
      const result = await createSession(user.id, user.role);
      sessionToken = result.token;
    } catch (e) {
      console.error('[login] createSession failed:', e instanceof Error ? e.message : String(e));
      return NextResponse.json({ success: false, error: 'Session creation failed.' }, { status: 500 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('__Host-kingdom_session', sessionToken, {
      httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 86400,
    });
    return response;
  }

  // Users with verified email: send email OTP (primary 2FA method)
  const { token: preAuthToken, code } = createOTP(user.id, emailClean, 'login');

  // Send OTP via email (non-blocking)
  try {
    await sendEmail(emailClean, 'Your KingdomTradex login code', `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #F0B90B;">KingdomTradex</h2>
        <p style="font-size: 16px;">Your verification code is:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #F0B90B; margin: 24px 0;">${code}</p>
        <p style="color: #848E9C; font-size: 13px;">This code expires in 10 minutes.</p>
        <p style="color: #848E9C; font-size: 13px;">If you did not attempt to log in, please change your password immediately.</p>
      </div>
    `);
  } catch (emailErr) {
    console.error('[login] OTP email send failed:', emailErr);
    return NextResponse.json({ success: false, error: 'Failed to send verification code. Please try again.' }, { status: 500 });
  }

  // Return available verification methods
  const methods: string[] = ['email'];
  if (totpEnabled) methods.push('totp');

  return NextResponse.json({
    success: true,
    requires_verification: true,
    methods,
    pre_auth_token: preAuthToken,
    message: 'A verification code has been sent to your email.',
  });
}
