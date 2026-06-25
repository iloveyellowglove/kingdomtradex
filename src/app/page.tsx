import { createServiceClient } from '@/lib/supabase/service';
import LandingNavbar from '@/components/landing/LandingNavbar';
import HeroSection from '@/components/landing/HeroSection';
import SignupCreditBanner from '@/components/landing/SignupCreditBanner';
import HowItWorks from '@/components/landing/HowItWorks';
import TierComparison from '@/components/landing/TierComparison';
import EarningsSection from '@/components/landing/EarningsSection';
import ReferralHighlight from '@/components/landing/ReferralHighlight';
import PwaInstallSection from '@/components/landing/PwaInstallSection';
import FaqAccordion from '@/components/landing/FaqAccordion';
import Testimonials from '@/components/landing/Testimonials';
import PlatformStats from '@/components/landing/PlatformStats';
import LandingFooter from '@/components/landing/LandingFooter';
import StickyBottomCTA from '@/components/landing/StickyBottomCTA';

export default async function LandingPage() {
  const supabase = createServiceClient();

  // Check if real data exists for platform stats
  const { count: userCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
  const hasRealData = (userCount ?? 0) > 0;

  return (
    <div style={{ background: '#0B0E11', minHeight: '100vh' }}>
      <LandingNavbar />

      {/* Hero */}
      <HeroSection />

      {/* Signup Credit Banner */}
      <SignupCreditBanner />

      {/* Main content + sidebar layout */}
      <div className="flex gap-0">
        <div className="flex-1 min-w-0">
          <HowItWorks />
          <TierComparison />
          <EarningsSection />
          <ReferralHighlight />

          {hasRealData && <PlatformStats />}

          <PwaInstallSection />
          <FaqAccordion />
          <Testimonials />
        </div>
      </div>

      <LandingFooter />
      <StickyBottomCTA />
    </div>
  );
}
