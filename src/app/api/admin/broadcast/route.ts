import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

async function validateAdmin() {
  const token = cookies().get('__Host-kingdom_session')?.value;
  if (!token || token.length !== 64) return null;

  const supabase = createServiceClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id, user_role')
    .eq('session_token', token)
    .limit(1);

  const s = (sessions ?? []) as unknown as { user_id: number; user_role: string }[];
  if (s.length === 0 || s[0].user_role !== 'admin') return null;
  return { supabase, adminId: s[0].user_id };
}

export async function GET() {
  const admin = await validateAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Return recent broadcasts (last 20 notifications of type 'system')
  const { data } = await admin.supabase
    .from('notifications')
    .select('id, title, message, created_at')
    .eq('type', 'system')
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json({
    success: true,
    broadcasts: (data ?? []).map((b: Record<string, unknown>) => ({
      id: b.id,
      title: b.title,
      message: b.message,
      createdAt: b.created_at,
    })),
  });
}

export async function POST(request: NextRequest) {
  const admin = await validateAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { title, message, segment } = body;

  if (!title || !message || typeof title !== 'string' || typeof message !== 'string') {
    return NextResponse.json({ success: false, error: 'Title and message are required.' }, { status: 400 });
  }

  if (title.length > 100) {
    return NextResponse.json({ success: false, error: 'Title must be under 100 characters.' }, { status: 400 });
  }

  const { supabase } = admin;

  // Build target user list based on segment
  let targetUsers: { id: number }[] = [];

  if (segment === 'all') {
    const { data } = await supabase.from('users').select('id').eq('status', 'active');
    targetUsers = (data ?? []) as { id: number }[];
  } else if (segment === 'kyc_verified') {
    const { data } = await supabase.from('users').select('id').gte('kyc_level', 2);
    targetUsers = (data ?? []) as { id: number }[];
  } else if (segment === 'kyc_unverified') {
    const { data } = await supabase.from('users').select('id').lt('kyc_level', 1);
    targetUsers = (data ?? []) as { id: number }[];
  } else if (segment === 'has_deposits') {
    const { data } = await supabase.from('users').select('id').gt('total_deposited_real', 0);
    targetUsers = (data ?? []) as { id: number }[];
  } else {
    // Default: all active users
    const { data } = await supabase.from('users').select('id').eq('status', 'active');
    targetUsers = (data ?? []) as { id: number }[];
  }

  if (targetUsers.length === 0) {
    return NextResponse.json({ success: false, error: 'No users match the selected segment.' }, { status: 400 });
  }

  // Batch insert notifications (batches of 100)
  const now = new Date().toISOString();
  const batchSize = 100;
  let created = 0;

  for (let i = 0; i < targetUsers.length; i += batchSize) {
    const batch = targetUsers.slice(i, i + batchSize);
    const inserts = batch.map(u => ({
      user_id: u.id,
      type: 'system',
      title,
      message,
      read: false,
      created_at: now,
    }));

    const { error } = await supabase.from('notifications').insert(inserts);
    if (error) {
      console.error('[broadcast] batch insert error:', error.message);
    } else {
      created += batch.length;
    }
  }

  return NextResponse.json({
    success: true,
    message: `Broadcast sent to ${created} users.`,
    sentTo: created,
  });
}
