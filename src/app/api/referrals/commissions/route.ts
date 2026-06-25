import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  const token = cookies().get('__Host-kingdom_session')?.value;
  if (!token || token.length !== 64) {
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

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');     // 'deposit_bonus' | 'profit_share' | null
  const level = searchParams.get('level');   // '1'-'5' | null
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  // Build query
  let query = supabase
    .from('referral_commissions')
    .select('id, source_user_id, level, percentage, amount, source_amount, status, referral_type, commission_rate, created_at', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type && ['deposit_bonus', 'profit_share'].includes(type)) {
    query = query.eq('referral_type', type);
  }
  if (level && ['1', '2', '3', '4', '5'].includes(level)) {
    query = query.eq('level', parseInt(level, 10));
  }

  const { data: commissions, count, error } = await query;

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  // Enrich with source username
  const enriched = await Promise.all(
    (commissions ?? []).map(async (c: Record<string, unknown>) => {
      let sourceUsername = 'Unknown';
      try {
        const { data: src } = await supabase
          .from('users')
          .select('username')
          .eq('id', c.source_user_id)
          .limit(1);
        if (src && src.length > 0) {
          sourceUsername = (src[0] as Record<string, unknown>).username as string;
        }
      } catch { /* ignore */ }
      return {
        id: c.id,
        sourceUserId: c.source_user_id,
        sourceUsername,
        level: c.level,
        percentage: Number(c.percentage),
        amount: Number(c.amount),
        sourceAmount: Number(c.source_amount),
        status: c.status,
        type: c.referral_type || 'deposit_bonus',
        commissionRate: Number(c.commission_rate ?? 0),
        createdAt: c.created_at,
      };
    })
  );

  return NextResponse.json({
    success: true,
    commissions: enriched,
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}
