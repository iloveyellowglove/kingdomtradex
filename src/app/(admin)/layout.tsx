import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get('kingdom_session')?.value;
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
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 py-4">
      <aside>
        <AdminSidebar />
      </aside>
      <div>{children}</div>
    </div>
  );
}
