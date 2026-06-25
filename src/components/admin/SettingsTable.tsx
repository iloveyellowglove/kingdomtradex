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

const API_KEY_FIELDS = ['plisio_api_key', 'openrouter_api_key'];
const MODEL_FIELDS = ['openrouter_model'];
const MODEL_OPTIONS = [
  'mistralai/mistral-7b-instruct',
  'openai/gpt-4o-mini',
  'openai/gpt-4o',
  'anthropic/claude-3-haiku',
  'anthropic/claude-3.5-sonnet',
  'google/gemini-flash-1.5',
];

function maskValue(val: string): string {
  if (!val) return '(empty)';
  if (val.length <= 4) return '****';
  return val.substring(0, 4) + '...' + val.substring(val.length - 4);
}

export default function SettingsTable({ settings: initial, csrfToken }: Props) {
  const [settings, setSettings] = useState(initial);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

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

  function toggleReveal(key: string) {
    setRevealed((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function renderDisplayValue(s: SettingRow) {
    if (API_KEY_FIELDS.includes(s.setting_key)) {
      if (!s.setting_value) {
        return <span className="text-kt-text-tertiary italic">(empty)</span>;
      }
      if (revealed[s.setting_key]) {
        return <span className="font-mono text-kt-gold">{s.setting_value}</span>;
      }
      return <span className="font-mono">{maskValue(s.setting_value)}</span>;
    }
    if (s.setting_value) {
      return s.setting_value;
    }
    return <span className="text-kt-text-tertiary italic">(empty)</span>;
  }

  function renderEditInput() {
    if (!editKey) return null;

    if (MODEL_FIELDS.includes(editKey)) {
      return (
        <select
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="bg-kt-bg border border-royal-purple rounded px-2 py-1 text-sm text-kt-text-primary w-full max-w-xs"
          autoFocus
        >
          {MODEL_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    if (API_KEY_FIELDS.includes(editKey)) {
      return (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="bg-kt-bg border border-royal-purple rounded px-2 py-1 text-sm font-mono text-kt-text-primary w-full max-w-xs"
          autoFocus
        />
      );
    }

    return (
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="bg-kt-bg border border-royal-purple rounded px-2 py-1 text-sm font-mono text-kt-text-primary w-full max-w-xs"
        autoFocus
      />
    );
  }

  function renderValueCell(s: SettingRow) {
    if (editKey === s.setting_key) {
      return (
        <div className="flex gap-2 items-center">
          {renderEditInput()}
          <button
            onClick={saveEdit}
            disabled={saving}
            className="px-2 py-1 text-xs rounded bg-temple-gold text-black hover:opacity-80 whitespace-nowrap"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={cancelEdit}
            className="px-2 py-1 text-xs rounded border border-text-muted text-kt-text-tertiary hover:text-white whitespace-nowrap"
          >
            Cancel
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <span
          className="font-mono cursor-pointer hover:text-kt-gold border-b border-dotted border-text-muted"
          onClick={() => startEdit(s)}
        >
          {renderDisplayValue(s)}
        </span>
        {API_KEY_FIELDS.includes(s.setting_key) && s.setting_value && !revealed[s.setting_key] && (
          <button
            onClick={() => toggleReveal(s.setting_key)}
            className="text-xs text-kt-text-tertiary hover:text-white underline"
          >
            show
          </button>
        )}
        {API_KEY_FIELDS.includes(s.setting_key) && s.setting_value && revealed[s.setting_key] && (
          <button
            onClick={() => toggleReveal(s.setting_key)}
            className="text-xs text-kt-text-tertiary hover:text-white underline"
          >
            hide
          </button>
        )}
      </div>
    );
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
                <td className="p-3">{renderValueCell(s)}</td>
                <td className="p-3"><small className="text-kt-text-tertiary">{s.description || '-'}</small></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
