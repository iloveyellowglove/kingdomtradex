import { getWaitlistEntryByReferralCode } from '@/lib/db/waitlist';
import { getWaitlistStats } from '@/lib/db/waitlist';
import WaitlistSignupForm from '@/components/waitlist/WaitlistSignupForm';
import DashboardMockup from '@/components/waitlist/DashboardMockup';
import Logo from '@/components/brand/Logo';

const VIP_LIMIT = 5000;

export default async function WaitlistReferralPage({
  params,
}: {
  params: { referralCode: string };
}) {
  const { referralCode } = params;

  let referrerName: string | null = null;
  let totalCount = 0;

  try {
    const [entry, stats] = await Promise.all([
      getWaitlistEntryByReferralCode(referralCode),
      getWaitlistStats(),
    ]);
    if (entry) {
      referrerName = entry.name || 'Anonymous';
    }
    totalCount = stats.totalCount;
  } catch {
    // use fallbacks
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
        {referrerName && (
          <p className="text-temple-gold font-semibold text-lg mb-2">
            {referrerName} invited you to join KingdomTradex
          </p>
        )}
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
          The first blockchain stewardship platform helping churches unlock 1.5% daily yield for their mission.
        </p>
      </section>

      {/* Dashboard mockup + signup form */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div>
          <DashboardMockup />
        </div>
        <div>
          <WaitlistSignupForm referredByName={referrerName ?? undefined} />
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
    </div>
  );
}
