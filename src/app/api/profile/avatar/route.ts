import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Allowed: JPG, PNG, WebP' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum 2MB' }, { status: 400 });
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const filename = `${userId}-${Date.now()}.${ext}`;

  const buffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('[profile/avatar] upload:', uploadError.message);
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filename);

  const avatarUrl = urlData?.publicUrl || '';
  if (!avatarUrl) {
    return NextResponse.json({ error: 'Failed to get public URL' }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);

  if (updateError) {
    console.error('[profile/avatar] update:', updateError.message);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }

  return NextResponse.json({ success: true, avatar_url: avatarUrl });
}
