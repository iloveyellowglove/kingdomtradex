'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after 3 seconds on site
      setTimeout(() => {
        if (!dismissed) setShow(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setShow(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [dismissed]);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setShow(false);
    setDismissed(true);
  }

  if (!show) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-40 p-4 rounded-xl shadow-2xl"
      style={{
        background: '#1a1a2e',
        border: '1px solid rgba(255,215,0,0.2)',
        animation: 'slideUp 300ms ease-out',
      }}
    >
      <div className="flex items-center gap-3">
        {/* App icon placeholder */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,215,0,0.12)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Add to Home Screen</p>
          <p className="text-xs text-white/40">Install KingdomTradex for quick access</p>
        </div>
        <button
          onClick={handleInstall}
          className="px-4 py-2 rounded-lg text-xs font-bold flex-shrink-0"
          style={{ background: '#FFD700', color: '#000', minHeight: 40 }}
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="text-white/30 hover:text-white/60 p-1 flex-shrink-0"
          aria-label="Dismiss"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
