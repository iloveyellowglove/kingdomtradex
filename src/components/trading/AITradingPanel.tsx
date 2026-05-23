import type { AITradingProfit } from '@/lib/types';

export default function AITradingPanel({ profits }: { profits: AITradingProfit[] }) {
  const totalProfit = profits.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div>
      <h2 className="mb-2">AI Trading History</h2>
      <p className="text-text-muted mb-6">Daily harvest from AI-powered trading algorithms</p>

      {totalProfit > 0 && (
        <p className="text-lg text-temple-gold mb-4">
          Total earned: {totalProfit.toFixed(8)} USDT
        </p>
      )}

      {profits.length > 0 ? (
        <div className="card">
          <div className="card-header"><h5 className="mb-0">Trading History</h5></div>
          <div className="card-body p-0">
            <table className="w-full text-sm">
              <thead>
                <tr><th className="text-left p-3">Date</th><th className="text-left p-3">Amount</th><th className="text-left p-3">Rate</th></tr>
              </thead>
              <tbody>
                {profits.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3">{p.date}</td>
                    <td className="p-3">{Number(p.amount).toFixed(8)} USDT</td>
                    <td className="p-3">{p.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body text-center py-8">
            <p className="text-text-muted mb-0">No trading profits yet. Profits are applied daily to active balances.</p>
          </div>
        </div>
      )}
    </div>
  );
}
