import { NextRequest, NextResponse } from 'next/server';
import { signupToWaitlist } from '@/lib/db/waitlist';
import { sendEmail } from '@/lib/services/email';

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
      // If duplicate email, return existing referral code for redirect
      if (result.existingReferralCode) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kingdomtradex.vercel.app';
        return NextResponse.json({
          success: true,
          alreadyExists: true,
          referralCode: result.existingReferralCode,
          referralLink: `${appUrl}/waitlist/${result.existingReferralCode}`,
        });
      }
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kingdomtradex.vercel.app';
    const referralLink = `${appUrl}/waitlist/${result.referralCode}`;
    const creditAmount = validRole === 'pastor' ? '$100' : '$50';

    // Send welcome email via Resend (fire-and-forget)
    const emailHtml = `<p>Welcome to KingdomTradex!</p>
<p>Your ${creditAmount} in free trading credits are reserved and waiting for you.</p>
<p>We launch on June 7, 2026. When we do, your credits will be ready to start earning.</p>
<p>In the meantime, share your referral link and earn rewards:<br><a href="${referralLink}">${referralLink}</a></p>
<p>Every friend who joins gets free credits too, and you climb the waitlist leaderboard.</p>
<p>See you at launch,<br>The KingdomTradex Team</p>`;

    sendEmail(email, 'Your free credits are reserved! Here\'s your referral link', emailHtml)
      .catch((e) => console.error('[waitlist] Welcome email failed:', e));

    return NextResponse.json({
      success: true,
      referralCode: result.referralCode,
      position: result.position,
      referralLink,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Server error. Please try again.' }, { status: 500 });
  }
}
