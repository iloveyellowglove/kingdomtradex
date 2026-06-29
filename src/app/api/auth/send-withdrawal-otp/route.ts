import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { createOTP } from '@/lib/auth/otp-store';
import { sendEmail } from '@/lib/services/email';
import { applyRateLimit } from '@/lib/rate-limit';

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

  // Rate limit: 3 OTP requests per user per hour
  const rateLimit = applyRateLimit(userId, 'withdrawal_otp', 3, 3600000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many code requests. Please try again later.' },
      { status: 429 }
    );
  }

  // Fetch user email
  const { data: users } = await supabase
    .from('users')
    .select('email, kyc_level')
    .eq('id', userId)
    .limit(1);

  if (!users || users.length === 0) {
    return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
  }

  const user = users[0] as unknown as { email: string; kyc_level: number };

  if (Number(user.kyc_level) < 1) {
    return NextResponse.json({ success: false, error: 'Email verification required.' }, { status: 400 });
  }

  // Generate OTP
  const { code } = createOTP(userId, user.email, 'withdrawal');

  // Send code via email
  try {
    await sendEmail(user.email, 'Your KingdomTradex withdrawal code', `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#F0B90B">KingdomTradex</h2>
        <p style="font-size:16px">Your withdrawal verification code is:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#F0B90B;margin:24px 0">${code}</p>
        <p style="color:#848E9C;font-size:13px">This code expires in 10 minutes.</p>
        <p style="color:#848E9C;font-size:13px">If you did not request a withdrawal, please contact support immediately.</p>
      </div>
    `);
  } catch (emailErr) {
    console.error('[send-withdrawal-otp] email failed:', emailErr);
    return NextResponse.json({ success: false, error: 'Failed to send code. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Verification code sent to your email.' });
}
