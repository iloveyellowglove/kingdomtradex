'use client';

import { useState, useRef, useEffect } from 'react';

const FAQS = [
  {
    q: 'How does the AI trading work?',
    a: 'Our proprietary AI algorithms analyze market conditions 24/7 across multiple exchanges, executing micro-trades to generate consistent returns. The system uses advanced machine learning models to identify profitable opportunities while managing risk. Profits are distributed daily to all active staked balances.',
  },
  {
    q: 'What is the minimum deposit?',
    a: 'The minimum deposit is $50 USDT equivalent. There is no maximum limit. Your funds begin earning the 1.5% daily rate immediately after your deposit is confirmed on the blockchain. Pastors receive a $100 starter grant (unlocks at $200 deposited). Members receive $50 (unlocks at $100 deposited).',
  },
  {
    q: 'How do withdrawals work?',
    a: 'Withdrawals are processed within 24 hours. There is a 72-hour security hold period from your first deposit before withdrawals become available. After this initial period, you can withdraw your earnings at any time. All withdrawals are sent to your registered wallet address.',
  },
  {
    q: 'What is the Covenant Referral system?',
    a: 'The Covenant Economy rewards you for building a network of disciples. You earn commissions across 5 levels: 15% on Level 1 (direct referrals), 5% on Level 2, 3% on Level 3, 2% on Level 4, and 1% on Level 5. These commissions apply to both deposits and trading profits of your network.',
  },
  {
    q: 'Is my investment secure?',
    a: 'Yes. KingdomTrade uses institutional-grade security including cold wallet storage, multi-signature authentication, and real-time monitoring. All platform operations are transparent and verifiable on-chain. We never commingle user funds with operational capital.',
  },
  {
    q: 'How is this different from other exchanges?',
    a: 'KingdomTrade combines AI-powered automated trading with a biblical covenant economic model. Unlike traditional exchanges where you trade manually, our AI trades for you. Unlike typical staking platforms, our returns come from actual trading profits rather than inflationary token emissions.',
  },
  {
    q: 'Can I track my earnings in real time?',
    a: 'Yes. Your dashboard shows real-time balance updates, daily profit distributions, referral commissions, and complete transaction history. The AI Trading panel displays every profit distribution with date, amount, and rate details.',
  },
  {
    q: 'What cryptocurrencies are supported?',
    a: 'We currently support USDT (TRC-20 and ERC-20) for deposits and trading. Bitcoin, Ethereum, and other major cryptocurrencies are tracked in our Trading Terminal. Additional deposit options are being added regularly.',
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
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Frequently Asked Questions</h2>
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
