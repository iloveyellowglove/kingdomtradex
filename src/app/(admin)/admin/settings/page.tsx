import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import SettingsTable from '@/components/admin/SettingsTable';

type SettingRow = {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string | null;
};

const MISSING_SETTINGS: { key: string; value: string; description: string }[] = [
  { key: 'openrouter_api_key', value: '', description: 'API key for OpenRouter AI provider' },
  { key: 'openrouter_model', value: 'mistralai/mistral-7b-instruct', description: 'Model used for AI oracle chatbot' },
  { key: 'cold_wallet_xmr', value: '', description: 'XMR cold wallet address for auto-split deposits (overrides COLD_WALLET_XMR env)' },
];

export default async function AdminSettingsPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('__Host-kingdom_session')?.value;

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

  // Upsert missing settings
  for (const s of MISSING_SETTINGS) {
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('setting_key', s.key)
      .limit(1);
    if (!existing || existing.length === 0) {
      await supabase.from('settings').insert({
        setting_key: s.key,
        setting_value: s.value,
        description: s.description,
      });
    }
  }

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
