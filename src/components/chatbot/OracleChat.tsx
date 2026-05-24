'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

const DOVE_ICON = (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16c0-1-.5-2-1-3M4 14c.5-3 2.5-6 5.5-8C12 4.5 15.5 4 18 5c2 .7 3.5 2 4 3.5.3 1 .2 2-.5 2.8-.5.5-1.2.5-1.8 0-.5-.5-.8-1.2-.7-1.8 0-.5.3-1 .8-1.3.5-.4 1-.6 1.5-.5M14 6.5c-3 .5-6 2.5-7.5 5.5M5.5 18.5c.5 1.2 1.5 2 2.8 2.2 1.5.3 3-.2 4-1.2.5-.5 1.2-.5 1.8 0 .7.7.7 1.5 0 2.2-1 1-2.2 1.5-3.8 1.3-2-.2-3.5-1.5-4.3-3" />
    <path d="M3.5 12c-.5 1.5-.5 3.5 0 5 .3 1 1 1.8 2 2" />
    <path d="M18 5c.1 1.5.1 3-.2 4.5" />
    <path d="M18.5 6.5l2-1.5M19.5 8l1.5-1" />
    <circle cx="19.5" cy="4.5" r="1" fill="#FFD700" stroke="none" />
  </svg>
);

const DOVE_SM = (
  <svg width="20" height="20" viewBox="0 0 28 28" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16c0-1-.5-2-1-3M4 14c.5-3 2.5-6 5.5-8C12 4.5 15.5 4 18 5c2 .7 3.5 2 4 3.5.3 1 .2 2-.5 2.8-.5.5-1.2.5-1.8 0-.5-.5-.8-1.2-.7-1.8 0-.5.3-1 .8-1.3.5-.4 1-.6 1.5-.5M14 6.5c-3 .5-6 2.5-7.5 5.5M5.5 18.5c.5 1.2 1.5 2 2.8 2.2 1.5.3 3-.2 4-1.2.5-.5 1.2-.5 1.8 0 .7.7.7 1.5 0 2.2-1 1-2.2 1.5-3.8 1.3-2-.2-3.5-1.5-4.3-3" />
    <path d="M3.5 12c-.5 1.5-.5 3.5 0 5 .3 1 1 1.8 2 2" />
    <path d="M18 5c.1 1.5.1 3-.2 4.5" />
    <path d="M18.5 6.5l2-1.5M19.5 8l1.5-1" />
    <circle cx="19.5" cy="4.5" r="1" fill="#FFD700" stroke="none" />
  </svg>
);

const DOVE_XS = (
  <svg width="14" height="14" viewBox="0 0 28 28" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
    <path d="M22 16c0-1-.5-2-1-3M4 14c.5-3 2.5-6 5.5-8C12 4.5 15.5 4 18 5c2 .7 3.5 2 4 3.5.3 1 .2 2-.5 2.8-.5.5-1.2.5-1.8 0-.5-.5-.8-1.2-.7-1.8 0-.5.3-1 .8-1.3.5-.4 1-.6 1.5-.5M14 6.5c-3 .5-6 2.5-7.5 5.5M5.5 18.5c.5 1.2 1.5 2 2.8 2.2 1.5.3 3-.2 4-1.2.5-.5 1.2-.5 1.8 0 .7.7.7 1.5 0 2.2-1 1-2.2 1.5-3.8 1.3-2-.2-3.5-1.5-4.3-3" />
    <path d="M3.5 12c-.5 1.5-.5 3.5 0 5 .3 1 1 1.8 2 2" />
    <path d="M18 5c.1 1.5.1 3-.2 4.5" />
    <path d="M18.5 6.5l2-1.5M19.5 8l1.5-1" />
    <circle cx="19.5" cy="4.5" r="1" fill="#FFD700" stroke="none" />
  </svg>
);

