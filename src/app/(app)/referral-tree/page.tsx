import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import ReferralTreeView from '@/components/referral/ReferralTreeView';
import type { ReferralTreeNode } from '@/lib/types';

type UserRow = { id: number; username: string; email: string; display_balance: number; created_at: string };

async function fetchDownline(parentId: number, currentLevel: number, maxDepth: number, supabase: ReturnType<typeof createServiceClient>): Promise<ReferralTreeNode[]> {
  if (currentLevel > maxDepth) return [];

  const { data } = await supabase
    .from('users')
    .select('id,username,email,display_balance,created_at')
    .eq('referred_by', parentId)
    .eq('status', 'active');

  const children: ReferralTreeNode[] = [];
  for (const row of (data ?? []) as unknown as UserRow[]) {
    children.push({
      ...row,
      level: currentLevel,
      children: await fetchDownline(row.id, currentLevel + 1, maxDepth, supabase),
    });
  }
  return children;
}

export default async function ReferralTreePage() {
  const cookieStore = cookies();
  const token = cookieStore.get('__Host-kingdom_session')?.value;
  if (!token) redirect('/login');

  const supabase = createServiceClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id')
    .eq('session_token', token)
    .limit(1);

  const s = (sessions ?? []) as unknown as { user_id: number }[];
  if (s.length === 0) redirect('/login');
  const userId = s[0].user_id;

  const tree = await fetchDownline(userId, 1, 5, supabase);

  const { data: user } = await supabase
    .from('users')
    .select('referral_code')
    .eq('id', userId)
    .limit(1);

  const userData = (user ?? []) as unknown as { referral_code: string }[];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kingdomtradex.vercel.app';

  return (
    <div className="py-4">
      <div className="flex flex-col md:flex-row justify-between mb-6">
        <div>
          <h2>Disciples Tree</h2>
          <p className="text-text-muted">Your covenant network across 5 levels</p>
        </div>
        <div className="mt-2 md:mt-0">
          <small className="text-text-muted">Your Referral Code:</small>
          <br />
          <strong className="text-temple-gold">{userData[0]?.referral_code || ''}</strong>
          <br />
          <small className="text-text-muted">Link: <code>{appUrl}/register?ref={userData[0]?.referral_code || ''}</code></small>
        </div>
      </div>

      <ReferralTreeView tree={tree} />
    </div>
  );
}
