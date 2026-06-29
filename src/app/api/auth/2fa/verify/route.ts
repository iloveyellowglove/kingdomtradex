import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyTOTP } from '@/lib/two-factor';

// Rate limit for 2FA setup verification: max 10 attempts per user per 10 minutes
const g = globalThis as Record<string, unknown>;
const setupRateMap = (g.__twoFactorSetupRateMap as Map<number, { count: number; resetAt: number }>)
  ?? (g.__twoFactorSetupRateMap = new Map<number, { count: number; resetAt: number }>());

/**
 * 2FA SETUP verification only.
 * Login 2FA has moved to /api/auth/verify-login.
 * This route confirms TOTP setup from the Settings page.
 */
export async function POST(request: NextRequest) {
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

  const body = await request.json();
  const { code } = body;
  if (!code || typeof code !== 'string' || code.length < 6) {
    return NextResponse.json({ success: false, error: 'Valid 6-digit code required.' }, { status: 400 });
  }

  // Rate limit 2FA setup attempts: max 10 per user per 10 minutes
  const nowSetup = Date.now();
  const setupEntry = setupRateMap.get(userId);
  if (setupEntry && nowSetup < setupEntry.resetAt && setupEntry.count >= 10) {
    return NextResponse.json({ success: false, error: 'Too many verification attempts. Please try again later.' }, { status: 429 });
  }
  if (!setupEntry || nowSetup >= setupEntry.resetAt) {
    setupRateMap.set(userId, { count: 1, resetAt: nowSetup + 10 * 60 * 1000 });
  } else {
    setupEntry.count++;
  }

  // Fetch stored secret
  const { data: users } = await supabase
    .from('users')
    .select('two_factor_secret, two_factor_enabled')
    .eq('id', userId)
    .limit(1);

  if (!users || users.length === 0) {
    return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
  }

  const u = users[0] as unknown as { two_factor_secret: string | null; two_factor_enabled: boolean };

  if (u.two_factor_enabled) {
    return NextResponse.json({ success: false, error: '2FA is already enabled.' }, { status: 400 });
  }

  if (!u.two_factor_secret) {
    return NextResponse.json({ success: false, error: 'No 2FA setup found. Please run setup first.' }, { status: 400 });
  }

  // Parse stored data
  let secret: string;
  try {
    const data = JSON.parse(u.two_factor_secret);
    secret = data.secret;
  } catch {
    secret = u.two_factor_secret;
  }

  // Verify the TOTP code
  if (!verifyTOTP(secret, code.trim())) {
    return NextResponse.json({ success: false, error: 'Invalid code. Please try again.' }, { status: 400 });
  }

  // Enable 2FA
  await supabase
    .from('users')
    .update({ two_factor_enabled: true })
    .eq('id', userId);

  return NextResponse.json({
    success: true,
    message: 'Two-factor authentication has been enabled.',
  });
}
