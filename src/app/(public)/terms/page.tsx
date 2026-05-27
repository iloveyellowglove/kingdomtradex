export default function TermsPage() {
  return (
    <div className="-mx-6">
      <section
        className="relative text-center py-20 md:py-28 px-6"
        style={{
          background: 'linear-gradient(180deg, #0e0b1a 0%, #120d24 40%, #1a1040 70%, #0e0b1a 100%)',
        }}
      >
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFE44D 30%, #FFC107 60%, #FFD700 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Terms of Service
        </h1>
        <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-8">
          Last updated: May 27, 2026
        </p>
        <div className="mx-auto" style={{ width: 80, height: 2, background: 'linear-gradient(90deg, transparent, #FFD700, transparent)' }} />
      </section>

      <section className="py-16 px-6 md:px-12">
        <div className="max-w-3xl mx-auto space-y-10 text-text-secondary leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using KingdomTradex (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform. We reserve the right to update these terms at any time. Continued use after changes constitutes acceptance.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-text-primary mb-3">2. Eligibility</h2>
            <p>You must be at least 18 years old to use the Platform. By creating an account, you represent that you are of legal age and have the capacity to enter into a binding agreement. The Platform is not available in jurisdictions where crypto trading is restricted or prohibited.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-text-primary mb-3">3. Account Registration</h2>
            <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. Kingdom Trade Solutions LLC reserves the right to suspend or terminate accounts that violate these terms.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-text-primary mb-3">4. Free Credits and Bonuses</h2>
            <p>Free trading credits and referral bonuses are promotional and subject to change. Credits are added to your trading balance and generate AI-powered returns. A minimum deposit is required to activate withdrawals. Free credits cannot be withdrawn directly but earnings generated from them may be withdrawn after meeting deposit requirements.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-text-primary mb-3">5. Deposits and Withdrawals</h2>
            <p>Minimum deposit is $100 for members and $200 for pastors. Deposits are processed in the cryptocurrency you select. Withdrawals are processed within 24-48 hours after admin review. We reserve the right to delay withdrawals for security verification. You are responsible for providing correct wallet addresses.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-text-primary mb-3">6. AI Trading and Returns</h2>
            <p>The Platform uses automated AI algorithms to trade cryptocurrency markets. Past performance does not guarantee future results. Trading involves risk, and you may lose part or all of your deposited funds. Kingdom Trade Solutions LLC does not guarantee specific returns or profits.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-text-primary mb-3">7. Referral Program</h2>
            <p>Our referral program pays commissions on deposits made by your referrals across 5 levels (15%, 5%, 3%, 2%, 1%). Commissions are credited to your account balance. We reserve the right to modify commission rates with notice. Fraudulent referrals will result in account termination.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-text-primary mb-3">8. Prohibited Activities</h2>
            <p>You may not use the Platform for any illegal activity, money laundering, fraud, market manipulation, or violation of applicable laws. Automated scraping, bots, and unauthorized API access are prohibited. Violation may result in immediate account termination and forfeiture of funds.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-text-primary mb-3">9. Limitation of Liability</h2>
            <p>Kingdom Trade Solutions LLC is not liable for losses resulting from market volatility, technical failures, security breaches, or user error. The Platform is provided &quot;as is&quot; without warranties of any kind. Our total liability is limited to the amount you have deposited.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-text-primary mb-3">10. Governing Law</h2>
            <p>These terms are governed by the laws of the State of Maine. Any disputes shall be resolved in the courts of York County, Maine. Users outside the United States are responsible for compliance with local laws.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-text-primary mb-3">11. Contact</h2>
            <p>For questions about these Terms, contact us at <a href="mailto:support@kingdomtradex.com" style={{ color: '#FFD700' }}>support@kingdomtradex.com</a>.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
