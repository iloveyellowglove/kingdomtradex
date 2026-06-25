import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyOTP, otpStore } from '@/lib/two-factor';

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
  if (!code || typeof code !== 'string' || code.length !== 6) {
    return NextResponse.json({ success: false, error: 'Valid 6-digit code required.' }, { status: 400 });
  }

  // Fetch stored OTP
  const stored = otpStore.get(userId);
  if (!stored) {
    return NextResponse.json({ success: false, error: 'No verification code requested. Please request a new code.' }, { status: 400 });
  }

  if (!verifyOTP(stored, code.trim())) {
    return NextResponse.json({
      success: false,
      error: stored.used ? 'Code already used.' : Date.now() > stored.expiresAt ? 'Code expired.' : 'Invalid code.',
    }, { status: 400 });
  }

  // Mark as used
  stored.used = true;

  return NextResponse.json({
    success: true,
    message: 'Code verified successfully.',
  });
}
