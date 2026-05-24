import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const VALID_DOC_TYPES = ['passport', 'national_id', 'drivers_license'];

export async function GET(req: NextRequest) {
  const token = req.cookies.get('kingdom_session')?.value;
  if (!token || token.length !== 64) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

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

  const { data: users } = await supabase
    .from('users')
    .select('kyc_status, kyc_document_type, kyc_submitted_at, kyc_reviewed_at, kyc_rejection_reason')
    .eq('id', sess[0].user_id)
    .limit(1);

  if (!users || users.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const u = users[0] as unknown as {
    kyc_status: string;
    kyc_document_type: string | null;
    kyc_submitted_at: string | null;
    kyc_reviewed_at: string | null;
    kyc_rejection_reason: string | null;
  };

  return NextResponse.json({
    status: u.kyc_status || 'unverified',
    documentType: u.kyc_document_type,
    submittedAt: u.kyc_submitted_at,
    reviewedAt: u.kyc_reviewed_at,
    rejectionReason: u.kyc_rejection_reason,
  });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('kingdom_session')?.value;
  if (!token || token.length !== 64) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

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

  // Check current KYC status
  const { data: users } = await supabase
    .from('users')
    .select('kyc_status')
    .eq('id', userId)
    .limit(1);

  if (!users || users.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const u = users[0] as unknown as { kyc_status?: string };
  const currentStatus = u.kyc_status || 'unverified';
  if (currentStatus === 'pending') {
    return NextResponse.json({ error: 'KYC verification is already pending' }, { status: 400 });
  }
  if (currentStatus === 'verified') {
    return NextResponse.json({ error: 'Your identity is already verified' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const documentType = typeof body.document_type === 'string' ? body.document_type : null;
  const documentUrl = typeof body.document_url === 'string' ? body.document_url : null;
  const selfieUrl = typeof body.selfie_url === 'string' ? body.selfie_url : null;

  if (!documentType || !VALID_DOC_TYPES.includes(documentType)) {
    return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
  }
  if (!documentUrl) {
    return NextResponse.json({ error: 'Document upload is required' }, { status: 400 });
  }
  if (!selfieUrl) {
    return NextResponse.json({ error: 'Selfie upload is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('users')
    .update({
      kyc_status: 'pending',
      kyc_document_type: documentType,
      kyc_document_url: documentUrl,
      kyc_selfie_url: selfieUrl,
      kyc_submitted_at: new Date().toISOString(),
      kyc_rejection_reason: null,
    })
    .eq('id', userId);

  if (error) {
    console.error('[profile/kyc]', error.message);
    return NextResponse.json({ error: 'Failed to submit KYC' }, { status: 500 });
  }

  return NextResponse.json({ success: true, status: 'pending' });
}
