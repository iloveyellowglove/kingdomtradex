'use client';

import { useState, useEffect } from 'react';
const LEVELS = [
  { level: 0, name: 'Sign Up', desc: 'Create your account', unlocks: 'No withdrawals', icon: '👤', action: 'Complete' },
  { level: 1, name: 'Email Verified', desc: 'Verify your email address', unlocks: 'Withdraw up to $100/week', icon: '📧', action: 'Verify Email' },
  { level: 2, name: 'Authenticator', desc: 'Setup 2FA authenticator app', unlocks: 'Withdraw up to $1,000/week', icon: '🔐', action: 'Setup 2FA' },
  { level: 3, name: 'ID Verified', desc: 'Upload government ID + selfie', unlocks: 'Withdraw up to $10,000/week', icon: '🪪', action: 'Upload ID' },
  { level: 4, name: 'Fully Verified', desc: 'Upload proof of address', unlocks: 'Unlimited withdrawals', icon: '📄', action: 'Upload Proof' },
];

export default function KycPage() {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [idDocFile, setIdDocFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/user/balance');
        const data = await res.json();
        if (data.success) setCurrentLevel(data.kycLevel ?? 0);
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  function handleFile(setter: (f: File | null) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { setError('File must be under 5MB.'); return; }
      setter(file);
      setError('');
    };
  }

  async function handleAction(level: number) {
    setError(''); setSuccess('');
    if (level === 1) {
      setSubmitting(true);
      try {
        const res = await fetch('/api/auth/2fa/send-otp', { method: 'POST' });
        const data = await res.json();
        if (data.success) setSuccess('Verification email sent. Check your inbox.');
        else setError(data.error || 'Failed to send email.');
      } catch { setError('Network error.'); }
      setSubmitting(false);
    } else if (level === 2) {
      window.location.href = '/settings';
    } else if (level === 3 && idDocFile && selfieFile) {
      setSubmitting(true);
      try {
        const fd1 = new FormData(); fd1.append('file', idDocFile); fd1.append('type', 'document');
        const r1 = await fetch('/api/profile/kyc/upload', { method: 'POST', body: fd1 });
        const d1 = await r1.json();
        if (!d1.success) { setError(d1.error || 'Upload failed'); setSubmitting(false); return; }
        const fd2 = new FormData(); fd2.append('file', selfieFile); fd2.append('type', 'selfie');
        const r2 = await fetch('/api/profile/kyc/upload', { method: 'POST', body: fd2 });
        const d2 = await r2.json();
        if (!d2.success) { setError(d2.error || 'Upload failed'); setSubmitting(false); return; }
        const r3 = await fetch('/api/profile/kyc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ document_type: 'national_id', document_url: d1.url, selfie_url: d2.url }) });
        const d3 = await r3.json();
        if (d3.success) { setSuccess('ID submitted for review. Check back in 24-48 hours.'); setCurrentLevel(2.5 as number); }
        else setError(d3.error || 'Submission failed.');
      } catch { setError('Network error.'); }
      setSubmitting(false);
    } else if (level === 4 && proofFile) {
      setSubmitting(true);
      try {
        const fd = new FormData(); fd.append('file', proofFile); fd.append('type', 'proof_of_address');
        const r = await fetch('/api/profile/kyc/upload', { method: 'POST', body: fd });
        const d = await r.json();
        if (d.success) { setSuccess('Proof of address submitted. Review takes 24-48 hours.'); }
        else setError(d.error || 'Upload failed.');
      } catch { setError('Network error.'); }
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-[#F0B90B] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="py-4 px-4 lg:px-6" style={{ background: '#0B0E11', minHeight: '100vh' }}>
      <h2 className="text-xl font-bold text-kt-text-primary mb-1">KYC Verification</h2>
      <p className="text-sm text-kt-text-secondary mb-6">Complete all levels to unlock full platform access</p>

      {error && <div className="mb-4 p-3 rounded-lg text-sm text-kt-red" style={{ background: 'rgba(246,70,93,0.1)', border: '1px solid rgba(246,70,93,0.2)' }}>{error}</div>}
      {success && <div className="mb-4 p-3 rounded-lg text-sm text-kt-green" style={{ background: 'rgba(14,203,129,0.1)', border: '1px solid rgba(14,203,129,0.2)' }}>{success}</div>}

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-kt-text-tertiary mb-2">
          {LEVELS.map(l => <span key={l.level} style={{ color: currentLevel >= l.level ? '#0ECB81' : '#5E6673' }}>L{l.level}</span>)}
        </div>
        <div className="h-2 rounded-full bg-kt-elevated">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(currentLevel / 4) * 100}%`, background: '#0ECB81' }} />
        </div>
      </div>

      {/* Level cards */}
      <div className="space-y-3">
        {LEVELS.filter(l => l.level > 0).map(l => {
          const isComplete = currentLevel >= l.level;
          const isNext = currentLevel + 1 === l.level;
          return (
            <div key={l.level} className="p-4 rounded-xl" style={{
              background: isComplete ? 'rgba(14,203,129,0.04)' : isNext ? 'rgba(240,185,11,0.04)' : '#1E2329',
              border: isComplete ? '1px solid rgba(14,203,129,0.2)' : isNext ? '1px solid rgba(240,185,11,0.2)' : '1px solid #2B3139',
            }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">{l.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-kt-text-primary">{l.name}</span>
                    {isComplete && <span className="text-xs text-kt-green font-bold">✓ Complete</span>}
                    {isNext && <span className="text-xs text-kt-gold font-bold">Next Step</span>}
                  </div>
                  <p className="text-xs text-kt-text-secondary">{l.desc}</p>
                </div>
              </div>
              <p className="text-xs text-kt-text-tertiary mb-2">{l.unlocks}</p>
              {isNext && (
                <div>
                  {(l.level === 3) && (
                    <div className="space-y-2 mb-3">
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile(setIdDocFile)} className="w-full text-xs text-kt-text-primary" />
                      {idDocFile && <p className="text-[10px] text-kt-green">ID: {idDocFile.name}</p>}
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile(setSelfieFile)} className="w-full text-xs text-kt-text-primary" />
                      {selfieFile && <p className="text-[10px] text-kt-green">Selfie: {selfieFile.name}</p>}
                    </div>
                  )}
                  {(l.level === 4) && (
                    <div className="mb-3">
                      <input type="file" accept="image/jpeg,image/png,image/webp,.pdf" onChange={handleFile(setProofFile)} className="w-full text-xs text-kt-text-primary" />
                      {proofFile && <p className="text-[10px] text-kt-green">{proofFile.name}</p>}
                    </div>
                  )}
                  <button onClick={() => handleAction(l.level)} disabled={submitting}
                    className="w-full py-2.5 rounded-lg text-sm font-bold transition disabled:opacity-40"
                    style={{ background: '#F0B90B', color: '#0B0E11', minHeight: 44 }}>
                    {submitting ? 'Submitting...' : l.action}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
