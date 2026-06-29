import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createServiceClient } from '@/lib/supabase/service';
import { sendEmail } from '@/lib/services/email';

// In-memory rate limit: max 3 resends per email per hour
const resendRateMap = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  const emailClean = (email || '').toLowerCase().trim();

  if (!emailClean || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailClean)) {
    return NextResponse.json({ success: false, error: 'Invalid email address.' }, { status: 400 });
  }

  // Rate limit: max 3 resends per email per hour
  const now = Date.now();
  const entry = resendRateMap.get(emailClean);
  if (entry && now < entry.resetAt && entry.count >= 3) {
    return NextResponse.json({
      success: false,
      error: 'Too many verification emails sent. Please wait before requesting another.',
    }, { status: 429 });
  }
  if (!entry || now >= entry.resetAt) {
    resendRateMap.set(emailClean, { count: 1, resetAt: now + 3600000 });
  } else {
    entry.count++;
  }

  const supabase = createServiceClient();

  // Check user exists and kyc_level = 0 (not yet verified)
  const { data: users } = await supabase
    .from('users')
    .select('id, kyc_level')
    .eq('email', emailClean)
    .eq('status', 'active')
    .limit(1);

  if (!users || users.length === 0) {
    // Don't reveal whether the email exists
    return NextResponse.json({ success: true, message: 'If your account exists and needs verification, a new email has been sent.' });
  }

  const user = users[0];
  if (Number(user.kyc_level) >= 1) {
    return NextResponse.json({ success: true, message: 'Your email is already verified.' });
  }

  // Invalidate old verification tokens for this email
  await supabase
    .from('password_resets')
    .update({ used: true })
    .eq('email', emailClean)
    .eq('type', 'email_verification')
    .eq('used', false);

  // Generate new token
  const verifyToken = randomBytes(32).toString('hex');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verifyLink = `${appUrl}/api/auth/verify-email?token=${verifyToken}`;

  await supabase.from('password_resets').insert({
    email: emailClean,
    token: verifyToken,
    type: 'email_verification',
    created_at: new Date().toISOString(),
    used: false,
  });

  try {
    await sendEmail(emailClean, 'Verify your email - KingdomTradex', `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #F0B90B;">KingdomTradex</h2>
        <p>A new email verification link has been requested for your account.</p>
        <p style="margin: 24px 0;">
          <a href="${verifyLink}" style="background: #F0B90B; color: #000; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Verify Email
          </a>
        </p>
        <p style="color: #848E9C; font-size: 13px;">This link expires in 24 hours.</p>
        <p style="color: #848E9C; font-size: 13px;">If you did not request this, please ignore this email.</p>
      </div>
    `);
  } catch (emailErr) {
    console.error('[resend-verification] email send failed:', emailErr);
    return NextResponse.json({ success: false, error: 'Failed to send verification email. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Verification email sent. Please check your inbox.' });
}
