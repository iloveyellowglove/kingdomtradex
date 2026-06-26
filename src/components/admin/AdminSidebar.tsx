'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminSidebar() {
  const pathname = usePathname();

  const links = [
    { href: '/admin', label: 'Dashboard', icon: '◈' },
    { href: '/admin/users', label: 'Users', icon: '◆' },
    { href: '/admin/deposits', label: 'Deposits', icon: '◇' },
    { href: '/admin/withdrawals', label: 'Withdrawals', icon: '◉' },
    { href: '/admin/commissions', label: 'Commissions', icon: '◎' },
    { href: '/admin/settings', label: 'Settings', icon: '◈' },
  ];

  return (
    <div className="bg-kt-surface border border-kt-border rounded-2xl shadow-sm">
      <div className="px-4 py-3 border-b border-kt-border"><h5 className="mb-0 text-kt-text-primary text-sm font-semibold">Admin Menu</h5></div>
      <div className="p-2">
        <nav className="flex flex-col">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-3 rounded-lg transition no-underline ${
                pathname === link.href
                  ? 'text-kt-gold bg-kt-active-bg'
                  : 'text-kt-text-secondary hover:text-kt-gold hover:bg-kt-hover-bg'
              }`}
            >
              <span className="mr-2">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
