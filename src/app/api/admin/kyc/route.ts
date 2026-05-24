import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

async function validateAdmin(req: NextRequest) {
  const token = req.cookies.get('kingdom_session')?.value;
  if (!token || token.length !== 64) return null;

  const supabase = createServiceClient();

  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id, expires_at, user_role')
    .eq('session_token', token)
    .limit(1);

  const sess = (sessions ?? []) as unknown as { user_id: number; expires_at: string; user_role: string }[];
  if (sess.length === 0) return null;
  if (new Date(sess[0].expires_at) < new Date()) {
    await supabase.from('sessions').delete().eq('session_token', token);
    return null;
  }
  if (sess[0].user_role !== 'admin') return null;

  return { supabase, adminId: sess[0].user_id };
}

export async function GET(req: NextRequest) {
  const admin = await validateAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { supabase } = admin;

  const { data: submissions } = await supabase
    .from('users')
    .select('id, username, email, kyc_status, kyc_document_type, kyc_document_url, kyc_selfie_url, kyc_submitted_at, full_name')
    .eq('kyc_status', 'pending')
    .order('kyc_submitted_at', { ascending: true });

  return NextResponse.json({ submissions: submissions || [] });
}

export async function POST(req: NextRequest) {
  const admin = await validateAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { supabase } = admin;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const userId = typeof body.user_id === 'number' ? body.user_id : null;
  const action = typeof body.action === 'string' ? body.action : null;

  if (!userId || !['approve', 'reject'].includes(action || '')) {
    return NextResponse.json({ error: 'Invalid request. Requires user_id and action (approve|reject)' }, { status: 400 });
  }

  if (action === 'reject' && typeof body.reason !== 'string') {
    return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    kyc_reviewed_at: new Date().toISOString(),
  };

  if (action === 'approve') {
    updates.kyc_status = 'verified';
    updates.kyc_rejection_reason = null;
  } else {
    updates.kyc_status = 'rejected';
    updates.kyc_rejection_reason = body.reason;
  }

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .eq('kyc_status', 'pending');

  if (error) {
    console.error('[admin/kyc]', error.message);
    return NextResponse.json({ error: 'Failed to process KYC review' }, { status: 500 });
  }

  return NextResponse.json({ success: true, action, userId });
}
