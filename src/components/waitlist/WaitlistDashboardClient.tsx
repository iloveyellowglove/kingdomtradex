'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { WaitlistEntry } from '@/lib/types';
import Logo from '@/components/brand/Logo';

interface Props {
  entry: WaitlistEntry;
  nextMilestone: { nextTier: string; needed: number } | null;
  referrals: { name: string; tier: string; joined_at: string }[];
}

export default function WaitlistDashboardClient({ entry, nextMilestone, referrals }: Props) {
  const searchParams = useSearchParams();
  const isWelcomeBack = searchParams.get('welcome_back') === '1';
  const [copied, setCopied] = useState(false);
  const [showWelcomeBack, setShowWelcomeBack] = useState(isWelcomeBack);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kingdomtradex.vercel.app';
  const referralLink = `${appUrl}/waitlist/${entry.referral_code}`;
  const creditAmount = entry.role === 'pastor' ? '$100' : '$50';

  const encoded = encodeURIComponent(referralLink);
  const waText = encodeURIComponent(`I just got ${creditAmount} in free crypto trading credits from KingdomTradex! Sign up with my link and you get free credits too: ${referralLink}`);
  const twitterText = encodeURIComponent(`Just signed up for @KingdomTradex and got free crypto trading credits! AI trades for you 24/7. Get yours: ${referralLink}`);
  const smsText = encodeURIComponent(`Check this out - free crypto trading credits: ${referralLink}`);
  const emailSubject = encodeURIComponent('Free crypto trading credits - check this out');
  const emailBody = encodeURIComponent(`Hey!\n\nI just signed up for KingdomTradex and got ${creditAmount} in free trading credits. Their AI trades crypto for you and earns daily returns.\n\nSign up with my link to get your free credits:\n${referralLink}`);

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const progressPercent = nextMilestone && nextMilestone.needed > 0
    ? Math.min(100, (entry.referral_count / nextMilestone.needed) * 100)
    : entry.referral_count >= 30 ? 100 : 0;

  const tiers = [
    { count: 5, name: 'Bronze Steward', badge: '\u{1F949}', desc: 'Early access badge' },
    { count: 15, name: 'Silver Steward', badge: '\u{1F948}', desc: 'Guaranteed early access for 5 friends' },
    { count: 30, name: 'Gold Steward', badge: '\u{1F947}', desc: 'Genesis NFT + 0.25% lifetime yield boost' },
    { count: -1, name: 'Genesis Steward', badge: '\u{1F451}', desc: 'Top 10: One-on-one strategy session' },
  ];

  return (
    <div className="py-8 max-w-2xl mx-auto">
      {/* Welcome-back toast for returning users */}
      {showWelcomeBack && (
        <div className="alert alert-success mb-6 flex items-center justify-between">
          <span>Welcome back! Here&apos;s your referral dashboard.</span>
          <button
            onClick={() => setShowWelcomeBack(false)}
            className="text-white/60 hover:text-white ml-4 flex-shrink-0"
            style={{ fontSize: '1.25rem', lineHeight: 1 }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Top: Confirmation */}
      <div className="text-center mb-8">
        <Logo size="md" className="mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {isWelcomeBack ? 'Welcome Back!' : 'You\'re In! 🎉'}
        </h1>
        <p className="text-kt-gold text-lg font-semibold mb-2">
          Your {creditAmount} free credits are reserved.
        </p>
        <p className="text-kt-text-tertiary">
          You&apos;re <span className="text-kt-text-primary font-bold">#{entry.waitlist_position ?? '-'}</span> on the waitlist
        </p>
      </div>

      {/* Share Block */}
      <div className="card p-6 mb-8" style={{ border: '1px solid rgba(255,215,0,0.3)' }}>
        <h2 className="text-xl font-bold text-center mb-1">Share & Earn More</h2>
        <p className="text-kt-text-tertiary text-center text-sm mb-6">
          Every friend who joins through your link earns you rewards at launch
        </p>

        {/* Referral Link */}
        <div className="flex items-center gap-2 mb-6">
          <code className="flex-1 text-left p-3 rounded-lg text-sm break-all" style={{
            background: '#0e0b1a', border: '1px solid #261f3a',
          }}>
            {referralLink}
          </code>
          <button
            onClick={copyLink}
            className="px-5 py-3 rounded-lg text-sm font-bold transition-all flex-shrink-0"
            style={{
              background: copied ? '#00c853' : '#FFD700',
              color: '#0e0b1a',
            }}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* WhatsApp */}
          <a
            href={`https://wa.me/?text=${waText}`}
            target="_blank"
            rel="noopener"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all hover:scale-105 no-underline"
            style={{ background: '#25D366', color: '#fff' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </a>

          {/* Twitter/X */}
          <a
            href={`https://twitter.com/intent/tweet?text=${twitterText}`}
            target="_blank"
            rel="noopener"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all hover:scale-105 no-underline"
            style={{ background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Twitter
          </a>

          {/* Facebook */}
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
            target="_blank"
            rel="noopener"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all hover:scale-105 no-underline"
            style={{ background: '#1877F2', color: '#fff' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Facebook
          </a>

          {/* Telegram */}
          <a
            href={`https://t.me/share/url?url=${encoded}&text=${waText}`}
            target="_blank"
            rel="noopener"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all hover:scale-105 no-underline"
            style={{ background: '#0088cc', color: '#fff' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            Telegram
          </a>

          {/* SMS */}
          <a
            href={`sms:?body=${smsText}`}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all hover:scale-105 no-underline"
            style={{ background: '#22c55e', color: '#fff' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"/><line x1="22" y1="6" x2="12" y2="13"/><line x1="2" y1="6" x2="12" y2="13"/></svg>
            SMS
          </a>

          {/* Email */}
          <a
            href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all hover:scale-105 no-underline"
            style={{ background: '#6e6080', color: '#fff' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"/><line x1="22" y1="6" x2="12" y2="13"/><line x1="2" y1="6" x2="12" y2="13"/></svg>
            Email
          </a>
        </div>
      </div>

      {/* Referral Progress Tracker */}
      <div className="card p-6 mb-8">
        <h3 className="text-lg font-bold mb-4 text-center">Your Referral Progress</h3>

        <div className="flex justify-between text-sm mb-2">
          <span className="text-kt-text-tertiary">{entry.referral_count} referrals</span>
          {nextMilestone && nextMilestone.needed > 0 && (
            <span className="text-kt-gold font-semibold">
              Next: {nextMilestone.nextTier} ({nextMilestone.needed} needed)
            </span>
          )}
          {(!nextMilestone || nextMilestone.needed <= 0) && (
            <span className="text-kt-gold font-semibold">Max tier reached!</span>
          )}
        </div>

        <div className="h-3 rounded-full mb-6" style={{ background: '#261f3a' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, #FFD700, #FFC107)',
            }}
          />
        </div>

        {/* Tier milestones */}
        <div className="space-y-2">
          {tiers.map((m) => {
            const tierKey = m.name.toLowerCase().split(' ')[0];
            const isCurrent = entry.tier === tierKey;
            const isAchieved = m.count !== -1 && entry.referral_count >= m.count;
            return (
              <div key={m.name} className="flex items-center gap-3 p-3 rounded-lg" style={{
                background: isCurrent ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.02)',
                border: isCurrent ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.04)',
                opacity: isAchieved || isCurrent ? 1 : 0.5,
              }}>
                <span className="text-xl">{m.badge}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm">{m.name}</p>
                  <p className="text-kt-text-tertiary text-xs">{m.desc}</p>
                </div>
                <span className="text-kt-gold font-bold text-sm">
                  {m.count === -1 ? 'Top 10' : isAchieved ? 'Achieved' : `${m.count} refs`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Referrals List */}
      <div className="card mb-8">
        <div className="card-header"><h5 className="mb-0">Your Referrals ({referrals.length})</h5></div>
        <div className="card-body p-0">
          {referrals.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Tier</th>
                  <th className="text-left p-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((ref, i) => (
                  <tr key={i}>
                    <td className="p-3">{ref.name || 'Anonymous'}</td>
                    <td className="p-3">
                      <span className="badge badge-info capitalize">{ref.tier}</span>
                    </td>
                    <td className="p-3 text-kt-text-tertiary text-xs">
                      {new Date(ref.joined_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-4 text-kt-text-tertiary mb-0">No referrals yet. Share your link to start climbing!</p>
          )}
        </div>
      </div>

      {/* Bottom: What's next */}
      <div className="text-center">
        <p className="text-kt-text-tertiary text-sm">We&apos;ll email you before launch on June 7</p>
        <p className="text-kt-text-tertiary text-sm">In the meantime, share your link to climb the leaderboard</p>
        <a href="/waitlist/leaderboard" className="text-kt-gold hover:underline text-sm mt-2 inline-block">
          View Leaderboard
        </a>
      </div>
    </div>
  );
}
