import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/service';
import { generateReferralCode, generatePlisioUid } from '@/lib/utils/referral';
import { getBonusTier } from '@/lib/bonus-tiers';
import { sendEmail } from '@/lib/services/email';
import { withErrorHandler } from '@/lib/api-error-handler';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const { username, email, password, referral_code, role: rawRole } = await request.json();

  const allowedRoles = ['member', 'pastor'];
  const role = allowedRoles.includes(rawRole) ? rawRole : 'member';

  const usernameClean = (username || '').trim();
  const emailClean = (email || '').toLowerCase().trim();

  if (!/^[a-zA-Z0-9._-]{3,30}$/.test(usernameClean)) {
    return NextResponse.json({ success: false, error: 'Username must be 3-30 characters: letters, numbers, dots, hyphens, underscores only.' }, { status: 400 });
  }
  if (!emailClean || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailClean)) {
    return NextResponse.json({ success: false, error: 'Invalid email address.' }, { status: 400 });
  }
  const pwCheck = validatePasswordStrength(password);
  if (!pwCheck.valid) {
    return NextResponse.json({ success: false, error: pwCheck.error! }, { status: 400 });
  }

  // Rate limit: 1 registration per IP per 24 hours
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const g = globalThis as Record<string, unknown>;
  const registerMap = (g.__registerRateLimitMap as Map<string, number>)
    ?? (g.__registerRateLimitMap = new Map<string, number>());
  const lastRegister = registerMap.get(ip);
  if (lastRegister && (Date.now() - lastRegister) < 86400000) {
    return NextResponse.json({ success: false, error: 'Please wait 24 hours before creating another account.' }, { status: 429 });
  }
  registerMap.set(ip, Date.now());

  // Anti-abuse: track IP registrations to flag suspicious referrals
  const ipRegMap = (g.__ipRegistrations as Map<string, number[]>)
    ?? (g.__ipRegistrations = new Map<string, number[]>());
  const recentUserIds = ipRegMap.get(ip) ?? [];
  const sameIpRecent = recentUserIds.length > 0;

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

  const tier = getBonusTier(role);

  // Insert user without referral_suspicious and registration_ip (may not exist yet)
  const { data: newUser } = await supabase
    .from('users')
    .insert({
      username: usernameClean,
      email: emailClean,
      password_hash: passwordHash,
      role,
      referral_code: newReferralCode,
      referred_by: referredBy,
      plisio_uid: plisioUid,
      plisio_btc_address: '',
      plisio_eth_address: '',
      plisio_usdt_address: '',
      display_balance: tier.bonusAmount.toFixed(8),
      total_deposited_real: 0,
      total_withdrawn_real: 0,
      pending_withdrawal_amount: 0,
      bonus_balance: tier.bonusAmount,
      bonus_locked: tier.bonusAmount > 0,
      minimum_deposit_to_unlock: tier.unlockThreshold,
      kyc_level: 0,
      signup_credit: 50.00,
      referral_level: 0,
      two_factor_enabled: false,
      auto_withdrawal_enabled: false,
      status: 'active',
      created_at: now,
    })
    .select();

  if (!newUser || newUser.length === 0) {
    return NextResponse.json({ success: false, error: 'Registration failed. Please try again.' }, { status: 500 });
  }

  // Set anti-abuse columns in a separate update (safe if columns don't exist yet)
  try {
    await supabase.from('users').update({
      registration_ip: ip !== 'unknown' ? ip : null,
      referral_suspicious: Boolean(referredBy && sameIpRecent),
    }).eq('id', newUser[0].id);
  } catch {
    // Non-critical: columns may not exist yet (migration pending). Don't fail registration.
    console.warn('[register] Failed to set referral_suspicious/registration_ip — migration may be pending');
  }

  // Track this user's ID for the IP-based anti-abuse map
  if (ip !== 'unknown') {
    recentUserIds.push(newUser[0].id);
    ipRegMap.set(ip, recentUserIds.slice(-5));
  }

  // Generate email verification token and send verification email
  try {
    const verifyToken = randomBytes(32).toString('hex');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyLink = `${appUrl}/api/auth/verify-email?token=${verifyToken}`;

    await supabase.from('password_resets').insert({
      email: emailClean,
      token: verifyToken,
      type: 'email_verification',
      created_at: now,
      used: false,
    });

    await sendEmail(emailClean, 'Verify your email - KingdomTradex', `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #F0B90B;">KingdomTradex</h2>
        <p>Welcome! Please verify your email address to activate your account and unlock withdrawals.</p>
        <p style="margin: 24px 0;">
          <a href="${verifyLink}" style="background: #F0B90B; color: #000; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Verify Email
          </a>
        </p>
        <p style="color: #848E9C; font-size: 13px;">This link expires in 24 hours.</p>
        <p style="color: #848E9C; font-size: 13px;">If you did not create this account, please ignore this email.</p>
      </div>
    `);
  } catch (emailErr) {
    console.error('[register] Verification email failed:', emailErr);
    // Non-fatal: user can request a resend later via /api/auth/resend-verification
  }

  // Create session
  try {
    const { token } = await createSession(newUser[0].id, role);
    const response = NextResponse.json({
      success: true,
      user_id: newUser[0].id,
      referral_code: newReferralCode,
      message: 'Account created. Please check your email to verify your account.',
    });
    response.cookies.set('__Host-kingdom_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    });
    return response;
  } catch (sessionErr) {
    console.error('[register] Session creation failed:', sessionErr);
    // User created but session failed — return success with login instruction
    return NextResponse.json({
      success: true,
      user_id: newUser[0].id,
      referral_code: newReferralCode,
      message: 'Account created. Please log in to continue.',
    });
  }
});
