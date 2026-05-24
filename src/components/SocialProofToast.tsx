'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface SocialEntry {
  type: 'waitlist' | 'deposit' | 'signup';
  text: string;
  timeAgo: string;
}

export default function SocialProofToast() {
  const pathname = usePathname();
  const allowed = pathname === '/' || pathname === '/dashboard';
  const [entries, setEntries] = useState<SocialEntry[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cancelled = useRef(false);

  // Check sessionStorage on mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && sessionStorage.getItem('social-proof-dismissed')) {
      setDismissed(true);
    }
  }, []);

  // Fetch entries
  useEffect(() => {
    if (!allowed || dismissed) return;

    fetch('/api/social-proof')
      .then((res) => res.json())
      .then((data: { entries: SocialEntry[] }) => {
        if (data.entries && data.entries.length > 0) {
          setEntries(data.entries);
        }
      })
      .catch(() => {});
  }, [allowed, dismissed]);

  // Cycle through entries
  useEffect(() => {
    if (entries.length === 0) return;
    cancelled.current = false;

    let idx = 0;

    function cycle() {
      if (cancelled.current) return;
      setCurrentIdx(idx);
      setVisible(true);

      setTimeout(() => {
        if (cancelled.current) return;
        setVisible(false);

        setTimeout(() => {
          if (cancelled.current) return;
          idx = (idx + 1) % entries.length;
          cycle();
        }, 3000);
      }, 5000);
    }

    // Small initial delay so the user sees the page first
    const start = setTimeout(cycle, 2000);
    return () => {
      cancelled.current = true;
      clearTimeout(start);
    };
  }, [entries]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    setVisible(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('social-proof-dismissed', '1');
    }
  }, []);

  if (!mounted || !allowed || dismissed || entries.length === 0) return null;

  const entry = entries[currentIdx];

  return (
    <div
      className="fixed z-[99] left-4 right-4 md:left-4 md:right-auto bottom-4 pointer-events-none"
      style={{ maxWidth: 320 }}
    >
      <div
        className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg relative"
        style={{
          background: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 200ms ease, transform 200ms ease',
        }}
      >
        {/* Gold pulse dot */}
        <div className="flex-shrink-0 mt-0.5 relative flex items-center justify-center" style={{ width: 8, height: 8 }}>
          <span className="absolute inline-flex h-full w-full rounded-full opacity-75" style={{
            background: '#FFD700',
            animation: 'spPulse 2s ease-in-out infinite',
          }} />
          <span className="relative inline-flex rounded-full" style={{ width: 6, height: 6, background: '#FFD700' }} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="mb-0 text-sm" style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
            {entry.text}
          </p>
          <p className="mb-0 text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {entry.timeAgo}
          </p>
        </div>

        {/* Close */}
        <button
          onClick={dismiss}
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.25)',
          }}
          aria-label="Dismiss notifications"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <style jsx>{`
        @keyframes spPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.6); }
        }
      `}</style>
    </div>
  );
}
