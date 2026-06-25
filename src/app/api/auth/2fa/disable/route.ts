import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyTOTP, verifyBackupCode } from '@/lib/two-factor';

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
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ success: false, error: 'A verification code is required to disable 2FA.' }, { status: 400 });
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

  if (!u.two_factor_enabled) {
    return NextResponse.json({ success: false, error: '2FA is not enabled.' }, { status: 400 });
  }

  if (!u.two_factor_secret) {
    return NextResponse.json({ success: false, error: 'No 2FA configuration found.' }, { status: 400 });
  }

  // Parse stored data
  let secret: string;
  let backups: string[] = [];
  try {
    const data = JSON.parse(u.two_factor_secret);
    secret = data.secret;
    backups = data.backups ?? [];
  } catch {
    secret = u.two_factor_secret;
  }

  const trimmedCode = code.trim();

  // Try TOTP first, then backup codes
  let valid = verifyTOTP(secret, trimmedCode);

  if (!valid && backups.length > 0) {
    const idx = verifyBackupCode(trimmedCode, backups);
    if (idx >= 0) {
      valid = true;
      // Mark backup code as used by removing it
      backups.splice(idx, 1);
      const updatedData = JSON.stringify({ secret, backups });
      await supabase
        .from('users')
        .update({ two_factor_secret: updatedData })
        .eq('id', userId);
    }
  }

  if (!valid) {
    return NextResponse.json({ success: false, error: 'Invalid code.' }, { status: 400 });
  }

  // Disable 2FA
  await supabase
    .from('users')
    .update({
      two_factor_enabled: false,
      two_factor_secret: null,
    })
    .eq('id', userId);

  return NextResponse.json({
    success: true,
    message: 'Two-factor authentication has been disabled.',
  });
}
