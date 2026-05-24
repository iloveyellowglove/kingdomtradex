export function fmt(value: number | string | null | undefined, decimals = 2): string {
  const n = Number(value ?? 0);
  return isNaN(n) ? (decimals === 2 ? '0.00' : '0.00000000') : n.toFixed(decimals);
}

export function fmtBtc(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return isNaN(n) ? '0.00000000' : n.toFixed(8);
}

export function fmt2(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return isNaN(n) ? '0.00' : n.toFixed(2);
}

export function formatCurrency(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return isNaN(n) ? '0.00' : n.toFixed(2);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function escapeHtml(value: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return value.replace(/[&<>"'/]/g, (m) => map[m] || m);
}
