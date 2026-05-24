'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Props {
  referredByName?: string;
}

export default function WaitlistSignupForm({ referredByName }: Props) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'pastor' | 'member'>('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ referralCode: string; position: number; referralLink: string } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

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
        setSuccess(data);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      } else {
        setError(data.error || 'Something went wrong.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="relative">
        {/* Confetti burst */}
        {showConfetti && <ConfettiBurst />}

        <div className="card p-8 text-center" style={{
          border: '1px solid #FFD700',
          boxShadow: '0 0 40px rgba(255,215,0,0.15)',
        }}>
          <div className="text-4xl mb-4">&#127881;</div>
          <h3 className="text-temple-gold text-2xl font-bold mb-4">You are on the list!</h3>

          <div className="bg-dark-indigo rounded-xl p-5 mb-6">
            <p className="text-text-muted text-sm mb-1">Your Position</p>
            <p className="text-white text-4xl font-extrabold">#{success.position}</p>
            <p className="text-text-muted text-xs mt-1">of thousands on the waitlist</p>
          </div>

          <div className="bg-dark-indigo rounded-xl p-5 mb-6">
            <p className="text-text-muted text-sm mb-3">Your Referral Link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-left p-3 rounded-lg text-sm break-all" style={{
                background: '#0e0b1a', border: '1px solid #261f3a',
              }}>
                {success.referralLink}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(success.referralLink)}
                className="btn-primary px-4 py-3 rounded-lg text-sm whitespace-nowrap"
              >
                Copy
              </button>
            </div>
          </div>

          <ShareButtons url={success.referralLink} />

          <div className="mt-6 pt-6 border-t border-border">
            <Link href={`/waitlist/dashboard/${success.referralCode}`} className="btn-primary inline-block px-8 py-3 rounded-xl font-bold">
              View My Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-8" style={{
      border: '1px solid #261f3a',
    }}>
      {referredByName && (
        <div className="text-center mb-6">
          <p className="text-temple-gold font-semibold">
            You were invited by {referredByName}
          </p>
        </div>
      )}

      <h2 className="text-2xl font-bold text-center mb-2">Secure Your Spot</h2>
      <p className="text-text-muted text-center mb-6">Join the waitlist and earn rewards for referring others</p>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-text-secondary font-medium mb-1">Email</label>
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
          <label className="block text-text-secondary font-medium mb-1">Name (optional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-text-secondary font-medium mb-1">I am a</label>
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

      <p className="text-text-muted text-xs text-center mt-4">
        No spam. Only launch updates and your referral dashboard.
      </p>
    </div>
  );
}

function ShareButtons({ url }: { url: string }) {
  const encoded = encodeURIComponent(url);
  const text = encodeURIComponent('Join me on the KingdomTradex waitlist! Early access to AI-powered crypto trading with 1.5% daily yield.');

  return (
    <div className="flex justify-center gap-3 flex-wrap">
      <a
        href={`https://twitter.com/intent/tweet?url=${encoded}&text=${text}`}
        target="_blank"
        rel="noopener"
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{ background: '#1DA1F2', color: '#fff' }}
      >
        Twitter
      </a>
      <a
        href={`https://wa.me/?text=${text}%20${encoded}`}
        target="_blank"
        rel="noopener"
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{ background: '#25D366', color: '#fff' }}
      >
        WhatsApp
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
        target="_blank"
        rel="noopener"
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{ background: '#1877F2', color: '#fff' }}
      >
        Facebook
      </a>
      <a
        href={`mailto:?subject=${encodeURIComponent('KingdomTradex Early Access')}&body=${text}%20${encoded}`}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{ background: '#6e6080', color: '#fff' }}
      >
        Email
      </a>
    </div>
  );
}

function ConfettiBurst() {
  const particles = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.5}s`,
    duration: `${Math.random() * 2 + 2}s`,
    color: i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? '#6A0DAD' : '#fff',
    size: Math.random() * 6 + 3,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            bottom: '50%',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            animation: `confettiFall ${p.duration} ${p.delay} ease-out forwards`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(400px) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
