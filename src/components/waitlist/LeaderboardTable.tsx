'use client';

import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  name: string;
  referral_count: number;
  tier: string;
  rank: number;
}

export default function LeaderboardTable() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/waitlist/leaderboard')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setEntries(d.leaderboard);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <p className="text-kt-text-tertiary">Loading leaderboard...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-kt-text-tertiary">No referrers yet.</p>
        <p className="text-kt-text-tertiary text-xs mt-1">Be the first to share your referral link and climb the ranks.</p>
      </div>
    );
  }

  const tierBadgeColors: Record<string, { bg: string; text: string }> = {
    genesis: { bg: '#FFD700', text: '#0e0b1a' },
    gold: { bg: '#FFD700', text: '#0e0b1a' },
    silver: { bg: '#b47cff', text: '#fff' },
    bronze: { bg: '#cd7f32', text: '#fff' },
    none: { bg: '#352c4a', text: '#a89bb5' },
  };

  return (
    <div className="card overflow-hidden">
      <div className="card-body p-0">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-4">Rank</th>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Referrals</th>
              <th className="text-left p-4">Tier</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const colors = tierBadgeColors[entry.tier] || tierBadgeColors.none;
              return (
                <tr key={entry.rank}>
                  <td className="p-4">
                    {entry.rank <= 3 ? (
                      <span className="text-lg">
                        {entry.rank === 1 ? '\u{1F947}' : entry.rank === 2 ? '\u{1F948}' : '\u{1F949}'}
                      </span>
                    ) : (
                      <span className="text-kt-text-tertiary">#{entry.rank}</span>
                    )}
                  </td>
                  <td className="p-4 font-medium">{entry.name}</td>
                  <td className="p-4 text-kt-gold font-bold">{entry.referral_count}</td>
                  <td className="p-4">
                    <span className="badge text-xs capitalize" style={{ background: colors.bg, color: colors.text }}>
                      {entry.tier}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
