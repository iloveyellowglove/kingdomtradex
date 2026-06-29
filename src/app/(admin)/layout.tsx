import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import AdminTabBar from '@/components/admin/AdminTabBar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get('__Host-kingdom_session')?.value;
  if (!token || token.length !== 64) redirect('/login');

  const supabase = createServiceClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id, user_role, expires_at')
    .eq('session_token', token)
    .limit(1);

  const s = (sessions ?? []) as unknown as { user_id: number; user_role: string; expires_at: string }[];

  if (s.length === 0) redirect('/login');
  if (new Date(s[0].expires_at) < new Date()) redirect('/login');
  if (s[0].user_role !== 'admin') redirect('/dashboard');

  return (
    <div className="py-4">
      <AdminTabBar />
      {children}
    </div>
  );
}
