import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createServiceClient } from '@/lib/supabase/service';
import { sendEmail } from '@/lib/services/email';

export async function POST(request: NextRequest) {
  // Rate limit: 3 attempts per IP per 5 minutes
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const rateLimitKey = `forgot:${ip}`;
  const g = globalThis as Record<string, unknown>;
  const rateLimitMap = (g.__forgotRateLimitMap as Map<string, { count: number; resetAt: number }>)
    ?? (g.__forgotRateLimitMap = new Map<string, { count: number; resetAt: number }>());
  const now = Date.now();
  const entry = rateLimitMap.get(rateLimitKey);
  if (entry && now < entry.resetAt && entry.count >= 3) {
    return NextResponse.json({ success: true });
  }
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(rateLimitKey, { count: 1, resetAt: now + 300000 });
  } else {
    entry.count++;
  }

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
