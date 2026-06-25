'use client';

import { useState, useEffect } from 'react';
import ReferralStats from '@/components/referral/ReferralStats';
import CommissionHistory from '@/components/referral/CommissionHistory';

export default function ReferralTreePage() {
  const [tab, setTab] = useState<'stats' | 'commissions'>('stats');
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/referrals/stats');
        const data = await res.json();
        if (data.success) {
          setReferralCode(data.referralCode || '');
          setReferralLink(data.referralLink || '');
        }
      } catch { /* ignore */ }
    }
    load();
  }, []);

  async function copyLink() {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = referralLink; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="py-4 px-4 lg:px-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-kt-text-primary">Referrals</h2>
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition"
          style={{
            background: copied ? 'rgba(76,175,80,0.15)' : 'rgba(255,215,0,0.1)',
            color: copied ? '#4CAF50' : '#FFD700',
            border: `1px solid ${copied ? 'rgba(76,175,80,0.25)' : 'rgba(255,215,0,0.2)'}`,
            minHeight: 36,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          {copied ? 'Copied!' : referralCode || 'Copy Link'}
        </button>
      </div>
      <p className="text-sm text-kt-text-tertiary mb-6">Grow your network and earn commissions across 5 levels</p>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-kt-hover-bg">
        {[
          { key: 'stats' as const, label: 'Stats' },
          { key: 'commissions' as const, label: 'Commissions' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-2.5 rounded-lg text-xs font-bold transition"
            style={{
              background: tab === t.key ? 'rgba(255,215,0,0.12)' : 'transparent',
              color: tab === t.key ? 'var(--kt-active-text)' : 'var(--kt-text-secondary)',
              minHeight: 44,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'stats' && <ReferralStats />}
      {tab === 'commissions' && <CommissionHistory />}
    </div>
  );
}
