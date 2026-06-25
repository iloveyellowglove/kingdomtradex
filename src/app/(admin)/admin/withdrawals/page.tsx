'use client';

import { useState, useEffect, useRef } from 'react';
import { fmt } from '@/lib/utils/formatting';

type WithdrawalRow = {
  id: number;
  user_id: number;
  amount: number;
  currency: string;
  network: string | null;
  wallet_address: string | null;
  address: string;
  fee: number;
  status: string;
  request_time: string;
  admin_notes: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  withdrawal_type: string | null;
  users?: { username: string; email: string } | { username: string; email: string }[] | null;
  reviewer?: { username: string } | { username: string }[] | null;
};

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [approveId, setApproveId] = useState<number | null>(null);
  const csrfTokenRef = useRef('');

  useEffect(() => {
    fetch('/api/csrf')
      .then((r) => r.json())
      .then((d) => { csrfTokenRef.current = d.csrfToken || ''; })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadWithdrawals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadWithdrawals() {
    setLoading(true);
    const res = await fetch('/api/admin/withdrawals/list');
    const data = await res.json();
    if (data.success) {
      setWithdrawals(data.withdrawals || []);
    }
    setLoading(false);
  }

  function getUserObj(w: WithdrawalRow) {
    if (!w.users) return { username: '#' + w.user_id, email: '' };
    if (Array.isArray(w.users)) return w.users[0] || { username: '#' + w.user_id, email: '' };
    return w.users;
  }

  function getReviewerName(w: WithdrawalRow): string {
    if (!w.reviewer) return '';
    if (Array.isArray(w.reviewer)) return w.reviewer[0]?.username || '';
    return w.reviewer.username || '';
  }

  async function handleAction(id: number, action: string, notes?: string) {
    setLoading(true);
    const res = await fetch(`/api/admin/withdrawals/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfTokenRef.current,
      },
      body: JSON.stringify({ action, admin_notes: notes || null }),
    });
    const data = await res.json();
    if (data.success) {
      setRejectId(null);
      setApproveId(null);
      setRejectNotes('');
      await loadWithdrawals();
    } else {
      alert(data.error || 'Action failed.');
    }
    setLoading(false);
  }

  const pending = withdrawals.filter(w => w.status === 'pending');
  const approved = withdrawals.filter(w => w.status === 'approved');

  const filtered = filter === 'all' ? withdrawals
    : filter === 'pending' ? pending
    : filter === 'approved' ? approved
    : withdrawals.filter(w => w.status === filter);

  return (
    <div>
      <h2 className="mb-4">Withdrawals</h2>

      {/* Pending Withdrawals */}
      <div className="mb-8">
        <h4 className="mb-3" style={{ color: '#FFD700' }}>
          Pending Review ({pending.length})
        </h4>
        {pending.length === 0 ? (
          <p className="text-kt-text-tertiary text-sm">No pending withdrawals.</p>
        ) : (
          <div className="card">
            <div className="card-body p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-3">ID</th>
                    <th className="text-left p-3">User</th>
                    <th className="text-left p-3">Type</th>
                    <th className="text-left p-3">Amount</th>
                    <th className="text-left p-3">Currency</th>
                    <th className="text-left p-3">Network</th>
                    <th className="text-left p-3">Address</th>
                    <th className="text-left p-3">Requested</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((w) => {
                    const u = getUserObj(w);
                    return (
                      <tr key={w.id} style={{ background: 'rgba(255,215,0,0.03)' }}>
                        <td className="p-3">#{w.id}</td>
                        <td className="p-3">
                          <div className="font-medium">{u.username}</div>
                          <div className="text-xs text-kt-text-tertiary">{u.email}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-xs font-bold" style={{
                            background: w.withdrawal_type === 'commission' ? 'rgba(180,124,255,0.15)' : 'rgba(255,215,0,0.15)',
                            color: w.withdrawal_type === 'commission' ? '#B47CFF' : '#FFD700',
                          }}>
                            {w.withdrawal_type === 'commission' ? 'Commission' : 'Profit'}
                          </span>
                        </td>
                        <td className="p-3">{fmt(Number(w.amount))}</td>
                        <td className="p-3">{w.currency}</td>
                        <td className="p-3"><small>{w.network || ''}</small></td>
                        <td className="p-3">
                          <code className="text-xs break-all" title={w.wallet_address || w.address}>
                            {(w.wallet_address || w.address).substring(0, 20)}...
                          </code>
                        </td>
                        <td className="p-3"><small>{w.request_time ? new Date(w.request_time).toLocaleDateString() : ''}</small></td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setApproveId(w.id)}
                              disabled={loading}
                              className="px-3 py-1 rounded text-xs font-bold bg-green-600 text-kt-text-primary hover:bg-green-500 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => { setRejectId(w.id); setRejectNotes(''); }}
                              disabled={loading}
                              className="px-3 py-1 rounded text-xs font-bold bg-red-600 text-kt-text-primary hover:bg-red-500 transition"
                            >
                              Reject
                            </button>
                          </div>

                          {/* Approve confirmation */}
                          {approveId === w.id && (
                            <div className="mt-2 p-3 rounded" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
                              <p className="text-xs mb-2">
                                Approve withdrawal of {fmt(Number(w.amount))} {w.currency} to {truncAddr(w.wallet_address || w.address)}?
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAction(w.id, 'approve')}
                                  className="px-3 py-1 rounded text-xs font-bold bg-green-600 text-kt-text-primary"
                                >
                                  Confirm Approve
                                </button>
                                <button
                                  onClick={() => setApproveId(null)}
                                  className="px-3 py-1 rounded text-xs border border-kt-border text-kt-text-tertiary"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Reject reason input */}
                          {rejectId === w.id && (
                            <div className="mt-2 p-3 rounded" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                              <textarea
                                value={rejectNotes}
                                onChange={(e) => setRejectNotes(e.target.value)}
                                placeholder="Reason for rejection..."
                                className="w-full text-xs p-2 rounded mb-2"
                                rows={2}
                                style={{ background: '#0e0b1a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAction(w.id, 'reject', rejectNotes)}
                                  className="px-3 py-1 rounded text-xs font-bold bg-red-600 text-kt-text-primary"
                                >
                                  Confirm Reject
                                </button>
                                <button
                                  onClick={() => { setRejectId(null); setRejectNotes(''); }}
                                  className="px-3 py-1 rounded text-xs border border-kt-border text-kt-text-tertiary"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Approved - Awaiting Completion */}
      {approved.length > 0 && (
        <div className="mb-8">
          <h4 className="mb-3" style={{ color: '#3b82f6' }}>
            Approved - Awaiting Send ({approved.length})
          </h4>
          <div className="card">
            <div className="card-body p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-3">ID</th>
                    <th className="text-left p-3">User</th>
                    <th className="text-left p-3">Type</th>
                    <th className="text-left p-3">Amount</th>
                    <th className="text-left p-3">Currency</th>
                    <th className="text-left p-3">Address</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {approved.map((w) => {
                    const u = getUserObj(w);
                    return (
                      <tr key={w.id}>
                        <td className="p-3">#{w.id}</td>
                        <td className="p-3">{u.username}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-xs font-bold" style={{
                            background: w.withdrawal_type === 'commission' ? 'rgba(180,124,255,0.15)' : 'rgba(255,215,0,0.15)',
                            color: w.withdrawal_type === 'commission' ? '#B47CFF' : '#FFD700',
                          }}>
                            {w.withdrawal_type === 'commission' ? 'Commission' : 'Profit'}
                          </span>
                        </td>
                        <td className="p-3">{fmt(Number(w.amount))}</td>
                        <td className="p-3">{w.currency}</td>
                        <td className="p-3">
                          <code className="text-xs break-all" title={w.wallet_address || w.address}>
                            {(w.wallet_address || w.address).substring(0, 20)}...
                          </code>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleAction(w.id, 'complete')}
                            disabled={loading}
                            className="px-3 py-1 rounded text-xs font-bold bg-blue-600 text-kt-text-primary hover:bg-blue-500 transition"
                          >
                            Mark Completed
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Status Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'pending', 'approved', 'completed', 'rejected', 'cancelled'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === f
                ? 'bg-temple-gold text-bg-dark'
                : 'border border-kt-border text-kt-text-tertiary hover:text-kt-text-primary'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* All Withdrawals History */}
      <div className="card">
        <div className="card-body p-0 overflow-x-auto">
          {filtered.length === 0 ? (
            <p className="p-6 text-kt-text-tertiary text-center mb-0">No withdrawals found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Currency</th>
                  <th className="text-left p-3">Address</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Requested</th>
                  <th className="text-left p-3">Reviewed By</th>
                  <th className="text-left p-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => {
                  const u = getUserObj(w);
                  return (
                    <tr key={w.id}>
                      <td className="p-3">#{w.id}</td>
                      <td className="p-3">{u.username}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-xs font-bold" style={{
                          background: w.withdrawal_type === 'commission' ? 'rgba(180,124,255,0.15)' : 'rgba(255,215,0,0.15)',
                          color: w.withdrawal_type === 'commission' ? '#B47CFF' : '#FFD700',
                        }}>
                          {w.withdrawal_type === 'commission' ? 'Commission' : 'Profit'}
                        </span>
                      </td>
                      <td className="p-3">{fmt(Number(w.amount))}</td>
                      <td className="p-3">{w.currency}</td>
                      <td className="p-3">
                        <small title={w.wallet_address || w.address}>
                          {truncAddr(w.wallet_address || w.address)}
                        </small>
                      </td>
                      <td className="p-3">
                        <span className={`badge ${
                          w.status === 'completed' ? 'badge-success' :
                          w.status === 'approved' ? 'badge-info' :
                          w.status === 'pending' ? 'badge-warning' :
                          w.status === 'processing' ? 'badge-info' :
                          w.status === 'rejected' ? 'badge-danger' :
                          'badge-secondary'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="p-3"><small>{w.request_time ? new Date(w.request_time).toLocaleDateString() : ''}</small></td>
                      <td className="p-3"><small>{getReviewerName(w)}</small></td>
                      <td className="p-3"><small>{w.admin_notes || ''}</small></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function truncAddr(addr: string): string {
  if (!addr || addr.length <= 12) return addr || '';
  return addr.slice(0, 6) + '...' + addr.slice(-6);
}
