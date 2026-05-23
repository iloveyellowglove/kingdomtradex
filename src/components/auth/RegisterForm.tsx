'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterForm({ csrfToken }: { csrfToken: string }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify({ username, email, password, referral_code: referralCode }),
    });

    const data = await res.json();
    if (data.success) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setError(data.error || 'Registration failed.');
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="alert alert-danger">{error}</div>}
      <div>
        <label htmlFor="username" className="block text-text-secondary font-medium mb-1">Username</label>
        <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} maxLength={50} className="w-full" autoFocus />
      </div>
      <div>
        <label htmlFor="email" className="block text-text-secondary font-medium mb-1">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full" />
      </div>
      <div>
        <label htmlFor="password" className="block text-text-secondary font-medium mb-1">Password</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full" />
      </div>
      <div>
        <label htmlFor="referral" className="block text-text-secondary font-medium mb-1">Referral Code (optional)</label>
        <input id="referral" type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className="w-full" placeholder="Enter referral code" />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-lg">
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}
