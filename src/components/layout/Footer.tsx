import Logo from '@/components/brand/Logo';

export default function Footer() {
  return (
    <footer
      style={{
        background: '#12101f',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 py-12">
        {/* 3-column layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 mb-10">
          {/* LEFT: Brand */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Logo size="sm" />
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
              AI-powered crypto trading for everyone.
            </p>
          </div>

          {/* MIDDLE: Quick Links */}
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Quick Links
            </h5>
            <div className="space-y-2">
              {[
                { label: 'Home', href: '/' },
                { label: 'About', href: '/about' },
                { label: 'Covenant', href: '/covenant' },
                { label: 'Leaderboard', href: '/waitlist/leaderboard' },
                { label: 'Terms', href: '#' },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block text-sm no-underline transition-colors"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* RIGHT: Launch Info */}
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Launch Info
            </h5>
            <div className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <p className="mb-0">Launch Date: June 7, 2026</p>
              <p className="mb-0">
                Contact:{' '}
                <a href="mailto:support@kingdomtradex.com" className="no-underline" style={{ color: '#FFD700' }}>
                  support@kingdomtradex.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div
          className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}
        >
          <span>&copy; {new Date().getFullYear()} KingdomTrade Exchange. All rights reserved.</span>
          <span className="italic" style={{ color: '#FFD700' }}>
            &quot;The earth is the LORD&apos;s, and the fullness thereof. &quot; &mdash; Psalm 24:1
          </span>
        </div>
      </div>
    </footer>
  );
}
