import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { generateTOTPSetup, hashBackupCodes } from '@/lib/two-factor';

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

  // Fetch username for QR label
  const { data: users } = await supabase
    .from('users')
    .select('username, email, two_factor_enabled')
    .eq('id', userId)
    .limit(1);

  if (!users || users.length === 0) {
    return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
  }

  const user = users[0] as unknown as { username: string; email: string; two_factor_enabled: boolean };

  if (user.two_factor_enabled) {
    return NextResponse.json({ success: false, error: '2FA is already enabled. Disable it first to set up again.' }, { status: 400 });
  }

  // Generate TOTP setup
  const setup = generateTOTPSetup(user.email);
  const hashedBackups = hashBackupCodes(setup.backupCodes);

  // Store secret + hashed backup codes (but don't enable yet - wait for verify step)
  await supabase
    .from('users')
    .update({
      two_factor_secret: setup.secret,
      // Store hashed backup codes as JSON in two_factor_secret for now
      // (we'll use a separate field or extend later)
    })
    .eq('id', userId);

  // Store backup codes separately in a temp row or session
  // For now, store them hashed in a simple way: append to secret as JSON
  const backupData = JSON.stringify({ secret: setup.secret, backups: hashedBackups });
  await supabase
    .from('users')
    .update({ two_factor_secret: backupData })
    .eq('id', userId);

  return NextResponse.json({
    success: true,
    secret: setup.secret,
    otpauthUri: setup.otpauthUri,
    backupCodes: setup.backupCodes,   // plaintext - show once
  });
}
