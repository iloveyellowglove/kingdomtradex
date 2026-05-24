'use client';

import { useState } from 'react';
import type { WaitlistEntry } from '@/lib/types';
import Logo from '@/components/brand/Logo';
import CountdownTimer from '@/components/waitlist/CountdownTimer';

interface Props {
  entry: WaitlistEntry;
  rank: number | null;
  totalSignups: number;
  nextMilestone: { nextTier: string; needed: number } | null;
  referrals: { name: string; tier: string; joined_at: string }[];
}

const TIER_DETAILS: Record<string, { badge: string; color: string; label: string; nextCount: number }> = {
  none: { badge: '', color: '#6e6080', label: 'No Tier', nextCount: 5 },
  bronze: { badge: '\u{1F949}', color: '#cd7f32', label: 'Bronze Steward', nextCount: 15 },
  silver: { badge: '\u{1F948}', color: '#b47cff', label: 'Silver Steward', nextCount: 30 },
  gold: { badge: '\u{1F947}', color: '#FFD700', label: 'Gold Steward', nextCount: -1 },
  genesis: { badge: '\u{1F451}', color: '#FFD700', label: 'Genesis Steward', nextCount: -1 },
};

export default function WaitlistDashboardClient({ entry, rank, totalSignups, nextMilestone, referrals }: Props) {
  const [copied, setCopied] = useState(false);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kingdomtradex.vercel.app';
  const referralLink = `${appUrl}/waitlist/${entry.referral_code}`;
  const tierInfo = TIER_DETAILS[entry.tier] || TIER_DETAILS.none;
  const encoded = encodeURIComponent(referralLink);
  const shareText = encodeURIComponent(
    'Join me on the KingdomTradex waitlist! Early access to AI-powered crypto trading with 1.5% daily yield.'
  );

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const progressPercent = nextMilestone && nextMilestone.needed > 0
    ? Math.min(100, (entry.referral_count / nextMilestone.needed) * 100)
    : entry.referral_count >= 30 ? 100 : 0;

  return (
    <div className="py-8 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <Logo size="md" className="mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Your Waitlist Dashboard</h1>
        <p className="text-text-muted">Track your referrals and climb the leaderboard</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4 text-center">
          <p className="text-text-muted text-xs mb-1">Your Position</p>
          <p className="text-temple-gold text-2xl font-extrabold">
            #{entry.waitlist_position ?? '-'}
          </p>
          <p className="text-text-muted text-xs">of {totalSignups.toLocaleString()}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-text-muted text-xs mb-1">Referrals</p>
          <p className="text-temple-gold text-2xl font-extrabold">{entry.referral_count}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-text-muted text-xs mb-1">Tier</p>
          <p className="text-2xl font-extrabold" style={{ color: tierInfo.color }}>
            {tierInfo.badge} {tierInfo.label}
          </p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-text-muted text-xs mb-1">Rank</p>
          <p className="text-temple-gold text-2xl font-extrabold">
            {rank ? `#${rank}` : '-'}
          </p>
          <p className="text-text-muted text-xs">on leaderboard</p>
        </div>
      </div>

      {/* Progress to next tier */}
      {nextMilestone && nextMilestone.needed > 0 && (
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-bold mb-3 text-center">Next Milestone</h3>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-text-muted">{entry.referral_count} referrals</span>
            <span className="text-temple-gold font-semibold capitalize">{nextMilestone.nextTier}: {nextMilestone.needed} referrals</span>
          </div>
          <div className="h-3 rounded-full" style={{ background: '#261f3a' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #FFD700, #FFC107)',
                minWidth: '0',
              }}
            />
          </div>
          <p className="text-text-muted text-xs text-center mt-2">
            {nextMilestone.needed - entry.referral_count} more referrals to reach {nextMilestone.nextTier}
          </p>
        </div>
      )}

      {/* Referral link */}
      <div className="card p-6 mb-8" style={{ border: '1px solid #FFD700' }}>
        <h3 className="text-lg font-bold mb-3 text-center">Your Referral Link</h3>
        <div className="flex items-center gap-2 mb-4">
          <code className="flex-1 text-left p-3 rounded-lg text-sm break-all" style={{
            background: '#0e0b1a', border: '1px solid #261f3a',
          }}>
            {referralLink}
          </code>
          <button
            onClick={copyLink}
            className="btn-primary px-4 py-3 rounded-lg text-sm whitespace-nowrap"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Share buttons */}
        <div className="flex justify-center gap-3 flex-wrap">
          <a
            href={`https://twitter.com/intent/tweet?url=${encoded}&text=${shareText}`}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: '#1DA1F2', color: '#fff' }}
          >
            Twitter
          </a>
          <a
            href={`https://wa.me/?text=${shareText}%20${encoded}`}
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
            href={`mailto:?subject=${encodeURIComponent('KingdomTradex Early Access')}&body=${shareText}%20${encoded}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: '#6e6080', color: '#fff' }}
          >
            Email
          </a>
        </div>
      </div>

      {/* Tier milestones */}
      <div className="card p-6 mb-8">
        <h3 className="text-lg font-bold mb-4 text-center">Tier Milestones</h3>
        <div className="space-y-3">
          {[
            { count: 5, tier: 'Bronze Steward', desc: 'Early access badge', badge: '\u{1F949}' },
            { count: 15, tier: 'Silver Steward', desc: 'Guaranteed early access for 5 friends', badge: '\u{1F948}' },
            { count: 30, tier: 'Gold Steward', desc: 'Genesis NFT + 0.25% lifetime yield boost', badge: '\u{1F947}' },
            { count: -1, tier: 'Genesis Steward', desc: 'Top 10: One-on-one strategy session', badge: '\u{1F451}' },
          ].map((m) => (
            <div key={m.tier} className="flex items-center gap-4 p-3 rounded-lg" style={{
              background: entry.tier === m.tier.toLowerCase().split(' ')[0] ? 'rgba(255,215,0,0.08)' : '#151025',
              border: entry.tier === m.tier.toLowerCase().split(' ')[0] ? '1px solid rgba(255,215,0,0.3)' : '1px solid #261f3a',
            }}>
              <span className="text-2xl">{m.badge}</span>
              <div className="flex-1">
                <p className="font-bold text-sm">{m.tier}</p>
                <p className="text-text-muted text-xs">{m.desc}</p>
              </div>
              <span className="text-temple-gold font-bold text-sm">
                {m.count === -1 ? 'Top 10' : `${m.count} refs`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Countdown */}
      <div className="mb-8">
        <CountdownTimer />
      </div>

      {/* Referrals list */}
      <div className="card mb-8">
        <div className="card-header"><h5 className="mb-0">Your Referrals</h5></div>
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
                    <td className="p-3 text-text-muted text-xs">
                      {new Date(ref.joined_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-4 text-text-muted mb-0">No referrals yet. Share your link to start climbing!</p>
          )}
        </div>
      </div>
    </div>
  );
}
