import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

async function validateAdmin(req: NextRequest) {
  const token = req.cookies.get('__Host-kingdom_session')?.value;
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

  // Fetch from both users (legacy) and kyc_submissions (new) tables
  const [legacyRes, newRes] = await Promise.all([
    supabase
      .from('users')
      .select('id, username, email, kyc_status, kyc_document_type, kyc_document_url, kyc_selfie_url, kyc_submitted_at, full_name, kyc_level')
      .eq('kyc_status', 'pending')
      .order('kyc_submitted_at', { ascending: true }),
    supabase
      .from('kyc_submissions')
      .select('id, user_id, id_document_url, selfie_url, status, submitted_at')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true }),
  ]);

  // Map legacy users to submission format
  const legacySubmissions = (legacyRes.data ?? []).map((u: Record<string, unknown>) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    full_name: u.full_name,
    kyc_document_type: u.kyc_document_type,
    kyc_document_url: u.kyc_document_url,
    kyc_selfie_url: u.kyc_selfie_url,
    kyc_submitted_at: u.kyc_submitted_at,
    kyc_status: u.kyc_status,
    kyc_level: u.kyc_level ?? 0,
    source: 'users',
  }));

  // Map new kyc_submissions (fetch user info for each)
  const newSubmissions = await Promise.all(
    (newRes.data ?? []).map(async (s: Record<string, unknown>) => {
      const { data: userRows } = await supabase
        .from('users')
        .select('username, email, full_name, kyc_level')
        .eq('id', s.user_id)
        .limit(1);
      const u = (userRows?.[0] ?? {}) as Record<string, unknown>;
      return {
        id: s.user_id,
        submission_uuid: s.id,
        username: u.username,
        email: u.email,
        full_name: u.full_name,
        kyc_document_type: 'national_id',
        kyc_document_url: s.id_document_url,
        kyc_selfie_url: s.selfie_url,
        kyc_submitted_at: s.submitted_at,
        kyc_status: s.status,
        kyc_level: u.kyc_level ?? 0,
        source: 'kyc_submissions',
      };
    })
  );

  // Merge and dedupe by user_id
  const seen = new Set<number>();
  const merged = [...legacySubmissions, ...newSubmissions].filter((s) => {
    const uid = s.id as number;
    if (seen.has(uid)) return false;
    seen.add(uid);
    return true;
  });

  return NextResponse.json({ submissions: merged });
}

export async function POST(req: NextRequest) {
  const admin = await validateAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { supabase, adminId } = admin;

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

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    kyc_reviewed_at: now,
    kyc_reviewed_by: adminId,
  };

  if (action === 'approve') {
    updates.kyc_status = 'verified';
    updates.kyc_level = 2;
    updates.kyc_rejection_reason = null;
  } else {
    updates.kyc_status = 'rejected';
    updates.kyc_rejection_reason = body.reason;
  }

  // Update user
  const { error: userErr } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    // Only update if currently pending (legacy) OR kyc_level < 2 (new)
    .or('kyc_status.eq.pending,kyc_level.lt.2');

  if (userErr) {
    console.error('[admin/kyc] user update error:', userErr.message);
    return NextResponse.json({ error: 'Failed to process KYC review' }, { status: 500 });
  }

  // Update kyc_submissions table if exists
  const { data: kycSubs } = await supabase
    .from('kyc_submissions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: false })
    .limit(1);

  if (kycSubs && kycSubs.length > 0) {
    await supabase
      .from('kyc_submissions')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_at: now,
        reviewed_by: adminId,
        ...(action === 'reject' ? { rejection_reason: body.reason as string } : {}),
      })
      .eq('id', (kycSubs[0] as Record<string, unknown>).id as string);
  }

  // Create notification for user
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: action === 'approve' ? 'kyc_approved' : 'kyc_rejected',
      title: action === 'approve' ? 'KYC Approved' : 'KYC Rejected',
      message: action === 'approve'
        ? 'Your identity verification has been approved. You now have full access to all platform features.'
        : `Your identity verification was rejected. Reason: ${body.reason || 'No reason provided'}. You can resubmit.`,
      read: false,
      created_at: now,
    });
  } catch { /* notification is non-critical */ }

  return NextResponse.json({ success: true, action, userId });
}
