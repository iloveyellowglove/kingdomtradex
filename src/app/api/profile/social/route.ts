import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { applyRateLimit } from '@/lib/rate-limit';

async function getUserId(): Promise<number | null> {
  const token = cookies().get('__Host-kingdom_session')?.value;
  if (!token || token.length !== 64) return null;
  const supabase = createServiceClient();
  const { data: sessions } = await supabase.from('sessions').select('user_id').eq('session_token', token).limit(1);
  if (!sessions || sessions.length === 0) return null;
  return sessions[0].user_id;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  const supabase = createServiceClient();
  const { data } = await supabase.from('users').select(
    'social_twitter,social_telegram,social_instagram,social_facebook,' +
    'social_twitter_verified,social_telegram_verified,social_instagram_verified,social_facebook_verified,' +
    'social_reward_claimed'
  ).eq('id', userId).single();
  const u = data as Record<string, unknown> | null;
  return NextResponse.json({
    success: true,
    handles: { twitter: u?.social_twitter || null, telegram: u?.social_telegram || null, instagram: u?.social_instagram || null, facebook: u?.social_facebook || null },
    verified: { twitter: !!u?.social_twitter_verified, telegram: !!u?.social_telegram_verified, instagram: !!u?.social_instagram_verified, facebook: !!u?.social_facebook_verified },
    rewardClaimed: !!u?.social_reward_claimed,
  });
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

    const socialRateLimit = applyRateLimit(userId, 'social_update', 10, 3600000);
    if (!socialRateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { platform, handle } = await request.json();
    if (!platform || !handle || !['twitter', 'telegram', 'instagram', 'facebook'].includes(platform)) {
      return NextResponse.json({ success: false, error: 'Invalid platform' }, { status: 400 });
    }

    // Validate social handle format per platform
    const handleClean = handle.trim().replace(/^@/, '');
    const HANDLE_PATTERNS: Record<string, RegExp> = {
      twitter: /^[a-zA-Z0-9_]{1,15}$/,
      telegram: /^[a-zA-Z0-9_]{5,32}$/,
      instagram: /^[a-zA-Z0-9._]{1,30}$/,
      facebook: /^[a-zA-Z0-9.]{5,50}$/,
    };
    const pattern = HANDLE_PATTERNS[platform];
    if (pattern && !pattern.test(handleClean)) {
      return NextResponse.json({ success: false, error: `Invalid ${platform} handle format.` }, { status: 400 });
    }
    const supabase = createServiceClient();
    const { error } = await supabase.from('users').update({ ['social_' + platform]: handle }).eq('id', userId);
    if (error) {
      console.error('[social POST]', error.message);
      return NextResponse.json({ success: false, error: 'Failed to update social handle.' }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: 'Social handle saved. Verification pending.' });
  } catch (err) {
    console.error('[social POST]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

export async function PUT() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

    const socialRateLimit = applyRateLimit(userId, 'social_claim', 10, 3600000);
    if (!socialRateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('claim_social_reward', { p_user_id: userId });
    if (error) {
      console.error('[social PUT]', error.message);
      return NextResponse.json({ success: false, error: 'Failed to claim social reward.' }, { status: 500 });
    }
    const result = (data as Array<{ success: boolean; reward_amount: number; message: string }>)?.[0];
    return NextResponse.json({ success: result?.success, error: result?.message, rewardAmount: result?.reward_amount });
  } catch (err) {
    console.error('[social PUT]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
