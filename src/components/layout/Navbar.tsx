'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Logo from '@/components/brand/Logo';
import { fmt, formatCurrency } from '@/lib/utils/formatting';

interface NavbarProps {
  user?: {
    username: string;
    role: string;
    display_balance: number;
    email?: string | null;
    avatar_url?: string | null;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const avatarLetter = user?.username?.charAt(0).toUpperCase() || '?';

  return (
    <nav className="navbar" id="mainNav">
      <div className="flex items-center justify-between max-w-[1280px] mx-auto px-6 w-full min-h-[64px]">
        <Link href="/" className="no-underline">
          <Logo size="md" />
        </Link>

        {/* Mobile toggle */}
        <button className="lg:hidden border border-border-light text-text-primary p-2 rounded-lg" onClick={() => document.getElementById('navbarNav')?.classList.toggle('hidden')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <div className="hidden lg:flex items-center gap-4 flex-1 ml-8" id="navbarNav">
          <div className="flex gap-1">
            {user ? (
              <>
                <NavLink href="/dashboard" active={pathname === '/dashboard'}>
                  Dashboard
                </NavLink>
                <NavLink href="/deposit" active={pathname === '/deposit'}>
                  Deposit
                </NavLink>
                <NavLink href="/trading" active={pathname === '/trading'}>
                  Trading
                </NavLink>
                <NavLink href="/manual-trading" active={pathname === '/manual-trading'}>
                  Manual Trading <span className="ml-1 px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>Beta</span>
                </NavLink>
                <NavLink href="/earnings" active={pathname === '/earnings'}>
                  Earnings
                </NavLink>
                <NavLink href="/withdrawals" active={pathname === '/withdrawals'}>
                  Withdrawals
                </NavLink>
                <NavLink href="/referral-tree" active={pathname === '/referral-tree'}>
                  Disciples
                </NavLink>
                {user.role === 'admin' && (
                  <NavLink href="/admin" active={pathname.startsWith('/admin')} highlight>
                    Admin
                  </NavLink>
                )}
              </>
            ) : (
              <>
                <NavLink href="/" active={pathname === '/'}>
                  Home
                </NavLink>
                <NavLink href="/about" active={pathname === '/about'}>
                  About
                </NavLink>
                <NavLink href="/covenant" active={pathname === '/covenant'}>
                  Covenant
                </NavLink>
                <NavLink href="/waitlist/leaderboard" active={pathname === '/waitlist/leaderboard'}>
                  Leaderboard
                </NavLink>
              </>
            )}
          </div>

          <div className="flex gap-2 ml-auto items-center">
            {user ? (
              <>
                <Link href="/dashboard" className="flex items-center gap-2 text-temple-gold hover:text-temple-gold/80 px-3 py-2 rounded-lg hover:bg-white/5 transition no-underline">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                  </svg>
                  <span className="font-bold text-sm">{fmt(user.display_balance)} USDT</span>
                </Link>

                {/* Click-based dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 text-text-primary hover:text-temple-gold px-2 py-1.5 rounded-lg hover:bg-white/5 transition"
                  >
                    {/* Avatar circle */}
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt=""
                        className="rounded-full object-cover flex-shrink-0"
                        style={{ width: 32, height: 32, border: '2px solid #FFD700' }}
                      />
                    ) : (
                      <span
                        className="inline-flex items-center justify-center rounded-full text-sm font-bold flex-shrink-0"
                        style={{
                          width: 32,
                          height: 32,
                          border: '2px solid #FFD700',
                          background: 'rgba(255,215,0,0.12)',
                          color: '#FFD700',
                        }}
                      >
                        {avatarLetter}
                      </span>
                    )}
                    <span className="text-sm font-medium">{user.username}</span>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M1 1l4 4 4-4" />
                    </svg>
                  </button>

                  {/* Dropdown panel */}
                  {dropdownOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 border border-white/10 rounded-lg shadow-2xl p-0 min-w-[240px]"
                      style={{
                        background: '#1a1a2e',
                        animation: 'dropdownIn 150ms ease-out',
                      }}
                    >
                      <div className="px-4 py-3 flex items-center gap-3 border-b border-white/5">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt=""
                            className="rounded-full object-cover flex-shrink-0"
                            style={{ width: 48, height: 48, border: '2px solid #FFD700' }}
                          />
                        ) : (
                          <span
                            className="inline-flex items-center justify-center rounded-full text-lg font-bold flex-shrink-0"
                            style={{
                              width: 48,
                              height: 48,
                              border: '2px solid #FFD700',
                              background: 'rgba(255,215,0,0.12)',
                              color: '#FFD700',
                            }}
                          >
                            {avatarLetter}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="text-text-primary text-sm font-semibold truncate">{user.username}</p>
                          {user.email && (
                            <p className="text-white/40 text-xs truncate">{user.email}</p>
                          )}
                          <p className="text-temple-gold text-xs mt-0.5">
                            {formatCurrency(user.display_balance)} USDT
                          </p>
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition no-underline"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          My Profile
                        </Link>

                        <Link
                          href="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition no-underline"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                          </svg>
                          Settings
                        </Link>

                        {user.role === 'admin' && (
                          <Link
                            href="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition no-underline"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            Admin Panel
                          </Link>
                        )}
                      </div>

                      <hr className="border-t border-white/5 my-1" />

                      <form action="/api/auth/logout" method="POST">
                        <button
                          type="submit"
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                          Sign Out
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link href="/waitlist" className="btn-primary px-5 py-2 rounded-lg text-sm font-bold">
                Join the Waitlist
              </Link>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </nav>
  );
}

function NavLink({ href, children, active, highlight }: { href: string; children: React.ReactNode; active?: boolean; highlight?: boolean }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
        active
          ? 'text-temple-gold bg-white/5'
          : highlight
            ? 'text-temple-gold hover:text-temple-gold hover:bg-white/5'
            : 'text-text-primary hover:text-temple-gold hover:bg-white/5'
      }`}
    >
      {children}
    </Link>
  );
}
