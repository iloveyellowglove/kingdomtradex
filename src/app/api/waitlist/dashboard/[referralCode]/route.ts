import { NextRequest, NextResponse } from 'next/server';
import { getWaitlistDashboard } from '@/lib/db/waitlist';

export async function GET(
  _request: NextRequest,
  { params }: { params: { referralCode: string } }
) {
  try {
    const { referralCode } = params;
    if (!referralCode) {
      return NextResponse.json({ success: false, error: 'Referral code required.' }, { status: 400 });
    }

    const dashboard = await getWaitlistDashboard(referralCode);

    if (!dashboard.entry) {
      return NextResponse.json({ success: false, error: 'Referral code not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, ...dashboard });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch dashboard.' }, { status: 500 });
  }
}
