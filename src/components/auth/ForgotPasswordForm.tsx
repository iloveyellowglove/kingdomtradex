'use client';

import { useState } from 'react';

export default function ForgotPasswordForm({ csrfToken }: { csrfToken: string }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (data.success) {
      setMessage('If an account with that email exists, a reset link has been sent.');
    } else {
      setError(data.error || 'Request failed.');
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}
      <p className="text-text-secondary text-sm">Enter your email address and we will send you a password reset link.</p>
      <div>
        <label htmlFor="email" className="block text-text-secondary font-medium mb-1">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full" autoFocus />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-lg">
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>
    </form>
  );
}
