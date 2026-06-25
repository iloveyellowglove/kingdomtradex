import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyShareToken } from '@/lib/share-token';

export async function POST(request: NextRequest) {
  const token = cookies().get('__Host-kingdom_session')?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id')
    .eq('session_token', token)
    .limit(1);

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ success: false, error: 'Session expired.' }, { status: 401 });
  }

  const userId = sessions[0].user_id;

  // Rate limit: 5 verification attempts per user per hour
  const g = globalThis as Record<string, unknown>;
  const verifyMap = (g.__verifyRateLimitMap as Map<number, { count: number; resetAt: number }>)
    ?? (g.__verifyRateLimitMap = new Map<number, { count: number; resetAt: number }>());
  const now = Date.now();
  const verifyEntry = verifyMap.get(userId);
  if (verifyEntry && now < verifyEntry.resetAt && verifyEntry.count >= 5) {
    return NextResponse.json({
      success: false,
      error: 'Too many verification attempts. Please try again later.',
    }, { status: 429 });
  }
  if (!verifyEntry || now >= verifyEntry.resetAt) {
    verifyMap.set(userId, { count: 1, resetAt: now + 3600000 });
  } else {
    verifyEntry.count++;
  }

  const { withdrawal_id, platform, testimony_id, share_token } = await request.json();

  const sharePlatform = (platform || '').trim().toLowerCase();
  const validPlatforms = ['facebook', 'whatsapp', 'instagram', 'twitter', 'x'];
  if (!sharePlatform || !validPlatforms.includes(sharePlatform)) {
    return NextResponse.json({
      success: false,
      error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}.`,
    }, { status: 400 });
  }

  if (withdrawal_id) {
    // Require a cryptographically signed share token
    if (!share_token || typeof share_token !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Share token required. Please share via the testimony page.',
      }, { status: 400 });
    }

    const tokenResult = verifyShareToken(share_token);
    if (!tokenResult.valid) {
      return NextResponse.json({
        success: false,
        error: tokenResult.error || 'Invalid share token.',
      }, { status: 400 });
    }

    // Token userId must match authenticated user
    if (tokenResult.userId !== userId) {
      return NextResponse.json({
        success: false,
        error: 'Share token does not belong to you.',
      }, { status: 403 });
    }

    // If token has a testimonyId, it must match the one being verified
    if (tokenResult.testimonyId && testimony_id && tokenResult.testimonyId !== testimony_id) {
      return NextResponse.json({
        success: false,
        error: 'Share token does not match testimony.',
      }, { status: 400 });
    }

    // Verify withdrawal belongs to user and is completed
    const { data: wd } = await supabase
      .from('withdrawals')
      .select('id, status')
      .eq('id', withdrawal_id)
      .eq('user_id', userId)
      .single();

    if (!wd) {
      return NextResponse.json({ success: false, error: 'Withdrawal not found.' }, { status: 404 });
    }

    if (wd.status !== 'completed') {
      return NextResponse.json({
        success: false,
        error: 'Withdrawal must be completed before verification.',
      }, { status: 400 });
    }

    // Find the social share
    const shareQuery = supabase
      .from('social_shares')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', sharePlatform);

    if (testimony_id) {
      shareQuery.eq('testimony_id', testimony_id);
    }

    const { data: shares } = await shareQuery.limit(1);

    if (!shares || shares.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No share found for this withdrawal. Please share your testimony first.',
      }, { status: 400 });
    }

    // Check if already verified
    const { data: existing } = await supabase
      .from('share_verifications')
      .select('id')
      .eq('user_id', userId)
      .eq('withdrawal_id', withdrawal_id)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ success: true, verified: true, already_verified: true });
    }

    // Insert verification
    await supabase.from('share_verifications').insert({
      user_id: userId,
      withdrawal_id,
      share_id: shares[0].id,
    });

    return NextResponse.json({ success: true, verified: true });
  }

  // No withdrawal_id — register generic share (first withdrawal pre-requisite)
  const { data: existingShare } = await supabase
    .from('social_shares')
    .select('id, click_count')
    .eq('user_id', userId)
    .is('testimony_id', null)
    .eq('platform', sharePlatform)
    .limit(1);

  if (existingShare && existingShare.length > 0) {
    await supabase
      .from('social_shares')
      .update({ click_count: (existingShare[0].click_count || 0) + 1 })
      .eq('id', existingShare[0].id);
  } else {
    await supabase.from('social_shares').insert({
      user_id: userId,
      platform: sharePlatform,
      click_count: 1,
    });
  }

  return NextResponse.json({ success: true, verified: true, generic_share: true });
}
