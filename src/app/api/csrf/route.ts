import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  const token = cookies().get('__Host-kingdom_session')?.value;
  if (!token || token.length !== 64) {
    return NextResponse.json({ csrfToken: '' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select('csrf_token, expires_at')
    .eq('session_token', token)
    .limit(1);

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ csrfToken: '' }, { status: 401 });
  }

  const session = sessions[0];
  if (new Date(session.expires_at) < new Date()) {
    return NextResponse.json({ csrfToken: '' }, { status: 401 });
  }

  return NextResponse.json({ csrfToken: session.csrf_token });
}
