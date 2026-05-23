import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createServiceClient } from '@/lib/supabase/service';
import { sendEmail } from '@/lib/services/email';

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  const emailClean = (email || '').toLowerCase().trim();

  if (!emailClean || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailClean)) {
    return NextResponse.json({ success: true });
  }

  const supabase = createServiceClient();
  const { data: users } = await supabase
    .from('users')
    .select('id,email')
    .eq('email', emailClean)
    .eq('status', 'active')
    .limit(1);

  if (users && users.length > 0) {
    const token = randomBytes(32).toString('hex');
    await supabase.from('password_resets').insert({
      email: emailClean,
      token,
      created_at: new Date().toISOString(),
      used: false,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    await sendEmail(emailClean, 'Password Reset - KingdomTrade Exchange', `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>If you did not request this, please ignore this email.</p>
    `);
  }

  return NextResponse.json({ success: true });
}
