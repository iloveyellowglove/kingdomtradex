'use client';

import { useState } from 'react';
import { fmt } from '@/lib/utils/formatting';

type Step = 'amount' | 'address' | 'confirm';

interface InvoiceData {
  deposit_id: number;
  txn_id: string;
  address: string;
  currency: string;
  amount: number;
}

const QR_API = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=FFD700&bg=0e0b1a&data=';

export default function DepositPage() {
  const [step, setStep] = useState<Step>('amount');
  const [currency, setCurrency] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [depositStatus, setDepositStatus] = useState<string | null>(null);

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const csrfToken = document.cookie.split('; ').find((r) => r.startsWith('csrf_guest='))?.split('=')[1] || '';

    const res = await fetch('/api/deposit/create-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify({ currency, amount: parseFloat(amount) }),
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
    setCurrency('USDT');
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
          <div className="card-header"><h5 className="mb-0">Step 1: Select Currency & Amount</h5></div>
          <div className="card-body">
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-text-secondary font-medium mb-1">Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full">
                  <option value="USDT">USDT (TRC-20)</option>
                  <option value="BTC">Bitcoin (BTC)</option>
                  <option value="ETH">Ethereum (ETH)</option>
                </select>
              </div>
              <div>
                <label className="block text-text-secondary font-medium mb-1">Amount</label>
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
                    {currency}
                  </span>
                </div>
              </div>
              <button type="submit" disabled={loading || !amount || parseFloat(amount) <= 0} className="btn-primary w-full py-3 rounded-lg">
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

              <div className="alert alert-warning text-sm">
                <strong>Important:</strong> Only send {invoice.currency} to this address. Sending other currencies will result in permanent loss.
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={reset} className="flex-1 py-3 rounded-lg text-sm font-medium border border-border-light text-text-primary hover:bg-white/5 transition">
              Cancel & Start Over
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
