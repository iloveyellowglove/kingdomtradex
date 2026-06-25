'use client';

import { useState, useEffect, useRef } from 'react';
import KycStatusBadge from '@/components/kyc/KycStatusBadge';

export default function KycPage() {
  const [kycLevel, setKycLevel] = useState(0);
  const [kycStatus, setKycStatus] = useState<string>('unverified');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [reviewedAt, setReviewedAt] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Upload state
  const [idDocFile, setIdDocFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idDocPreview, setIdDocPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const csrfTokenRef = useRef('');

  useEffect(() => {
    fetch('/api/csrf')
      .then(r => r.json())
      .then(d => { csrfTokenRef.current = d.csrfToken || ''; })
      .catch(() => {});

    async function load() {
      try {
        const res = await fetch('/api/profile/kyc');
        const data = await res.json();
        if (!data.error) {
          // Map status to level
          const status = data.status || 'unverified';
          setKycStatus(status);
          setRejectionReason(data.rejectionReason || null);
          setReviewedAt(data.reviewedAt || null);
          setSubmittedAt(data.submittedAt || null);

          if (status === 'verified') setKycLevel(2);
          else if (status === 'pending') setKycLevel(1); // at least email verified to submit
          else if (status === 'unverified') {
            // Check actual kyc_level from balance endpoint
            try {
              const bRes = await fetch('/api/user/balance');
              const bData = await bRes.json();
              if (bData.success) setKycLevel(bData.kycLevel ?? 0);
            } catch { /* ignore */ }
          }
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  function handleFileSelect(type: 'id' | 'selfie', file: File | null) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG, and WebP images are accepted.');
      return;
    }

    const url = URL.createObjectURL(file);
    if (type === 'id') {
      setIdDocFile(file);
      setIdDocPreview(url);
    } else {
      setSelfieFile(file);
      setSelfiePreview(url);
    }
    setError('');
  }

  async function handleSubmit() {
    if (!idDocFile || !selfieFile) {
      setError('Please upload both your ID document and a selfie.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Upload ID document
      const idForm = new FormData();
      idForm.append('file', idDocFile);
      idForm.append('type', 'document');
      const idRes = await fetch('/api/profile/kyc/upload', {
        method: 'POST',
        headers: { 'x-csrf-token': csrfTokenRef.current },
        body: idForm,
      });
      const idData = await idRes.json();
      if (!idData.success) {
        setError(idData.error || 'Failed to upload ID document.');
        setSubmitting(false);
        return;
      }

      // Upload selfie
      const selfieForm = new FormData();
      selfieForm.append('file', selfieFile);
      selfieForm.append('type', 'selfie');
      const selfieRes = await fetch('/api/profile/kyc/upload', {
        method: 'POST',
        headers: { 'x-csrf-token': csrfTokenRef.current },
        body: selfieForm,
      });
      const selfieData = await selfieRes.json();
      if (!selfieData.success) {
        setError(selfieData.error || 'Failed to upload selfie.');
        setSubmitting(false);
        return;
      }

      // Submit KYC
      const kycRes = await fetch('/api/profile/kyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfTokenRef.current,
        },
        body: JSON.stringify({
          document_type: 'national_id',
          document_url: idData.url,
          selfie_url: selfieData.url,
        }),
      });
      const kycData = await kycRes.json();
      if (kycData.success || kycData.status === 'pending') {
        setKycStatus('pending');
        setKycLevel(1);
        setSuccess('Your documents have been submitted for review. This typically takes 24-48 hours.');
        setIdDocFile(null);
        setSelfieFile(null);
        setIdDocPreview(null);
        setSelfiePreview(null);
      } else {
        setError(kycData.error || 'Failed to submit KYC.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-4 max-w-lg mx-auto px-4">
      <h2 className="text-xl font-bold text-white mb-1">Identity Verification</h2>
      <p className="text-sm text-white/40 mb-6">Verify your identity to unlock full platform features</p>

      {/* Status card */}
      <div
        className="p-5 rounded-xl mb-6"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Verification Status</h3>
          <KycStatusBadge
            level={kycLevel}
            status={kycStatus}
            rejectionReason={rejectionReason}
            reviewedAt={reviewedAt}
            size="md"
          />
        </div>

        {/* KYC level explanation */}
        <div className="space-y-2 mt-4">
          <div className="flex items-center gap-3 text-sm">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              kycLevel >= 1 ? 'text-[#4CAF50]' : 'text-white/30'
            }`} style={{ background: kycLevel >= 1 ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.05)' }}>
              {kycLevel >= 1 ? '✓' : '1'}
            </div>
            <div>
              <span className={kycLevel >= 1 ? 'text-[#4CAF50]' : 'text-white/50'}>Level 1 - Email Verification</span>
              <p className="text-xs text-white/30">Weekly profit withdrawals up to $5,000</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              kycLevel >= 2 ? 'text-[#4CAF50]' : 'text-white/30'
            }`} style={{ background: kycLevel >= 2 ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.05)' }}>
              {kycLevel >= 2 ? '✓' : '2'}
            </div>
            <div>
              <span className={kycLevel >= 2 ? 'text-[#4CAF50]' : 'text-white/50'}>Level 2 - ID + Selfie Verification</span>
              <p className="text-xs text-white/30">Daily profit withdrawals, no limits</p>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        {submittedAt && (
          <p className="text-xs text-white/30 mt-3 pt-3 border-t border-white/5">
            Submitted: {new Date(submittedAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Error/Success messages */}
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

      {/* Upload form - show if unverified or rejected */}
      {(kycStatus === 'unverified' || kycStatus === 'rejected') && (
        <div
          className="p-5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h3 className="text-sm font-semibold text-white mb-4">
            {kycStatus === 'rejected' ? 'Resubmit Verification' : 'Submit Identity Verification'}
          </h3>

          {kycStatus === 'rejected' && rejectionReason && (
            <div className="mb-4 p-3 rounded-lg text-xs text-red-400" style={{ background: 'rgba(244,67,54,0.08)', border: '1px solid rgba(244,67,54,0.15)' }}>
              <span className="font-semibold">Previous rejection reason:</span> {rejectionReason}
            </div>
          )}

          {/* ID upload */}
          <div className="mb-4">
            <label className="block text-sm text-white/60 font-medium mb-2">Government ID (Front)</label>
            <div
              className="relative rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition hover:border-[#FFD700]/50"
              style={{
                borderColor: idDocPreview ? '#4CAF50' : 'rgba(255,255,255,0.12)',
                background: idDocPreview ? 'rgba(76,175,80,0.04)' : 'rgba(255,255,255,0.02)',
                minHeight: 120,
              }}
              onClick={() => document.getElementById('kyc-id-input')?.click()}
            >
              {idDocPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={idDocPreview} alt="ID preview" className="max-h-48 mx-auto rounded-lg object-contain" />
              ) : (
                <div className="py-6">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 text-white/20">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <p className="text-sm text-white/40">Tap to upload ID document</p>
                  <p className="text-xs text-white/25 mt-1">JPG, PNG, or WebP · Max 5MB</p>
                </div>
              )}
              <input
                id="kyc-id-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => handleFileSelect('id', e.target.files?.[0] || null)}
              />
            </div>
          </div>

          {/* Selfie upload */}
          <div className="mb-4">
            <label className="block text-sm text-white/60 font-medium mb-2">Selfie with ID</label>
            <div
              className="relative rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition hover:border-[#FFD700]/50"
              style={{
                borderColor: selfiePreview ? '#4CAF50' : 'rgba(255,255,255,0.12)',
                background: selfiePreview ? 'rgba(76,175,80,0.04)' : 'rgba(255,255,255,0.02)',
                minHeight: 120,
              }}
              onClick={() => document.getElementById('kyc-selfie-input')?.click()}
            >
              {selfiePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selfiePreview} alt="Selfie preview" className="max-h-48 mx-auto rounded-lg object-contain" />
              ) : (
                <div className="py-6">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 text-white/20">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <p className="text-sm text-white/40">Tap to upload selfie</p>
                  <p className="text-xs text-white/25 mt-1">Hold your ID next to your face</p>
                </div>
              )}
              <input
                id="kyc-selfie-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => handleFileSelect('selfie', e.target.files?.[0] || null)}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !idDocFile || !selfieFile}
            className="w-full py-3.5 rounded-lg text-sm font-bold transition disabled:opacity-40"
            style={{ background: '#FFD700', color: '#000', minHeight: 48 }}
          >
            {submitting ? 'Uploading & Submitting...' : 'Submit for Verification'}
          </button>
          <p className="text-xs text-white/30 mt-2 text-center">Review takes 24-48 hours. You&apos;ll be notified when complete.</p>
        </div>
      )}

      {/* Pending state */}
      {kycStatus === 'pending' && (
        <div
          className="p-5 rounded-xl text-center"
          style={{ background: 'rgba(255,193,7,0.06)', border: '1px solid rgba(255,193,7,0.15)' }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,193,7,0.1)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFC107" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[#FFC107] mb-2">Under Review</h3>
          <p className="text-sm text-white/40">Your identity documents are being reviewed by our team.</p>
          <p className="text-xs text-white/25 mt-1">This typically takes 24-48 hours.</p>
          {submittedAt && (
            <p className="text-xs text-white/30 mt-3">Submitted: {new Date(submittedAt).toLocaleString()}</p>
          )}
        </div>
      )}

      {/* Verified state */}
      {kycStatus === 'verified' && (
        <div
          className="p-5 rounded-xl text-center"
          style={{ background: 'rgba(76,175,80,0.06)', border: '1px solid rgba(76,175,80,0.15)' }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(76,175,80,0.1)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[#4CAF50] mb-2">Identity Verified</h3>
          <p className="text-sm text-white/40">You have full access to all platform features.</p>
          {reviewedAt && (
            <p className="text-xs text-white/30 mt-2">Verified: {new Date(reviewedAt).toLocaleString()}</p>
          )}
        </div>
      )}
    </div>
  );
}
