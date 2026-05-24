import { NextResponse } from 'next/server';
import { getWaitlistStats } from '@/lib/db/waitlist';

export async function GET() {
  try {
    const stats = await getWaitlistStats();
    return NextResponse.json({ success: true, ...stats });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch stats.' }, { status: 500 });
  }
}
