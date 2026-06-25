'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DepositBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('deposit-banner-dismissed');
    setDismissed(stored === '1');
  }, []);

  function dismiss() {
    sessionStorage.setItem('deposit-banner-dismissed', '1');
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div
      className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 rounded-xl"
      style={{ background: 'linear-gradient(135deg, #F0B90B, #E0A800)' }}
    >
      <div className="flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B0E11" strokeWidth="2.5">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
        <p className="text-[15px] font-semibold text-[#0B0E11] m-0">
          The AI engine is trading live right now. Deposit to start earning from these trades.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/deposit"
          className="px-6 py-2 rounded-lg text-sm font-bold no-underline"
          style={{ background: '#0B0E11', color: '#F0B90B' }}>
          Deposit Now
        </Link>
        <button
          onClick={dismiss}
          className="p-1.5 rounded-md hover:bg-black/10 transition"
          aria-label="Dismiss">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B0E11" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
