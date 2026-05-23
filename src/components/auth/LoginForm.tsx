'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm({ csrfToken }: { csrfToken: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (data.success) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setError(data.error || 'Login failed.');
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="alert alert-danger">{error}</div>}
      <div>
        <label htmlFor="email" className="block text-text-secondary font-medium mb-1">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full" autoFocus />
      </div>
      <div>
        <label htmlFor="password" className="block text-text-secondary font-medium mb-1">Password</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full" />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-lg">
        {loading ? 'Logging in...' : 'Log In'}
      </button>
      <div className="text-center">
        <a href="/forgot-password" className="text-sm text-text-secondary hover:text-temple-gold">Forgot password?</a>
      </div>
    </form>
  );
}
