'use client';

import { useState, useRef, useEffect } from 'react';

const FAQS = [
  {
    q: 'What are the free credits?',
    a: 'When you sign up, you receive $50 in trading credits (or $100 if you\'re a pastor). These credits let you experience AI-powered trading returns from day one.',
  },
  {
    q: 'How does the AI trading work?',
    a: 'Our AI algorithms analyze crypto markets 24/7, executing trades across multiple pairs to generate daily returns. You don\'t need any trading experience - the AI handles everything.',
  },
  {
    q: 'What cryptocurrencies can I deposit?',
    a: 'We support 21+ cryptocurrencies including Bitcoin, Ethereum, Solana, USDT, USDC, Dogecoin, Litecoin, XRP, Cardano, Kaspa, and more.',
  },
  {
    q: 'What is the minimum deposit?',
    a: 'Minimum deposit is $100 for members and $200 for pastors.',
  },
  {
    q: 'How do withdrawals work?',
    a: 'Withdrawals are processed within 24-48 hours after admin review. You can withdraw to any wallet address in your chosen cryptocurrency.',
  },
  {
    q: 'How does the referral program work?',
    a: 'You earn commissions when people you refer make deposits - 15% on direct referrals, and up to 5 levels deep. Share your unique link after signing up.',
  },
  {
    q: 'Is there a withdrawal requirement for free credits?',
    a: 'Free credits are added to your trading balance. A minimum deposit is required to activate withdrawals. See our terms for details.',
  },
];

function FaqItem({ faq, isOpen, onToggle }: { faq: typeof FAQS[0]; isOpen: boolean; onToggle: () => void }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div className="border-b" style={{ borderColor: '#261f3a' }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left transition-colors hover:text-temple-gold"
      >
        <span className="font-semibold pr-4">{faq.q}</span>
        <span className={`flex-shrink-0 transition-transform duration-300 text-temple-gold ${isOpen ? 'rotate-45' : ''}`} style={{ fontSize: '1.5rem', lineHeight: 1 }}>
          +
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: `${height}px` }}
      >
        <div ref={contentRef} className="pb-4 text-text-secondary leading-relaxed">
          {faq.a}
        </div>
      </div>
    </div>
  );
}

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={`mb-12 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Questions? We&apos;ve Got Answers</h2>
        <p className="text-text-muted">Everything you need to know about KingdomTrade</p>
      </div>

      <div className="card max-w-3xl mx-auto">
        <div className="card-body p-6">
          {FAQS.map((faq, i) => (
            <FaqItem
              key={i}
              faq={faq}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
