'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstallSection() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setInstalled(true); setDeferredPrompt(null); });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  if (installed) return null;

  return (
    <section className="py-16 lg:py-20 bg-kt-surface">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-10 max-w-[900px] mx-auto">
          {/* LEFT: Phone mockup */}
          <div className="flex-shrink-0">
            <div className="w-[200px] h-[340px] rounded-[24px] p-3 relative overflow-hidden" style={{ background: '#0B0E11', border: '2px solid #2B3139' }}>
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
            <button
              onClick={handleInstall}
              disabled={!deferredPrompt}
              className="px-8 py-3.5 rounded-lg text-base font-semibold transition disabled:opacity-40"
              style={{ background: '#F0B90B', color: '#0B0E11' }}
            >
              {deferredPrompt ? 'Install App' : 'Already Installed'}
            </button>
            <p className="text-xs text-kt-text-tertiary mt-3">No app store needed. Install directly from your browser.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
