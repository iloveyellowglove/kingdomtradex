import { fmt } from '@/lib/utils/formatting';

type Props = {
  balance: number;
  dailyRate: number;
};

export default function YieldVault({ balance, dailyRate }: Props) {
  const dailyEarnings = balance * (dailyRate / 100);
  const monthlyEarnings = dailyEarnings * 30;

  return (
    <div className="card mb-6 relative overflow-hidden" style={{ border: '1px solid transparent', borderImage: 'linear-gradient(135deg, #FFD700, #6A0DAD) 1' }}>
      {/* Faint cross behind title */}
      <div className="absolute left-6 top-6 pointer-events-none" style={{ opacity: 0.06 }}>
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="36" y="8" width="8" height="64" rx="3" fill="#FFD700" />
          <rect x="10" y="32" width="60" height="8" rx="3" fill="#FFD700" />
        </svg>
      </div>
      <div className="card-body p-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-temple-gold mb-1" style={{ fontSize: '1.25rem' }}>Kingdom Yield Vault</h3>
            <p className="text-text-muted text-sm">Your balance earns yield daily through AI-powered trading</p>
          </div>
          <a href="/dashboard" className="btn-primary inline-block px-6 py-2 rounded-lg text-sm">
            Stake More
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-dark-indigo rounded-lg p-4 text-center">
            <p className="text-text-muted text-xs mb-1">Daily Rate</p>
            <p className="text-temple-gold text-2xl font-bold">{dailyRate}%</p>
          </div>
          <div className="bg-dark-indigo rounded-lg p-4 text-center">
            <p className="text-text-muted text-xs mb-1">Staked Balance</p>
            <p className="text-white text-2xl font-bold">{fmt(balance)} USDT</p>
          </div>
          <div className="bg-dark-indigo rounded-lg p-4 text-center">
            <p className="text-text-muted text-xs mb-1">Daily Earnings</p>
            <p className="text-temple-gold text-2xl font-bold">{fmt(dailyEarnings)} USDT</p>
          </div>
          <div className="bg-dark-indigo rounded-lg p-4 text-center">
            <p className="text-text-muted text-xs mb-1">Monthly Earnings</p>
            <p className="text-temple-gold text-2xl font-bold">{fmt(monthlyEarnings)} USDT</p>
          </div>
        </div>
      </div>
    </div>
  );
}
