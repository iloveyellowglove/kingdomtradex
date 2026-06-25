'use client';

import { useState, useEffect } from 'react';

interface NotifPref {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

const DEFAULT_PREFS: NotifPref[] = [
  { key: 'deposit_confirmed', label: 'Deposit Confirmed', description: 'When your deposit is confirmed on the blockchain', enabled: true },
  { key: 'withdrawal_processed', label: 'Withdrawal Processed', description: 'When funds are sent to your wallet', enabled: true },
  { key: 'withdrawal_failed', label: 'Withdrawal Failed', description: 'When a withdrawal could not be processed', enabled: true },
  { key: 'kyc_approved', label: 'KYC Approved', description: 'When your identity verification is approved', enabled: true },
  { key: 'kyc_rejected', label: 'KYC Rejected', description: 'When your identity verification is rejected', enabled: true },
  { key: 'commission_earned', label: 'Commission Earned', description: 'When you earn a referral commission', enabled: true },
  { key: 'referral_joined', label: 'New Referral', description: 'When someone signs up with your referral link', enabled: true },
  { key: 'security_alerts', label: 'Security Alerts', description: 'New login, password changes, 2FA changes', enabled: true },
];

export default function NotificationPreferences() {
  const [prefs, setPrefs] = useState<NotifPref[]>(DEFAULT_PREFS);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  // In production, load saved prefs from API. For now, use defaults.
  useEffect(() => {
    // Could fetch from /api/profile/notification-prefs
  }, []);

  async function toggle(key: string) {
    const updated = prefs.map(p => p.key === key ? { ...p, enabled: !p.enabled } : p);
    setPrefs(updated);
    setSaving(key);
    setMsg('');

    // Persist - could POST to /api/profile/notification-prefs
    // For now, just simulate save
    setTimeout(() => {
      setSaving(null);
      setMsg('Preferences saved.');
      setTimeout(() => setMsg(''), 2000);
    }, 300);
  }

  return (
    <div
      className="p-5 rounded-xl bg-kt-hover-bg border border-kt-border"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-kt-text-primary">Email Notifications</h3>
          <p className="text-xs text-kt-text-tertiary mt-0.5">Choose which events send you an email</p>
        </div>
      </div>

      {msg && (
        <div className="mb-4 p-2 rounded-lg text-xs text-green-400 bg-green-500/10 border border-green-500/20">
          {msg}
        </div>
      )}

      <div className="space-y-1">
        {prefs.map(p => (
          <div
            key={p.key}
            className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/[0.02] transition"
          >
            <div className="flex-1 min-w-0 mr-3">
              <p className="text-sm text-kt-text-primary font-medium">{p.label}</p>
              <p className="text-xs text-white/35 truncate">{p.description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={p.enabled}
              onClick={() => toggle(p.key)}
              disabled={saving === p.key}
              className="relative w-11 h-6 rounded-full transition flex-shrink-0 disabled:opacity-50"
              style={{
                background: p.enabled ? '#4CAF50' : 'rgba(255,255,255,0.12)',
              }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                style={{ left: p.enabled ? 'calc(100% - 22px)' : '2px' }}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
