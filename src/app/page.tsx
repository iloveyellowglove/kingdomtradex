import LandingNavbar from '@/components/landing/LandingNavbar';
import HeroSection from '@/components/landing/HeroSection';
import SignupCreditBanner from '@/components/landing/SignupCreditBanner';
import dynamic from 'next/dynamic';

const HowItWorks = dynamic(() => import('@/components/landing/HowItWorks'));
const TierComparison = dynamic(() => import('@/components/landing/TierComparison'));
const EarningsSection = dynamic(() => import('@/components/landing/EarningsSection'));
const ReferralHighlight = dynamic(() => import('@/components/landing/ReferralHighlight'));
const PwaInstallSection = dynamic(() => import('@/components/landing/PwaInstallSection'));
const FaqAccordion = dynamic(() => import('@/components/landing/FaqAccordion'));
const Testimonials = dynamic(() => import('@/components/landing/Testimonials'));
const LandingFooter = dynamic(() => import('@/components/landing/LandingFooter'));
const StickyBottomCTA = dynamic(() => import('@/components/landing/StickyBottomCTA'));

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
