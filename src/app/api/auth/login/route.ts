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

  if (!user) {
    console.warn('[login] failed attempt', { ip: request.headers.get('x-forwarded-for') || 'unknown', timestamp: new Date().toISOString() });
    return NextResponse.json({ success: false, error: 'Invalid credentials.' }, { status: 401 });
  }

  if (user.status === 'banned') {
    return NextResponse.json({ success: false, error: 'Account is banned.' }, { status: 403 });
  }
  if (user.status === 'suspended') {
    return NextResponse.json({ success: false, error: 'Account is suspended.' }, { status: 403 });
  }

  const pwOk = verifyPassword(password, user.password_hash);
  if (!pwOk) {
    console.warn('[login] failed attempt', { ip: request.headers.get('x-forwarded-for') || 'unknown', timestamp: new Date().toISOString() });
    return NextResponse.json({ success: false, error: 'Invalid credentials.' }, { status: 401 });
  }

  await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);

  let token: string;
  try {
    const result = await createSession(user.id, user.role);
    token = result.token;
  } catch (e) {
    console.error('[login] createSession failed:', e instanceof Error ? e.message : String(e));
    return NextResponse.json({ success: false, error: 'Session creation failed.' }, { status: 500 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('kingdom_session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 86400,
  });

  return response;
}
