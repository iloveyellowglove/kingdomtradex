'use client';

import { useRef, useEffect, useState } from 'react';

const TESTIMONIALS = [
  {
    initials: 'MW',
    name: 'Michael W.',
    role: 'Pastor',
    text: 'KingdomTradex has been a blessing for our ministry. The AI trading generates consistent daily returns, and the free $100 credit gave us a real head start.',
  },
  {
    initials: 'SD',
    name: 'Sarah D.',
    role: 'Member',
    text: 'I had zero crypto experience before joining. The platform is incredibly easy to use, and I am already seeing daily earnings from my deposit.',
  },
  {
    initials: 'JT',
    name: 'James T.',
    role: 'Member',
    text: 'The referral program is amazing. I have invited four friends and the commissions keep growing. This is the first crypto platform I actually trust.',
  },
];

export default function Testimonials() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={`mb-12 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Trusted by the Community</h2>
        <p className="text-kt-text-tertiary">Hear from early members experiencing daily returns</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.initials}
            className="card p-6"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span
                className="inline-flex items-center justify-center rounded-full text-sm font-bold flex-shrink-0"
                style={{
                  width: 44,
                  height: 44,
                  background: 'rgba(255,215,0,0.12)',
                  color: '#FFD700',
                  border: '1px solid rgba(255,215,0,0.25)',
                }}
              >
                {t.initials}
              </span>
              <div>
                <p className="text-kt-text-primary font-semibold text-sm">{t.name}</p>
                <p className="text-kt-gold text-xs">{t.role}</p>
              </div>
            </div>
            <p className="text-kt-text-secondary text-sm leading-relaxed italic">
              &ldquo;{t.text}&rdquo;
            </p>
          </div>
        ))}
      </div>

      {/* Section divider */}
      <div className="mx-auto mt-12 max-w-lg" style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.15), transparent)' }} />
    </section>
  );
}
