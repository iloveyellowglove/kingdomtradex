'use client';

interface ConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  loading?: boolean;
  children: React.ReactNode;
}

export default function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  title,
  loading = false,
  children,
}: ConfirmationModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        style={{ animation: 'fadeIn 150ms ease-out' }}
      />

      {/* Modal */}
      <div
        className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-kt-border p-6"
        style={{
          background: '#1a1a2e',
          animation: 'slideUp 200ms ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-kt-text-tertiary hover:text-white hover:bg-white/10 transition"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-lg font-bold text-kt-text-primary mb-4">{title}</h3>

        <div className="text-sm text-kt-text-secondary mb-6">{children}</div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-lg text-sm font-bold border border-kt-border text-kt-text-secondary hover:text-white hover:bg-white/5 transition disabled:opacity-40"
            style={{ minHeight: 44 }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-lg text-sm font-bold transition disabled:opacity-50"
            style={{
              background: '#FFD700',
              color: '#000',
              minHeight: 44,
            }}
          >
            {loading ? 'Processing...' : 'Confirm Withdrawal'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
