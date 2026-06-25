import { createServiceClient } from '@/lib/supabase/service';
import HeroSection from '@/components/landing/HeroSection';
import EarningsPreview from '@/components/landing/EarningsPreview';
import PastorProgram from '@/components/landing/PastorProgram';
import SupportedCurrencies from '@/components/landing/SupportedCurrencies';
import ReferralProgram from '@/components/landing/ReferralProgram';
import TierComparison from '@/components/landing/TierComparison';
import Testimonials from '@/components/landing/Testimonials';
import FaqAccordion from '@/components/landing/FaqAccordion';
import PlatformStats from '@/components/landing/PlatformStats';
import StickyBottomCTA from '@/components/landing/StickyBottomCTA';

export default async function LandingPage() {
  const supabase = createServiceClient();

  const { count: waitlistCount } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="flex gap-8">
      {/* Main content column */}
      <div className="flex-1 min-w-0">
        {/* Hero with inline signup */}
        <HeroSection waitlistCount={waitlistCount ?? 0} />

        {/* How It Works */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">How It Works</h2>
            <p className="text-white/40">Three simple steps to start earning daily</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: '01', title: 'Sign Up', desc: 'Create your account and claim $50 or $100 in free trading credits instantly.' },
              { step: '02', title: 'Deposit & Lock', desc: 'Choose a tier (6/9/12/18 months). Longer locks earn higher daily rates.' },
              { step: '03', title: 'Earn Daily', desc: 'Earnings are credited to your account every day. Withdraw or compound.' },
            ].map((item, i) => (
              <div key={item.step} className="p-6 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold" style={{ background: 'rgba(255,215,0,0.1)', color: '#FFD700' }}>{item.step}</div>
                <h4 className="font-bold mb-1">{item.title}</h4>
                <p className="text-sm text-white/40">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tier Comparison */}
        <section className="mb-12" id="tiers">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Lock Tiers &amp; Rates</h2>
            <p className="text-white/40">Projected returns based on current daily rates</p>
          </div>
          <TierComparison />
        </section>

        {/* Earnings Calculator Preview */}
        <EarningsPreview />

        {/* Referral Program */}
        <ReferralProgram />

        {/* Testimonials */}
        <Testimonials />

        {/* Pastor Program */}
        <PastorProgram />

        {/* Supported Currencies */}
        <SupportedCurrencies />

        {/* FAQ */}
        <FaqAccordion />

        {/* Psalm */}
        <div className="text-center mb-8 pb-16 lg:pb-8">
          <p className="text-white/30 italic">
            &quot;The earth is the LORD&apos;s, and the fullness thereof; the world, and they that dwell therein.&quot;
          </p>
          <p className="text-[#FFD700] font-bold text-sm mt-1">Psalm 24:1</p>
        </div>
      </div>

      {/* Right sidebar (desktop only) */}
      <aside className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-4 space-y-4">
          <PlatformStats />
        </div>
      </aside>

      {/* Mobile sticky CTA */}
      <StickyBottomCTA />
    </div>
  );
}
