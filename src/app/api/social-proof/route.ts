import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const LAUNCH_DATE = process.env.NEXT_PUBLIC_LAUNCH_DATE
  ? new Date(process.env.NEXT_PUBLIC_LAUNCH_DATE)
  : new Date('2026-06-07');

interface SocialEntry {
  type: 'waitlist' | 'deposit' | 'signup';
  text: string;
  timeAgo: string;
}

interface CacheEntry {
  data: { entries: SocialEntry[] };
  ts: number;
}

let CACHE: CacheEntry | null = null;

function timeAgoStr(dateStr: string): string {
  const then = new Date(dateStr).getTime();
  const diff = Date.now() - then;
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return d === 1 ? '1 day ago' : `${d} days ago`;
  if (h > 0) return h === 1 ? '1 hour ago' : `${h} hours ago`;
  if (m > 0) return m === 1 ? '1 minute ago' : `${m} minutes ago`;
  return 'just now';
}

function firstName(name: string | null): string {
  if (!name) return 'Someone';
  return name.trim().split(/\s+/)[0] || 'Someone';
}

export async function GET() {
  // In-memory cache: 60 seconds
  if (CACHE && Date.now() - CACHE.ts < 60_000) {
    return NextResponse.json(CACHE.data);
  }

  const supabase = createServiceClient();
  const isPreLaunch = new Date() < LAUNCH_DATE;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const entries: SocialEntry[] = [];

    if (isPreLaunch) {
      // Pre-launch: recent waitlist signups
      const { data: waitlist } = await supabase
        .from('waitlist')
        .select('name, joined_at')
        .gte('joined_at', sevenDaysAgo)
        .order('joined_at', { ascending: false })
        .limit(20);

      for (const w of waitlist || []) {
        const name = firstName(w.name);
        entries.push({
          type: 'waitlist',
          text: `${name} just joined the waitlist`,
          timeAgo: timeAgoStr(w.joined_at),
        });
      }
    } else {
      // Post-launch: recent deposits + signups, alternating

      // Fetch admin user IDs to exclude
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin');
      const adminIds = new Set((admins || []).map((a: { id: number }) => a.id));

      // Recent completed deposits
      const { data: deposits } = await supabase
        .from('deposits')
        .select('amount, currency, created_at, user_id')
        .eq('status', 'completed')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(30);

      const realDeposits = (deposits || []).filter(
        (d: { user_id: number }) => !adminIds.has(d.user_id)
      );

      for (const d of realDeposits.slice(0, 20)) {
        const amt = Number(d.amount);
        const formatted = amt >= 1000
          ? (amt / 1000).toFixed(amt % 1000 === 0 ? 0 : 1) + 'K'
          : amt.toFixed(amt % 1 === 0 ? 0 : 2);
        entries.push({
          type: 'deposit',
          text: `A steward just deposited ${formatted} ${d.currency}`,
          timeAgo: timeAgoStr(d.created_at),
        });
      }

      // Recent non-admin signups
      const { data: signups } = await supabase
        .from('users')
        .select('username, created_at')
        .not('role', 'eq', 'admin')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(20);

      for (const s of signups || []) {
        const short = (s.username || '??').substring(0, 2);
        entries.push({
          type: 'signup',
          text: `${short}*** just joined KingdomTradex`,
          timeAgo: timeAgoStr(s.created_at),
        });
      }
    }

    const data = { entries };

    CACHE = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch (err) {
    console.error('[social-proof]', err);
    return NextResponse.json({ entries: [] });
  }
}
