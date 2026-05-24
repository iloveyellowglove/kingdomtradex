import { NextRequest, NextResponse } from 'next/server';
import { signupToWaitlist } from '@/lib/db/waitlist';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, role, referredBy } = body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // Validate role
    const validRole = role === 'pastor' ? 'pastor' : 'member';

    const result = await signupToWaitlist(
      email,
      (name || '').trim(),
      validRole,
      referredBy || undefined
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      referralCode: result.referralCode,
      position: result.position,
      referralLink: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kingdomtradex.vercel.app'}/waitlist/${result.referralCode}`,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Server error. Please try again.' }, { status: 500 });
  }
}
