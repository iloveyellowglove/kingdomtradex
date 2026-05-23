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
    <div className="admin-sidebar card">
      <div className="card-header"><h5 className="mb-0">Admin Menu</h5></div>
      <div className="card-body p-0">
        <nav className="flex flex-col p-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-3 rounded-lg transition ${
                pathname === link.href
                  ? 'text-temple-gold bg-white/5'
                  : 'text-text-secondary hover:text-temple-gold hover:bg-white/5'
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
