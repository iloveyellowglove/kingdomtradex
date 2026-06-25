'use client';

import { useState, useEffect } from 'react';

export default function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const links = [
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#tiers', label: 'Tiers' },
    { href: '/calculator', label: 'Calculator' },
    { href: '#faq', label: 'FAQ' },
  ];

  return (
    <nav
      className="sticky top-0 z-50 border-b transition-colors"
      style={{
        background: scrolled ? 'rgba(11,14,17,0.95)' : '#0B0E11',
        borderColor: '#2B3139',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        height: 64,
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 no-underline">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F0B90B" strokeWidth="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span className="text-lg font-bold text-kt-text-primary hidden sm:inline">KingdomTradex</span>
        </a>

        {/* Desktop nav links */}
        <div className="hidden lg:flex items-center gap-1">
          {links.map(l => (
            <a key={l.href} href={l.href}
              className="px-4 py-2 rounded-lg text-sm font-medium text-kt-text-secondary hover:text-kt-text-primary hover:bg-kt-surface transition no-underline">
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <a href="/login" className="text-sm font-medium text-kt-text-primary hover:text-kt-gold transition no-underline">Log In</a>
          <a href="/register"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold no-underline transition"
            style={{ background: '#F0B90B', color: '#0B0E11' }}>
            Register
          </a>
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden flex items-center justify-center w-11 h-11 rounded-lg"
          style={{ background: 'transparent', border: '1px solid #2B3139', color: '#EAECEF' }}
          aria-label="Menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen
              ? <path d="M18 6L6 18M6 6l12 12" />
              : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t px-6 py-4 space-y-2" style={{ background: '#0B0E11', borderColor: '#2B3139' }}>
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 rounded-lg text-sm font-medium text-kt-text-secondary hover:text-kt-text-primary hover:bg-kt-surface no-underline">
              {l.label}
            </a>
          ))}
          <hr style={{ borderColor: '#2B3139' }} />
          <a href="/login" className="block px-4 py-3 rounded-lg text-sm font-medium text-kt-text-primary hover:bg-kt-surface no-underline">Log In</a>
          <a href="/register"
            className="block px-4 py-3 rounded-lg text-center text-sm font-semibold no-underline"
            style={{ background: '#F0B90B', color: '#0B0E11' }}>
            Register
          </a>
        </div>
      )}
    </nav>
  );
}
