'use client';

import { useState, useEffect } from 'react';
import { TIER_LIST, getTierForAmount } from '@/lib/tiers';
import { Area, XAxis, CartesianGrid, ResponsiveContainer, ComposedChart } from 'recharts';
import { defaultGridProps } from '@/lib/chartTheme';

const QUICK_AMOUNTS = [50, 100, 500, 1000, 5000];
const CURRENCIES = ['USDT (TRC-20)', 'USDC (ERC-20)', 'BTC', 'ETH'];

export default function DepositPage() {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('gold');
  const [currency, setCurrency] = useState('USDT (TRC-20)');
  const [fundSource, setFundSource] = useState<'crypto' | 'balance'>('crypto');
  const [activeDeposits, setActiveDeposits] = useState<Array<{ id: string; amount: number; tier: string; dailyRate: number; lockedAt: string; unlocksAt: string }>>([]);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const amountNum = parseFloat(amount) || 0;

  useEffect(() => {
    const tier = getTierForAmount(amountNum);
    if (tier) setSelectedTier(tier.key);
  }, [amountNum]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/user/balance');
        const data = await res.json();
        if (data.success && data.lockedDeposits) setActiveDeposits(data.lockedDeposits);
      } catch { /* ignore */ }
    }
    load();
  }, []);

  const tier = TIER_LIST.find(t => t.key === selectedTier) || TIER_LIST[1];
  const daily = amountNum * tier.dailyRate;
  const weekly = daily * 7;
  const monthly = daily * 30;
  const total = daily * tier.duration;

  const chartData = Array.from({ length: 10 }, (_, i) => {
    const day = Math.round((tier.duration / 10) * i);
    return { label: 'Day ' + (day || 1), value: Math.round(daily * day * 100) / 100 };
  });

  function selectAmount(amt: number) {
    setAmount(amt.toString());
    const t = getTierForAmount(amt);
    if (t) setSelectedTier(t.key);
  }

  async function handleGenerateAddress() {
    if (!amountNum || amountNum < tier.minDeposit) return;
    setLoading(true);
    setTimeout(() => { setAddress('TX' + Math.random().toString(36).slice(2, 14).toUpperCase()); setStep(2); setLoading(false); }, 1500);
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0 bg-kt-bg">
      <div className="px-3 sm:px-4 py-4 space-y-4">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: step === s ? '#F0B90B' : step > s ? '#0ECB81' : '#2B3139', color: step >= s ? '#0B0E11' : '#5E6673' }}>
                  {step > s ? '✓' : s}
                </div>
                <span className="text-xs font-medium hidden sm:inline" style={{ color: step >= s ? '#EAECEF' : '#5E6673' }}>
                  {s === 1 ? 'Amount' : s === 2 ? 'Address' : 'Confirm'}
                </span>
              </div>
              {i < 2 && <div className="flex-1 h-0.5" style={{ background: step > s ? '#0ECB81' : '#2B3139' }} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-xl bg-kt-surface border border-kt-border">
              <h2 className="text-lg font-semibold text-kt-text-primary mb-1">Select Your Lock Tier</h2>
              <p className="text-sm text-kt-text-secondary mb-4">Longer locks earn higher daily returns</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {TIER_LIST.map(t => (
                  <button key={t.key} onClick={() => { setSelectedTier(t.key); }}
                    className="relative p-4 rounded-lg text-center transition"
                    style={{ background: '#0B0E11', border: selectedTier === t.key ? '2px solid #F0B90B' : '1px solid #2B3139', boxShadow: selectedTier === t.key ? '0 0 12px rgba(240,185,11,0.15)' : 'none' }}>
                    {t.badge && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold"
                        style={{ background: t.featured ? '#F0B90B' : t.color, color: '#0B0E11' }}>{t.badge}</span>
                    )}
                    <p className="text-sm font-bold mb-1" style={{ color: t.color }}>{t.name}</p>
                    <p className="text-xs text-kt-text-tertiary mb-2">{t.duration} days</p>
                    <p className="text-xl font-extrabold text-kt-green tabular-nums">{(t.dailyRate * 100).toFixed(1)}%</p>
                    <p className="text-[10px] text-kt-text-tertiary">/day</p>
                    <p className="text-[11px] text-kt-text-tertiary mt-1">${t.minDeposit} - {t.maxDeposit === Infinity ? 'Unlimited' : '$' + t.maxDeposit}</p>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-kt-text-primary mb-2 block">Deposit Amount (USD)</label>
                  <div className="flex items-center gap-2">
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                      placeholder="0.00" min={tier.minDeposit}
                      className="flex-1 px-4 py-3 rounded-lg text-lg font-bold text-kt-text-primary"
                      style={{ background: '#0B0E11', border: '1px solid #2B3139', minHeight: 48 }} />
                    <span className="text-sm font-medium text-kt-text-tertiary">USD</span>
                  </div>
                  <p className="text-xs text-kt-text-tertiary mt-1">Min: ${tier.minDeposit} / Max: {tier.maxDeposit === Infinity ? 'Unlimited' : '$' + tier.maxDeposit} ({tier.name})</p>
                  {amountNum > 0 && (amountNum < tier.minDeposit || (tier.maxDeposit !== Infinity && amountNum > tier.maxDeposit)) && (
                    <p className="text-xs text-kt-red mt-1">Amount outside {tier.name} tier range. Try a different tier.</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {QUICK_AMOUNTS.map(a => (
                      <button key={a} onClick={() => selectAmount(a)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium"
                        style={{ background: amountNum === a ? '#F0B90B' : '#2B3139', color: amountNum === a ? '#0B0E11' : '#848E9C' }}>
                        ${a >= 1000 ? a / 1000 + 'k' : a}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-kt-text-primary mb-2 block">Funding Source</label>
                  <div className="flex gap-2">
                    {(['crypto', 'balance'] as const).map(f => (
                      <button key={f} onClick={() => setFundSource(f)}
                        className="flex-1 py-2.5 rounded-lg text-sm font-medium capitalize"
                        style={{ background: fundSource === f ? '#F0B90B' : '#2B3139', color: fundSource === f ? '#0B0E11' : '#848E9C' }}>
                        {f === 'crypto' ? 'Crypto Deposit' : 'Fund from Balance'}
                      </button>
                    ))}
                  </div>
                </div>

                {fundSource === 'crypto' && (
                  <div>
                    <label className="text-sm font-medium text-kt-text-primary mb-2 block">Currency</label>
                    <select value={currency} onChange={e => setCurrency(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg text-sm text-kt-text-primary"
                      style={{ background: '#0B0E11', border: '1px solid #2B3139', minHeight: 48 }}>
                      {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                )}

                <button onClick={handleGenerateAddress} disabled={!amountNum || amountNum < tier.minDeposit || loading}
                  className="w-full py-3.5 rounded-lg text-base font-bold transition disabled:opacity-40"
                  style={{ background: amountNum >= tier.minDeposit ? '#F0B90B' : '#2B3139', color: amountNum >= tier.minDeposit ? '#0B0E11' : '#5E6673' }}>
                  {loading ? 'Generating...' : 'Generate Deposit Address'}
                </button>
              </div>
            </div>

            {step >= 2 && address && (
              <div className="p-5 rounded-xl bg-kt-surface border border-kt-border">
                <h3 className="text-sm font-bold text-kt-text-primary mb-3">Your Deposit Address</h3>
                <div className="p-4 rounded-lg text-center bg-kt-bg border border-kt-border">
                  <p className="text-xs text-kt-text-tertiary mb-2">Send only {currency} to this address</p>
                  <code className="text-sm font-bold text-kt-green break-all select-all">{address}</code>
                </div>
                <p className="text-xs text-kt-text-tertiary mt-3">Once your deposit is confirmed on the blockchain, funds will appear in your locked balance.</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-kt-surface border border-kt-border">
              <h3 className="text-sm font-bold text-kt-text-primary mb-3">Your Projected Earnings</h3>
              {amountNum > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { l: 'Daily', v: daily, c: '#0ECB81' },
                      { l: 'Weekly', v: weekly, c: '#0ECB81' },
                      { l: 'Monthly', v: monthly, c: '#F0B90B' },
                      { l: 'Total (' + tier.duration + 'd)', v: total, c: '#EAECEF' },
                    ].map(r => (
                      <div key={r.l} className="p-2.5 rounded-lg text-center bg-kt-bg">
                        <p className="text-[10px] text-kt-text-tertiary">{r.l}</p>
                        <p className="text-sm font-bold" style={{ color: r.c }}>${r.v.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ width: '100%', height: 120 }}>
                    <ResponsiveContainer>
                      <ComposedChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                        <defs><linearGradient id="dep-green" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0ECB81" stopOpacity={0.3}/><stop offset="100%" stopColor="#0ECB81" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid {...defaultGridProps} />
                        <XAxis dataKey="label" hide />
                        <Area type="monotone" dataKey="value" stroke="#0ECB81" strokeWidth={1.5} fill="url(#dep-green)" dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <p className="text-sm text-kt-text-tertiary text-center py-8">Enter amount to see projections</p>
              )}
            </div>

            <div className="p-5 rounded-xl bg-kt-surface border border-kt-border">
              <h3 className="text-sm font-bold text-kt-text-primary mb-3">Your Active Deposits</h3>
              {activeDeposits.length > 0 ? (
                <div className="space-y-2">
                  {activeDeposits.slice(0, 5).map(d => (
                    <div key={d.id} className="flex items-center gap-2 p-2.5 rounded-lg text-xs bg-kt-bg">
                      <span className="px-1.5 py-0.5 rounded font-bold" style={{ background: '#F0B90B20', color: '#F0B90B' }}>{d.tier}</span>
                      <span className="text-kt-text-primary font-bold">${d.amount.toFixed(0)}</span>
                      <span className="text-kt-text-tertiary ml-auto">{(d.dailyRate * 100).toFixed(1)}%/day</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-kt-text-tertiary text-center py-6">No active deposits yet.</p>
              )}
            </div>

            <div className="p-5 rounded-xl bg-kt-surface border border-kt-border">
              <h3 className="text-sm font-bold text-kt-text-primary mb-3">Important Information</h3>
              <ul className="space-y-2 text-xs text-kt-text-secondary">
                <li className="flex gap-2"><span className="text-kt-gold">•</span> Deposits are locked for the selected tier duration</li>
                <li className="flex gap-2"><span className="text-kt-gold">•</span> Early withdrawal incurs a 25% forfeit fee</li>
                <li className="flex gap-2"><span className="text-kt-gold">•</span> Daily returns are projected, not guaranteed</li>
                <li className="flex gap-2"><span className="text-kt-gold">•</span> Minimum deposit: $50 (Silver tier)</li>
                <li className="flex gap-2"><span className="text-kt-gold">•</span> $50 signup credit is non-withdrawable</li>
                <li className="flex gap-2"><span className="text-kt-gold">•</span> AI Trading Engine manages all trades automatically</li>
              </ul>
              <p className="text-[10px] text-kt-text-tertiary mt-3">Projected returns are estimates and not guaranteed.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
