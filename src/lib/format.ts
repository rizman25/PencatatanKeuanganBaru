/** Money is BIGINT whole rupiah (ADR-0007). These only ever format for display. */

const NBSP = ' ';

export function rp(n: number): string {
  return 'Rp' + NBSP + Math.round(n).toLocaleString('id-ID');
}

/** Bare grouped digits, for input fields where "Rp" is already a prefix. */
export function grouped(n: number): string {
  return n ? n.toLocaleString('id-ID') : '';
}

/** Strips everything but digits, so "1.500.000" and "Rp 1500000" both parse. */
export function parseAmount(s: string): number {
  const n = parseInt((s || '').replace(/\D/g, ''), 10);
  return Number.isNaN(n) ? 0 : n;
}

export function signed(type: string, amount: number): string {
  if (type === 'income') return '+ ' + rp(amount);
  if (type === 'expense') return '− ' + rp(amount);
  return rp(amount);
}

export function signGlyph(type: string): string {
  if (type === 'income') return '+';
  if (type === 'expense') return '−';
  return '⇄';
}

/** ISO date (YYYY-MM-DD) in local time — never toISOString(), which is UTC. */
export function isoDate(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function monthStart(iso: string): string {
  return iso.slice(0, 8) + '01';
}

export function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function fmtMonth(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric'
  });
}

export function daysUntil(iso: string, today: string = isoDate()): number {
  return Math.round(
    (new Date(iso + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000
  );
}

/** "Hari Ini" / "Kemarin" / an explicit date — the prototype's timeline headers. */
export function dateLabel(iso: string, today: string = isoDate()): string {
  const diff = daysUntil(iso, today);
  if (diff === 0) return 'Hari Ini';
  if (diff === -1) return 'Kemarin';
  return fmtDate(iso);
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function shortMonth(iso: string): string {
  return MONTHS_SHORT[parseInt(iso.slice(5, 7), 10) - 1];
}
