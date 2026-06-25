'use client';

import { useState, useEffect, useRef } from 'react';
import TwoFactorSetup from '@/components/settings/TwoFactorSetup';
import NotificationPreferences from '@/components/settings/NotificationPreferences';
import Link from 'next/link';

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const csrfTokenRef = useRef('');

  useEffect(() => {
    fetch('/api/csrf')
      .then(r => r.json())
      .then(d => { csrfTokenRef.current = d.csrfToken || ''; })
      .catch(() => {});
  }, []);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordError(false);

    if (newPassword.length < 8) {
      setPasswordMsg('New password must be at least 8 characters.');
      setPasswordError(true);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg('Passwords do not match.');
      setPasswordError(true);
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfTokenRef.current,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordMsg('Password changed successfully.');
        setPasswordError(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg(data.error || 'Failed to change password.');
        setPasswordError(true);
      }
    } catch {
      setPasswordMsg('Network error.');
      setPasswordError(true);
    }
    setPasswordLoading(false);
  }

  return (
    <div className="py-4 max-w-lg mx-auto px-4">
      <h2 className="text-xl font-bold text-white mb-1">Settings</h2>
      <p className="text-sm text-white/40 mb-6">Manage your account security and preferences</p>

      {/* Change Password */}
      <div
        className="p-5 rounded-xl mb-6"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h3 className="text-base font-bold text-white mb-4">Change Password</h3>

        {passwordMsg && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${passwordError ? 'text-red-400' : 'text-green-400'}`}
            style={{
              background: passwordError ? 'rgba(244,67,54,0.1)' : 'rgba(76,175,80,0.1)',
              border: `1px solid ${passwordError ? 'rgba(244,67,54,0.2)' : 'rgba(76,175,80,0.2)'}`,
            }}>
            {passwordMsg}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 font-medium mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg text-white"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                minHeight: 48,
              }}
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 font-medium mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-lg text-white"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                minHeight: 48,
              }}
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 font-medium mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg text-white"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                minHeight: 48,
              }}
            />
          </div>
          <button
            type="submit"
            disabled={passwordLoading}
            className="w-full py-3 rounded-lg text-sm font-bold transition disabled:opacity-40"
            style={{ background: '#FFD700', color: '#000', minHeight: 44 }}
          >
            {passwordLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* 2FA Section */}
      <TwoFactorSetup />

      {/* Email OTP */}
      <div className="mt-6">
        <EmailOtpCard />
      </div>

      {/* Notification Preferences */}
      <div className="mt-6">
        <NotificationPreferences />
      </div>

      {/* Auto-withdrawal link */}
      <div className="mt-6">
        <Link
          href="/withdraw?tab=auto"
          className="flex items-center justify-between p-5 rounded-xl transition hover:bg-white/[0.02] no-underline"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <h3 className="text-base font-bold text-white">Auto-Withdrawal</h3>
            <p className="text-xs text-white/40 mt-0.5">Configure automatic profit withdrawals</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </Link>
      </div>
    </div>
  );
}

function EmailOtpCard() {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const csrfTokenRef = useRef('');

  useEffect(() => {
    fetch('/api/csrf')
      .then(r => r.json())
      .then(d => { csrfTokenRef.current = d.csrfToken || ''; })
      .catch(() => {});
    setLoading(false);
  }, []);

  async function handleSendOTP() {
    setSending(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/2fa/send-otp', {
        method: 'POST',
        headers: { 'x-csrf-token': csrfTokenRef.current },
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Verification code sent to your email.');
        if (data.code) setOtpCode(data.code); // dev mode
      } else {
        setError(data.error || 'Failed to send code.');
      }
    } catch {
      setError('Network error.');
    }
    setSending(false);
  }

  async function handleVerifyOTP() {
    if (!otpCode || otpCode.length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfTokenRef.current,
        },
        body: JSON.stringify({ code: otpCode }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Code verified!');
        setOtpCode('');
      } else {
        setError(data.error || 'Invalid code.');
      }
    } catch {
      setError('Network error.');
    }
    setVerifying(false);
  }

  if (loading) return null;

  return (
    <div
      className="p-5 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white">Email Verification (OTP)</h3>
          <p className="text-xs text-white/40 mt-0.5">6-digit code sent to your email</p>
        </div>
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

      <div className="space-y-3">
        <button
          onClick={handleSendOTP}
          disabled={sending}
          className="w-full py-2.5 rounded-lg text-sm font-bold transition disabled:opacity-40"
          style={{ background: 'rgba(33,150,243,0.12)', color: '#2196F3', border: '1px solid rgba(33,150,243,0.2)', minHeight: 44 }}
        >
          {sending ? 'Sending...' : 'Send Verification Code'}
        </button>

        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="flex-1 px-4 py-3 rounded-lg text-center text-lg tracking-widest text-white"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              minHeight: 48,
            }}
          />
          <button
            onClick={handleVerifyOTP}
            disabled={verifying || otpCode.length !== 6}
            className="px-6 py-3 rounded-lg text-sm font-bold transition disabled:opacity-40"
            style={{ background: '#FFD700', color: '#000', minHeight: 48 }}
          >
            {verifying ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  );
}
