import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';

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
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  const { platform, handle } = await request.json();
  if (!platform || !handle || !['twitter', 'telegram', 'instagram', 'facebook'].includes(platform)) {
    return NextResponse.json({ success: false, error: 'Invalid platform' }, { status: 400 });
  }
  const supabase = createServiceClient();
  const { error } = await supabase.from('users').update({ ['social_' + platform]: handle }).eq('id', userId);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, message: 'Social handle saved. Verification pending.' });
}

export async function PUT() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('claim_social_reward', { p_user_id: userId });
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  const result = (data as Array<{ success: boolean; reward_amount: number; message: string }>)?.[0];
  return NextResponse.json({ success: result?.success, error: result?.message, rewardAmount: result?.reward_amount });
}
