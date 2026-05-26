import { createServiceClient } from '@/lib/supabase/service';
import type { WaitlistEntry, WaitlistLeaderboardEntry } from '@/lib/types';

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function maskName(name: string): string {
  if (!name || name.length <= 2) return name || '***';
  return name.substring(0, 2) + '***' + name.substring(name.length - 1);
}

function calculateTier(referralCount: number): string {
  if (referralCount >= 30) return 'gold';
  if (referralCount >= 15) return 'silver';
  if (referralCount >= 5) return 'bronze';
  return 'none';
}

function nextTierMilestone(currentTier: string): { nextTier: string; needed: number } | null {
  const milestones: Record<string, { nextTier: string; needed: number }> = {
    none: { nextTier: 'bronze', needed: 5 },
    bronze: { nextTier: 'silver', needed: 15 },
    silver: { nextTier: 'gold', needed: 30 },
    gold: { nextTier: 'genesis', needed: -1 },
  };
  return milestones[currentTier] || null;
}

export async function signupToWaitlist(
  email: string,
  name: string,
  role: 'pastor' | 'member',
  referredBy?: string
): Promise<{ success: boolean; error?: string; referralCode?: string; position?: number; existingReferralCode?: string }> {
  const supabase = createServiceClient();

  // Check for duplicate email
  const { data: existing } = await supabase
    .from('waitlist')
    .select('id, referral_code')
    .eq('email', email.toLowerCase().trim())
    .limit(1);

  if (existing && existing.length > 0) {
    return { success: false, error: 'This email is already on the waitlist.', existingReferralCode: existing[0].referral_code };
  }

  // Generate unique referral code
  let referralCode = generateReferralCode();
  let attempts = 0;
  while (attempts < 10) {
    const { data: dup } = await supabase
      .from('waitlist')
      .select('id')
      .eq('referral_code', referralCode)
      .limit(1);
    if (!dup || dup.length === 0) break;
    referralCode = generateReferralCode();
    attempts++;
  }

  // Validate referrer if provided
  let referrerCode: string | null = null;
  if (referredBy) {
    const { data: referrer } = await supabase
      .from('waitlist')
      .select('referral_code')
      .eq('referral_code', referredBy)
      .limit(1);
    if (referrer && referrer.length > 0) {
      referrerCode = referredBy;
    }
  }

  // Get current total count for position
  const { count } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true });

  const position = (count ?? 0) + 1;

  // Insert waitlist entry
  const { error: insertError } = await supabase
    .from('waitlist')
    .insert({
      email: email.toLowerCase().trim(),
      name: name.trim() || null,
      role,
      referral_code: referralCode,
      referred_by: referrerCode,
      waitlist_position: position,
    });

  if (insertError) {
    if (insertError.message?.includes('duplicate') || insertError.code === '23505') {
      return { success: false, error: 'This email is already on the waitlist.' };
    }
    return { success: false, error: 'Failed to join waitlist. Please try again.' };
  }

  // Increment referrer's count and recalculate tier
  if (referrerCode) {
    const { data: referrerData } = await supabase
      .from('waitlist')
      .select('referral_count')
      .eq('referral_code', referrerCode)
      .limit(1);

    if (referrerData && referrerData.length > 0) {
      const newCount = (referrerData[0].referral_count || 0) + 1;
      const newTier = calculateTier(newCount);
      await supabase
        .from('waitlist')
        .update({ referral_count: newCount, tier: newTier })
        .eq('referral_code', referrerCode);
    }
  }

  return { success: true, referralCode, position };
}

export async function getWaitlistStats(): Promise<{ totalCount: number; recentSignups: number }> {
  const supabase = createServiceClient();

  const { count } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true });

  // Recent = last 24 hours
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const { count: recentCount } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true })
    .gte('joined_at', yesterday);

  return { totalCount: count ?? 0, recentSignups: recentCount ?? 0 };
}

export async function getWaitlistDashboard(referralCode: string): Promise<{
  entry: WaitlistEntry | null;
  rank: number | null;
  totalSignups: number;
  nextMilestone: { nextTier: string; needed: number } | null;
  referrals: { name: string; tier: string; joined_at: string }[];
}> {
  const supabase = createServiceClient();

  const { data: entry } = await supabase
    .from('waitlist')
    .select('*')
    .eq('referral_code', referralCode)
    .limit(1);

  const entryData = (entry?.[0] ?? null) as unknown as WaitlistEntry | null;

  // Get total signups
  const { count: totalSignups } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true });

  // Calculate rank based on referral_count
  let rank: number | null = null;
  if (entryData) {
    const { count: higherCount } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .gt('referral_count', entryData.referral_count);

    rank = (higherCount ?? 0) + 1;
  }

  // Get referrals made by this person
  const { data: referrals } = await supabase
    .from('waitlist')
    .select('name, tier, joined_at')
    .eq('referred_by', referralCode)
    .order('joined_at', { ascending: false })
    .limit(50);

  const nextMilestone = entryData
    ? nextTierMilestone(entryData.tier)
    : null;

  return {
    entry: entryData,
    rank,
    totalSignups: totalSignups ?? 0,
    nextMilestone,
    referrals: (referrals ?? []) as unknown as { name: string; tier: string; joined_at: string }[],
  };
}

export async function getLeaderboard(limit = 100): Promise<WaitlistLeaderboardEntry[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('waitlist')
    .select('name, referral_count, tier')
    .gt('referral_count', 0)
    .order('referral_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getLeaderboard] Supabase error:', JSON.stringify(error));
    return [];
  }

  const entries = (data ?? []) as unknown as { name: string | null; referral_count: number; tier: string }[];

  return entries.map((entry, index) => ({
    name: maskName(entry.name || 'Anonymous'),
    referral_count: entry.referral_count,
    tier: entry.tier,
    rank: index + 1,
  }));
}

export async function getWaitlistEntryByReferralCode(referralCode: string): Promise<WaitlistEntry | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('waitlist')
    .select('*')
    .eq('referral_code', referralCode)
    .limit(1);

  return ((data?.[0] ?? null) as unknown as WaitlistEntry | null);
}

export { calculateTier, nextTierMilestone, maskName };
