import Logo from '@/components/brand/Logo';

export default function Footer() {
  return (
    <footer>
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Logo size="sm" className="mb-1" />
              <small className="text-text-secondary">Secure blockchain transactions. All balances and trades are processed in real time.</small>
            </div>
            <div className="text-left md:text-right">
              <small className="text-text-secondary">&copy; {new Date().getFullYear()} KingdomTrade Exchange. All rights reserved.</small><br />
              <small className="text-text-secondary">&quot;The earth is the LORD&apos;s, and the fullness thereof.&quot; (Psalm 24:1)</small>
            </div>
          </div>
        </div>
      </footer>
  );
}
