'use client';

import { useState, useEffect, useRef } from 'react';

interface Broadcast {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [segment, setSegment] = useState('all');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [history, setHistory] = useState<Broadcast[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const csrfTokenRef = useRef('');

  useEffect(() => {
    fetch('/api/csrf')
      .then(r => r.json())
      .then(d => { csrfTokenRef.current = d.csrfToken || ''; })
      .catch(() => {});
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const res = await fetch('/api/admin/broadcast');
      const data = await res.json();
      if (data.success) setHistory(data.broadcasts ?? []);
    } catch { /* ignore */ }
    setHistoryLoading(false);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfTokenRef.current,
        },
        body: JSON.stringify({ title: title.trim(), message: message.trim(), segment }),
      });
      const data = await res.json();
      setResult({ ok: data.success, msg: data.success ? data.message : (data.error || 'Failed.') });
      if (data.success) {
        setTitle('');
        setMessage('');
        loadHistory();
      }
    } catch {
      setResult({ ok: false, msg: 'Network error.' });
    }
    setSending(false);
    setTimeout(() => setResult(null), 5000);
  }

  const segments = [
    { key: 'all', label: 'All Active Users' },
    { key: 'kyc_verified', label: 'KYC Verified (Level 2+)' },
    { key: 'kyc_unverified', label: 'KYC Unverified' },
    { key: 'has_deposits', label: 'Users with Deposits' },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-kt-text-primary mb-4">Broadcast Message</h2>

      {result && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${result.ok ? 'text-green-400' : 'text-red-400'}`}
          style={{
            background: result.ok ? 'rgba(76,175,80,0.1)' : 'rgba(244,67,54,0.1)',
            border: `1px solid ${result.ok ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)'}`,
          }}>
          {result.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose */}
        <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-sm font-semibold text-kt-text-primary mb-4">Compose Broadcast</h3>

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs text-kt-text-tertiary mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                required
                placeholder="Important Announcement"
                className="w-full px-4 py-2.5 rounded-lg text-sm text-kt-text-primary"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', minHeight: 44 }}
              />
            </div>

            <div>
              <label className="block text-xs text-kt-text-tertiary mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
                placeholder="Your message to users..."
                className="w-full px-4 py-2.5 rounded-lg text-sm text-kt-text-primary resize-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>

            <div>
              <label className="block text-xs text-kt-text-tertiary mb-1.5">Target Segment</label>
              <div className="grid grid-cols-2 gap-2">
                {segments.map(s => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSegment(s.key)}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-left transition"
                    style={{
                      background: segment === s.key ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.03)',
                      color: segment === s.key ? '#FFD700' : 'rgba(255,255,255,0.5)',
                      border: segment === s.key ? '1px solid rgba(255,215,0,0.25)' : '1px solid rgba(255,255,255,0.06)',
                      minHeight: 44,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {title && message && (
              <div className="p-4 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] text-kt-text-tertiary uppercase tracking-wider mb-1">Preview</p>
                <p className="text-sm font-bold text-kt-text-primary">{title}</p>
                <p className="text-xs text-kt-text-tertiary mt-1">{message}</p>
                <p className="text-[10px] text-kt-text-tertiary mt-2">
                  Sending to: {segments.find(s => s.key === segment)?.label}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={sending || !title.trim() || !message.trim()}
              className="w-full py-3 rounded-lg text-sm font-bold transition disabled:opacity-40"
              style={{ background: '#FFD700', color: '#000', minHeight: 44 }}
            >
              {sending ? 'Sending...' : 'Send Broadcast'}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-sm font-semibold text-kt-text-primary mb-4">Broadcast History</h3>

          {historyLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
              ))}
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-white/30">No broadcasts sent yet.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.map(b => (
                <div key={b.id} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-kt-text-primary truncate">{b.title}</p>
                    <span className="text-[10px] text-kt-text-tertiary flex-shrink-0 ml-2">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-kt-text-tertiary truncate">{b.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
