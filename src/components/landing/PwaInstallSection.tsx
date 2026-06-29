'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isAppInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export default function PwaInstallSection() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already installed (iOS + standard detection)
    if (isAppInstalled()) {
      setInstalled(true);
      return;
    }

    // Detect platform
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  function handleDismissGuide() {
    setShowIOSGuide(false);
  }

  // Already installed: show success state
  if (installed) {
    return (
      <section className="py-16 lg:py-20 bg-kt-surface">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-kt-active-bg text-kt-gold text-sm font-semibold">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            App Installed
          </div>
          <p className="text-kt-text-secondary text-sm mt-3">KingdomTradex is on your home screen. Launch it anytime.</p>
        </div>
      </section>
    );
  }

  // Determine button state
  const canInstall = !!deferredPrompt;
  const showInstallInstructions = isIOS || (!canInstall && !installed);

  return (
    <>
      <section className="py-16 lg:py-20 bg-kt-surface">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-10 max-w-[900px] mx-auto">
            {/* LEFT: Phone mockup */}
            <div className="flex-shrink-0">
              <div
                className="w-[200px] h-[340px] rounded-[24px] p-3 relative overflow-hidden"
                style={{ background: '#0B0E11', border: '2px solid #2B3139' }}
              >
                <div className="w-full h-5 rounded-t-lg mb-2 flex items-center justify-center" style={{ background: 'transparent' }}>
                  <div className="w-12 h-1 rounded-full bg-kt-elevated" />
                </div>
                <div className="space-y-2 px-1">
                  <div className="h-3 w-20 rounded" style={{ background: '#F0B90B', opacity: 0.8 }} />
                  <div className="h-2 w-16 rounded bg-kt-elevated" />
                  <div className="h-8 rounded mt-3 bg-kt-surface" />
                  <div className="h-6 rounded bg-kt-surface" />
                  <div className="h-6 rounded bg-kt-surface" />
                  <div className="h-10 rounded mt-2" style={{ background: '#F0B90B', opacity: 0.2 }} />
                </div>
              </div>
            </div>

            {/* RIGHT: Content */}
            <div className="text-center lg:text-left">
              <h2 className="text-[22px] sm:text-[28px] font-semibold text-kt-text-primary mb-2">Earn on the Go. Anywhere, Anytime.</h2>
              <p className="text-sm text-kt-text-secondary mb-6 max-w-[400px]">
                Install KingdomTradex on your phone for instant access. No app store needed - install directly from your browser.
              </p>
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-6 text-kt-text-tertiary text-xs">
                <span>📱 Android</span><span>📱 iOS</span><span>💻 Desktop</span>
              </div>

              {canInstall ? (
                /* Chrome/Edge: native install prompt available */
                <button
                  onClick={handleInstall}
                  className="px-8 py-3.5 rounded-lg text-base font-semibold transition bg-kt-gold text-black"
                >
                  Install App
                </button>
              ) : showInstallInstructions ? (
                /* iOS or unsupported browser: show instructions */
                <div className="space-y-3">
                  <button
                    onClick={handleInstall}
                    className="px-8 py-3.5 rounded-lg text-base font-semibold transition bg-kt-gold text-black"
                  >
                    {isIOS ? 'How to Install on iPhone' : 'How to Install'}
                  </button>
                  <p className="text-xs text-kt-text-tertiary">
                    {isIOS
                      ? 'Use Safari — tap Share then Add to Home Screen'
                      : 'Open in Chrome to install with one tap'}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* iOS Install Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={handleDismissGuide}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative z-10 w-full max-w-sm p-6 rounded-xl bg-kt-surface border border-kt-card-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <p className="text-base font-semibold text-kt-text-primary">Install on iPhone / iPad</p>
              <button onClick={handleDismissGuide} className="text-kt-text-tertiary hover:text-kt-text-secondary p-1" aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <ol className="space-y-4 text-sm text-kt-text-secondary">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-kt-gold text-black text-xs font-bold flex items-center justify-center">1</span>
                <div>
                  <p className="text-kt-text-primary font-medium">Tap Share</p>
                  <p className="text-xs text-kt-text-tertiary mt-0.5">The share icon in Safari&apos;s bottom bar (square with arrow)</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-kt-gold text-black text-xs font-bold flex items-center justify-center">2</span>
                <div>
                  <p className="text-kt-text-primary font-medium">Add to Home Screen</p>
                  <p className="text-xs text-kt-text-tertiary mt-0.5">Scroll down the share menu and tap this option</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-kt-gold text-black text-xs font-bold flex items-center justify-center">3</span>
                <div>
                  <p className="text-kt-text-primary font-medium">Tap Add</p>
                  <p className="text-xs text-kt-text-tertiary mt-0.5">Confirm by tapping Add in the top right corner</p>
                </div>
              </li>
            </ol>
            <button
              onClick={handleDismissGuide}
              className="mt-5 w-full py-2.5 rounded-lg text-sm font-semibold bg-kt-gold text-black"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
