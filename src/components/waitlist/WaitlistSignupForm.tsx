'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  referredByName?: string;
}

export default function WaitlistSignupForm({ referredByName }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'pastor' | 'member'>('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/waitlist/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          role,
          referredBy: window.location.pathname.split('/waitlist/')[1] || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.alreadyExists) {
          router.push(`/waitlist/dashboard/${data.referralCode}?welcome_back=1`);
        } else {
          router.push(`/waitlist/dashboard/${data.referralCode}`);
        }
      } else {
        setError(data.error || 'Something went wrong.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="card p-8" style={{
      border: '1px solid #261f3a',
    }}>
      {referredByName && (
        <div className="text-center mb-6">
          <p className="text-kt-gold font-semibold">
            You were invited by {referredByName}
          </p>
        </div>
      )}

      <h2 className="text-2xl font-bold text-center mb-2">Secure Your Spot</h2>
      <p className="text-kt-text-tertiary text-center mb-6">Join the waitlist and earn rewards for referring others</p>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-kt-text-secondary font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="block text-kt-text-secondary font-medium mb-1">Name (optional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-kt-text-secondary font-medium mb-1">I am a</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'pastor' | 'member')}
            className="w-full"
          >
            <option value="member">Member</option>
            <option value="pastor">Pastor / Ministry Leader</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-4 rounded-xl text-lg font-bold"
        >
          {loading ? 'Securing Your Spot...' : 'Secure My Kingdom Grant'}
        </button>
      </form>

      <p className="text-kt-text-tertiary text-xs text-center mt-4">
        No spam. Only launch updates and your referral dashboard.
      </p>
    </div>
  );
}
