import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServiceClient();
  const dayAgo = new Date(Date.now() - 86400000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  // User counts
  const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
  const { count: activeUsers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'active');
  const { count: newUsers24h } = await supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', dayAgo);
  const { count: newUsers7d } = await supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo);

  // Deposit metrics
  const { data: deposits24h } = await supabase.from('deposits').select('amount').eq('status', 'completed').gte('created_at', dayAgo);
  const { data: deposits7d } = await supabase.from('deposits').select('amount').eq('status', 'completed').gte('created_at', weekAgo);
  const { data: deposits30d } = await supabase.from('deposits').select('amount').eq('status', 'completed').gte('created_at', monthAgo);
  const { data: allDeposits } = await supabase.from('deposits').select('amount').eq('status', 'completed');

  const sum = (rows: { amount: number }[] | null) => (rows ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0);
  const deposit24h = sum(deposits24h as unknown as { amount: number }[] | null);
  const deposit7d = sum(deposits7d as unknown as { amount: number }[] | null);
  const deposit30d = sum(deposits30d as unknown as { amount: number }[] | null);
  const depositAllTime = sum(allDeposits as unknown as { amount: number }[] | null);

  // Withdrawal queue
  const { data: pendingWds } = await supabase.from('withdrawals').select('amount').in('status', ['pending', 'processing']);
  const pendingWdCount = (pendingWds ?? []).length;
  const pendingWdTotal = sum(pendingWds as unknown as { amount: number }[] | null);

  // Revenue (30% retained pool)
  const { data: splits } = await supabase.from('deposit_splits').select('usdt_retained').eq('status', 'completed');
  const retainedTotal = (splits ?? []).reduce((s: number, r: Record<string, unknown>) => s + Number(r.usdt_retained ?? 0), 0);

  // KYC queue
  const { count: kycPending } = await supabase.from('kyc_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
  const { count: kycLegacy } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('kyc_status', 'pending');

  // Daily signups for chart (last 14 days)
  const signups: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    const dateStr = date.toISOString().split('T')[0];
    const start = dateStr + 'T00:00:00Z';
    const end = dateStr + 'T23:59:59Z';
    const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end);
    signups.push({ date: dateStr, count: count ?? 0 });
  }

  return NextResponse.json({
    success: true,
    users: { total: totalUsers ?? 0, active: activeUsers ?? 0, new24h: newUsers24h ?? 0, new7d: newUsers7d ?? 0 },
    deposits: { allTime: depositAllTime, last24h: deposit24h, last7d: deposit7d, last30d: deposit30d },
    withdrawals: { pendingCount: pendingWdCount, pendingTotal: pendingWdTotal },
    revenue: { retainedTotal },
    kyc: { pendingNew: kycPending ?? 0, pendingLegacy: kycLegacy ?? 0 },
    signups,
  });
}
