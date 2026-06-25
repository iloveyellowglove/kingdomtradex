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
import LandingFooter from '@/components/landing/LandingFooter';
import StickyBottomCTA from '@/components/landing/StickyBottomCTA';

export default function LandingPage() {
  return (
    <div style={{ background: '#0B0E11', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FinancialService',
          name: 'KingdomTradex',
          description: 'Faith-grounded crypto earnings platform with AI-powered trading',
          url: 'https://kingdomtradex.vercel.app',
          logo: 'https://kingdomtradex.vercel.app/og-image.png',
          sameAs: ['https://twitter.com/kingdomtradex', 'https://t.me/kingdomtradex'],
        }),
      }} />
      <LandingNavbar />
      <HeroSection />
      <SignupCreditBanner />
      <HowItWorks />
      <TierComparison />
      <EarningsSection />
      <ReferralHighlight />
      <PwaInstallSection />
      <FaqAccordion />
      <Testimonials />
      <LandingFooter />
      <StickyBottomCTA />
    </div>
  );
}
