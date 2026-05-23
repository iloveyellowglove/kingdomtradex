export function fmt(value: number | string | null | undefined, decimals = 8): string {
  const n = Number(value ?? 0);
  return isNaN(n) ? '0.00000000' : n.toFixed(decimals);
}

export function fmt2(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return isNaN(n) ? '0.00' : n.toFixed(2);
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
