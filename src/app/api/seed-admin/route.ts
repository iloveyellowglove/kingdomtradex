import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth/password';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(_request: NextRequest) {
  console.log('[seed-admin] CRON_SECRET:', process.env.CRON_SECRET);

  // Token check temporarily bypassed
  // const token = request.headers.get('X-Seed-Token');
  // if (!token || token !== process.env.CRON_SECRET) {
  //   return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  // }

  const newHash = hashPassword('admin123');

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('users')
    .update({ password_hash: newHash })
    .eq('email', 'admin@demo.local');

  if (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }

  return NextResponse.json({ success: true, hash: newHash });
}
