'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import InstallBanner from '@/components/layout/InstallBanner';

export default function RootShell({ user, children }: { user: unknown; children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  return (
    <>
      {!isLanding && <Navbar user={user as { username: string; role: string; display_balance: number; email?: string | null; avatar_url?: string | null } | null} />}
      {children}
      {!isLanding && <Footer />}
      {!isLanding && <InstallBanner />}
    </>
  );
}
