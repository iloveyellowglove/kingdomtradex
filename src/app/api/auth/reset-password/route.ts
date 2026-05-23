import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth/password';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  const { token, password } = await request.json();

  if (!token || !password || password.length < 8) {
    return NextResponse.json({ success: false, error: 'Password must be at least 8 characters.' }, { status: 400 });
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

  return NextResponse.json({ success: true });
}
