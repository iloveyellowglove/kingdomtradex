import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import SettingsTable from '@/components/admin/SettingsTable';

type SettingRow = {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string | null;
};

export default async function AdminSettingsPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('kingdom_session')?.value;

  let csrfToken = '';
  if (token) {
    const supabase = createServiceClient();
    const { data: sessions } = await supabase
      .from('sessions')
      .select('csrf_token')
      .eq('session_token', token)
      .limit(1);
    csrfToken = (sessions?.[0] as { csrf_token?: string } | undefined)?.csrf_token ?? '';
  }

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('settings')
    .select('*')
    .order('id');

  const settings = (data ?? []) as unknown as SettingRow[];

  return (
    <div>
      <h2 className="mb-4">System Settings</h2>
      <SettingsTable settings={settings} csrfToken={csrfToken} />
    </div>
  );
}
