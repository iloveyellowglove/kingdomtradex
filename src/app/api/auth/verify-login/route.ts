import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyTOTP, verifyBackupCode } from '@/lib/two-factor';
import { verifyOTP as verifyEmailOTP, deleteOTP, resendOTP } from '@/lib/auth/otp-store';
import { sendEmail } from '@/lib/services/email';

const g = globalThis as Record<string, unknown>;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { pre_auth_token, code, method, resend } = body;

  // ── RESEND ────────────────────────────────────────────────────────────────
  if (resend) {
    if (!pre_auth_token) {
      return NextResponse.json({ success: false, error: 'Missing token.' }, { status: 400 });
    }
    const result = resendOTP(pre_auth_token);
    if (!result.success || !result.newCode) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    // Send new code via email — look up user from OTP store
    const store = g.__otpStore as Map<string, { email: string }>;
    const entry = store?.get(pre_auth_token);
    if (entry?.email) {
      try {
        await sendEmail(entry.email, 'Your KingdomTradex login code', `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#F0B90B">KingdomTradex</h2>
            <p style="font-size:16px">Your new verification code is:</p>
            <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#F0B90B;margin:24px 0">${result.newCode}</p>
            <p style="color:#848E9C;font-size:13px">This code expires in 10 minutes.</p>
          </div>
        `);
      } catch { /* non-fatal */ }
    }
    return NextResponse.json({ success: true, message: 'New code sent to your email.' });
  }

  // ── VERIFY ────────────────────────────────────────────────────────────────
  if (!pre_auth_token || !code || typeof code !== 'string') {
    return NextResponse.json({ success: false, error: 'Token and code are required.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Email OTP (primary method)
  if (!method || method === 'email') {
    const result = verifyEmailOTP(pre_auth_token, code);
    if (!result.valid || !result.userId) {
      return NextResponse.json({ success: false, error: result.error || 'Invalid code.' }, { status: 400 });
    }
    return await createLoginSession(supabase, result.userId);
  }

  // TOTP authenticator (optional upgrade method)
  if (method === 'totp') {
    // Get userId from OTP store without consuming the email OTP
    const store = g.__otpStore as Map<string, { userId: number; expiresAt: number }>;
    const entry = store?.get(pre_auth_token);
    if (!entry || Date.now() > entry.expiresAt) {
      return NextResponse.json({ success: false, error: 'Token expired. Please log in again.' }, { status: 400 });
    }
    const userId = entry.userId;

    const { data: users } = await supabase
      .from('users')
      .select('two_factor_secret, two_factor_enabled, role')
      .eq('id', userId)
      .limit(1);

    if (!users || users.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    const u = users[0] as unknown as { two_factor_secret: string | null; two_factor_enabled: boolean; role: string };
    if (!u.two_factor_enabled || !u.two_factor_secret) {
      return NextResponse.json({ success: false, error: 'Authenticator is not enabled.' }, { status: 400 });
    }

    let secret: string;
    let backups: string[] = [];
    try {
      const data = JSON.parse(u.two_factor_secret);
      secret = data.secret;
      backups = data.backups ?? [];
    } catch {
      secret = u.two_factor_secret;
    }

    let totpValid = verifyTOTP(secret, code.trim());

    if (!totpValid && backups.length > 0) {
      const idx = verifyBackupCode(code.trim(), backups);
      if (idx >= 0) {
        totpValid = true;
        backups.splice(idx, 1);
        await supabase
          .from('users')
          .update({ two_factor_secret: JSON.stringify({ secret, backups }) })
          .eq('id', userId);
      }
    }

    if (!totpValid) {
      return NextResponse.json({ success: false, error: 'Invalid authenticator code.' }, { status: 400 });
    }

    // TOTP valid — clear the OTP entry and create session
    deleteOTP(pre_auth_token);
    return await createLoginSession(supabase, userId);
  }

  return NextResponse.json({ success: false, error: 'Invalid verification method.' }, { status: 400 });
}

async function createLoginSession(supabase: ReturnType<typeof createServiceClient>, userId: number) {
  const { data: users } = await supabase
    .from('users').select('role').eq('id', userId).limit(1);
  const role = (users?.[0]?.role as string) ?? 'member';

  const session = await createSession(userId, role);
  const response = NextResponse.json({ success: true });
  response.cookies.set('__Host-kingdom_session', session.token, {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 86400,
  });
  return response;
}
