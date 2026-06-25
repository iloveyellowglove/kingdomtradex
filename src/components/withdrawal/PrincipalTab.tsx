'use client';

import { useState, useEffect, useRef } from 'react';
import ConfirmationModal from './ConfirmationModal';
import { DEPOSIT_CURRENCIES, coinIconUrl } from '@/lib/currencies';

interface LockedDeposit {
  id: string;
  amount: number;
  tier: string;
  lockDays: number;
  dailyRate: number;
  lockedAt: string;
  unlocksAt: string;
  status: string;
  timeRemaining: number;
  forfeitAmount: number;
  netIfEarly: number;
}

export default function PrincipalTab() {
  const [deposits, setDeposits] = useState<LockedDeposit[]>([]);
  const [selectedDeposit, setSelectedDeposit] = useState<LockedDeposit | null>(null);
  const [currencyId, setCurrencyId] = useState('USDT_TRX');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [signupCredit, setSignupCredit] = useState(50);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const csrfTokenRef = useRef('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/csrf')
      .then((r) => r.json())
      .then((d) => { csrfTokenRef.current = d.csrfToken || ''; })
      .catch(() => {});
    fetchDeposits();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  async function fetchDeposits() {
    try {
      const res = await fetch('/api/user/balance');
      const data = await res.json();
      if (data.success) {
        setDeposits(data.lockedDeposits ?? []);
        setSignupCredit(data.signupCredit ?? 50);
      }
    } catch { /* ignore */ }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!selectedDeposit) { setError('Please select a deposit.'); return; }
    if (!walletAddress.trim() || walletAddress.trim().length < 10) {
      setError('Please enter a valid wallet address.'); return;
    }
    setModalOpen(true);
  }

  async function confirmWithdrawal() {
    setModalOpen(false);
    setLoading(true);
    setError('');

    const res = await fetch('/api/withdraw/principal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfTokenRef.current,
      },
      body: JSON.stringify({
        deposit_id: selectedDeposit?.id,
        currency: currencyId,
        wallet_address: walletAddress.trim(),
      }),
    });

    const data = await res.json();
    if (data.success) {
      setSuccess(data.message || 'Principal withdrawal submitted.');
      setSelectedDeposit(null);
      setWalletAddress('');
      fetchDeposits();
    } else {
      setError(data.error || 'Failed to submit withdrawal.');
    }
    setLoading(false);
  }

  function formatTimeRemaining(ms: number): string {
    if (ms <= 0) return 'Matured';
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  }

  function tierColor(tier: string): string {
    const colors: Record<string, string> = {
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2',
      diamond: '#B9F2FF',
    };
    return colors[tier] ?? '#FFD700';
  }

  const selectedCurrency = DEPOSIT_CURRENCIES.find(c => c.id === currencyId) || DEPOSIT_CURRENCIES[0];
  const stablecoins = DEPOSIT_CURRENCIES.filter(c => c.category === 'stablecoin');
  const majors = DEPOSIT_CURRENCIES.filter(c => c.category === 'major');
  const alts = DEPOSIT_CURRENCIES.filter(c => c.category === 'alt');

  return (
    <div>
      {/* Signup credit notice */}
      <div
        className="flex items-center gap-3 p-4 rounded-lg mb-4"
        style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.15)' }}
      >
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,215,0,0.12)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-kt-gold">Platform Credit - Non-withdrawable</p>
          <p className="text-xs text-white/50">
            Your ${signupCredit.toFixed(2)} signup credit is provided by the platform and cannot be withdrawn.
            Only deposited funds can be withdrawn as principal.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm text-red-400" style={{ background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.2)' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg text-sm text-green-400" style={{ background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.2)' }}>
          {success}
        </div>
      )}

      {/* Locked deposits list */}
      {deposits.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <p className="text-white/40 text-sm">No locked deposits found.</p>
          <p className="text-white/25 text-xs mt-1">Deposits must be locked in a tier before principal withdrawal.</p>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {deposits.map((d) => {
            const isMatured = d.timeRemaining <= 0;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDeposit(selectedDeposit?.id === d.id ? null : d)}
                className="w-full text-left p-4 rounded-lg transition"
                style={{
                  background: selectedDeposit?.id === d.id ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)',
                  border: selectedDeposit?.id === d.id ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.06)',
                  minHeight: 44,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold"
                      style={{ background: `${tierColor(d.tier)}20`, color: tierColor(d.tier) }}>
                      {d.tier.toUpperCase()}
                    </span>
                    <span className="ml-2 text-kt-text-primary font-bold">${d.amount.toFixed(2)}</span>
                  </div>
                  <span className={`text-xs font-medium ${isMatured ? 'text-green-400' : 'text-kt-gold'}`}>
                    {isMatured ? 'Matured' : formatTimeRemaining(d.timeRemaining)}
                  </span>
                </div>

                {selectedDeposit?.id === d.id && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-white/40">Tier:</span>
                        <span className="ml-1 text-kt-text-primary capitalize">{d.tier}</span>
                      </div>
                      <div>
                        <span className="text-white/40">Lock:</span>
                        <span className="ml-1 text-kt-text-primary">{d.lockDays} days</span>
                      </div>
                      <div>
                        <span className="text-white/40">Daily Rate:</span>
                        <span className="ml-1 text-kt-green">{(d.dailyRate * 100).toFixed(2)}%</span>
                      </div>
                      <div>
                        <span className="text-white/40">Matures:</span>
                        <span className="ml-1 text-kt-text-primary">{new Date(d.unlocksAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {!isMatured && (
                      <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: 'rgba(244,67,54,0.08)', border: '1px solid rgba(244,67,54,0.2)' }}>
                        <p className="text-red-400 font-semibold mb-1">⚠️ Early Withdrawal - 25% Forfeit</p>
                        <div className="flex justify-between text-red-300/70">
                          <span>Original deposit:</span>
                          <span>${d.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-red-300/70">
                          <span>Forfeit (25%):</span>
                          <span>-${d.forfeitAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-red-300 font-bold mt-1 pt-1 border-t border-red-400/10">
                          <span>You receive:</span>
                          <span>${d.netIfEarly.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Withdrawal form (shown when deposit selected) */}
      {selectedDeposit && (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Currency */}
          <div>
            <label className="block text-sm text-kt-text-secondary font-medium mb-1.5">Receive Currency</label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-kt-border text-left hover:border-[#FFD700]/50 transition"
                style={{ background: 'rgba(255,255,255,0.04)', minHeight: 48 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coinIconUrl(selectedCurrency.iconSlug)} alt="" width={24} height={24} className="rounded-full flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div className="flex-1">
                  <span className="text-kt-text-primary font-medium">{selectedCurrency.symbol}</span>
                  <span className="text-white/40 text-sm ml-2">{selectedCurrency.name}</span>
                </div>
                <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-kt-hover-bg text-white/40">{selectedCurrency.network}</span>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 1l4 4 4-4"/></svg>
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 border border-kt-border rounded-lg shadow-2xl z-50 max-h-72 overflow-y-auto"
                  style={{ background: '#1a1a2e' }}>
                  {[
                    { label: 'Stablecoins', items: stablecoins },
                    { label: 'Major Coins', items: majors },
                    { label: 'Altcoins', items: alts },
                  ].map(group => (
                    <div key={group.label}>
                      <div className="px-4 py-2 text-xs font-semibold text-kt-text-tertiary uppercase tracking-wider">{group.label}</div>
                      {group.items.map(currency => (
                        <button
                          key={currency.id}
                          type="button"
                          onClick={() => { setCurrencyId(currency.id); setDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition"
                          style={{ minHeight: 44 }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={coinIconUrl(currency.iconSlug)} alt="" width={22} height={22} className="rounded-full flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          <span className="flex-1 text-sm text-kt-text-primary">{currency.symbol}</span>
                          <span className="text-xs text-white/40">{currency.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-xs bg-kt-hover-bg text-white/40">{currency.network}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Wallet address */}
          <div>
            <label className="block text-sm text-kt-text-secondary font-medium mb-1.5">Wallet Address</label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              required
              minLength={10}
              placeholder={`Your ${selectedCurrency.network} address`}
              className="w-full px-4 py-3 rounded-lg text-kt-text-primary text-base"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                minHeight: 48,
              }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !walletAddress.trim()}
            className="w-full py-3.5 rounded-lg text-sm font-bold transition disabled:opacity-40"
            style={{
              background: '#FFD700',
              color: '#000',
              minHeight: 48,
            }}
          >
            {loading ? 'Submitting...' : `Withdraw $${selectedDeposit.amount.toFixed(2)} Principal`}
          </button>
        </form>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmWithdrawal}
        title="Confirm Principal Withdrawal"
        loading={loading}
      >
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-white/50">Deposit:</span>
            <span className="text-kt-text-primary font-bold">${selectedDeposit?.amount.toFixed(2)}</span>
          </div>
          {selectedDeposit && selectedDeposit.timeRemaining > 0 && (
            <>
              <div className="flex justify-between text-red-400">
                <span>Forfeit (25%):</span>
                <span>-${selectedDeposit.forfeitAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-kt-text-primary font-semibold">Net amount:</span>
                <span className="text-kt-gold font-bold">${selectedDeposit.netIfEarly.toFixed(2)}</span>
              </div>
            </>
          )}
          <hr className="border-t border-white/5" />
          <p className="text-xs text-white/40">
            By withdrawing principal, you forfeit any future earnings on this deposit.
            {selectedDeposit && selectedDeposit.timeRemaining > 0 && ' Early withdrawal incurs a 25% penalty.'}
          </p>
        </div>
      </ConfirmationModal>
    </div>
  );
}
