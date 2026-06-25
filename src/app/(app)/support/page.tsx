'use client';

import { useState, useEffect } from 'react';

interface Ticket {
  id: number;
  user_id: number;
  subject: string;
  category: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: string;
  created_at: string;
  updated_at: string;
}

interface TicketMessage {
  id: number;
  ticket_id: number;
  sender_id: number;
  sender_role: 'user' | 'admin';
  message: string;
  created_at: string;
}

const CATEGORIES = [
  { value: 'deposit_issue', label: 'Deposit Issue' },
  { value: 'withdrawal_issue', label: 'Withdrawal Issue' },
  { value: 'account', label: 'Account' },
  { value: 'trading', label: 'Trading' },
  { value: 'other', label: 'Other' },
];

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  open: { bg: 'rgba(255,215,0,0.12)', text: '#FFD700' },
  in_progress: { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6' },
  resolved: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e' },
  closed: { bg: 'rgba(255,255,255,0.06)', text: 'var(--kt-text-tertiary)' },
};

function categoryLabel(cat: string): string {
  return CATEGORIES.find((c) => c.value === cat)?.label || cat;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('deposit_issue');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Detail view
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    setLoading(true);
    const res = await fetch('/api/support/tickets');
    const data = await res.json();
    if (data.tickets) setTickets(data.tickets);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await fetch('/api/support/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, category, description }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (data.success) {
      setSuccess('Ticket created successfully.');
      setSubject('');
      setCategory('deposit_issue');
      setDescription('');
      setShowForm(false);
      fetchTickets();
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(data.error || 'Failed to create ticket.');
    }
  }

  async function viewTicket(ticket: Ticket) {
    setSelectedTicket(ticket);
    setDetailLoading(true);
    setMessages([]);
    setReplyText('');

    const res = await fetch(`/api/support/tickets/${ticket.id}`);
    const data = await res.json();
    if (data.ticket) setSelectedTicket(data.ticket);
    if (data.messages) setMessages(data.messages);
    setDetailLoading(false);
  }

  async function handleReply() {
    if (!replyText.trim() || !selectedTicket) return;
    setSendingReply(true);

    const res = await fetch(`/api/support/tickets/${selectedTicket.id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: replyText }),
    });

    const data = await res.json();
    setSendingReply(false);

    if (data.success) {
      setReplyText('');
      viewTicket(selectedTicket);
    } else {
      setError(data.error || 'Failed to send reply.');
    }
  }

  function backToList() {
    setSelectedTicket(null);
    setMessages([]);
    fetchTickets();
  }

  const statusBadge = (status: string) => {
    const s = STATUS_STYLES[status] || STATUS_STYLES.closed;
    return (
      <span
        className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
        style={{ background: s.bg, color: s.text }}
      >
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="py-4 px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="mb-1">Support</h2>
          <p className="text-kt-text-tertiary text-sm">Get help with your account, deposits, and trading</p>
        </div>
        {!selectedTicket && (
          <button
            onClick={() => { setShowForm(!showForm); setError(''); }}
            className="px-5 py-2.5 rounded-lg font-semibold text-sm transition"
            style={{
              background: '#FFD700',
              color: '#0e0b1a',
            }}
          >
            {showForm ? 'Cancel' : 'New Ticket'}
          </button>
        )}
      </div>

      {error && (
        <div
          className="mb-4 p-3 rounded-lg text-sm font-medium"
          style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}
        >
          {error}
          <button onClick={() => setError('')} className="ml-2 text-kt-text-tertiary hover:text-white">&times;</button>
        </div>
      )}

      {success && (
        <div
          className="mb-4 p-3 rounded-lg text-sm font-medium"
          style={{ color: '#22c55e', background: 'rgba(34,197,94,0.08)' }}
        >
          {success}
        </div>
      )}

      {/* Create Ticket Form */}
      {showForm && !selectedTicket && (
        <div className="card p-5 mb-6">
          <h3 className="text-lg font-semibold text-kt-text-primary mb-4">Create Support Ticket</h3>
          <form onSubmit={handleCreate}>
            <div className="mb-4">
              <label className="block text-kt-text-secondary font-medium mb-1 text-sm">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="Brief summary of your issue"
                className="w-full"
              />
            </div>

            <div className="mb-4">
              <label className="block text-kt-text-secondary font-medium mb-1 text-sm">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-kt-bg border border-kt-border rounded-lg px-4 py-2.5 text-kt-text-primary"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-kt-text-secondary font-medium mb-1 text-sm">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Describe your issue in detail..."
                rows={4}
                className="w-full bg-kt-bg border border-kt-border rounded-lg px-4 py-2.5 text-kt-text-primary resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg font-bold text-sm transition"
              style={{
                background: submitting ? 'rgba(255,215,0,0.25)' : '#FFD700',
                color: '#0e0b1a',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Creating...' : 'Submit Ticket'}
            </button>
          </form>
        </div>
      )}

      {/* Ticket Detail View */}
      {selectedTicket && (
        <div className="card p-5 mb-6">
          <button
            onClick={backToList}
            className="flex items-center gap-2 text-kt-text-tertiary hover:text-white text-sm mb-4 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to tickets
          </button>

          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-kt-text-primary">{selectedTicket.subject}</h3>
            {statusBadge(selectedTicket.status)}
          </div>
          <p className="text-kt-text-tertiary text-xs mb-4">
            {categoryLabel(selectedTicket.category)} &middot; Created {timeAgo(selectedTicket.created_at)}
          </p>

          <p className="text-kt-text-secondary text-sm mb-6 p-4 rounded-lg bg-kt-hover-bg">
            {selectedTicket.description}
          </p>

          {/* Messages */}
          <div className="space-y-4 mb-6">
            {detailLoading ? (
              <p className="text-kt-text-tertiary text-sm text-center">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="text-kt-text-tertiary text-sm text-center">No messages yet.</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3 rounded-lg"
                  style={{
                    background: msg.sender_role === 'admin'
                      ? 'rgba(255,215,0,0.04)'
                      : 'rgba(255,255,255,0.03)',
                    borderLeft: msg.sender_role === 'admin'
                      ? '3px solid #FFD700'
                      : '3px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold" style={{
                      color: msg.sender_role === 'admin' ? '#FFD700' : 'rgba(255,255,255,0.6)',
                    }}>
                      {msg.sender_role === 'admin' ? 'Support Team' : 'You'}
                    </span>
                    <span className="text-xs text-kt-text-tertiary">{timeAgo(msg.created_at)}</span>
                  </div>
                  <p className="text-sm text-kt-text-secondary whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))
            )}
          </div>

          {/* Reply form */}
          {selectedTicket.status !== 'closed' && (
            <div>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                rows={3}
                className="w-full bg-kt-bg border border-kt-border rounded-lg px-4 py-2.5 text-kt-text-primary resize-y text-sm mb-3"
              />
              <button
                onClick={handleReply}
                disabled={sendingReply || !replyText.trim()}
                className="px-5 py-2.5 rounded-lg font-bold text-sm transition"
                style={{
                  background: (sendingReply || !replyText.trim()) ? 'rgba(255,215,0,0.25)' : '#FFD700',
                  color: '#0e0b1a',
                  cursor: (sendingReply || !replyText.trim()) ? 'not-allowed' : 'pointer',
                }}
              >
                {sendingReply ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Ticket List */}
      {!selectedTicket && (
        <div className="card p-0">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-kt-text-tertiary text-sm">Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-kt-text-tertiary mb-2">No support tickets yet.</p>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="text-kt-gold text-sm hover:underline"
                >
                  Create your first ticket
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left p-4 text-kt-text-tertiary text-xs font-medium">Subject</th>
                    <th className="text-left p-4 text-kt-text-tertiary text-xs font-medium">Category</th>
                    <th className="text-left p-4 text-kt-text-tertiary text-xs font-medium">Status</th>
                    <th className="text-left p-4 text-kt-text-tertiary text-xs font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => viewTicket(ticket)}
                      className="border-b border-kt-border cursor-pointer hover:bg-white/5 transition"
                    >
                      <td className="p-4 text-kt-text-primary font-medium">{ticket.subject}</td>
                      <td className="p-4 text-kt-text-tertiary">{categoryLabel(ticket.category)}</td>
                      <td className="p-4">{statusBadge(ticket.status)}</td>
                      <td className="p-4 text-kt-text-tertiary text-xs">{timeAgo(ticket.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
