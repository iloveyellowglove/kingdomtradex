'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'kt-install-dismissed';
const DISMISS_DAYS = 7;

function isAppInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already installed (iOS + standard)
    if (isAppInstalled()) return;

    // Check if dismissed in the last 7 days
    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const elapsed = Date.now() - parseInt(dismissedAt);
        if (elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
      }
    } catch { /* localStorage unavailable */ }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    if (iOS) {
      // iOS: no beforeinstallprompt — show banner with custom instructions after delay
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const timer = setTimeout(() => setShow(true), 3000);
      // Cleanup only matters if component unmounts before timeout
      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setShow(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  async function handleInstall() {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
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
    setShowIOSGuide(false);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch { /* localStorage unavailable */ }
  }

  if (!show) return null;

  return (
    <>
      <div className="fixed bottom-20 left-4 right-4 z-40 p-4 rounded-xl shadow-2xl bg-kt-surface border border-kt-card-border lg:hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-kt-active-bg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-kt-gold" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-kt-text-primary">Add to Home Screen</p>
            <p className="text-xs text-kt-text-tertiary">Install KingdomTradex for quick access</p>
          </div>
          <button
            onClick={handleInstall}
            className="px-4 py-2 rounded-lg text-xs font-bold flex-shrink-0 bg-kt-gold text-black"
            style={{ minHeight: 40 }}
          >
            {isIOS ? 'How to Install' : 'Install'}
          </button>
          <button
            onClick={handleDismiss}
            className="text-kt-text-tertiary hover:text-kt-text-secondary p-1 flex-shrink-0"
            aria-label="Dismiss"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* iOS Install Guide Tooltip */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-24 px-4" onClick={handleDismiss}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative z-10 w-full max-w-sm p-5 rounded-xl bg-kt-surface border border-kt-card-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-kt-text-primary">Install on iPhone / iPad</p>
              <button onClick={handleDismiss} className="text-kt-text-tertiary p-1" aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <ol className="space-y-3 text-sm text-kt-text-secondary">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-kt-gold text-black text-xs font-bold flex items-center justify-center">1</span>
                <span>Tap the <strong className="text-kt-text-primary">Share</strong> button in Safari&apos;s bottom bar</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-kt-gold text-black text-xs font-bold flex items-center justify-center">2</span>
                <span>Scroll down and tap <strong className="text-kt-text-primary">Add to Home Screen</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-kt-gold text-black text-xs font-bold flex items-center justify-center">3</span>
                <span>Tap <strong className="text-kt-text-primary">Add</strong> in the top right</span>
              </li>
            </ol>
            <button
              onClick={handleDismiss}
              className="mt-4 w-full py-2.5 rounded-lg text-sm font-semibold bg-kt-gold text-black"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
