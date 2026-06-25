'use client';

interface KycStatusBadgeProps {
  level: number;        // 0 = unverified, 1 = email, 2 = ID+selfie
  status?: string;      // 'unverified' | 'pending' | 'verified' | 'rejected'
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export default function KycStatusBadge({
  level,
  status,
  rejectionReason,
  reviewedAt,
  size = 'md',
}: KycStatusBadgeProps) {
  const dims = { sm: { badge: 'text-[10px] px-2 py-0.5', icon: 12 }, md: { badge: 'text-xs px-3 py-1.5', icon: 14 }, lg: { badge: 'text-sm px-4 py-2', icon: 16 } };
  const d = dims[size];

  // If status is 'rejected', show rejected regardless of level
  if (status === 'rejected') {
    return (
      <div className="inline-flex flex-col gap-1">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${d.badge}`}
          style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
        >
          <svg width={d.icon} height={d.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          Rejected
        </span>
        {rejectionReason && (
          <span className="text-xs text-red-400/70">{rejectionReason}</span>
        )}
      </div>
    );
  }

  // If status is 'pending', show pending
  if (status === 'pending') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${d.badge}`}
        style={{ background: 'rgba(255,193,7,0.12)', color: '#FFC107' }}
      >
        <svg width={d.icon} height={d.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        Under Review
      </span>
    );
  }

  // Level 2: fully verified
  if (level >= 2 || status === 'verified') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${d.badge}`}
        style={{ background: 'rgba(76,175,80,0.12)', color: '#4CAF50' }}
      >
        <svg width={d.icon} height={d.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        Verified
        {reviewedAt && (
          <span className="opacity-60 ml-0.5">
            · {new Date(reviewedAt).toLocaleDateString()}
          </span>
        )}
      </span>
    );
  }

  // Level 1: email verified
  if (level >= 1) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${d.badge}`}
        style={{ background: 'rgba(33,150,243,0.12)', color: '#2196F3' }}
      >
        <svg width={d.icon} height={d.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
        Email Verified
      </span>
    );
  }

  // Level 0: unverified
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${d.badge}`}
      style={{ background: 'rgba(158,158,158,0.12)', color: 'var(--kt-text-tertiary)' }}
    >
      <svg width={d.icon} height={d.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      Unverified
    </span>
  );
}
