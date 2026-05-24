import type { Metadata } from 'next';
import './globals.css';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import OracleChat from '@/components/chatbot/OracleChat';
import SocialProofToast from '@/components/SocialProofToast';

export const metadata: Metadata = {
  title: 'KingdomTrade Exchange',
  description: 'A professional cryptocurrency trading platform. Secure blockchain transactions.',
};

async function getUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('kingdom_session')?.value;
  if (!token || token.length !== 64) return null;

  const supabase = createServiceClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id, user_role, csrf_token, expires_at')
    .eq('session_token', token)
    .limit(1);

  const sess = (sessions ?? []) as unknown as { user_id: number; user_role: string; csrf_token: string; expires_at: string }[];
  if (sess.length === 0) return null;
  const session = sess[0];
  if (new Date(session.expires_at) < new Date()) return null;

  const { data: users } = await supabase
    .from('users')
    .select('id,username,role,display_balance,email,avatar_url')
    .eq('id', session.user_id)
    .eq('status', 'active')
    .limit(1);

  if (!users || users.length === 0) return null;
  return users[0];
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  return (
    <html lang="en">
      <body>
        <Navbar user={user ? { username: user.username, role: user.role, display_balance: user.display_balance, email: (user as unknown as { email?: string }).email ?? null, avatar_url: (user as unknown as { avatar_url?: string }).avatar_url ?? null } : null} />
        <main className="max-w-[1280px] mx-auto px-6">
          {children}
        </main>
        <Footer user={user ? { role: user.role } : null} />
        <OracleChat />
        <SocialProofToast />
        <script dangerouslySetInnerHTML={{
          __html: `(function(){var n=document.getElementById('mainNav');if(n){window.addEventListener('scroll',function(){n.classList.toggle('scrolled',window.scrollY>20)});}})();`
        }} />
      </body>
    </html>
  );
}
