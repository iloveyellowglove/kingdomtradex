export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-kt-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-8">
          Last updated: May 27, 2026
        </p>
        <div className="mx-auto" style={{ width: 80, height: 2, background: 'linear-gradient(90deg, transparent, #FFD700, transparent)' }} />
      </section>

      <section className="py-16 px-6 md:px-12">
        <div className="max-w-3xl mx-auto space-y-10 text-kt-text-secondary leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-kt-text-primary mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly: email address, username, and cryptocurrency wallet addresses. We also collect usage data including IP addresses, browser type, pages visited, and timestamps. Deposit and transaction history is stored for compliance and operational purposes.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-kt-text-primary mb-3">2. How We Use Your Information</h2>
            <p>We use your information to provide and improve the Platform, process transactions, communicate about your account, send launch updates, and comply with legal obligations. We do not sell your personal information to third parties.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-kt-text-primary mb-3">3. Data Storage and Security</h2>
            <p>Your data is stored on Supabase servers with encryption at rest and in transit. We implement reasonable security measures including session tokens, CSRF protection, and rate limiting. No method of electronic storage is 100% secure, and we cannot guarantee absolute security.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-kt-text-primary mb-3">4. Cookies</h2>
            <p>We use essential cookies for session management and authentication. We do not use tracking cookies or third-party analytics cookies. Session cookies expire when you log out or close your browser.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-kt-text-primary mb-3">5. Third-Party Services</h2>
            <p>We use Supabase for database hosting and authentication. Cryptocurrency deposits and withdrawals are processed on their respective blockchains. We do not share your data with additional third parties except as required by law.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-kt-text-primary mb-3">6. Your Rights</h2>
            <p>You may request access to, correction of, or deletion of your personal data by contacting us. You may close your account at any time. We will retain transaction records as required by applicable law even after account closure.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-kt-text-primary mb-3">7. Communications</h2>
            <p>By creating an account, you agree to receive service-related emails. You may opt out of promotional communications at any time. We will still send transactional emails related to your account activity.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-kt-text-primary mb-3">8. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify users of material changes via email or platform notification. Continued use after changes constitutes acceptance of the updated policy.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-kt-text-primary mb-3">9. Contact</h2>
            <p>For privacy-related inquiries, contact us at <a href="mailto:support@kingdomtradex.com" style={{ color: '#FFD700' }}>support@kingdomtradex.com</a>.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
