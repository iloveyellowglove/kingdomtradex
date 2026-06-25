import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET /api/auth/verify-email?token=xxx
// Sets kyc_level = 1 (email verified) and marks token as used
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ success: false, error: 'Missing verification token.' }, { status: 400 });
  }

  if (token.length < 32) {
    return NextResponse.json({ success: false, error: 'Invalid token.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Find password_resets table entry for this token (reusing existing table for email verification)
  const { data: rows } = await supabase
    .from('password_resets')
    .select('id, email, created_at, used')
    .eq('token', token)
    .limit(1);

  if (!rows || rows.length === 0) {
    return NextResponse.json({ success: false, error: 'Invalid or expired verification link.' }, { status: 400 });
  }

  const record = rows[0] as unknown as { id: number; email: string; created_at: string; used: boolean };

  if (record.used) {
    return NextResponse.json({ success: false, error: 'This verification link has already been used.' }, { status: 400 });
  }

  // Check 24h expiry
  const createdAt = new Date(record.created_at).getTime();
  if (Date.now() - createdAt > 24 * 60 * 60 * 1000) {
    return NextResponse.json({ success: false, error: 'Verification link has expired. Please request a new one.' }, { status: 400 });
  }

  // Mark token as used
  await supabase
    .from('password_resets')
    .update({ used: true })
    .eq('id', record.id);

  // Set kyc_level = 1 for the user
  const { error: updateErr } = await supabase
    .from('users')
    .update({ kyc_level: 1 })
    .eq('email', record.email);

  if (updateErr) {
    console.error('[verify-email] update failed:', updateErr.message);
    return NextResponse.json({ success: false, error: 'Failed to verify email.' }, { status: 500 });
  }

  // Redirect to login with verified message
  const redirectUrl = new URL('/login?verified=1', request.url);
  return NextResponse.redirect(redirectUrl);
}
