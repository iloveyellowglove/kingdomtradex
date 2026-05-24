'use client';

import { useState, useEffect, useRef } from 'react';

export default function OracleChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'I am Ephod, the AI Oracle. How may I guide your stewardship today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || 'The Oracle is silent.' }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'The Oracle is temporarily unavailable.' }]);
    }
    setLoading(false);
  }

  return (
    <>
      {/* Floating button — visible when closed */}
      <button
        onClick={() => setOpen(true)}
        className="fixed z-50 flex items-center justify-center"
        style={{
          bottom: 20,
          right: 20,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: '#1a1a2e',
          border: '1.5px solid rgba(255,215,0,0.35)',
          cursor: 'pointer',
          opacity: open ? 0 : 1,
          pointerEvents: open ? 'none' : 'auto',
          transition: 'opacity 200ms ease',
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
        }}
        aria-label="Open Oracle chat"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Chat panel — visible when open */}
      <div
        className="fixed z-50 flex flex-col"
        style={{
          bottom: 20,
          right: 20,
          width: 'min(380px, calc(100vw - 32px))',
          height: 'min(500px, 70vh)',
          background: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.96)',
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 200ms ease, transform 200ms ease',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 flex-shrink-0"
          style={{
            height: 44,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>
            Ephod Oracle
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setOpen(false)}
              className="flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.4)',
              }}
              aria-label="Minimize Oracle chat"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button
              onClick={() => setOpen(false)}
              className="flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.4)',
              }}
              aria-label="Close Oracle chat"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="px-3 py-2 text-sm"
                style={{
                  maxWidth: '82%',
                  borderRadius: 10,
                  borderBottomRightRadius: m.role === 'user' ? 4 : 10,
                  borderBottomLeftRadius: m.role === 'assistant' ? 4 : 10,
                  background: m.role === 'user'
                    ? 'rgba(255,215,0,0.15)'
                    : 'rgba(255,255,255,0.05)',
                  color: m.role === 'user' ? '#FFD700' : 'rgba(255,255,255,0.85)',
                  lineHeight: 1.5,
                }}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div
                className="px-4 py-3 flex items-center gap-1"
                style={{
                  borderRadius: 10,
                  borderBottomLeftRadius: 4,
                  background: 'rgba(255,255,255,0.05)',
                }}
              >
                <span className="dot-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div
          className="flex-shrink-0 px-3 py-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask the Oracle..."
              className="flex-1 px-3 py-2 text-sm outline-none"
              style={{
                borderRadius: 8,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#ffffff',
              }}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                border: 'none',
                cursor: loading || !input.trim() ? 'default' : 'pointer',
                background: loading || !input.trim()
                  ? 'rgba(255,215,0,0.08)'
                  : 'rgba(255,215,0,0.18)',
                color: loading || !input.trim()
                  ? 'rgba(255,215,0,0.3)'
                  : '#FFD700',
                transition: 'background 150ms ease, color 150ms ease',
              }}
              aria-label="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Dot-pulse animation styles */}
      <style jsx>{`
        .dot-pulse {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.4);
          animation: dotPulse 1.2s infinite ease-in-out;
          position: relative;
        }
        .dot-pulse::before,
        .dot-pulse::after {
          content: '';
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.4);
          position: absolute;
          top: 0;
          animation: dotPulse 1.2s infinite ease-in-out;
        }
        .dot-pulse::before {
          left: -12px;
          animation-delay: 0s;
        }
        .dot-pulse {
          animation-delay: 0.2s;
        }
        .dot-pulse::after {
          left: 12px;
          animation-delay: 0.4s;
        }
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}
