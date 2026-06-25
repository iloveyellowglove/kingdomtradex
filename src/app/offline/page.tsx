'use client';

export default function OfflinePage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#0e0b1a' }}
    >
      <div className="text-center max-w-sm">
        {/* Offline icon */}
        <div
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-kt-active-bg"
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <line x1="12" y1="20" x2="12.01" y2="20"/>
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-kt-text-primary mb-2">You&apos;re Offline</h1>
        <p className="text-sm text-kt-text-tertiary mb-6">
          It looks like you&apos;ve lost your internet connection. Check your connection and try again.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 rounded-lg text-sm font-bold transition bg-kt-gold text-black" style={{ minHeight: 48 }}
          >
            Try Again
          </button>
          <p className="text-xs text-kt-muted-text">
            Some features may work offline. Your data will sync when you&apos;re back online.
          </p>
        </div>
      </div>
    </div>
  );
}
