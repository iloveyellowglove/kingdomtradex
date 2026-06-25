import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: '/app/' },
    ],
    sitemap: 'https://kingdomtradex.vercel.app/sitemap.xml',
  };
}
