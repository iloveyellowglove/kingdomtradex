import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const emailClean = (email || '').toLowerCase().trim();
  if (!emailClean || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailClean)) {
    return NextResponse.json({ success: false, error: 'Invalid credentials.' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .eq('email', emailClean)
    .limit(1);

  const user = users?.[0];
  console.log('[login] email:', emailClean);
  console.log('[login] user found:', !!user);
  console.log('[login] hash prefix (first 10):', user?.password_hash?.substring(0, 10) ?? 'none');

  if (!user) {
    return NextResponse.json({ success: false, error: 'Invalid credentials.' }, { status: 401 });
  }

  if (user.status === 'banned') {
    return NextResponse.json({ success: false, error: 'Account is banned.' }, { status: 403 });
  }
  if (user.status === 'suspended') {
    return NextResponse.json({ success: false, error: 'Account is suspended.' }, { status: 403 });
  }

  const pwOk = verifyPassword(password, user.password_hash);
  console.log('[login] bcrypt.compare result:', pwOk);
  if (!pwOk) {
    return NextResponse.json({ success: false, error: 'Invalid credentials.' }, { status: 401 });
  }

  await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);
  await createSession(user.id, user.role);

  return NextResponse.json({ success: true });
}
