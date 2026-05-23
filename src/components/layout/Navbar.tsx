'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavbarProps {
  user?: {
    username: string;
    role: string;
    display_balance: number;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  return (
    <nav className="navbar" id="mainNav">
      <div className="flex items-center justify-between max-w-[1280px] mx-auto px-6 w-full min-h-[64px]">
        <Link href="/" className="flex items-center gap-2.5 text-temple-gold font-bold text-[1.3rem] no-underline tracking-[-0.3px]">
          <div className="w-[34px] h-[34px] flex items-center justify-center text-[1rem] text-bg-dark rounded-lg" style={{ background: 'linear-gradient(135deg, var(--temple-gold), #b8860b)' }}>
            &#x2663;
          </div>
          KingdomTrade Exchange
        </Link>

        {/* Mobile toggle */}
        <button className="lg:hidden border border-border-light text-text-primary p-2 rounded-lg" onClick={() => document.getElementById('navbarNav')?.classList.toggle('hidden')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <div className="hidden lg:flex items-center gap-4 flex-1 ml-8" id="navbarNav">
          <div className="flex gap-1">
            {user && (
              <>
                <NavLink href="/dashboard" active={pathname === '/dashboard'}>
                  Dashboard
                </NavLink>
                <NavLink href="/trading" active={pathname === '/trading'}>
                  Trading
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
            )}
            <NavLink href="/about" active={pathname === '/about'}>
              About
            </NavLink>
            <NavLink href="/covenant" active={pathname === '/covenant'}>
              Covenant
            </NavLink>
          </div>

          <div className="flex gap-2 ml-auto">
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 text-text-primary hover:text-temple-gold px-4 py-2 rounded-lg hover:bg-white/5 transition">
                  {user.username}
                  <span className="badge badge-secondary">{user.role}</span>
                </button>
                <div className="absolute right-0 top-full mt-2 hidden group-hover:block bg-card-bg border border-temple-gold rounded-xl py-2 min-w-[240px]">
                  <div className="px-4 py-2 text-text-secondary">
                    Balance: <strong className="text-text-primary">{Number(user.display_balance).toFixed(8)} USDT</strong>
                  </div>
                  <hr className="border-border my-1" />
                  <Link href="/logout" className="block px-4 py-2 text-text-primary hover:text-temple-gold hover:bg-gold-glow/10 rounded-lg mx-2">
                    Logout
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-text-primary hover:text-temple-gold px-4 py-2 rounded-lg hover:bg-white/5 transition">
                  Log In
                </Link>
                <Link href="/register" className="text-temple-gold hover:text-temple-gold-light px-4 py-2 rounded-lg hover:bg-white/5 transition font-medium">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
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
