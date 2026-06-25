'use client';

import { useState, useEffect } from 'react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  deposit_confirmed: 'Deposit',
  withdrawal_processed: 'Withdrawal',
  withdrawal_failed: 'Failed',
  kyc_approved: 'KYC',
  kyc_rejected: 'KYC',
  commission_earned: 'Commission',
  referral_joined: 'Referral',
  system: 'System',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => { load(); }, [typeFilter, unreadOnly, page]);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (unreadOnly) params.set('unread', '1');
      params.set('page', page.toString());
      params.set('limit', '20');
      const res = await fetch(`/api/notifications?${params}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications ?? []);
        setTotalPages(data.totalPages ?? 1);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mark_all: true }),
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div className="py-4 max-w-lg mx-auto px-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold text-white">Notifications</h2>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-[#FFD700] font-medium hover:underline"
          >
            Mark all read ({unreadCount})
          </button>
        )}
      </div>
      <p className="text-sm text-white/40 mb-4">Stay updated on your account activity</p>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setUnreadOnly(!unreadOnly)}
          className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition"
          style={{
            background: unreadOnly ? 'rgba(244,67,54,0.12)' : 'rgba(255,255,255,0.04)',
            color: unreadOnly ? '#F44336' : 'rgba(255,255,255,0.5)',
            border: `1px solid ${unreadOnly ? 'rgba(244,67,54,0.2)' : 'rgba(255,255,255,0.06)'}`,
            minHeight: 32,
          }}
        >
          Unread{unreadOnly ? ` · ${unreadCount}` : ''}
        </button>
        {['', 'deposit_confirmed', 'withdrawal_processed', 'kyc_approved', 'commission_earned', 'referral_joined'].map(t => (
          <button
            key={t}
            onClick={() => { setTypeFilter(t); setPage(1); }}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition"
            style={{
              background: typeFilter === t ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.04)',
              color: typeFilter === t ? '#FFD700' : 'rgba(255,255,255,0.5)',
              border: `1px solid ${typeFilter === t ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.06)'}`,
              minHeight: 32,
            }}
          >
            {t ? TYPE_LABELS[t] : 'All'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <p className="text-white/30 text-sm">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map(n => (
            <button
              key={n.id}
              onClick={() => !n.read ? markRead(n.id) : undefined}
              className="w-full text-left p-4 rounded-lg transition flex gap-3 items-start"
              style={{
                background: n.read ? 'transparent' : 'rgba(255,255,255,0.02)',
                border: n.read ? '1px solid transparent' : '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.read ? 'bg-transparent' : ''}`}
                style={{ background: n.read ? 'transparent' : '#FFD700' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-white/30">{TYPE_LABELS[n.type] || n.type}</span>
                  {!n.read && (
                    <span className="text-[10px] text-[#FFD700] font-medium">New</span>
                  )}
                </div>
                <p className={`text-sm ${n.read ? 'text-white/50' : 'text-white'}`}>{n.title}</p>
                <p className="text-xs text-white/35 mt-0.5">{n.message}</p>
                <p className="text-[10px] text-white/20 mt-1.5">{timeAgo(n.createdAt)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded text-xs font-bold transition disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#fff', minHeight: 32 }}
          >
            Prev
          </button>
          <span className="text-xs text-white/40">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded text-xs font-bold transition disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#fff', minHeight: 32 }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
