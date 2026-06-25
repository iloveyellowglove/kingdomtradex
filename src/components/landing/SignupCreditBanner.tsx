'use client';

import AnimatedNumber from '@/components/landing/AnimatedNumber';

const STEPS = [
  { label: 'Starting Balance', val: 50.00, color: '#EAECEF', size: 'text-xl' },
  { label: 'After 7 Days', val: 56.30, color: '#848E9C', size: 'text-xl' },
  { label: 'After 30 Days', val: 77.00, color: '#F0B90B', size: 'text-2xl' },
  { label: 'After 90 Days', val: 131.00, color: '#0ECB81', size: 'text-3xl' },
];

export default function SignupCreditBanner() {
  return (
    <section className="py-12 lg:py-20 bg-kt-surface">
      <div className="max-w-[1200px] mx-auto px-6 text-center">
        <h2 className="text-[22px] sm:text-[28px] font-semibold text-kt-text-primary mb-2">
          See What Your <span className="text-kt-gold">$50 Free Credits</span> Can Become
        </h2>
        <p className="text-sm text-kt-text-secondary mb-10 max-w-[500px] mx-auto">
          Your $50 starting credit, growing with projected daily returns at our current Gold tier rate.
        </p>

        {/* Timeline */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.label} className="relative p-5 rounded-xl" style={{ background: '#0B0E11', border: '1px solid #2B3139' }}>
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-[#2B3139] text-xl">→</div>
              )}
              <p className="text-xs text-kt-text-tertiary mb-2">{s.label}</p>
              <p className={`${s.size} font-bold`} style={{ color: s.color }}>
                <AnimatedNumber value={s.val} prefix="$" decimals={2} duration={1.2} />
              </p>
            </div>
          ))}
        </div>

        <a href="#signup"
          className="inline-block px-10 py-4 rounded-lg text-base font-semibold no-underline transition"
          style={{ background: '#F0B90B', color: '#0B0E11' }}>
          Claim My Free $50
        </a>
        <p className="mt-3 text-xs text-kt-text-tertiary max-w-[500px] mx-auto">
          Credits are non-withdrawable. Profits from credits can be withdrawn based on KYC level. Projected returns are estimates and not guaranteed.
        </p>
      </div>
    </section>
  );
}
