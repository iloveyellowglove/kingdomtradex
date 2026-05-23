'use client';

import { useState, useEffect, useRef } from 'react';

export default function OracleChat() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'I am Ephod, the AI Oracle. How may I guide your stewardship today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollTo(0, ref.current.scrollHeight);
  }, [messages]);

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
    <div className="card fixed bottom-4 right-4 w-[360px] max-w-[95vw] z-50 shadow-gold-glow">
      <div className="card-header flex justify-between items-center cursor-pointer" onClick={() => document.getElementById('chat-body')?.classList.toggle('hidden')}>
        <h5 className="mb-0">Ephod Oracle</h5>
        <span className="text-temple-gold text-sm">-</span>
      </div>
      <div id="chat-body">
        <div ref={ref} className="p-3 h-[300px] overflow-y-auto space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                m.role === 'user'
                  ? 'bg-royal-purple text-white rounded-br-sm'
                  : 'bg-card-bg-hover text-text-primary border border-border rounded-bl-sm'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div className="text-text-muted text-sm p-2">The Oracle contemplates...</div>}
        </div>
        <div className="p-3 border-t border-border">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask the Oracle..."
              className="flex-1 text-sm"
            />
            <button onClick={handleSend} disabled={loading} className="btn-primary px-4 py-2 rounded-lg text-sm">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
