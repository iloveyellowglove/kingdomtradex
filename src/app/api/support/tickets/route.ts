import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';

const VALID_CATEGORIES = ['deposit_issue', 'withdrawal_issue', 'account', 'trading', 'other'];

async function getUserId(): Promise<number | null> {
  const token = cookies().get('kingdom_session')?.value;
  if (!token || token.length !== 64) return null;

  const supabase = createServiceClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id, expires_at')
    .eq('session_token', token)
    .limit(1);

  const s = (sessions ?? []) as unknown as { user_id: number; expires_at: string }[];
  if (s.length === 0) return null;
  if (new Date(s[0].expires_at) < new Date()) return null;
  return s[0].user_id;
}

async function getUserRole(): Promise<string | null> {
  const token = cookies().get('kingdom_session')?.value;
  if (!token || token.length !== 64) return null;

  const supabase = createServiceClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id, user_role, expires_at')
    .eq('session_token', token)
    .limit(1);

  const s = (sessions ?? []) as unknown as { user_id: number; user_role: string; expires_at: string }[];
  if (s.length === 0) return null;
  if (new Date(s[0].expires_at) < new Date()) return null;
  return s[0].user_role;
}

export async function GET(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = await getUserRole();
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const isAdmin = searchParams.get('admin') === 'true' && role === 'admin';
  const statusFilter = searchParams.get('status');
  const categoryFilter = searchParams.get('category');

  let query = supabase
    .from('support_tickets')
    .select('*');

  if (!isAdmin) {
    query = query.eq('user_id', userId);
  }

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }
  if (categoryFilter) {
    query = query.eq('category', categoryFilter);
  }

  const { data: tickets, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }

  // Fetch usernames for admin view
  if (isAdmin && tickets.length > 0) {
    const userIds = Array.from(new Set(tickets.map((t: { user_id: number }) => t.user_id)));
    const { data: users } = await supabase
      .from('users')
      .select('id, username')
      .in('id', userIds);

    const userMap = new Map((users ?? []).map((u: { id: number; username: string }) => [u.id, u.username]));

    return NextResponse.json({
      tickets: tickets.map((t: { user_id: number }) => ({
        ...t,
        username: userMap.get(t.user_id) || 'Unknown',
      })),
    });
  }

  return NextResponse.json({ tickets });
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { subject, category, description } = await request.json();

  if (!subject || !subject.trim()) {
    return NextResponse.json({ error: 'Subject is required.' }, { status: 400 });
  }

  if (!category || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}.` }, { status: 400 });
  }

  if (!description || !description.trim()) {
    return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data: tickets, error } = await supabase
    .from('support_tickets')
    .insert({
      user_id: userId,
      subject: subject.trim(),
      category,
      description: description.trim(),
      status: 'open',
      priority: 'medium',
      created_at: now,
      updated_at: now,
    })
    .select();

  if (error || !tickets || tickets.length === 0) {
    return NextResponse.json({ error: 'Failed to create ticket.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, ticket: tickets[0] });
}
