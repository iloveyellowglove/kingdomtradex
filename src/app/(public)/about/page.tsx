export default function AboutPage() {
  return (
    <div className="-mx-6">
      {/* SECTION 1: HERO */}
      <section
        className="relative text-center py-20 md:py-28 px-6"
        style={{
          background: 'linear-gradient(180deg, #0e0b1a 0%, #120d24 40%, #1a1040 70%, #0e0b1a 100%)',
        }}
      >
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFE44D 30%, #FFC107 60%, #FFD700 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          About KingdomTradex
        </h1>
        <p className="text-kt-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-8">
          Building the future of faith-driven crypto trading
        </p>
        <div className="mx-auto" style={{ width: 80, height: 2, background: 'linear-gradient(90deg, transparent, #FFD700, transparent)' }} />
      </section>

      {/* SECTION 2: OUR MISSION */}
      <section className="py-16 md:py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 md:gap-16 items-center">
          <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 120, height: 120 }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.8}>
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
              <line x1="12" y1="2" x2="12" y2="4" />
              <line x1="12" y1="20" x2="12" y2="22" />
              <line x1="2" y1="12" x2="4" y2="12" />
              <line x1="20" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
              <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
              <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
              <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: '#FFD700' }}>Our Mission</h2>
            <p className="text-kt-text-secondary leading-relaxed text-base md:text-lg">
              KingdomTradex is an AI-powered cryptocurrency trading platform built on biblical principles of stewardship and multiplication. We combine advanced trading algorithms with a covenant economy that rewards community growth. Our mission is to make crypto trading accessible to everyone, regardless of experience, while building a community rooted in trust and shared prosperity.
            </p>
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="mx-auto max-w-lg" style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.15), transparent)' }} />

      {/* SECTION 3: HOW IT WORKS */}
      <section className="py-16 md:py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">How KingdomTradex Works</h2>
          <p className="text-kt-text-tertiary text-center mb-12">A simple, automated path to earning crypto daily</p>

          <div className="relative">
            {/* Dotted line connecting steps (desktop only) */}
            <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%]" style={{ height: 2, borderTop: '2px dashed rgba(255,215,0,0.15)' }} />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  step: '1',
                  title: 'Deposit',
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  ),
                  desc: 'Fund your account with any of 21+ supported cryptocurrencies. Minimum $100 for members, $200 for pastors.',
                },
                {
                  step: '2',
                  title: 'AI Trades',
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                      <rect x="9" y="9" width="6" height="6" />
                      <line x1="9" y1="2" x2="9" y2="4" />
                      <line x1="15" y1="2" x2="15" y2="4" />
                      <line x1="9" y1="20" x2="9" y2="22" />
                      <line x1="15" y1="20" x2="15" y2="22" />
                    </svg>
                  ),
                  desc: 'Our AI algorithms trade crypto markets 24/7 on your behalf, executing profitable strategies across multiple pairs.',
                },
                {
                  step: '3',
                  title: 'Earn Daily',
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                      <polyline points="16 7 22 7 22 13" />
                    </svg>
                  ),
                  desc: 'Receive daily returns from AI trading activity. Watch your balance grow in real time on your dashboard.',
                },
                {
                  step: '4',
                  title: 'Withdraw',
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <polyline points="19 12 12 19 5 12" />
                    </svg>
                  ),
                  desc: 'Withdraw your earnings to any wallet address in your chosen cryptocurrency. Processed within 24-48 hours.',
                },
              ].map((item) => (
                <div key={item.step} className="relative flex flex-col items-center text-center">
                  {/* Step circle */}
                  <div
                    className="flex items-center justify-center rounded-full mb-4 relative z-10"
                    style={{
                      width: 56,
                      height: 56,
                      background: '#0e0b1a',
                      border: '2px solid rgba(255,215,0,0.4)',
                    }}
                  >
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-kt-text-tertiary text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <a href="/#signup" className="btn-primary inline-block px-8 py-3 rounded-xl font-bold no-underline cta-btn-glow">
              Get Started Now
            </a>
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="mx-auto max-w-lg" style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.15), transparent)' }} />

      {/* SECTION 4: THE COVENANT ECONOMY */}
      <section className="py-16 md:py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">The Covenant Economy</h2>
          <p className="text-kt-text-secondary text-center leading-relaxed mb-10 max-w-2xl mx-auto">
            Our referral system is built on the biblical principle that those who sow into the Kingdom will reap a harvest. When you introduce others to the platform, you participate in their growth through five generations of blessings.
          </p>

          <div className="space-y-3">
            {[
              { level: 1, name: 'Firstfruits', pct: 15 },
              { level: 2, name: 'Fruit that Remains', pct: 5 },
              { level: 3, name: 'Thirtyfold Return', pct: 3 },
              { level: 4, name: 'Sixtyfold', pct: 2 },
              { level: 5, name: 'Hundredfold', pct: 1 },
            ].map((item) => {
              const goldAlpha = Math.max(0.02, 0.08 - (item.level - 1) * 0.015);
              return (
                <div
                  key={item.level}
                  className="flex items-center gap-4 p-5 rounded-xl"
                  style={{
                    marginLeft: `${(item.level - 1) * 24}px`,
                    background: `rgba(255,215,0,${goldAlpha})`,
                    border: item.level === 1 ? '1px solid rgba(255,215,0,0.25)' : '1px solid rgba(255,255,255,0.05)',
                    maxWidth: `calc(100% - ${(item.level - 1) * 24}px)`,
                  }}
                >
                  <span
                    className="flex items-center justify-center rounded-full text-sm font-bold flex-shrink-0"
                    style={{
                      width: 40, height: 40,
                      background: item.level === 1 ? '#FFD700' : 'rgba(255,255,255,0.08)',
                      color: item.level === 1 ? '#0e0b1a' : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    {item.level}
                  </span>
                  <span className="flex-1 text-kt-text-primary font-medium">{item.name}</span>
                  <span
                    className="text-xl font-extrabold"
                    style={{
                      color: item.level === 1 ? '#FFD700' : 'rgba(255,215,0,0.4)',
                    }}
                  >
                    {item.pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="mx-auto max-w-lg" style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.15), transparent)' }} />

      {/* SECTION 5: LEADERSHIP */}
      <section className="py-16 md:py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center">Leadership</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: James E. Ricker */}
            <div
              className="p-8 rounded-2xl text-center"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{
                  width: 80,
                  height: 80,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <span className="text-kt-text-primary text-xl font-bold">JR</span>
              </div>
              <h3 className="text-xl font-bold mb-1">James E. Ricker</h3>
              <p className="text-kt-gold text-sm font-medium mb-3">Founder & Managing Member</p>
              <p className="text-kt-text-tertiary text-sm leading-relaxed">
                Entrepreneur and registered agent for Kingdom Trade Solutions LLC. Based in Sanford, Maine.
              </p>
            </div>

            {/* Card 2: Team */}
            <div
              className="p-8 rounded-2xl text-center"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{
                  width: 80,
                  height: 80,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <span className="text-kt-text-primary text-xl font-bold">KT</span>
              </div>
              <h3 className="text-xl font-bold mb-1">KingdomTradex Team</h3>
              <p className="text-kt-gold text-sm font-medium mb-3">Development & Operations</p>
              <p className="text-kt-text-tertiary text-sm leading-relaxed">
                Our distributed team of developers, traders, and community builders works around the clock to deliver consistent results for our members.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="mx-auto max-w-lg" style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.15), transparent)' }} />

      {/* SECTION 6: COMPANY DETAILS */}
      <section className="py-16 md:py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center">Company Information</h2>

          <div
            className="p-8 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
              {[
                { label: 'Legal Name', value: 'Kingdom Trade Solutions LLC' },
                { label: 'Filing Type', value: 'Limited Liability Company' },
                {
                  label: 'Status',
                  value: (
                    <span className="inline-flex items-center gap-2">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                      Good Standing
                    </span>
                  ),
                },
                { label: 'Charter Number', value: '202513471DC' },
                { label: 'Jurisdiction', value: 'State of Maine' },
                { label: 'Filing Date', value: 'April 22, 2025' },
                { label: 'Registered Agent', value: 'James E. Ricker' },
                { label: 'Office', value: 'Sanford, Maine' },
              ].map((row) => (
                <div key={row.label} className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {row.label}
                  </span>
                  <span className="text-kt-text-primary font-medium">{row.value}</span>
                </div>
              ))}
            </div>

            <p className="text-kt-text-tertiary text-xs mt-8 leading-relaxed">
              Kingdom Trade Solutions LLC is a registered limited liability company in the State of Maine. Company records are publicly verifiable through the Maine Secretary of State.
            </p>
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="mx-auto max-w-lg" style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.15), transparent)' }} />

      {/* SECTION 7: CONTACT */}
      <section className="py-16 md:py-20 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Get in Touch</h2>

          <div
            className="p-8 rounded-2xl mb-8 text-left"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-kt-text-tertiary text-sm" style={{ width: 120 }}>Email</span>
                <a href="mailto:support@kingdomtradex.com" className="no-underline font-medium" style={{ color: '#FFD700' }}>
                  support@kingdomtradex.com
                </a>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-kt-text-tertiary text-sm" style={{ width: 120 }}>Location</span>
                <span className="text-kt-text-primary">Sanford, Maine, USA</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-kt-text-tertiary text-sm" style={{ width: 120 }}>Response Time</span>
                <span className="text-kt-text-primary">We typically respond within 24 hours</span>
              </div>
            </div>
          </div>

          <a
            href="/#signup"
            className="btn-primary inline-block px-10 py-4 rounded-xl text-lg font-bold no-underline cta-btn-glow"
          >
            Join the Waitlist
          </a>
        </div>
      </section>

      {/* SECTION 8: SCRIPTURE FOOTER */}
      <section
        className="text-center py-16 md:py-24 px-6"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.06) 0%, transparent 60%), linear-gradient(180deg, #0e0b1a 0%, #120d24 50%, #0e0b1a 100%)',
        }}
      >
        <div className="max-w-3xl mx-auto">
          <p
            className="text-2xl md:text-3xl italic leading-relaxed mb-6"
            style={{ color: '#FFD700' }}
          >
            &quot;But thou shalt remember the LORD thy God: for it is he that giveth thee power to get wealth, that he may establish his covenant.&quot;
          </p>
          <p className="text-kt-gold font-bold text-lg tracking-wide">Deuteronomy 8:18</p>
        </div>
      </section>
    </div>
  );
}
