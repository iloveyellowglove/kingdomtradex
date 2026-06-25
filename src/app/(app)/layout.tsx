import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // DEV BYPASS: Skip auth when no real Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl === 'http://localhost:54321') {
    return <>{children}</>;
  }

  const cookieStore = cookies();
  const token = cookieStore.get('__Host-kingdom_session')?.value;

  if (!token || token.length !== 64) {
    redirect('/login');
  }

  const supabase = createServiceClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id, expires_at')
    .eq('session_token', token)
    .limit(1);

  const s = (sessions ?? []) as unknown as { user_id: number; expires_at: string }[];

  if (s.length === 0) redirect('/login');

  if (new Date(s[0].expires_at) < new Date()) {
    await supabase.from('sessions').delete().eq('session_token', token);
    redirect('/login');
  }

  return <>{children}</>;
}
