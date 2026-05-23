import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';

export default async function LandingPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('kingdom_session')?.value;
  let user: { username: string; role: string } | null = null;

  if (token && token.length === 64) {
    const supabase = createServiceClient();
    const { data: sessions } = await supabase
      .from('sessions')
      .select('user_id, expires_at')
      .eq('session_token', token)
      .limit(1);

    if (sessions && sessions.length > 0 && new Date(sessions[0].expires_at) > new Date()) {
      const { data: users } = await supabase
        .from('users')
        .select('username,role')
        .eq('id', sessions[0].user_id)
        .eq('status', 'active')
        .limit(1);

      if (users && users.length > 0) user = users[0];
    }
  }

  return (
    <div>
      <section className="hero-section mt-8">
        <h1 className="text-4xl md:text-5xl mb-4">KingdomTrade Exchange</h1>
        <p className="text-xl text-text-secondary mb-6">AI-Powered Crypto Trading with Covenant Economics</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <Link href="/dashboard" className="btn-primary inline-block px-8 py-4 rounded-xl text-lg">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/register" className="btn-primary inline-block px-8 py-4 rounded-xl text-lg">
                Join the Kingdom
              </Link>
              <Link href="/login" className="inline-block border border-temple-gold text-temple-gold px-8 py-4 rounded-xl text-lg hover:bg-temple-gold hover:text-bg-dark transition">
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="card p-6 text-center">
          <h4 className="text-temple-gold mb-2">AI Trading</h4>
          <p className="text-text-secondary">Advanced AI algorithms trade on your behalf, generating consistent daily returns on your deposits.</p>
          <p className="text-2xl font-bold text-temple-gold mt-2">1.5% Daily</p>
        </div>
        <div className="card p-6 text-center">
          <h4 className="text-temple-gold mb-2">Covenant Blessings</h4>
          <p className="text-text-secondary">Earn blessings across 5 levels of your disciples network when they deposit and trade.</p>
          <p className="text-2xl font-bold text-temple-gold mt-2">Up to 26%</p>
        </div>
        <div className="card p-6 text-center">
          <h4 className="text-temple-gold mb-2">Secure Withdrawals</h4>
          <p className="text-text-secondary">Withdraw your earnings at any time after the 72-hour security hold period from your first deposit.</p>
          <p className="text-2xl font-bold text-temple-gold mt-2">Fast & Secure</p>
        </div>
      </section>

      <section className="card p-8 mb-12 text-center">
        <h2 className="text-temple-gold mb-4">The Covenant Economy</h2>
        <p className="text-text-secondary max-w-3xl mx-auto mb-6">
          KingdomTrade operates on biblical principles of stewardship and multiplication. When you deposit and trade,
          you are not just growing your own resources - you are participating in a covenant economy that blesses
          those who brought you here. Your disciples bring disciples, and the blessings flow through five generations.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-3xl mx-auto">
          {[
            { level: 1, pct: 15, name: 'Firstfruits' },
            { level: 2, pct: 5, name: 'Fruit that Remains' },
            { level: 3, pct: 3, name: 'Thirtyfold Return' },
            { level: 4, pct: 2, name: 'Sixtyfold' },
            { level: 5, pct: 1, name: 'Hundredfold' },
          ].map((l) => (
            <div key={l.level} className="card p-4">
              <p className="text-temple-gold font-bold text-lg">{l.pct}%</p>
              <p className="text-text-secondary text-sm">Level {l.level}</p>
              <p className="text-text-muted text-xs">{l.name}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="urgency-banner rounded-xl mb-12">
        Time is short. The harvest is plentiful but the laborers are few. Join the Kingdom economy today.
      </div>

      <div className="text-center mb-12">
        <p className="text-text-secondary italic">
          &quot;The earth is the LORD&apos;s, and the fullness thereof; the world, and they that dwell therein.&quot;
        </p>
        <p className="text-temple-gold font-bold mt-1">Psalm 24:1</p>
      </div>
    </div>
  );
}
