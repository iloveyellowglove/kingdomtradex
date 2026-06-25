import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';

const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

async function getUserId(): Promise<number | null> {
  const token = cookies().get('__Host-kingdom_session')?.value;
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
  return s[0].user_id;
}

async function isAdmin(): Promise<boolean> {
  const token = cookies().get('__Host-kingdom_session')?.value;
  if (!token || token.length !== 64) return false;

  const supabase = createServiceClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_role, expires_at')
    .eq('session_token', token)
    .limit(1);

  const s = (sessions ?? []) as unknown as { user_role: string; expires_at: string }[];
  if (s.length === 0) return false;
  if (new Date(s[0].expires_at) < new Date()) return false;
  return s[0].user_role === 'admin';
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = await isAdmin();
  const { id } = await params;
  const ticketId = parseInt(id);

  const supabase = createServiceClient();

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .limit(1);

  if (!tickets || tickets.length === 0) {
    return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
  }

  const ticket = tickets[0];

  if (!admin && ticket.user_id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get messages
  const { data: messages } = await supabase
    .from('ticket_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  // Get username for ticket owner
  const { data: users } = await supabase
    .from('users')
    .select('username')
    .eq('id', ticket.user_id)
    .limit(1);

  return NextResponse.json({
    ticket: {
      ...ticket,
      username: users?.[0]?.username || 'Unknown',
    },
    messages: messages || [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const { id } = await params;
  const ticketId = parseInt(id);
  const { status } = await request.json();

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}.` }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('support_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ticketId);

  if (error) {
    return NextResponse.json({ error: 'Failed to update ticket.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
