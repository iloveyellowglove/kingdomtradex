'use client';

import { useState, useEffect, useRef } from 'react';
import { DEPOSIT_CURRENCIES, coinIconUrl } from '@/lib/currencies';

export default function AutoWithdrawSettings() {
  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | null>(null);
  const [coin, setCoin] = useState('');
  const [wallet, setWallet] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [coinDropdownOpen, setCoinDropdownOpen] = useState(false);
  const csrfTokenRef = useRef('');
  const coinDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/csrf')
      .then((r) => r.json())
      .then((d) => { csrfTokenRef.current = d.csrfToken || ''; })
      .catch(() => {});

    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/withdraw/auto');
        const data = await res.json();
        if (data.success && data.settings) {
          setEnabled(data.settings.enabled);
          setFrequency(data.settings.frequency);
          setCoin(data.settings.coin || '');
          setWallet(data.settings.wallet || '');
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (coinDropdownRef.current && !coinDropdownRef.current.contains(e.target as Node)) {
        setCoinDropdownOpen(false);
      }
    }
    if (coinDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [coinDropdownOpen]);

  async function handleSave() {
    setError('');
    setSuccess('');
    setSaving(true);

    const res = await fetch('/api/withdraw/auto', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfTokenRef.current,
      },
      body: JSON.stringify({
        enabled,
        frequency: frequency || null,
        coin: coin || null,
        wallet: wallet || null,
      }),
    });

    const data = await res.json();
    if (data.success) {
      setSuccess('Auto-withdrawal settings saved.');
    } else {
      setError(data.error || 'Failed to save settings.');
    }
    setSaving(false);
  }

  const selectedCoinConfig = DEPOSIT_CURRENCIES.find(c => c.id === coin);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16 }}>
        <div className="h-5 w-40 bg-white/5 rounded" />
        <div className="h-10 w-full bg-white/5 rounded" />
        <div className="h-10 w-full bg-white/5 rounded" />
      </div>
    );
  }

  return (
    <div
      className="p-4 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <h3 className="text-base font-bold text-white mb-4">Auto-Withdrawal Settings</h3>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm text-red-400" style={{ background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.2)' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg text-sm text-green-400" style={{ background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.2)' }}>
          {success}
        </div>
      )}

      {/* Enable toggle */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-white font-medium">Enable Auto-Withdrawal</p>
          <p className="text-xs text-white/40">Automatically withdraw profits on schedule</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled(!enabled)}
          className="relative w-12 h-7 rounded-full transition flex-shrink-0"
          style={{
            background: enabled ? '#4CAF50' : 'rgba(255,255,255,0.12)',
          }}
        >
          <span
            className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform"
            style={{
              left: enabled ? 'calc(100% - 26px)' : '2px',
              transform: enabled ? 'translateX(0)' : 'translateX(0)',
            }}
          />
        </button>
      </div>

      {enabled && (
        <div className="space-y-4 pt-2">
          {/* Frequency */}
          <div>
            <label className="block text-sm text-white/60 font-medium mb-1.5">Frequency</label>
            <div className="flex gap-2">
              {(['daily', 'weekly'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium capitalize transition"
                  style={{
                    background: frequency === f ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.03)',
                    border: frequency === f ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.08)',
                    color: frequency === f ? '#FFD700' : 'rgba(255,255,255,0.5)',
                    minHeight: 44,
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Coin selector */}
          <div>
            <label className="block text-sm text-white/60 font-medium mb-1.5">Preferred Coin</label>
            <div className="relative" ref={coinDropdownRef}>
              <button
                type="button"
                onClick={() => setCoinDropdownOpen(!coinDropdownOpen)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-white/10 text-left hover:border-[#FFD700]/50 transition"
                style={{ background: 'rgba(255,255,255,0.04)', minHeight: 48 }}
              >
                {selectedCoinConfig ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coinIconUrl(selectedCoinConfig.iconSlug)} alt="" width={24} height={24} className="rounded-full flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <span className="text-white font-medium">{selectedCoinConfig.symbol}</span>
                    <span className="text-white/40 text-sm">{selectedCoinConfig.name}</span>
                    <span className="ml-auto px-2 py-0.5 rounded text-xs bg-white/5 text-white/40">{selectedCoinConfig.network}</span>
                  </>
                ) : (
                  <span className="text-white/40">Select a coin</span>
                )}
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 1l4 4 4-4"/></svg>
              </button>

              {coinDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 border border-white/10 rounded-lg shadow-2xl z-50 max-h-64 overflow-y-auto"
                  style={{ background: '#1a1a2e' }}>
                  {DEPOSIT_CURRENCIES.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setCoin(c.id); setCoinDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition"
                      style={{ minHeight: 44 }}
                    >
                      <img src={coinIconUrl(c.iconSlug)} alt="" width={22} height={22} className="rounded-full flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <span className="flex-1 text-sm text-white">{c.symbol}</span>
                      <span className="text-xs text-white/40">{c.network}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Wallet address */}
          <div>
            <label className="block text-sm text-white/60 font-medium mb-1.5">Wallet Address</label>
            <input
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="Your permanent wallet address"
              className="w-full px-4 py-3 rounded-lg text-white text-base"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                minHeight: 48,
              }}
            />
          </div>

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-lg text-sm font-bold transition disabled:opacity-40"
            style={{ background: '#FFD700', color: '#000', minHeight: 44 }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  );
}
