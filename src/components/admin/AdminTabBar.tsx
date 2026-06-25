'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/deposits', label: 'Deposits' },
  { href: '/admin/withdrawals', label: 'Withdrawals' },
  { href: '/admin/commissions', label: 'Commissions' },
  { href: '/admin/kyc', label: 'KYC Review' },
  { href: '/admin/support', label: 'Support' },
  { href: '/admin/broadcast', label: 'Broadcast' },
  { href: '/admin/settings', label: 'Settings' },
];

export default function AdminTabBar() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-0 border-b border-white/10 mb-6 overflow-x-auto">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition no-underline ${
              active
                ? 'text-white border-b-2 border-[#FFD700]'
                : 'text-white/50 hover:text-white/70 border-b-2 border-transparent'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
