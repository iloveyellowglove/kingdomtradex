import { createServiceClient } from '../supabase/service';
import type { User, DownlineCounts } from '../types';

export async function getUserById(id: number): Promise<User | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .limit(1);
  return data?.[0] ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .limit(1);
  return data?.[0] ?? null;
}

export async function getUserByPlisioUid(uid: string): Promise<User | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('plisio_uid', uid)
    .limit(1);
  return data?.[0] ?? null;
}

export async function getUserByReferralCode(code: string): Promise<User | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('referral_code', code.toUpperCase().trim())
    .eq('status', 'active')
    .limit(1);
  return data?.[0] ?? null;
}

export async function checkExistingUser(email: string, username: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('users')
    .select('id')
    .or(`email.eq.${email.toLowerCase().trim()},username.eq.${username.trim()}`)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export async function createUser(userData: {
  username: string;
  email: string;
  password_hash: string;
  role: string;
  referral_code: string;
  referred_by: number | null;
  plisio_uid: string;
  display_balance: number;
  total_deposited_real: number;
  total_withdrawn_real: number;
  pending_withdrawal_amount: number;
  status: string;
  created_at: string;
}): Promise<User | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('users')
    .insert(userData)
    .select();
  return data?.[0] ?? null;
}

export async function updateUser(id: number, fields: Record<string, unknown>): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from('users').update(fields).eq('id', id);
}

export async function getLastUserId(): Promise<number> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('users')
    .select('id')
    .order('id', { ascending: false })
    .limit(1);
  return data?.[0]?.id ?? 0;
}

export async function getDownlineCounts(userId: number): Promise<DownlineCounts> {
  const counts: DownlineCounts = { level_1: 0, level_2: 0, level_3: 0, level_4: 0, level_5: 0 };

  const l1 = await getReferralIds(userId);
  counts.level_1 = l1.length;
  if (!l1.length) return counts;

  const l2 = await getReferralIdsForList(l1);
  counts.level_2 = l2.length;
  if (!l2.length) return counts;

  const l3 = await getReferralIdsForList(l2);
  counts.level_3 = l3.length;
  if (!l3.length) return counts;

  const l4 = await getReferralIdsForList(l3);
  counts.level_4 = l4.length;
  if (!l4.length) return counts;

  const l5 = await getReferralIdsForList(l4);
  counts.level_5 = l5.length;

  return counts;
}

async function getReferralIds(userId: number): Promise<number[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('referred_by', userId)
    .eq('status', 'active');
  return (data ?? []).map((d: Record<string, unknown>) => d.id);
}

async function getReferralIdsForList(userIds: number[]): Promise<number[]> {
  if (!userIds.length) return [];
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('users')
    .select('id')
    .in('referred_by', userIds)
    .eq('status', 'active');
  return (data ?? []).map((d: Record<string, unknown>) => d.id);
}

export async function searchUsers(
  query: string,
  limit = 50,
  offset = 0
): Promise<Pick<User, 'id' | 'username' | 'email' | 'role' | 'display_balance' | 'total_deposited_real' | 'total_withdrawn_real' | 'status' | 'created_at'>[]> {
  const supabase = createServiceClient();
  const safe = query.replace(/[^a-zA-Z0-9@._%\-\s]/g, '');

  let q = supabase
    .from('users')
    .select('id,username,email,role,display_balance,total_deposited_real,total_withdrawn_real,status,created_at')
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1);

  if (safe) {
    q = q.or(`email.ilike.%${safe}%,username.ilike.%${safe}%`);
  }

  const { data } = await q;
  return data ?? [];
}

export async function getDownlineTree(userId: number, maxDepth = 5) {
  return fetchDownline(userId, 1, maxDepth);
}

async function fetchDownline(parentId: number, currentLevel: number, maxDepth: number): Promise<Array<Record<string, unknown>>> {
  if (currentLevel > maxDepth) return [];

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('users')
    .select('id,username,email,display_balance,created_at')
    .eq('referred_by', parentId)
    .eq('status', 'active');

  const children = [];
  for (const row of data ?? []) {
    children.push({
      ...row,
      level: currentLevel,
      children: await fetchDownline(row.id, currentLevel + 1, maxDepth),
    });
  }
  return children;
}
