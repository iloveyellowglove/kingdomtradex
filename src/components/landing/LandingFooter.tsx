import Link from 'next/link';

export default function LandingFooter() {
  return (
    <footer style={{ background: '#1E2329', borderTop: '1px solid #2B3139' }}>
      <div className="max-w-[1200px] mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Column 1 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F0B90B" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span className="text-sm font-bold text-kt-text-primary">KingdomTradex</span>
            </div>
            <p className="text-xs text-kt-text-secondary leading-relaxed mb-3">Faith-grounded crypto earning platform.</p>
            <div className="flex gap-3 text-kt-text-tertiary">
              <a href="#" className="hover:text-kt-gold transition" aria-label="Twitter">𝕏</a>
              <a href="#" className="hover:text-kt-gold transition" aria-label="Telegram">✈</a>
              <a href="#" className="hover:text-kt-gold transition" aria-label="Discord">◻</a>
            </div>
          </div>

          {/* Column 2: Platform */}
          <div>
            <h4 className="text-sm font-semibold text-kt-text-primary mb-3">Platform</h4>
            <div className="space-y-2">
              {[
                { h: '/dashboard', l: 'Dashboard' },
                { h: '/calculator', l: 'Calculator' },
                { h: '/#tiers', l: 'Tiers' },
                { h: '/leaderboard', l: 'Leaderboard' },
              ].map(l => <Link key={l.h} href={l.h} className="block text-xs text-kt-text-secondary hover:text-kt-text-primary no-underline transition">{l.l}</Link>)}
            </div>
          </div>

          {/* Column 3: Support */}
          <div>
            <h4 className="text-sm font-semibold text-kt-text-primary mb-3">Support</h4>
            <div className="space-y-2">
              {[
                { h: '/support', l: 'Help Center' },
                { h: '/support', l: 'Submit Ticket' },
                { h: '/faq', l: 'FAQ' },
                { h: 'mailto:support@kingdomtradex.com', l: 'Contact Us' },
              ].map(l => <a key={l.h} href={l.h} className="block text-xs text-kt-text-secondary hover:text-kt-text-primary no-underline transition">{l.l}</a>)}
            </div>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h4 className="text-sm font-semibold text-kt-text-primary mb-3">Legal</h4>
            <div className="space-y-2">
              {[
                { h: '/terms', l: 'Terms of Service' },
                { h: '/privacy', l: 'Privacy Policy' },
                { h: '/terms', l: 'Risk Disclosure' },
              ].map(l => <Link key={l.h} href={l.h} className="block text-xs text-kt-text-secondary hover:text-kt-text-primary no-underline transition">{l.l}</Link>)}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t text-center" style={{ borderColor: '#2B3139' }}>
          <p className="text-xs text-kt-text-tertiary mb-2">
            © 2026 KingdomTradex. All rights reserved.
          </p>
          <p className="text-[10px] text-kt-text-tertiary max-w-[700px] mx-auto leading-relaxed">
            Projected returns are estimates and not guaranteed. Past performance does not indicate future results.
            Cryptocurrency investments carry risk. This platform is not a registered securities exchange or investment advisor.
            Deposit values may fluctuate based on market conditions.
          </p>
        </div>
      </div>
    </footer>
  );
}
