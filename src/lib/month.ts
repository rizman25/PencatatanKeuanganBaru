/**
 * The selected month, resolved from the `?m=` URL parameter (spec 0001).
 *
 * Browser-safe on purpose: the stepper, the bottom navigation and the `load`
 * functions all need the same answer, and a second implementation on either
 * side of the wire would drift.
 *
 * `?m=` is untrusted input. The resolver is deliberately *total* — every
 * malformed, impossible or future value resolves to the current month rather
 * than erroring or redirecting. There is no failure path to exploit and no
 * screen a bad link can break.
 */

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export interface SelectedMonth {
  /** Canonical `YYYY-MM`. */
  key: string;
  /** First day, `YYYY-MM-01` — the shape budget_progress expects. */
  start: string;
  /** Last day inclusive, for bounding a query. */
  end: string;
  /** "Juni 2026", for display. */
  label: string;
  /** The previous month's parameter value. Always available. */
  prev: string;
  /** The next month's parameter value, or null at the current month. */
  next: string | null;
  /** True when the selected month is the one today falls in. */
  isCurrent: boolean;
  /**
   * The month today falls in. Links omit `?m=` when they point at it, so the
   * stepper needs to recognise it independently of what is selected.
   */
  currentKey: string;
}

const PATTERN = /^(\d{4})-(\d{2})$/;

/** Adds `delta` months to a `YYYY-MM` key, rolling the year over correctly. */
export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  const total = y * 12 + (m - 1) + delta;
  const year = Math.floor(total / 12);
  const month = total % 12;
  return `${String(year).padStart(4, '0')}-${String(month + 1).padStart(2, '0')}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** Last day of the month, honouring leap years. */
function lastDay(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return `${key}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
}

export function resolveMonth(param: string | null | undefined, today: string): SelectedMonth {
  const current = today.slice(0, 7);
  let key = current;

  const match = PATTERN.exec(param ?? '');
  if (match) {
    const month = Number(match[2]);
    // Month 00 and 13 both match the pattern; neither is a month.
    if (month >= 1 && month <= 12) {
      const candidate = `${match[1]}-${match[2]}`;
      // Future months hold nothing to read, so the stepper stops at today's.
      if (candidate <= current) key = candidate;
    }
  }

  const isCurrent = key === current;
  return {
    key,
    start: `${key}-01`,
    end: lastDay(key),
    label: monthLabel(key),
    prev: shiftMonth(key, -1),
    next: isCurrent ? null : shiftMonth(key, 1),
    isCurrent,
    currentKey: current
  };
}

/**
 * A window of `count` consecutive months ending at `key`, oldest first — so the
 * selected month is always the last entry, and the rightmost bar on a chart.
 */
export function monthWindow(key: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => shiftMonth(key, i - (count - 1)));
}

/**
 * Builds a link that carries the selected month. The current month is the
 * default, so it is left out — ordinary use produces clean URLs and only
 * deliberate time travel is visible in the address bar.
 */
export function withMonth(path: string, month: SelectedMonth): string {
  return month.isCurrent ? path : `${path}?m=${month.key}`;
}
