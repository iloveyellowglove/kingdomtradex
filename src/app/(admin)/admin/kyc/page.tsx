'use client';

import { useEffect, useState, useCallback } from 'react';

interface KycSubmission {
  id: number;
  username: string;
  email: string | null;
  full_name: string | null;
  kyc_document_type: string | null;
  kyc_document_url: string | null;
  kyc_selfie_url: string | null;
  kyc_submitted_at: string | null;
}

export default function AdminKycPage() {
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/kyc');
      const data = await res.json();
      if (data.submissions) setSubmissions(data.submissions);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleAction = useCallback(async (userId: number, action: 'approve' | 'reject', reason?: string) => {
    setMsg('');
    try {
      const res = await fetch('/api/admin/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, action, reason }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmissions((prev) => prev.filter((s) => s.id !== userId));
        setMsg(`${action === 'approve' ? 'Approved' : 'Rejected'} user #${userId}`);
      } else {
        setMsg(data.error || 'Action failed.');
      }
    } catch {
      setMsg('Network error.');
    } finally {
      setTimeout(() => setMsg(''), 4000);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-temple-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {msg && (
        <div className={`px-3 py-2 rounded-lg text-xs mb-4 ${msg.includes('Failed') || msg.includes('error') ? 'bg-red-400/10 text-red-400' : 'bg-green-400/10 text-green-400'}`}>
          {msg}
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="rounded-xl p-8 text-center bg-kt-hover-bg border border-kt-border">
          <p className="text-kt-text-tertiary text-sm">No pending KYC submissions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="rounded-xl p-5 bg-kt-hover-bg border border-kt-border"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-kt-text-primary text-sm font-semibold">
                    {sub.full_name || sub.username}
                    <span className="text-kt-text-tertiary text-xs ml-2">#{sub.id}</span>
                  </p>
                  {sub.email && <p className="text-kt-text-tertiary text-xs">{sub.email}</p>}
                  <p className="text-kt-text-tertiary text-xs mt-1">
                    {sub.kyc_document_type} &middot; Submitted {sub.kyc_submitted_at ? new Date(sub.kyc_submitted_at).toLocaleString() : 'unknown'}
                  </p>
                </div>
              </div>

              {/* Document links */}
              <div className="flex gap-4 mb-4">
                {sub.kyc_document_url && (
                  <a
                    href={sub.kyc_document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-kt-gold text-xs hover:underline"
                  >
                    View ID Document
                  </a>
                )}
                {sub.kyc_selfie_url && (
                  <a
                    href={sub.kyc_selfie_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-kt-gold text-xs hover:underline"
                  >
                    View Selfie
                  </a>
                )}
              </div>

              {/* Actions */}
              {rejectId === sub.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Rejection reason..."
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#fff',
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { handleAction(sub.id, 'reject', rejectReason); setRejectId(null); setRejectReason(''); }}
                      disabled={!rejectReason}
                      className="px-3 py-1.5 rounded text-xs font-semibold bg-red-500/20 text-red-400 disabled:opacity-40"
                    >
                      Confirm Reject
                    </button>
                    <button
                      onClick={() => { setRejectId(null); setRejectReason(''); }}
                      className="px-3 py-1.5 rounded text-xs text-kt-text-tertiary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(sub.id, 'approve')}
                    className="px-4 py-1.5 rounded text-xs font-semibold"
                    style={{ background: '#22c55e', color: '#fff' }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectId(sub.id)}
                    className="px-4 py-1.5 rounded text-xs font-semibold"
                    style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
