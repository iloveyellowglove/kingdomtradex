export default function Footer({ user }: { user?: { role: string } | null }) {
  return (
    <>
      {user && (
        <div className="max-w-[1280px] mx-auto px-6 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="ekklesia-box">
              <h6 className="text-temple-gold font-bold">Join the Ekklesia (Apostle Team)</h6>
              <p className="text-sm mb-2">Connect with fellow stewards. Receive prophetic market insights. Coordinate the harvest.</p>
              <a href="https://t.me/yourgroup" target="_blank" rel="noopener" className="inline-block border border-temple-gold text-temple-gold px-4 py-2 rounded-lg text-sm hover:bg-temple-gold hover:text-bg-dark transition mt-2">
                Join on Telegram
              </a>
            </div>
            <div className="ekklesia-box">
              <h6 className="text-temple-gold font-bold">Confidential Onboarding</h6>
              <p className="text-sm mb-2">For private coaching, use BonChat, encrypted and secure. Your financial journey stays between you and your spiritual covering.</p>
              <a href="https://bonchat.io/yourlink" target="_blank" rel="noopener" className="inline-block border border-text-primary text-text-primary px-4 py-2 rounded-lg text-sm hover:bg-white/5 transition mt-2">
                Open BonChat
              </a>
            </div>
          </div>
        </div>
      )}

      <footer>
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-bold mb-1">KingdomTrade Exchange</p>
              <small className="text-text-secondary">Secure blockchain transactions. All balances and trades are processed in real time.</small>
            </div>
            <div className="text-left md:text-right">
              <small className="text-text-secondary">&copy; {new Date().getFullYear()} KingdomTrade Exchange. All rights reserved.</small><br />
              <small className="text-text-secondary">&quot;The earth is the LORD&apos;s, and the fullness thereof.&quot; (Psalm 24:1)</small>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
