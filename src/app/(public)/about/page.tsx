export default function AboutPage() {
  return (
    <div className="py-8 max-w-3xl mx-auto">
      <h1 className="text-3xl mb-6">About KingdomTrade Exchange</h1>

      <div className="card p-6 mb-6">
        <h3 className="text-temple-gold mb-3">Our Mission</h3>
        <p>KingdomTrade Exchange is a covenant-based cryptocurrency trading platform that combines AI-powered trading algorithms with biblical principles of stewardship and multiplication.</p>
      </div>

      <div className="card p-6 mb-6">
        <h3 className="text-temple-gold mb-3">How It Works</h3>
        <ol className="space-y-3 text-text-secondary">
          <li><strong className="text-text-primary">1. Deposit</strong> - Fund your account with USDT, BTC, or ETH.</li>
          <li><strong className="text-text-primary">2. Trade</strong> - Our AI algorithms trade on your behalf, earning 1.5% daily returns.</li>
          <li><strong className="text-text-primary">3. Multiply</strong> - Refer others and earn covenant blessings across 5 levels.</li>
          <li><strong className="text-text-primary">4. Withdraw</strong> - Access your funds after the 72-hour security hold period.</li>
        </ol>
      </div>

      <div className="card p-6 mb-6">
        <h3 className="text-temple-gold mb-3">The Covenant Economy</h3>
        <p className="text-text-secondary">Our 5-level blessing system is based on the biblical principle that those who sow into the Kingdom will reap a harvest. When you introduce others to the platform, you participate in their growth - and the growth of their disciples - through five generations.</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          {[15, 5, 3, 2, 1].map((pct, i) => (
            <div key={i} className="text-center card p-3">
              <p className="text-temple-gold font-bold text-lg">{pct}%</p>
              <p className="text-text-muted text-xs">Level {i + 1}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
