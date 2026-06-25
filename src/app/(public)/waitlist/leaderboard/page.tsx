import { getWaitlistStats } from '@/lib/db/waitlist';
import LeaderboardTable from '@/components/waitlist/LeaderboardTable';
import CountdownTimer from '@/components/waitlist/CountdownTimer';
import CrossDove from '@/components/brand/CrossDove';
import Logo from '@/components/brand/Logo';

export default async function LeaderboardPage() {
  let totalCount = 0;
  try {
    const stats = await getWaitlistStats();
    totalCount = stats.totalCount;
  } catch {
    // use fallback 0
  }

  return (
    <div className="py-8 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <Logo size="md" className="mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          <CrossDove size={24} /> Waitlist Leaderboard
        </h1>
        <p className="text-kt-text-tertiary">Top referrers earning early access rewards</p>
      </div>

      {/* Stats */}
      <div className="text-center mb-8">
        <div className="card p-6 inline-block min-w-[200px]">
          <p className="text-kt-text-tertiary text-sm mb-1">Total Waitlist Members</p>
          <p className="text-kt-gold text-4xl font-extrabold">{totalCount.toLocaleString()}</p>
        </div>
      </div>

      {/* Countdown */}
      <div className="mb-8">
        <CountdownTimer />
      </div>

      {/* Leaderboard */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4 text-center">Top 100 Referrers</h3>
        <LeaderboardTable />
      </div>

      {/* CTA */}
      <div className="text-center">
        <a href="/waitlist" className="btn-primary inline-block px-8 py-4 rounded-xl text-lg font-bold">
          Join the Waitlist
        </a>
      </div>
    </div>
  );
}
