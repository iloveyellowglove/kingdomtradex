import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/db/waitlist';

export async function GET() {
  try {
    const leaderboard = await getLeaderboard(100);
    return NextResponse.json({ success: true, leaderboard });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch leaderboard.' }, { status: 500 });
  }
}
