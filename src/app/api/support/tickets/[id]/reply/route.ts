import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';

async function getUserId(): Promise<number | null> {
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
  return s[0].user_id;
}

async function isAdmin(): Promise<boolean> {
  const token = cookies().get('kingdom_session')?.value;
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

export async function POST(
  request: NextRequest,
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

  // Verify ticket exists and user has access
  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('id, user_id, status')
    .eq('id', ticketId)
    .limit(1);

  if (!tickets || tickets.length === 0) {
    return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
  }

  const ticket = tickets[0];

  if (!admin && ticket.user_id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (ticket.status === 'closed') {
    return NextResponse.json({ error: 'Cannot reply to a closed ticket.' }, { status: 400 });
  }

  const { message } = await request.json();

  if (!message || !message.trim()) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { data: messages, error } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: ticketId,
      sender_id: userId,
      sender_role: admin ? 'admin' : 'user',
      message: message.trim(),
      created_at: now,
    })
    .select();

  if (error) {
    return NextResponse.json({ error: 'Failed to add message.' }, { status: 500 });
  }

  // Update ticket updated_at
  await supabase
    .from('support_tickets')
    .update({ updated_at: now })
    .eq('id', ticketId);

  return NextResponse.json({ success: true, message: messages?.[0] });
}
