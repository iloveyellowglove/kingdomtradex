'use client';

import { useState, useEffect, useRef } from 'react';

interface SetupData {
  secret: string;
  otpauthUri: string;
  backupCodes: string[];
}

export default function TwoFactorSetup() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [showDisable, setShowDisable] = useState(false);
  const [backupCopied, setBackupCopied] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const csrfTokenRef = useRef('');

  useEffect(() => {
    fetch('/api/csrf')
      .then(r => r.json())
      .then(d => { csrfTokenRef.current = d.csrfToken || ''; })
      .catch(() => {});

    async function load() {
      try {
        const res = await fetch('/api/user/balance');
        const data = await res.json();
        if (data.success) {
          // Fetch 2FA status from a quick profile query
          const pRes = await fetch('/api/profile/me');
          const pData = await pRes.json();
          setEnabled(Boolean(pData.two_factor_enabled));
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSetup() {
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'x-csrf-token': csrfTokenRef.current },
      });
      const data = await res.json();
      if (data.success) {
        setSetup(data);
      } else {
        setError(data.error || 'Setup failed.');
      }
    } catch {
      setError('Network error.');
    }
  }

  async function handleVerify() {
    if (!verifyCode || verifyCode.length !== 6) {
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfTokenRef.current,
        },
        body: JSON.stringify({ code: verifyCode }),
      });
      const data = await res.json();
      if (data.success) {
        setEnabled(true);
        setSuccess('2FA enabled successfully!');
      } else {
        setError(data.error || 'Invalid code.');
      }
    } catch {
      setError('Network error.');
    }
    setVerifying(false);
  }

  async function handleDisable() {
    if (!disableCode || disableCode.length < 6) {
      setError('Enter a valid code or backup code.');
      return;
    }
    setDisabling(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfTokenRef.current,
        },
        body: JSON.stringify({ code: disableCode }),
      });
      const data = await res.json();
      if (data.success) {
        setEnabled(false);
        setSetup(null);
        setShowDisable(false);
        setDisableCode('');
        setSuccess('2FA disabled.');
      } else {
        setError(data.error || 'Invalid code.');
      }
    } catch {
      setError('Network error.');
    }
    setDisabling(false);
  }

  function copyBackupCodes() {
    if (!setup?.backupCodes) return;
    navigator.clipboard.writeText(setup.backupCodes.join('\n')).then(() => {
      setBackupCopied(true);
      setTimeout(() => setBackupCopied(false), 3000);
    }).catch(() => {});
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-6 w-40 bg-white/5 rounded" />
        <div className="h-10 w-full bg-white/5 rounded" />
      </div>
    );
  }

  return (
    <div
      className="p-5 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white">Authenticator App (TOTP)</h3>
          <p className="text-xs text-white/40 mt-0.5">Google Authenticator, Authy, or similar</p>
        </div>
        {enabled ? (
          <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(76,175,80,0.12)', color: '#4CAF50' }}>
            Enabled
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
            Disabled
          </span>
        )}
      </div>

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

      {!enabled && !setup && (
        <button
          onClick={handleSetup}
          className="w-full py-3 rounded-lg text-sm font-bold transition"
          style={{ background: '#FFD700', color: '#000', minHeight: 44 }}
        >
          Set Up Authenticator App
        </button>
      )}

      {/* Setup flow: QR + verify */}
      {!enabled && setup && (
        <div className="space-y-4">
          {/* QR Code */}
          <div className="text-center">
            <div className="inline-block p-3 rounded-xl bg-white mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setup.otpauthUri)}`}
                alt="QR Code"
                width={180}
                height={180}
                className="block"
              />
            </div>
            <p className="text-xs text-white/40 mb-1">Scan with your authenticator app</p>
            <p className="text-xs text-white/30 font-mono select-all break-all px-4">
              {setup.secret}
            </p>
            <p className="text-[10px] text-white/25 mt-1">Or enter this key manually</p>
          </div>

          {/* Verify code */}
          <div>
            <label className="block text-sm text-white/60 font-medium mb-1.5">Enter 6-digit code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-3 rounded-lg text-center text-xl tracking-widest text-white"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                minHeight: 48,
              }}
            />
          </div>

          <button
            onClick={handleVerify}
            disabled={verifying || verifyCode.length !== 6}
            className="w-full py-3 rounded-lg text-sm font-bold transition disabled:opacity-40"
            style={{ background: '#FFD700', color: '#000', minHeight: 44 }}
          >
            {verifying ? 'Verifying...' : 'Verify & Enable'}
          </button>

          {/* Backup codes (shown after enable but we show during setup too) */}
          {setup.backupCodes && setup.backupCodes.length > 0 && (
            <div className="p-4 rounded-lg" style={{ background: 'rgba(255,193,7,0.06)', border: '1px solid rgba(255,193,7,0.15)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-[#FFC107]">Backup Codes</p>
                <button
                  onClick={copyBackupCodes}
                  className="text-xs px-2 py-1 rounded font-medium transition"
                  style={{
                    background: backupCopied ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.06)',
                    color: backupCopied ? '#4CAF50' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  {backupCopied ? 'Copied!' : 'Copy All'}
                </button>
              </div>
              <p className="text-[10px] text-white/30 mb-2">Save these — each code can be used once if you lose access to your authenticator.</p>
              <div className="grid grid-cols-2 gap-1">
                {setup.backupCodes.map((code, i) => (
                  <code key={i} className="text-xs font-mono text-white/60 bg-white/5 px-2 py-1 rounded select-all">
                    {code}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Disable flow */}
      {enabled && (
        <div>
          {!showDisable ? (
            <button
              onClick={() => setShowDisable(true)}
              className="w-full py-2.5 rounded-lg text-sm font-bold transition"
              style={{ background: 'rgba(244,67,54,0.1)', color: '#F44336', border: '1px solid rgba(244,67,54,0.2)', minHeight: 44 }}
            >
              Disable Authenticator
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-white/40">Enter your authenticator code or a backup code to disable.</p>
              <input
                type="text"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                placeholder="6-digit code or backup code"
                className="w-full px-4 py-3 rounded-lg text-white"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  minHeight: 48,
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDisable(false); setDisableCode(''); }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold border border-white/10 text-white/50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisable}
                  disabled={disabling || disableCode.length < 6}
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold transition disabled:opacity-40"
                  style={{ background: '#F44336', color: '#fff' }}
                >
                  {disabling ? 'Disabling...' : 'Confirm Disable'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
