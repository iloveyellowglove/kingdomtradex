import { createServiceClient } from '@/lib/supabase/service';

type SettingRow = {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string | null;
};

export default async function AdminSettingsPage() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('settings')
    .select('*')
    .order('id');

  const settings = (data ?? []) as unknown as SettingRow[];

  return (
    <div>
      <h2 className="mb-4">System Settings</h2>
      <div className="card">
        <div className="card-body p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-3">Key</th>
                <th className="text-left p-3">Value</th>
                <th className="text-left p-3">Description</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((s) => (
                <tr key={s.id}>
                  <td className="p-3"><code>{s.setting_key}</code></td>
                  <td className="p-3 font-mono">{s.setting_value}</td>
                  <td className="p-3"><small className="text-text-muted">{s.description || '-'}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
