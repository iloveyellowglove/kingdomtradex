'use client';

import { useState, useEffect } from 'react';

interface LeaderboardRow {
  userId: number;
  displayName: string;
  totalEarned: number;
  totalReferrals: number;
  rank: number;
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<'earnings' | 'referrals'>('earnings');
  const [earners, setEarners] = useState<LeaderboardRow[]>([]);
  const [referrers, setReferrers] = useState<LeaderboardRow[]>([]);
  const [myRanks, setMyRanks] = useState<{ earnings: number | null; referrals: number | null }>({ earnings: null, referrals: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        if (data.success) {
          setEarners(data.earners ?? []);
          setReferrers(data.referrers ?? []);
          setMyRanks(data.currentUserRank ?? { earnings: null, referrals: null });
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  const data = tab === 'earnings' ? earners : referrers;
  const myRank = tab === 'earnings' ? myRanks.earnings : myRanks.referrals;

  function rankBadge(rank: number) {
    if (rank === 1) return { emoji: '🥇', color: '#FFD700' };
    if (rank === 2) return { emoji: '🥈', color: '#C0C0C0' };
    if (rank === 3) return { emoji: '🥉', color: '#CD7F32' };
    return { emoji: '', color: 'rgba(255,255,255,0.3)' };
  }

  return (
    <div className="py-4 px-4 lg:px-6">
      <h2 className="text-xl font-bold text-kt-text-primary mb-1">Leaderboard</h2>
      <p className="text-sm text-kt-text-tertiary mb-6">Top performers across the platform</p>

      {/* My rank */}
      {myRank && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl mb-4"
          style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)' }}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ background: 'rgba(255,215,0,0.12)', color: '#FFD700' }}>
            #{myRank}
          </div>
          <div>
            <p className="text-sm font-bold text-kt-gold">Your {tab === 'earnings' ? 'Earnings' : 'Referral'} Rank</p>
            <p className="text-xs text-kt-text-tertiary">You&apos;re on the board! Keep growing.</p>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-kt-hover-bg">
        {[
          { key: 'earnings' as const, label: 'Top Earners' },
          { key: 'referrals' as const, label: 'Top Referrers' },
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

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-14 rounded-lg animate-pulse bg-kt-hover-bg" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-kt-text-tertiary text-sm">No data yet. Start earning to appear on the leaderboard.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {data.map(row => {
            const badge = rankBadge(row.rank);
            const isMe = myRank && row.rank === myRank;
            return (
              <div
                key={row.userId}
                className="flex items-center gap-3 p-3 rounded-lg transition"
                style={{
                  background: isMe ? 'rgba(255,215,0,0.06)' : 'rgba(255,255,255,0.02)',
                  border: isMe ? '1px solid rgba(255,215,0,0.2)' : '1px solid transparent',
                }}
              >
                {/* Rank */}
                <div className="w-8 text-center flex-shrink-0">
                  {badge.emoji ? (
                    <span className="text-lg">{badge.emoji}</span>
                  ) : (
                    <span className="text-sm font-bold" style={{ color: badge.color }}>#{row.rank}</span>
                  )}
                </div>

                {/* Avatar placeholder */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'rgba(255,215,0,0.1)', color: '#FFD700' }}
                >
                  {row.displayName.charAt(0)}
                </div>

                {/* Name + stats */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isMe ? 'text-kt-gold' : 'text-kt-text-primary'}`}>
                    {row.displayName}
                    {isMe && <span className="text-[10px] ml-1 text-kt-gold/50">(you)</span>}
                  </p>
                  <div className="flex gap-3 text-[10px] text-kt-text-tertiary">
                    {tab === 'earnings' ? (
                      <span>${row.totalEarned.toFixed(0)} earned</span>
                    ) : (
                      <span>{row.totalReferrals} referrals</span>
                    )}
                  </div>
                </div>

                {/* Right stat */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-kt-green">
                    {tab === 'earnings'
                      ? `$${row.totalEarned.toFixed(0)}`
                      : row.totalReferrals}
                  </p>
                  {tab === 'earnings' && row.totalReferrals > 0 && (
                    <p className="text-[10px] text-kt-muted-text">{row.totalReferrals} refs</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center text-[10px] text-kt-text-tertiary mt-6">
        Rankings update every 6 hours. Names are anonymized for privacy.
      </p>
    </div>
  );
}
