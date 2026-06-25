import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const ALLOWED_FIELDS = [
  'full_name',
  'phone',
  'date_of_birth',
  'country',
  'city',
  'address',
] as const;

export async function POST(req: NextRequest) {
  const token = req.cookies.get('__Host-kingdom_session')?.value;
  if (!token || token.length !== 64) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Validate session
  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id, expires_at')
    .eq('session_token', token)
    .limit(1);

  const sess = (sessions ?? []) as unknown as { user_id: number; expires_at: string }[];
  if (sess.length === 0) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
  if (new Date(sess[0].expires_at) < new Date()) {
    await supabase.from('sessions').delete().eq('session_token', token);
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }

  const userId = sess[0].user_id;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Build update object with only allowed fields
  const updates: Record<string, unknown> = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in body) {
      const val = body[field];
      if (typeof val === 'string') {
        updates[field] = val.trim() || null;
      } else if (val === null) {
        updates[field] = null;
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);

  if (error) {
    console.error('[profile/update]', error.message);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
