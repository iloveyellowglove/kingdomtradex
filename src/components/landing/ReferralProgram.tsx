export default function ReferralProgram() {
  const levels = [
    { level: 1, pct: 15, desc: 'Your direct referrals' },
    { level: 2, pct: 5, desc: '' },
    { level: 3, pct: 3, desc: '' },
    { level: 4, pct: 2, desc: '' },
    { level: 5, pct: 1, desc: '' },
  ];

  return (
    <section className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Earn More by Sharing</h2>
        <p className="text-text-muted">When your friends deposit and earn, you earn too. Up to 5 levels deep.</p>
      </div>

      <div className="card max-w-2xl mx-auto p-8">
        <div className="space-y-3">
          {levels.map((l) => (
            <div
              key={l.level}
              className="flex items-center gap-4 p-4 rounded-xl"
              style={{
                background: l.level === 1 ? 'rgba(255,215,0,0.06)' : 'rgba(255,255,255,0.02)',
                border: l.level === 1 ? '1px solid rgba(255,215,0,0.2)' : '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <span
                className="flex items-center justify-center rounded-full text-sm font-bold flex-shrink-0"
                style={{
                  width: 40, height: 40,
                  background: l.level === 1 ? '#FFD700' : 'rgba(255,255,255,0.08)',
                  color: l.level === 1 ? '#0e0b1a' : 'rgba(255,255,255,0.5)',
                }}
              >
                L{l.level}
              </span>
              <div className="flex-1">
                <span className="text-text-primary font-medium">{l.desc}</span>
                {l.level === 1 && (
                  <span className="text-text-muted text-xs ml-2">- where most of your earnings come from</span>
                )}
              </div>
              <span className="text-temple-gold text-xl font-extrabold">{l.pct}%</span>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <a href="#signup" className="btn-primary inline-block px-8 py-3 rounded-xl font-bold no-underline">
            Start Building Your Network
          </a>
        </div>
      </div>
    </section>
  );
}
