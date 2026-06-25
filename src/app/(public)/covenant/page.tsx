'use client';

import { useEffect, useRef, useState } from 'react';

const articles = [
  {
    numeral: 'I',
    title: 'Stewardship',
    icon: '\u{1F331}',
    body: 'We acknowledge that all resources ultimately belong to God. We are stewards, not owners. Every deposit is a seed sown into the Kingdom, and every withdrawal is a harvest reaped in due season.',
  },
  {
    numeral: 'II',
    title: 'Multiplication',
    icon: '\u{1F33F}',
    body: 'The covenant economy operates on the principle of multiplication. As you are blessed, you become a channel of blessing to others. Your disciples are your spiritual investments, and their growth is your harvest.',
  },
  {
    numeral: 'III',
    title: 'Five-Generation Blessing',
    icon: '\u{1F333}',
    body: 'Blessings flow through five levels:',
    levels: [
      { name: 'Firstfruits', pct: 15 },
      { name: 'Fruit that Remains', pct: 5 },
      { name: 'Thirtyfold Return', pct: 3 },
      { name: 'Sixtyfold', pct: 2 },
      { name: 'Hundredfold', pct: 1 },
    ],
    footer: 'This structure ensures that those who build the Kingdom are proportionally rewarded.',
  },
  {
    numeral: 'IV',
    title: 'Security and Patience',
    icon: '\u{1F6E1}',
    body: 'A security hold from your first deposit ensures the integrity of the covenant. This period of patience reflects the biblical principle that harvest comes in due season.',
  },
  {
    numeral: 'V',
    title: 'Community',
    icon: '\u{26EA}',
    body: 'KingdomTradex is not merely a platform. It is an ekklesia, a called-out assembly of stewards. We trade together, grow together, and bless the nations together.',
  },
];

function FadeIn({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
      }}
    >
      {children}
    </div>
  );
}

export default function CovenantPage() {
  return (
    <div className="-mx-6">
      {/* SECTION 1: HERO */}
      <section
        className="relative text-center py-20 md:py-28 px-6"
        style={{
          background: 'linear-gradient(180deg, #0e0b1a 0%, #120d24 40%, #1a0a2e 70%, #0e0b1a 100%)',
        }}
      >
        <h1
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-4 tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFE44D 30%, #FFC107 60%, #FFD700 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          The Covenant
        </h1>
        <p className="text-kt-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
          A new financial covenant built on biblical principles of stewardship, multiplication, and community.
        </p>
        <div className="mx-auto" style={{ width: 80, height: 2, background: 'linear-gradient(90deg, transparent, #FFD700, transparent)' }} />
      </section>

      {/* SECTION 2: THE FIVE ARTICLES */}
      {articles.map((article, i) => {
        const isOdd = i % 2 === 0;

        return (
          <FadeIn key={article.numeral}>
            <section
              className="relative py-16 md:py-20 px-6 md:px-12"
              style={{
                background: isOdd ? 'rgba(255,255,255,0.01)' : 'transparent',
              }}
            >
              <div className={`max-w-4xl mx-auto flex flex-col ${isOdd ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 md:gap-16 items-start`}>
                {/* Numeral / Icon column */}
                <div className={`flex-shrink-0 flex flex-col items-center ${isOdd ? 'md:items-start' : 'md:items-end'} text-center`}>
                  <span
                    className="text-6xl md:text-8xl font-extrabold block mb-3"
                    style={{
                      background: 'linear-gradient(180deg, #FFD700 0%, rgba(255,215,0,0.3) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      lineHeight: 1,
                    }}
                  >
                    {article.numeral}
                  </span>
                  <span className="text-3xl">{article.icon}</span>
                </div>

                {/* Content column */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: '#FFD700' }}>
                    {article.title}
                  </h2>
                  <p className="text-kt-text-secondary leading-relaxed text-base md:text-lg mb-4">
                    {article.body}
                  </p>

                  {/* Level visualization for Article III */}
                  {article.levels && (
                    <div className="space-y-3 mt-6">
                      {article.levels.map((level, j) => (
                        <div
                          key={level.name}
                          className="flex items-center gap-4 rounded-xl p-4"
                          style={{
                            background: j === 0 ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.02)',
                            border: j === 0 ? '1px solid rgba(255,215,0,0.2)' : '1px solid rgba(255,255,255,0.04)',
                          }}
                        >
                          <span
                            className="flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
                            style={{
                              width: 32, height: 32,
                              background: j === 0 ? '#FFD700' : 'rgba(255,255,255,0.08)',
                              color: j === 0 ? '#0e0b1a' : 'rgba(255,255,255,0.5)',
                            }}
                          >
                            {j + 1}
                          </span>
                          <span className="flex-1 text-kt-text-primary font-medium text-sm">{level.name}</span>
                          <span
                            className="text-xl font-extrabold"
                            style={{ color: j === 0 ? '#FFD700' : 'rgba(255,255,255,0.3)' }}
                          >
                            {level.pct}%
                          </span>
                        </div>
                      ))}
                      {article.footer && (
                        <p className="text-kt-text-tertiary text-sm mt-3">{article.footer}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Separator between articles */}
              {i < articles.length - 1 && (
                <div
                  className="mx-auto mt-16 md:mt-20 max-w-lg"
                  style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}
                />
              )}
            </section>
          </FadeIn>
        );
      })}

      {/* SECTION 3: SCRIPTURE */}
      <section
        className="relative text-center py-20 md:py-28 px-6"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.06) 0%, transparent 60%), linear-gradient(180deg, #0e0b1a 0%, #120d24 50%, #0e0b1a 100%)',
        }}
      >
        <FadeIn>
          <div className="max-w-3xl mx-auto">
            <p
              className="text-2xl md:text-3xl lg:text-4xl italic leading-relaxed mb-6"
              style={{
                color: '#FFD700',
                textShadow: '0 0 80px rgba(255,215,0,0.2)',
              }}
            >
              &quot;But thou shalt remember the LORD thy God: for it is he that giveth thee power to get wealth, that he may establish his covenant.&quot;
            </p>
            <p className="text-kt-gold font-bold text-lg tracking-wide">Deuteronomy 8:18</p>
          </div>
        </FadeIn>
      </section>

      {/* SECTION 4: CTA */}
      <section className="text-center py-16 md:py-24 px-6">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Enter the Covenant</h2>
          <p className="text-kt-text-tertiary text-lg mb-8">Join the waitlist and claim your free credits today.</p>
          <a
            href="/#signup"
            className="inline-block px-10 py-4 rounded-xl text-lg font-bold transition-all no-underline"
            style={{
              background: 'linear-gradient(135deg, #FFD700, #c9a800)',
              color: '#0e0b1a',
              boxShadow: '0 4px 32px rgba(255,215,0,0.3)',
            }}
          >
            Claim My Free $50
          </a>
          <p className="text-kt-text-tertiary text-sm mt-4">Pastors receive $100 free</p>
        </FadeIn>
      </section>
    </div>
  );
}
