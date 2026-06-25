'use client';

import { useState, useEffect } from 'react';

export default function StickyBottomCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => {
      // Show after scrolling past hero section
      const hero = document.getElementById('hero-section');
      if (hero) {
        setVisible(window.scrollY > hero.offsetHeight * 0.6);
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-3 border-t border-white/5"
      style={{
        background: '#0c0a16',
        animation: 'slideUp 200ms ease-out',
      }}
    >
      <a
        href="#signup"
        className="block w-full py-3 rounded-xl text-center text-sm font-bold no-underline"
        style={{ background: '#FFD700', color: '#000' }}
      >
        Start Earning - Get Free Credits
      </a>
      <style jsx>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
}
