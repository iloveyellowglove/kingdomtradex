import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { confirmCommissions } from '@/lib/db/commissions';

// GET /api/auth/verify-email?token=xxx
// Sets kyc_level = 1 (email verified) and marks token as used.
// Only processes tokens with type='email_verification' to avoid conflicts
// with password reset tokens.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ success: false, error: 'Missing verification token.' }, { status: 400 });
  }

  if (token.length < 32) {
    return NextResponse.json({ success: false, error: 'Invalid token.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Find email verification token (filter by type='email_verification')
  const { data: rows } = await supabase
    .from('password_resets')
    .select('id, email, created_at, used')
    .eq('token', token)
    .eq('type', 'email_verification')
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

  // Confirm any pending referral commissions from this user's deposits
  // (commissions were held until the depositor reached KYC Level 1)
  try {
    const { data: userRows } = await supabase
      .from('users')
      .select('id')
      .eq('email', record.email)
      .limit(1);
    if (userRows && userRows.length > 0) {
      const { data: userDeposits } = await supabase
        .from('deposits')
        .select('id')
        .eq('user_id', userRows[0].id)
        .eq('status', 'completed');
      for (const d of userDeposits ?? []) {
        await confirmCommissions(d.id);
      }
    }
  } catch (commErr) {
    console.error('[verify-email] commission confirmation failed:', commErr);
    // Non-fatal: commissions can be confirmed manually by admin
  }

  // Redirect to login with verified message
  const redirectUrl = new URL('/login?verified=1', request.url);
  return NextResponse.redirect(redirectUrl);
}
