import { createServiceClient } from '@/lib/supabase/service';
import HeroSection from '@/components/landing/HeroSection';
import CountdownTimer from '@/components/waitlist/CountdownTimer';
import EarningsPreview from '@/components/landing/EarningsPreview';
import PastorProgram from '@/components/landing/PastorProgram';
import SupportedCurrencies from '@/components/landing/SupportedCurrencies';
import ReferralProgram from '@/components/landing/ReferralProgram';
import TierComparison from '@/components/landing/TierComparison';
import Testimonials from '@/components/landing/Testimonials';
import FaqAccordion from '@/components/landing/FaqAccordion';

export default async function LandingPage() {
  const supabase = createServiceClient();

  const { count: waitlistCount } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true });

  return (
    <div>
      {/* Section 1: Hero with inline signup form */}
      <HeroSection waitlistCount={waitlistCount ?? 0} />

      {/* Countdown timer */}
      <CountdownTimer />

      {/* Section 2: How It Works */}
      <section className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">How Your Free Credits Work</h2>
          <p className="text-text-muted">Three simple steps to start earning</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              icon: '\u{1F381}',
              title: 'Sign Up & Get Free Credits',
              desc: 'Choose Member ($50) or Pastor ($100). Credits added to your account instantly.',
            },
            {
              step: '02',
              icon: '\u{1F916}',
              title: 'AI Trades For You',
              desc: 'Our AI engine trades crypto 24/7 across multiple markets. You earn daily returns without lifting a finger.',
            },
            {
              step: '03',
              icon: '\u{1F4C8}',
              title: 'Watch Your Earnings Grow',
              desc: 'Log in anytime to see your balance growing. Invite friends to earn even more.',
            },
          ].map((item, i) => (
            <div
              key={item.step}
              className={`card step-card p-6 text-center animate-fade-in-up-${i + 1}`}
            >
              <p className="text-3xl mb-3">{item.icon}</p>
              <h4 className="text-lg font-bold mb-2">{item.title}</h4>
              <p className="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <a href="#signup" className="btn-primary inline-block px-8 py-3 rounded-xl font-bold no-underline cta-btn-glow">
            Get Your Free Credits Now
          </a>
        </div>

        {/* Section divider */}
        <div className="mx-auto mt-12 max-w-lg" style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.15), transparent)' }} />
      </section>

      {/* Section 3: Earnings Preview Timeline */}
      <EarningsPreview />

      {/* Section 4: Pastor Program */}
      <PastorProgram />

      {/* Section 5: Supported Currencies */}
      <SupportedCurrencies />

      {/* Section 6: Referral Program */}
      <ReferralProgram />

      {/* Tier Comparison */}
      <TierComparison />

      {/* Section 7: Testimonials */}
      <Testimonials />

      {/* Section 8: FAQ */}
      <FaqAccordion />

      {/* Psalm */}
      <div className="text-center mb-8">
        <p className="text-text-secondary italic">
          &quot;The earth is the LORD&apos;s, and the fullness thereof; the world, and they that dwell therein.&quot;
        </p>
        <p className="text-temple-gold font-bold mt-1">Psalm 24:1</p>
      </div>
    </div>
  );
}
