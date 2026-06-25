export default function HowItWorks() {
  const steps = [
    {
      num: '1',
      title: 'Sign Up',
      desc: 'Create your account in seconds. Choose Member ($50) or Pastor ($100) and get your free trading credits instantly.',
    },
    {
      num: '2',
      title: 'Deposit & Lock',
      desc: 'Choose from our 4 tier options (6/9/12/18 months). Longer locks unlock higher daily earning rates.',
    },
    {
      num: '3',
      title: 'Earn Daily',
      desc: 'Earnings are credited to your account every single day. Withdraw profits or compound for greater growth.',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 lg:py-20 bg-kt-bg">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-[22px] sm:text-[28px] font-semibold text-kt-text-primary mb-2">How It Works</h2>
          <p className="text-sm text-kt-text-secondary">Three simple steps to start earning daily</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[900px] mx-auto">
          {steps.map((s, i) => (
            <div key={s.num} className="relative text-center p-8 rounded-xl" style={{ background: '#1E2329', border: '1px solid #2B3139' }}>
              {/* Dotted connector between cards */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 border-t border-dashed border-kt-border" />
              )}
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold" style={{ background: 'rgba(240,185,11,0.1)', color: '#F0B90B' }}>
                {s.num}
              </div>
              <h3 className="text-lg font-semibold text-kt-text-primary mb-2">{s.title}</h3>
              <p className="text-sm text-kt-text-secondary leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
