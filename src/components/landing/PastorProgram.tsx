export default function PastorProgram() {
  return (
    <section className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Pastors: Lead Your Congregation to Financial Growth</h2>
        <p className="text-text-muted">Special benefits for ministry leaders</p>
      </div>

      <div className="card max-w-2xl mx-auto p-8" style={{ border: '1px solid rgba(255,215,0,0.3)' }}>
        <div className="space-y-4">
          {[
            { icon: '\u{1F4B0}', text: '$100 in free trading credits (double the standard bonus)' },
            { icon: '\u{1F91D}', text: 'Earn commissions when your members join (5 levels deep)' },
            { icon: '\u{1F4DE}', text: 'Dedicated support for ministry leaders' },
            { icon: '\u{2705}', text: 'Verify your ministry to unlock pastor benefits' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <p className="text-text-primary text-lg">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <a
            href="/?role=pastor#signup"
            className="btn-primary inline-block px-8 py-3 rounded-xl font-bold no-underline"
          >
            Sign Up as a Pastor
          </a>
        </div>
      </div>
    </section>
  );
}
