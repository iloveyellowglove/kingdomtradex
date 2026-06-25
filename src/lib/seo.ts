// Shared SEO metadata config

export const siteConfig = {
  name: 'KingdomTradex',
  tagline: 'Faith-Grounded Crypto Earnings',
  url: 'https://kingdomtradex.vercel.app',
  ogImage: 'https://kingdomtradex.vercel.app/og-image.png',
  twitter: '@kingdomtradex',
  locale: 'en_US',
  description: 'Earn projected daily returns on your crypto deposits with our AI-powered trading engine. Trusted by faith communities worldwide. Start with $50 free credits.',
  keywords: 'crypto earnings, daily returns, AI trading, faith community investing, crypto deposit, passive income crypto, automated trading',
};

export const defaultMetadata = {
  title: {
    default: siteConfig.name + ' - ' + siteConfig.tagline,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    url: siteConfig.url,
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    site: siteConfig.twitter,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const appNoIndex = {
  robots: { index: false, follow: false },
};

export const publicIndex = {
  robots: { index: true, follow: true },
};
