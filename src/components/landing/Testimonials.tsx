'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const TESTIMONIALS = [
  {
    name: 'Elder Michael O.',
    role: 'Level 3 Steward',
    text: 'I have been with KingdomTrade for 8 months. The AI trading delivers consistently - I am seeing real daily returns. The covenant blessings from my referral network now match my trading profits. This is the best financial decision I have made.',
    rating: 5,
  },
  {
    name: 'Sarah K.',
    role: 'Level 2 Steward',
    text: 'What sets KingdomTrade apart is the transparency. Every trade, every commission, every withdrawal is tracked and visible. The 1.5% daily rate is real and consistent. I started with $500 and have grown it significantly.',
    rating: 5,
  },
  {
    name: 'Prophet David N.',
    role: 'Level 4 Apostle',
    text: 'The covenant economy model is unlike anything else in crypto. I earn from my own staking AND from helping others succeed. The five-level blessing system creates true generational wealth. My team has grown to over 200 members.',
    rating: 5,
  },
  {
    name: 'Grace M.',
    role: 'Level 1 Steward',
    text: 'I was skeptical at first, but the 72-hour security hold and transparent operations gave me confidence. The AI trading has been running for months without a single losing day. The community support and mentorship have been incredible.',
    rating: 5,
  },
  {
    name: 'Apostle James T.',
    role: 'Level 5 Elder',
    text: 'KingdomTrade is building something different - a real covenant economy where everyone benefits. The AI technology is legitimate, the returns are consistent, and the spiritual covering makes this more than just another exchange. I have referred dozens who are all thriving.',
    rating: 5,
  },
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

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

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent(index);
    setTimeout(() => setIsTransitioning(false), 400);
  }, [isTransitioning]);

  useEffect(() => {
    if (!visible) return;
    intervalRef.current = setInterval(() => {
      goTo((current + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, [visible, current, goTo]);

  const t = TESTIMONIALS[current];

  return (
    <section ref={sectionRef} className={`mb-12 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">What Stewards Say</h2>
        <p className="text-text-muted">Hear from members of the KingdomTrade covenant community</p>
      </div>

      <div className="card max-w-2xl mx-auto overflow-hidden">
        <div className="card-body p-8">
          {/* Rating */}
          <div className="flex justify-center gap-1 mb-4">
            {Array.from({ length: t.rating }).map((_, i) => (
              <span key={i} className="text-temple-gold" style={{ fontSize: '1.25rem' }}>&#9733;</span>
            ))}
          </div>

          {/* Quote */}
          <div className="transition-opacity duration-300" style={{ opacity: isTransitioning ? 0 : 1 }}>
            <p className="text-text-secondary text-lg leading-relaxed text-center mb-6">
              &ldquo;{t.text}&rdquo;
            </p>
            <div className="text-center">
              <p className="font-bold text-white">{t.name}</p>
              <p className="text-temple-gold text-sm">{t.role}</p>
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === current ? '24px' : '8px',
                  height: '8px',
                  background: i === current ? '#FFD700' : '#352c4a',
                }}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>

          {/* Arrows */}
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() => goTo((current - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ border: '1px solid #352c4a', color: '#a89bb5' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FFD700'; e.currentTarget.style.color = '#FFD700'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#352c4a'; e.currentTarget.style.color = '#a89bb5'; }}
            >
              &#8592;
            </button>
            <button
              onClick={() => goTo((current + 1) % TESTIMONIALS.length)}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ border: '1px solid #352c4a', color: '#a89bb5' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FFD700'; e.currentTarget.style.color = '#FFD700'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#352c4a'; e.currentTarget.style.color = '#a89bb5'; }}
            >
              &#8594;
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
