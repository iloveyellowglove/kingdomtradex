import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

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

  // Check KYC status - can't upload if already verified or pending
  const { data: users } = await supabase
    .from('users')
    .select('kyc_status')
    .eq('id', userId)
    .limit(1);

  if (users && users.length > 0) {
    const u = users[0] as unknown as { kyc_status?: string };
    const status = u.kyc_status || 'unverified';
    if (status === 'verified') {
      return NextResponse.json({ error: 'KYC already verified' }, { status: 400 });
    }
    if (status === 'pending') {
      return NextResponse.json({ error: 'KYC submission is pending review' }, { status: 400 });
    }
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const uploadType = formData.get('type') as string | null; // 'document' or 'selfie'

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!uploadType || !['document', 'selfie'].includes(uploadType)) {
    return NextResponse.json({ error: 'Invalid upload type. Must be document or selfie' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Allowed: JPG, PNG, WebP, PDF' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum 5MB' }, { status: 400 });
  }

  const ext = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const filename = `${userId}-${uploadType}-${Date.now()}.${ext}`;

  const buffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('kyc-documents')
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('[kyc/upload]', uploadError.message);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from('kyc-documents')
    .getPublicUrl(filename);

  const publicUrl = urlData?.publicUrl || '';

  if (!publicUrl) {
    return NextResponse.json({ error: 'Failed to get public URL' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    url: publicUrl,
    type: uploadType,
  });
}
