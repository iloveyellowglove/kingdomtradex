import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { generateOTP, checkOTPRateLimit, recordOTPRequest, otpStore } from '@/lib/two-factor';

export async function POST() {
  const token = cookies().get('__Host-kingdom_session')?.value;
  if (!token || token.length !== 64) {
    return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id')
    .eq('session_token', token)
    .limit(1);

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ success: false, error: 'Session expired.' }, { status: 401 });
  }

  const userId = sessions[0].user_id;

  // Rate limit
  const limit = checkOTPRateLimit(userId);
  if (!limit.allowed) {
    return NextResponse.json({
      success: false,
      error: `Too many OTP requests. Please wait ${Math.ceil(limit.retryAfterMs / 60000)} minutes.`,
      retryAfterMs: limit.retryAfterMs,
    }, { status: 429 });
  }

  // Generate OTP
  const code = generateOTP();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore.set(userId, { code, expiresAt, used: false });

  // Record for rate limiting
  recordOTPRequest(userId);

  // Fetch user email
  const { data: users } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .limit(1);

  const email = (users?.[0] as Record<string, unknown>)?.email as string ?? 'your email';

  // In production, send via Resend/SendGrid/Supabase Edge Functions.
  // For now, log to console and return the code (dev/stub mode).
  if (process.env.NODE_ENV === 'production' && process.env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'KingdomTradex <security@kingdomtradex.com>',
          to: email,
          subject: 'Your 2FA Verification Code',
          text: `Your verification code is: ${code}\n\nThis code expires in 5 minutes. If you did not request this, please ignore this email.`,
        }),
      });
    } catch {
      console.error('[send-otp] Failed to send email via Resend');
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[2FA OTP] Code for user ${userId} (${email}): ${code}`);
  }

  return NextResponse.json({
    success: true,
    message: 'Verification code sent.',
    expiresAt,
    // Only return code in dev
    ...(process.env.NODE_ENV !== 'production' ? { code } : {}),
  });
}
