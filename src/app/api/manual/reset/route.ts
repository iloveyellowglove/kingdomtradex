import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { resetDummyAccount } from '@/lib/db/dummy-atomic';
import { timingSafeEqual } from '@/lib/auth/csrf';

export async function POST(request: NextRequest) {
  const token = cookies().get('__Host-kingdom_session')?.value;
  if (!token || token.length !== 64) {
    return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id, csrf_token')
    .eq('session_token', token)
    .limit(1);

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ success: false, error: 'Session expired.' }, { status: 401 });
  }

  const session = sessions[0];
  const csrfHeader = request.headers.get('x-csrf-token');
  if (!csrfHeader || !timingSafeEqual(csrfHeader, session.csrf_token)) {
    return NextResponse.json({ success: false, error: 'Invalid CSRF token.' }, { status: 403 });
  }

  await resetDummyAccount(session.user_id);

  return NextResponse.json({ success: true });
}