export default function OracleChat() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'I am Ephod, the AI Oracle. How may I guide your stewardship today?', createdAt: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasPulsed, setHasPulsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pulse ring on first load, once
  useEffect(() => {
    const t = setTimeout(() => setHasPulsed(true), 2000);
    return () => clearTimeout(t);
  }, []);

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

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 150);
  }, []);

  const open_ = useCallback(() => {
    setOpen(true);
  }, []);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMsg, createdAt: Date.now() }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || 'The Oracle is silent.', createdAt: Date.now() }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'The Oracle is temporarily unavailable.', createdAt: Date.now() }]);
    }
    setLoading(false);
  }

  function fmtTime(ts: number): string {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={open_}
        className="fixed z-50 flex items-center justify-center"
        style={{
          bottom: 20,
          right: 20,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: '#1a1a2e',
          border: '2px solid rgba(255,215,0,0.4)',
          cursor: 'pointer',
          opacity: open ? 0 : 1,
          pointerEvents: open ? 'none' : 'auto',
          transition: 'opacity 200ms ease, box-shadow 200ms ease',
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 0 20px rgba(255,215,0,0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.4)';
        }}
        aria-label="Open Ephod Oracle"
      >
        {/* Pulse ring */}
        {!hasPulsed && (
          <span
            className="pulse-ring"
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: '50%',
              border: '2px solid rgba(255,215,0,0.5)',
            }}
          />
        )}
        {DOVE_ICON}
      </button>

      {/* Chat panel */}
      <div
        className="fixed z-50 flex flex-col"
        style={{
          bottom: 20,
          right: 20,
          width: 'min(380px, calc(100vw - 32px))',
          height: 'min(520px, 70vh)',
          background: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          opacity: open && !closing ? 1 : 0,
          transform: open && !closing ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.96)',
          pointerEvents: open ? 'auto' : 'none',
          transition: closing
            ? 'opacity 150ms ease-in, transform 150ms ease-in'
            : 'opacity 200ms ease-out, transform 200ms ease-out',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 flex-shrink-0"
          style={{
            height: 56,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #2a1a3e 100%)',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            position: 'relative',
          }}
        >
          {/* Gold gradient top border */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: 'linear-gradient(90deg, #FFD700, #B8860B)',
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
            }}
          />

          <div className="flex items-center gap-2.5">
            {DOVE_SM}
            <div>
              <span className="text-base font-semibold" style={{ color: '#FFD700' }}>
                Ephod Oracle
              </span>
              <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Guided by wisdom
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={close}
              className="flex items-center justify-center hover:text-white transition-colors"
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
              onClick={close}
              className="flex items-center justify-center hover:text-white transition-colors"
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
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-4"
          style={{ background: '#0e0b1a' }}
        >
          {messages.map((m, i) => {
            const isWelcome = i === 0 && m.role === 'assistant';
            const isUser = m.role === 'user';

            if (isUser) {
              return (
                <div key={i} className="flex justify-end">
                  <div className="flex flex-col items-end" style={{ maxWidth: '82%' }}>
                    <div
                      className="px-3 py-2 text-sm"
                      style={{
                        borderRadius: 10,
                        borderTopRightRadius: 4,
                        background: 'rgba(255,255,255,0.06)',
                        color: 'rgba(255,255,255,0.8)',
                        lineHeight: 1.5,
                      }}
                    >
                      {m.content}
                    </div>
                    <span className="mt-0.5" style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                      {fmtTime(m.createdAt)}
                    </span>
                  </div>
                </div>
              );
            }

            // Bot message (or welcome)
            return (
              <div key={i} className="flex justify-start">
                <div className="flex flex-col" style={{ maxWidth: '82%' }}>
                  {/* Bot label */}
                  {!isWelcome && (
                    <div className="flex items-center gap-1 mb-1 ml-1">
                      {DOVE_XS}
                      <span style={{ fontSize: 11, color: 'rgba(255,215,0,0.5)', fontWeight: 500 }}>
                        Ephod
                      </span>
                    </div>
                  )}
                  <div
                    className={`px-3 py-2 ${isWelcome ? '' : ''}`}
                    style={{
                      borderRadius: 10,
                      borderTopLeftRadius: isWelcome ? 10 : 4,
                      background: isWelcome ? 'transparent' : 'rgba(255,215,0,0.06)',
                      borderLeft: isWelcome ? 'none' : '2px solid rgba(255,215,0,0.3)',
                      color: isWelcome ? 'rgba(255,215,0,0.7)' : 'rgba(255,255,255,0.85)',
                      fontStyle: isWelcome ? 'italic' : 'normal',
                      lineHeight: 1.5,
                      fontSize: isWelcome ? 14 : undefined,
                    }}
                  >
                    {m.content}
                  </div>
                  <span className="ml-1 mt-0.5" style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                    {fmtTime(m.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="flex flex-col" style={{ maxWidth: '82%' }}>
                <div className="flex items-center gap-1 mb-1 ml-1">
                  {DOVE_XS}
                  <span style={{ fontSize: 11, color: 'rgba(255,215,0,0.5)', fontWeight: 500 }}>
                    Ephod
                  </span>
                </div>
                <div
                  className="px-4 py-3 flex flex-col gap-1"
                  style={{
                    borderRadius: 10,
                    borderTopLeftRadius: 4,
                    background: 'rgba(255,215,0,0.06)',
                    borderLeft: '2px solid rgba(255,215,0,0.3)',
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                  <span className="text-xs italic" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    The Oracle speaks...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div
          className="flex-shrink-0 px-3 py-3"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.05)',
            background: '#1a1a2e',
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
          }}
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Seek wisdom..."
              className="flex-1 px-4 py-2.5 text-sm outline-none"
              style={{
                borderRadius: '9999px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#ffffff',
              }}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="flex items-center justify-center flex-shrink-0 transition"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: 'none',
                cursor: loading || !input.trim() ? 'default' : 'pointer',
                background: loading || !input.trim()
                  ? 'rgba(255,215,0,0.05)'
                  : 'rgba(255,215,0,0.1)',
                color: loading || !input.trim()
                  ? 'rgba(255,215,0,0.2)'
                  : '#FFD700',
                opacity: input.trim() ? 1 : 0.4,
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

      {/* Animations */}
      <style jsx>{`
        @keyframes pulseRing {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.12); }
          100% { opacity: 0; transform: scale(1.25); }
        }
        .pulse-ring {
          animation: pulseRing 1.8s ease-out forwards;
          pointer-events: none;
        }

        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        .typing-dot {
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #FFD700;
          animation: typingBounce 1.4s infinite ease-in-out;
        }
        .typing-dot:nth-child(1) { animation-delay: 0s; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
