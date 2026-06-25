'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();
    if (data.success) {
      router.push('/login?reset=1');
    } else {
      setError(data.error || 'Reset failed.');
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="alert alert-danger">{error}</div>}
      <p className="text-kt-text-tertiary text-center">Enter your new password for <strong>{email}</strong>.</p>
      <div>
        <label htmlFor="password" className="block text-kt-text-secondary font-medium mb-1">New Password</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full" autoFocus />
      </div>
      <div>
        <label htmlFor="confirm" className="block text-kt-text-secondary font-medium mb-1">Confirm Password</label>
        <input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} className="w-full" />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-lg">
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}
