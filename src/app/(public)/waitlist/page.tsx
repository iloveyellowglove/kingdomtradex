import { getWaitlistStats } from '@/lib/db/waitlist';
import WaitlistSignupForm from '@/components/waitlist/WaitlistSignupForm';
import DashboardMockup from '@/components/waitlist/DashboardMockup';
import CountdownTimer from '@/components/waitlist/CountdownTimer';
import CrossDove from '@/components/brand/CrossDove';
import Logo from '@/components/brand/Logo';

const VIP_LIMIT = 5000;

export default async function WaitlistPage() {
  let totalCount = 0;
  try {
    const stats = await getWaitlistStats();
    totalCount = stats.totalCount;
  } catch {
    // use fallback 0
  }

  const spotsLeft = Math.max(0, VIP_LIMIT - totalCount);

  return (
    <div className="py-8">
      {/* Scarcity banner */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full"
          style={{
            background: 'rgba(255,82,82,0.08)',
            border: '1px solid rgba(255,82,82,0.2)',
          }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#ff5252' }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#ff5252' }} />
          </span>
          <span className="text-sm font-semibold" style={{ color: '#ff5252' }}>
            Only {spotsLeft.toLocaleString()} VIP spots remaining
          </span>
        </div>
      </div>

      {/* Hero */}
      <section className="text-center mb-12">
        <Logo size="lg" showText={false} className="mb-4" />
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight" style={{
          background: 'linear-gradient(135deg, #FFD700 0%, #FFE44D 30%, #FFC107 60%, #FFD700 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Get Early Access to KingdomTradex
        </h1>
        <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-4">
          A New Way to Fund Your Ministry
        </p>
        <p className="text-text-muted max-w-2xl mx-auto">
          The first blockchain stewardship platform helping churches unlock 1.5% daily yield for their mission. AI-powered trading that funds the Great Commission.
        </p>
      </section>

      {/* Dashboard mockup + signup form */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div>
          <DashboardMockup />
        </div>
        <div>
          <WaitlistSignupForm />
        </div>
      </section>

      {/* Live counter */}
      <section className="text-center mb-12">
        <div className="card p-6 inline-block min-w-[200px]">
          <p className="text-text-muted text-sm mb-1">Total Waitlist Signups</p>
          <p className="text-temple-gold text-4xl font-extrabold">{totalCount.toLocaleString()}</p>
          <p className="text-text-muted text-xs mt-1">and growing</p>
        </div>
      </section>

      {/* Tier milestones */}
      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
          <CrossDove size={24} /> Referral Rewards
        </h2>
        <p className="text-text-muted text-center mb-8">The more you share, the more you earn when we launch</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { count: 5, tier: 'Bronze Steward', badge: '\u{1F949}', desc: 'Early access badge' },
            { count: 15, tier: 'Silver Steward', badge: '\u{1F948}', desc: 'Guaranteed early access for 5 friends' },
            { count: 30, tier: 'Gold Steward', badge: '\u{1F947}', desc: 'Genesis NFT + 0.25% lifetime yield boost' },
            { count: -1, tier: 'Genesis Steward', badge: '\u{1F451}', desc: 'Top 10: One-on-one strategy session' },
          ].map((milestone) => (
            <div key={milestone.tier} className="card p-5 text-center transition-all hover:border-temple-gold">
              <p className="text-3xl mb-2">{milestone.badge}</p>
              <h5 className="font-bold text-sm mb-1">{milestone.tier}</h5>
              <p className="text-temple-gold font-extrabold text-xl mb-1">
                {milestone.count === -1 ? 'Top 10' : `${milestone.count} referrals`}
              </p>
              <p className="text-text-muted text-xs">{milestone.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Countdown */}
      <section className="mb-12">
        <CountdownTimer />
      </section>

      <div className="text-center">
        <a href="/waitlist/leaderboard" className="text-temple-gold hover:underline text-sm">
          View Leaderboard
        </a>
      </div>
    </div>
  );
}
