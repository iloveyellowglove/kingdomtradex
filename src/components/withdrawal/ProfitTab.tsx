'use client';

import { useState, useEffect, useRef } from 'react';
import ConfirmationModal from './ConfirmationModal';
import { DEPOSIT_CURRENCIES, coinIconUrl } from '@/lib/currencies';

interface EligibilityData {
  eligible: boolean;
  reason?: string;
  nextEligibleAt?: string | null;
  kycLevel: number;
  availableProfit: number;
  withdrawalFrequency: 'daily' | 'weekly' | null;
}

export default function ProfitTab() {
  const [amount, setAmount] = useState('');
  const [currencyId, setCurrencyId] = useState('USDT_TRX');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [countdown, setCountdown] = useState('');
  const csrfTokenRef = useRef('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch('/api/csrf')
      .then((r) => r.json())
      .then((d) => { csrfTokenRef.current = d.csrfToken || ''; })
      .catch(() => {});

    fetchEligibility();
  }, []);

  useEffect(() => {
    if (!eligibility?.nextEligibleAt) {
      setCountdown('');
      return;
    }

    function tick() {
      const remaining = new Date(eligibility!.nextEligibleAt!).getTime() - Date.now();
      if (remaining <= 0) {
        setCountdown('');
        fetchEligibility();
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    }

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [eligibility?.nextEligibleAt]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  async function fetchEligibility() {
    try {
      const res = await fetch('/api/user/balance');
      const data = await res.json();
      if (data.success) {
        setEligibility({
          eligible: data.eligible ?? true,
          kycLevel: data.kycLevel ?? 0,
          availableProfit: data.profitBalance ?? 0,
          withdrawalFrequency: data.withdrawalFrequency ?? null,
        });
      }
    } catch { /* ignore */ }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const amt = parseFloat(amount);
    if (!amt || amt < 25) {
      setError('Minimum withdrawal is $25.00.');
      return;
    }
    if (!walletAddress.trim() || walletAddress.trim().length < 10) {
      setError('Please enter a valid wallet address.');
      return;
    }
    setModalOpen(true);
  }

  async function confirmWithdrawal() {
    setModalOpen(false);
    setLoading(true);
    setError('');

    const res = await fetch('/api/withdraw/profit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfTokenRef.current,
      },
      body: JSON.stringify({
        amount: parseFloat(amount),
        currency: currencyId,
        wallet_address: walletAddress.trim(),
      }),
    });

    const data = await res.json();
    if (data.success) {
      setSuccess('Withdrawal submitted! You will receive your funds after processing.');
      setAmount('');
      setWalletAddress('');
      fetchEligibility();
    } else {
      setError(data.error || 'Failed to submit withdrawal.');
    }
    setLoading(false);
  }

  const selectedCurrency = DEPOSIT_CURRENCIES.find(c => c.id === currencyId) || DEPOSIT_CURRENCIES[0];
  const stablecoins = DEPOSIT_CURRENCIES.filter(c => c.category === 'stablecoin');
  const majors = DEPOSIT_CURRENCIES.filter(c => c.category === 'major');
  const alts = DEPOSIT_CURRENCIES.filter(c => c.category === 'alt');
  const kycLevel = eligibility?.kycLevel ?? 0;
  const availableProfit = eligibility?.availableProfit ?? 0;
  const maxAmount = Math.min(availableProfit, 100000);

  return (
    <div>
      {/* KYC Level indicator */}
      <div
        className="flex items-center gap-3 p-4 rounded-lg mb-4"
        style={{
          background: kycLevel >= 2
            ? 'rgba(76,175,80,0.08)'
            : kycLevel >= 1
              ? 'rgba(255,193,7,0.08)'
              : 'rgba(244,67,54,0.08)',
          border: `1px solid ${
            kycLevel >= 2 ? 'rgba(76,175,80,0.25)' : kycLevel >= 1 ? 'rgba(255,193,7,0.25)' : 'rgba(244,67,54,0.25)'
          }`,
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: kycLevel >= 2 ? 'rgba(76,175,80,0.2)' : kycLevel >= 1 ? 'rgba(255,193,7,0.2)' : 'rgba(244,67,54,0.2)',
          }}
        >
          {kycLevel >= 2 ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          ) : kycLevel >= 1 ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFC107" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F44336" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            {kycLevel >= 2 ? 'KYC Level 2 - ID Verified' : kycLevel >= 1 ? 'KYC Level 1 - Email Verified' : 'KYC Level 0 - Unverified'}
          </p>
          <p className="text-xs text-white/50">
            {kycLevel >= 2
              ? 'You can withdraw daily.'
              : kycLevel >= 1
                ? 'You can withdraw once per week. Complete ID verification for daily withdrawals.'
                : 'Verify your email to unlock withdrawals.'}
          </p>
        </div>
      </div>

      {/* Countdown timer */}
      {countdown && (
        <div
          className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm text-[#FFC107]"
          style={{ background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.2)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Next withdrawal available in: <span className="font-bold">{countdown}</span>
        </div>
      )}

      {/* Available balance */}
      <div className="mb-4 text-center">
        <p className="text-xs text-white/40 uppercase tracking-wider">Available Profit Balance</p>
        <p className="text-3xl font-bold text-[#4CAF50]">${availableProfit.toFixed(2)}</p>
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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-sm text-white/60 font-medium mb-1.5">Amount (USD)</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min={25}
              max={maxAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="25.00"
              className="w-full px-4 py-3 rounded-lg text-white text-base"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                minHeight: 48,
              }}
            />
            <button
              type="button"
              onClick={() => setAmount(availableProfit.toFixed(2))}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs font-bold"
              style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700', minHeight: 32, minWidth: 44 }}
            >
              MAX
            </button>
          </div>
          <p className="text-xs text-white/40 mt-1">Min: $25.00 · Available: ${availableProfit.toFixed(2)}</p>
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm text-white/60 font-medium mb-1.5">Receive Currency</label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-white/10 text-left hover:border-[#FFD700]/50 transition"
              style={{ background: 'rgba(255,255,255,0.04)', minHeight: 48 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coinIconUrl(selectedCurrency.iconSlug)} alt="" width={24} height={24} className="rounded-full flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div className="flex-1">
                <span className="text-white font-medium">{selectedCurrency.symbol}</span>
                <span className="text-white/40 text-sm ml-2">{selectedCurrency.name}</span>
              </div>
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-white/5 text-white/40">{selectedCurrency.network}</span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 1l4 4 4-4"/></svg>
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 border border-white/10 rounded-lg shadow-2xl z-50 max-h-72 overflow-y-auto"
                style={{ background: '#1a1a2e' }}>
                {[
                  { label: 'Stablecoins', items: stablecoins },
                  { label: 'Major Coins', items: majors },
                  { label: 'Altcoins', items: alts },
                ].map(group => (
                  <div key={group.label}>
                    <div className="px-4 py-2 text-xs font-semibold text-white/30 uppercase tracking-wider">{group.label}</div>
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
                        <span className="flex-1 text-sm text-white">{currency.symbol}</span>
                        <span className="text-xs text-white/40">{currency.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-xs bg-white/5 text-white/40">{currency.network}</span>
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
          <label className="block text-sm text-white/60 font-medium mb-1.5">Wallet Address</label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            required
            minLength={10}
            placeholder={`Your ${selectedCurrency.network} address`}
            className="w-full px-4 py-3 rounded-lg text-white text-base"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              minHeight: 48,
            }}
          />
          <p className="text-xs text-white/40 mt-1">Double check the address. Wrong addresses cannot be recovered.</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !eligibility?.eligible || !amount || parseFloat(amount) < 25 || !walletAddress.trim()}
          className="w-full py-3.5 rounded-lg text-sm font-bold transition disabled:opacity-40"
          style={{
            background: '#FFD700',
            color: '#000',
            minHeight: 48,
          }}
        >
          {loading ? 'Submitting...' : `Withdraw $${amount ? parseFloat(amount).toFixed(2) : '0.00'}`}
        </button>
      </form>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmWithdrawal}
        title="Confirm Withdrawal"
        loading={loading}
      >
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-white/50">Amount:</span>
            <span className="text-white font-bold">${parseFloat(amount || '0').toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Currency:</span>
            <span className="text-white">{selectedCurrency.symbol} ({selectedCurrency.network})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Wallet:</span>
            <span className="text-white text-xs font-mono max-w-[180px] truncate">{walletAddress.trim()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Network Fee:</span>
            <span className="text-white/50 text-xs">Calculated at processing</span>
          </div>
          <hr className="border-t border-white/5" />
          <p className="text-xs text-white/40">
            Withdrawals are typically processed within 24-48 hours. Network fees vary by blockchain.
          </p>
        </div>
      </ConfirmationModal>
    </div>
  );
}
