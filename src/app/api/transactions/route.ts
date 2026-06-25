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
  const sp = request.nextUrl.searchParams;
  const type = sp.get('type');           // 'deposit' | 'withdrawal' | 'commission' | 'profit'
  const status = sp.get('status');       // filter by status
  const search = sp.get('search');       // tx hash search
  const from = sp.get('from');           // ISO date
  const to = sp.get('to');               // ISO date
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(sp.get('limit') || '25', 10)));
  const exportCsv = sp.get('export') === '1';

  const rows: Array<{
    id: string;
    type: string;
    subtype: string;
    amount: number;
    currency: string;
    status: string;
    txHash: string | null;
    description: string;
    createdAt: string;
    meta: Record<string, unknown>;
  }> = [];

  // ── Deposits ──
  if (!type || type === 'deposit') {
    let q = supabase.from('deposits')
      .select('id, amount, currency, txn_id, txid, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(type ? limit : Math.floor(limit / 3));
    if (status) q = q.eq('status', status);
    if (from) q = q.gte('created_at', from);
    if (to) q = q.lte('created_at', to);
    if (search) q = q.or(`txn_id.ilike.%${search}%,txid.ilike.%${search}%`);

    if (!type) q = q.limit(Math.floor(limit / 3));

    const { data } = await q;
    for (const d of (data ?? []) as Record<string, unknown>[]) {
      rows.push({
        id: `dep-${d.id}`,
        type: 'deposit',
        subtype: (d as { currency?: string }).currency || 'USDT',
        amount: Number(d.amount ?? 0),
        currency: (d as { currency?: string }).currency as string || 'USDT',
        status: (d as { status?: string }).status || 'pending',
        txHash: ((d as { txn_id?: string; txid?: string }).txn_id || (d as { txn_id?: string; txid?: string }).txid || null),
        description: 'Deposit',
        createdAt: (d as { created_at?: string }).created_at || '',
        meta: {},
      });
    }
  }

  // ── Withdrawals ──
  if (!type || type === 'withdrawal') {
    let q = supabase.from('withdrawals')
      .select('id, amount, currency, coin, tx_hash, status, withdrawal_type, request_time, forfeit_amount, failure_reason')
      .eq('user_id', userId)
      .order('request_time', { ascending: false })
      .limit(type ? limit : Math.floor(limit / 3));
    if (status) q = q.eq('status', status);
    if (from) q = q.gte('request_time', from);
    if (to) q = q.lte('request_time', to);
    if (search) q = q.ilike('tx_hash', `%${search}%`);
    if (!type) q = q.limit(Math.floor(limit / 3));

    const { data } = await q;
    for (const w of (data ?? []) as Record<string, unknown>[]) {
      rows.push({
        id: `wd-${w.id}`,
        type: 'withdrawal',
        subtype: (w.withdrawal_type as string) || 'profit',
        amount: Number(w.amount ?? 0),
        currency: ((w.coin || w.currency) as string) || 'USDT',
        status: (w.status as string) || 'pending',
        txHash: (w.tx_hash as string) || null,
        description: `${(w.withdrawal_type as string) === 'principal' ? 'Principal' : (w.withdrawal_type as string) === 'commission' ? 'Commission' : 'Profit'} Withdrawal${w.forfeit_amount && Number(w.forfeit_amount) > 0 ? ` (forfeit: $${Number(w.forfeit_amount).toFixed(2)})` : ''}`,
        createdAt: (w.request_time as string) || '',
        meta: { forfeitAmount: Number(w.forfeit_amount ?? 0), failureReason: w.failure_reason },
      });
    }
  }

  // ── Referral Commissions ──
  if (!type || type === 'commission') {
    let q = supabase.from('referral_commissions')
      .select('id, amount, source_amount, level, status, referral_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(type ? limit : Math.floor(limit / 3));
    if (status) q = q.eq('status', status);
    if (from) q = q.gte('created_at', from);
    if (to) q = q.lte('created_at', to);
    if (!type) q = q.limit(Math.floor(limit / 3));

    const { data } = await q;
    for (const c of (data ?? []) as Record<string, unknown>[]) {
      const refType = c.referral_type as string || 'deposit_bonus';
      rows.push({
        id: `comm-${c.id}`,
        type: 'commission',
        subtype: refType,
        amount: Number(c.amount ?? 0),
        currency: 'USD',
        status: (c.status as string) || 'pending',
        txHash: null,
        description: `${refType === 'profit_share' ? 'Profit Share' : 'Deposit Bonus'} · Level ${c.level} · ${Number(c.source_amount ?? 0).toFixed(2)} USD source`,
        createdAt: (c.created_at as string) || '',
        meta: { level: c.level, sourceAmount: Number(c.source_amount ?? 0) },
      });
    }
  }

  // ── AI Trading Profits ──
  if (!type || type === 'profit') {
    let q = supabase.from('ai_trading_profits')
      .select('id, amount, percentage, date, created_at')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(type ? limit : Math.floor(limit / 3));
    if (from) q = q.gte('date', from);
    if (to) q = q.lte('date', to);
    if (!type) q = q.limit(Math.floor(limit / 3));

    const { data } = await q;
    for (const p of (data ?? []) as Record<string, unknown>[]) {
      rows.push({
        id: `profit-${p.id}`,
        type: 'profit',
        subtype: 'daily',
        amount: Number(p.amount ?? 0),
        currency: 'USD',
        status: 'completed',
        txHash: null,
        description: `Daily Profit · ${Number(p.percentage ?? 0).toFixed(2)}% · ${(p.date as string) || ''}`,
        createdAt: (p.created_at as string) || (p.date as string) || '',
        meta: { percentage: Number(p.percentage ?? 0), date: p.date },
      });
    }
  }

  // Sort merged results by date
  rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Export CSV
  if (exportCsv) {
    const header = 'ID,Type,Subtype,Amount,Currency,Status,Description,Date';
    const csvRows = rows.map(r =>
      `"${r.id}","${r.type}","${r.subtype}",${r.amount.toFixed(2)},"${r.currency}","${r.status}","${r.description}","${r.createdAt}"`
    );
    const csv = [header, ...csvRows].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=transactions-${new Date().toISOString().split('T')[0]}.csv`,
      },
    });
  }

  // Paginate merged results
  const total = rows.length;
  const offset = (page - 1) * limit;
  const paged = rows.slice(offset, offset + limit);

  return NextResponse.json({
    success: true,
    transactions: paged,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
