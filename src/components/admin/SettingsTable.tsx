'use client';

import { useState } from 'react';

type SettingRow = {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string | null;
};

type Props = {
  settings: SettingRow[];
  csrfToken: string;
};

export default function SettingsTable({ settings: initial, csrfToken }: Props) {
  const [settings, setSettings] = useState(initial);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  function startEdit(s: SettingRow) {
    setEditKey(s.setting_key);
    setEditValue(s.setting_value);
  }

  function cancelEdit() {
    setEditKey(null);
    setEditValue('');
  }

  async function saveEdit() {
    if (!editKey) return;
    setSaving(true);

    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      body: JSON.stringify({ key: editKey, value: editValue }),
    });

    if (res.ok) {
      setSettings((prev) =>
        prev.map((s) =>
          s.setting_key === editKey ? { ...s, setting_value: editValue } : s
        )
      );
      setEditKey(null);
      setEditValue('');
    }
    setSaving(false);
  }

  return (
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
                <td className="p-3">
                  {editKey === s.setting_key ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="bg-dark-indigo border border-royal-purple rounded px-2 py-1 text-sm font-mono text-white w-full max-w-xs"
                        autoFocus
                      />
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="px-2 py-1 text-xs rounded bg-temple-gold text-black hover:opacity-80 whitespace-nowrap"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-2 py-1 text-xs rounded border border-text-muted text-text-muted hover:text-white whitespace-nowrap"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span
                      className="font-mono cursor-pointer hover:text-temple-gold border-b border-dotted border-text-muted"
                      onClick={() => startEdit(s)}
                    >
                      {s.setting_value}
                    </span>
                  )}
                </td>
                <td className="p-3"><small className="text-text-muted">{s.description || '-'}</small></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
