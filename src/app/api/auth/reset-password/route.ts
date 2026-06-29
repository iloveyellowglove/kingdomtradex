import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  const { token, password } = await request.json();

  if (!token || !password) {
    return NextResponse.json({ success: false, error: 'Token and password are required.' }, { status: 400 });
  }
  const pwCheck = validatePasswordStrength(password);
  if (!pwCheck.valid) {
    return NextResponse.json({ success: false, error: pwCheck.error! }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: rows } = await supabase
    .from('password_resets')
    .select('*')
    .eq('token', token)
    .limit(1);

  const row = rows?.[0];
  if (!row || row.used) {
    return NextResponse.json({ success: false, error: 'Invalid or expired reset token.' }, { status: 400 });
  }

  const createdAt = new Date(row.created_at).getTime();
  if (Date.now() - createdAt > 3600000) {
    await supabase.from('password_resets').update({ used: true }).eq('token', token);
    return NextResponse.json({ success: false, error: 'This reset token has expired.' }, { status: 400 });
  }

  const passwordHash = hashPassword(password);
  await supabase.from('users').update({ password_hash: passwordHash }).eq('email', row.email);
  await supabase.from('password_resets').update({ used: true }).eq('token', token);

  // Invalidate all existing sessions for this user — forces re-login
  const { data: targetUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', row.email)
    .limit(1);
  if (targetUser && targetUser.length > 0) {
    await supabase.from('sessions').delete().eq('user_id', targetUser[0].id);
  }

  return NextResponse.json({ success: true });
}
