import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/service';
import { generateReferralCode, generatePlisioUid } from '@/lib/utils/referral';

export async function POST(request: NextRequest) {
  const { username, email, password, referral_code } = await request.json();

  const usernameClean = (username || '').trim();
  const emailClean = (email || '').toLowerCase().trim();

  if (usernameClean.length < 3 || usernameClean.length > 50) {
    return NextResponse.json({ success: false, error: 'Username must be 3-50 characters.' }, { status: 400 });
  }
  if (!emailClean || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailClean)) {
    return NextResponse.json({ success: false, error: 'Invalid email address.' }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ success: false, error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .or(`email.eq.${emailClean},username.eq.${usernameClean}`)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ success: false, error: 'Email or username already taken.' }, { status: 409 });
  }

  let referredBy: number | null = null;
  if (referral_code) {
    const { data: ref } = await supabase
      .from('users')
      .select('id')
      .eq('referral_code', referral_code.toUpperCase().trim())
      .eq('status', 'active')
      .limit(1);
    if (ref && ref.length > 0) {
      referredBy = ref[0].id;
    } else {
      return NextResponse.json({ success: false, error: 'Invalid referral code.' }, { status: 400 });
    }
  }

  const newReferralCode = await generateReferralCode();

  const { data: lastUser } = await supabase
    .from('users')
    .select('id')
    .order('id', { ascending: false })
    .limit(1);
  const nextId = (lastUser?.[0]?.id ?? 0) + 1;

  const plisioUid = generatePlisioUid(nextId, emailClean);
  const passwordHash = hashPassword(password);
  const now = new Date().toISOString();

  const { data: newUser } = await supabase
    .from('users')
    .insert({
      username: usernameClean,
      email: emailClean,
      password_hash: passwordHash,
      role: 'member',
      referral_code: newReferralCode,
      referred_by: referredBy,
      plisio_uid: plisioUid,
      plisio_btc_address: '',
      plisio_eth_address: '',
      plisio_usdt_address: '',
      display_balance: 50.00,
      total_deposited_real: 0,
      total_withdrawn_real: 0,
      pending_withdrawal_amount: 0,
      bonus_balance: 50.00,
      bonus_locked: true,
      status: 'active',
      created_at: now,
    })
    .select();

  if (!newUser || newUser.length === 0) {
    return NextResponse.json({ success: false, error: 'Registration failed. Please try again.' }, { status: 500 });
  }

  const { token } = await createSession(newUser[0].id, 'member');

  const response = NextResponse.json({
    success: true,
    user_id: newUser[0].id,
    referral_code: newReferralCode,
  });
  response.cookies.set('kingdom_session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 86400,
  });
  return response;
}
