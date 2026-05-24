import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import HeroSection from '@/components/landing/HeroSection';
import LiveMarkets from '@/components/landing/LiveMarkets';
import YieldCalculator from '@/components/landing/YieldCalculator';
import Testimonials from '@/components/landing/Testimonials';
import FaqAccordion from '@/components/landing/FaqAccordion';
import CrossDove from '@/components/brand/CrossDove';

export default async function LandingPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('kingdom_session')?.value;
  let user: { username: string; role: string } | null = null;

  const supabase = createServiceClient();

  if (token && token.length === 64) {
    const { data: sessions } = await supabase
      .from('sessions')
      .select('user_id, expires_at')
      .eq('session_token', token)
      .limit(1);

    if (sessions && sessions.length > 0 && new Date(sessions[0].expires_at) > new Date()) {
      const { data: users } = await supabase
        .from('users')
        .select('username,role')
        .eq('id', sessions[0].user_id)
        .eq('status', 'active')
        .limit(1);

      if (users && users.length > 0) user = users[0];
    }
  }

  const { count: waitlistCount } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true });

  return (
    <div>
      {/* Hero Section */}
      <HeroSection user={user} waitlistCount={waitlistCount ?? 0} />

      {/* Live Markets */}
      <LiveMarkets />

      {/* How It Works */}
      <section className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            <CrossDove size={24} /> How KingdomTrade Works
          </h2>
          <p className="text-text-muted">Three simple steps to start growing your assets</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Stake Your Assets', desc: 'Deposit USDT into your KingdomTrade wallet. Your assets begin earning immediately at the 1.5% daily rate. Minimum deposit is only $50 USDT.' },
            { step: '02', title: 'AI Multiplies Your Yield', desc: 'Our proprietary AI trading algorithms work 24/7 across multiple exchanges, executing profitable micro-trades to generate consistent daily returns on your staked balance.' },
            { step: '03', title: 'Build Your Covenant', desc: 'Refer disciples and earn blessings across 5 levels. As your network grows, so do your covenant rewards - from 15% on Level 1 to 1% on Level 5.' },
          ].map((item) => (
            <div key={item.step} className="card p-6 text-center group transition-all hover:border-temple-gold">
              <p className="text-4xl font-extrabold mb-3" style={{ color: '#FFD700', opacity: 0.15 }}>
                {item.step}
              </p>
              <h4 className="text-lg font-bold mb-2">{item.title}</h4>
              <p className="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Yield Calculator */}
      <YieldCalculator />

      {/* Security & Trust */}
      <section className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            <CrossDove size={24} /> Enterprise-Grade Security
          </h2>
          <p className="text-text-muted">Your assets are protected by institutional-level security measures</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '\u{1F512}', title: 'Cold Storage', desc: 'Majority of funds held in offline multi-sig wallets' },
            { icon: '\u{1F6E1}', title: '2FA Protection', desc: 'Two-factor authentication on all accounts and withdrawals' },
            { icon: '\u{1F310}', title: '24/7 Monitoring', desc: 'Real-time threat detection and automated response systems' },
            { icon: '\u{1F4DC}', title: 'Smart Contract Audit', desc: 'All trading contracts independently audited and verified' },
          ].map((item) => (
            <div key={item.title} className="card p-5 text-center">
              <p className="text-2xl mb-2">{item.icon}</p>
              <h5 className="font-bold text-sm mb-1">{item.title}</h5>
              <p className="text-text-muted text-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Referral Program Preview */}
      <section className="card p-8 mb-12 text-center" style={{
        borderImage: 'linear-gradient(135deg, #FFD700, #6A0DAD) 1',
        border: '1px solid transparent',
      }}>
        <h2 className="text-temple-gold text-2xl md:text-3xl font-bold mb-4">
          <CrossDove size={24} /> The Covenant Economy
        </h2>
        <p className="text-text-secondary max-w-3xl mx-auto mb-8">
          KingdomTrade operates on biblical principles of stewardship and multiplication. When you deposit and trade,
          you are not just growing your own resources - you are participating in a covenant economy that blesses
          those who brought you here. Your disciples bring disciples, and the blessings flow through five generations.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-3xl mx-auto mb-6">
          {[
            { level: 1, pct: 15, name: 'Firstfruits' },
            { level: 2, pct: 5, name: 'Fruit that Remains' },
            { level: 3, pct: 3, name: 'Thirtyfold Return' },
            { level: 4, pct: 2, name: 'Sixtyfold' },
            { level: 5, pct: 1, name: 'Hundredfold' },
          ].map((l) => (
            <div key={l.level} className="card p-4">
              <p className="text-temple-gold font-bold text-lg">{l.pct}%</p>
              <p className="text-text-secondary text-sm">Level {l.level}</p>
              <p className="text-text-muted text-xs">{l.name}</p>
            </div>
          ))}
        </div>
        <div className="text-text-muted text-xs">
          Total possible blessing: up to 26% across 5 levels
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* FAQ */}
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
