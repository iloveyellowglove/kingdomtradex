'use client';

import { useState, useEffect, useRef } from 'react';
import { fmt } from '@/lib/utils/formatting';
import { DEPOSIT_CURRENCIES, coinIconUrl } from '@/lib/currencies';
import LockTierSelector, { type TierConfig } from '@/components/deposit/LockTierSelector';

type Step = 'amount' | 'address' | 'confirm';

interface InvoiceData {
  deposit_id: number;
  txn_id: string;
  address: string;
  currency: string;
  amount: number;
  pay_amount?: number;
  pay_currency?: string;
  expiration?: string;
}

const QR_API = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=FFD700&bg=0e0b1a&data=';


export default function DepositPage() {
  const [step, setStep] = useState<Step>('amount');
  const [currencyId, setCurrencyId] = useState('USDT_TRX');
  const [amount, setAmount] = useState('');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedTierConfig, setSelectedTierConfig] = useState<TierConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [depositStatus, setDepositStatus] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const csrfTokenRef = useRef('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/csrf')
      .then((r) => r.json())
      .then((d) => { csrfTokenRef.current = d.csrfToken || ''; })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const selectedCurrency = DEPOSIT_CURRENCIES.find(c => c.id === currencyId) || DEPOSIT_CURRENCIES[0];

  const stablecoins = DEPOSIT_CURRENCIES.filter(c => c.category === 'stablecoin');
  const majors = DEPOSIT_CURRENCIES.filter(c => c.category === 'major');
  const alts = DEPOSIT_CURRENCIES.filter(c => c.category === 'alt');

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/deposit/create-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfTokenRef.current },
      body: JSON.stringify({
        currency: currencyId,
        amount: parseFloat(amount),
        tier: selectedTierConfig?.tier,
        lock_months: selectedTierConfig?.lock_months,
      }),
    });

    const data = await res.json();
    if (data.success) {
      setInvoice(data);
      setStep('address');
    } else {
      setError(data.error || 'Failed to create deposit invoice.');
    }
    setLoading(false);
  }

  async function checkStatus() {
    if (!invoice) return;
    setLoading(true);

    const res = await fetch(`/api/deposit/status/${invoice.txn_id}`);
    const data = await res.json();

    if (data.success && data.deposit) {
      setDepositStatus(data.deposit.status);
      if (data.deposit.status === 'completed') {
        setStep('confirm');
      }
    }
    setLoading(false);
  }

  function copyAddress() {
    if (invoice?.address) {
      navigator.clipboard.writeText(invoice.address);
    }
  }

  function reset() {
    setStep('amount');
    setAmount('');
    setSelectedTier(null);
    setSelectedTierConfig(null);
    setCurrencyId('USDT_TRX');
    setInvoice(null);
    setDepositStatus(null);
    setError('');
  }

  return (
    <div className="py-4 max-w-2xl mx-auto">
      <h2 className="mb-2">Deposit Funds</h2>
      <p className="text-text-muted mb-6">Send crypto to your deposit address to fund your account</p>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {(['amount', 'address', 'confirm'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === s ? 'bg-temple-gold text-bg-dark' :
              ['amount', 'address', 'confirm'].indexOf(step) > i ? 'bg-success text-white' :
              'bg-card-bg border border-border-light text-text-muted'
            }`}>
              {['amount', 'address', 'confirm'].indexOf(step) > i ? '✓' : i + 1}
            </div>
            <span className={`text-sm ${step === s ? 'text-temple-gold font-medium' : 'text-text-muted'}`}>
              {s === 'amount' ? 'Amount' : s === 'address' ? 'Address' : 'Confirm'}
            </span>
            {i < 2 && <div className="w-8 h-px bg-border-light" />}
          </div>
        ))}
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      {/* Step 1: Select amount and currency */}
      {step === 'amount' && (
        <div className="card">
          <div className="card-header"><h5 className="mb-0">Step 1: Amount, Lock Tier &amp; Currency</h5></div>
          <div className="card-body">
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-text-secondary font-medium mb-1">Amount (USD)</label>
                <div className="flex">
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="0.01"
                    placeholder="0.00"
                    className="flex-1 rounded-r-none"
                  />
                  <span className="bg-border border border-border-light text-text-secondary px-4 flex items-center rounded-r-lg">
                    USD
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  Min deposit: $100 USD (members) / $200 USD (pastors)
                </p>
              </div>

              <LockTierSelector
                amount={parseFloat(amount) || 0}
                selectedTier={selectedTier}
                onSelect={(tier) => {
                  setSelectedTier(tier.tier);
                  setSelectedTierConfig(tier);
                }}
              />

              <div>
                <label className="block text-text-secondary font-medium mb-1">Currency</label>

                {/* Custom dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border-light bg-bg-dark text-left hover:border-temple-gold/50 transition"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coinIconUrl(selectedCurrency.iconSlug)}
                      alt=""
                      width={24}
                      height={24}
                      className="rounded-full flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="flex-1">
                      <span className="text-text-primary font-medium">{selectedCurrency.symbol}</span>
                      <span className="text-text-muted text-sm ml-2">{selectedCurrency.name}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-white/5 text-text-muted">
                      {selectedCurrency.network}
                    </span>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M1 1l4 4 4-4" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div
                      className="absolute left-0 right-0 top-full mt-1 border border-white/10 rounded-lg shadow-2xl z-50 max-h-80 overflow-y-auto"
                      style={{ background: '#1a1a2e' }}
                    >
                      {[
                        { label: 'Stablecoins', items: stablecoins },
                        { label: 'Major Coins', items: majors },
                        { label: 'Altcoins', items: alts },
                      ].map(group => (
                        <div key={group.label}>
                          <div className="px-4 py-2 text-xs font-semibold text-white/30 uppercase tracking-wider">
                            {group.label}
                          </div>
                          {group.items.map(currency => (
                            <button
                              key={currency.id}
                              type="button"
                              onClick={() => {
                                setCurrencyId(currency.id);
                                setDropdownOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition ${
                                currency.id === currencyId ? 'bg-white/5 text-temple-gold' : 'text-text-primary'
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={coinIconUrl(currency.iconSlug)}
                                alt=""
                                width={22}
                                height={22}
                                className="rounded-full flex-shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                              <span className="flex-1 text-sm">{currency.symbol}</span>
                              <span className="text-xs text-text-muted">{currency.name}</span>
                              <span className="px-1.5 py-0.5 rounded text-xs bg-white/5 text-white/40">
                                {currency.network}
                              </span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !amount || parseFloat(amount) <= 0 || !selectedTier}
                className="btn-primary w-full py-3 rounded-lg"
              >
                {loading ? 'Generating...' : 'Generate Deposit Address'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Step 2: Show deposit address with QR */}
      {step === 'address' && invoice && (
        <div className="space-y-6">
          <div className="card" style={{
            border: '1px solid transparent',
            borderImage: 'linear-gradient(135deg, #FFD700, #6A0DAD) 1',
          }}>
            <div className="card-header"><h5 className="mb-0">Step 2: Send {invoice.currency}</h5></div>
            <div className="card-body text-center">
              <p className="text-text-muted mb-4">
                Send exactly <strong className="text-temple-gold">{fmt(invoice.amount)} {invoice.currency}</strong> to the address below
              </p>

              {invoice.pay_amount && (
                <p className="text-text-muted text-xs mb-3">
                  Expected: {fmt(invoice.pay_amount)} {invoice.pay_currency}
                </p>
              )}

              {/* QR Code */}
              <div className="inline-block p-4 rounded-xl mb-4" style={{
                background: '#0e0b1a',
                border: '2px solid #FFD700',
                boxShadow: '0 0 24px rgba(255,215,0,0.15)',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${QR_API}${encodeURIComponent(invoice.address)}`}
                  alt="Deposit QR Code"
                  width={200}
                  height={200}
                  className="block"
                />
              </div>

              {/* Address */}
              <div className="bg-dark-indigo rounded-xl p-4 mb-4">
                <p className="text-text-muted text-xs mb-2">Deposit Address ({invoice.currency})</p>
                <code className="block break-all text-sm text-temple-gold">{invoice.address}</code>
              </div>

              <button onClick={copyAddress} className="btn-primary px-6 py-2 rounded-lg text-sm mb-4">
                Copy Address
              </button>

              {invoice.expiration && (
                <p className="text-xs text-text-muted mb-4">
                  Expires: {new Date(invoice.expiration).toLocaleString()}
                </p>
              )}

              <div className="alert alert-warning text-sm">
                <strong>Important:</strong> Only send {invoice.currency} to this address. Sending other currencies will result in permanent loss.
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={reset} className="flex-1 py-3 rounded-lg text-sm font-medium border border-border-light text-text-primary hover:bg-white/5 transition">
              Cancel &amp; Start Over
            </button>
            <button onClick={checkStatus} disabled={loading} className="flex-1 btn-primary py-3 rounded-lg text-sm">
              {loading ? 'Checking...' : 'I Have Sent the Funds'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 'confirm' && (
        <div className="card text-center" style={{
          border: '1px solid transparent',
          borderImage: 'linear-gradient(135deg, #FFD700, #6A0DAD) 1',
        }}>
          <div className="card-body py-8">
            <div className="text-5xl mb-4">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" className="mx-auto">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 className="text-success mb-2">Deposit Confirmed!</h3>
            <p className="text-text-muted mb-6">
              Your deposit of <strong className="text-temple-gold">{invoice && fmt(invoice.amount)} {invoice?.currency}</strong> is being processed.
            </p>
            <div className="alert alert-info text-sm mb-6">
              Your balance will update once the transaction receives blockchain confirmations. This typically takes 10-30 minutes.
            </div>
            <div className="flex gap-4">
              <a href="/dashboard" className="flex-1 btn-primary py-3 rounded-lg text-center no-underline">
                Back to Dashboard
              </a>
              <button onClick={reset} className="flex-1 py-3 rounded-lg text-sm font-medium border border-border-light text-text-primary hover:bg-white/5 transition">
                Make Another Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checking status */}
      {depositStatus === 'pending' && step === 'address' && (
        <div className="alert alert-info mt-4 text-center">
          <p className="mb-0">Deposit is still pending. Please wait for blockchain confirmations.</p>
          <button onClick={checkStatus} className="btn-primary mt-3 px-4 py-2 rounded-lg text-sm">
            Check Again
          </button>
        </div>
      )}
    </div>
  );
}
