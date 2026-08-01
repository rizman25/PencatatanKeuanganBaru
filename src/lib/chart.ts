/**
 * Category breakdown slices (spec 0001). Pure arithmetic — the SVG lives in the
 * component, the numbers live here where they can be asserted.
 */
import type { Transaction } from '$lib/types';

/**
 * Debt payments carry no Category, so without a slice of their own a month
 * heavy with cicilan would silently fail to add up to the Pengeluaran figure
 * printed directly above the chart.
 */
export const CICILAN = 'Cicilan Hutang';
/**
 * The income-side counterpart. Money arrives through a Debt in two ways —
 * borrowing (a payable being opened) and a Piutang being repaid — and neither
 * carries a Category. One slice covers both, for the same reason CICILAN does:
 * without it the ring would fail to add up to the Pemasukan figure above it.
 */
export const HUTANG = 'Hutang & Piutang';
export const LAINNYA = 'Lainnya';

/** Six named slices is what stays legible on a phone; the rest roll up. */
export const MAX_SLICES = 6;

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)'
];
const REST_COLOR = 'var(--chart-rest)';

export interface Slice {
  name: string;
  amount: number;
  /** Exact fraction of the total, for geometry. */
  share: number;
  /** Rounded whole percent, for display. */
  pct: number;
  color: string;
  /**
   * The Category this slice stands for, where it stands for exactly one.
   * Lainnya and Cicilan Hutang have none, which is what makes them unlinkable.
   */
  key?: string;
}

/**
 * Turns category totals into ranked slices, rolling everything past `max` into
 * a single Lainnya. Sorting happens before the rollup, so the named slices are
 * always the largest ones.
 *
 * `keys` maps a slice name to the Category id behind it, for the charts whose
 * slices are tappable.
 */
export function rollUp(
  totals: Map<string, number>,
  max = MAX_SLICES,
  keys?: Map<string, string>
): Slice[] {
  const entries = [...totals.entries()]
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);

  const total = entries.reduce((a, [, amount]) => a + amount, 0);
  if (!total) return [];

  const named = entries.slice(0, max);
  const rest = entries.slice(max).reduce((a, [, amount]) => a + amount, 0);

  const slices: Slice[] = named.map(([name, amount], i) => ({
    name,
    amount,
    share: amount / total,
    pct: Math.round((amount / total) * 100),
    color: COLORS[i % COLORS.length],
    key: keys?.get(name)
  }));

  if (rest > 0) {
    slices.push({
      name: LAINNYA,
      amount: rest,
      share: rest / total,
      pct: Math.round((rest / total) * 100),
      color: REST_COLOR
    });
  }

  return slices;
}

/**
 * Shared by both charts below. Every Transaction of the given type contributes
 * to exactly one slice — a Category, the Debt slice, or Lainnya — which is what
 * makes each ring total its own headline figure exactly.
 *
 * Transfers move money between Wallets without leaving the Household, so they
 * are neither income nor spending and match neither type.
 */
function byCategory(
  transactions: Transaction[],
  type: 'income' | 'expense',
  categoryNames: Map<string, string>,
  debtLabel: string,
  max: number
): Slice[] {
  const totals = new Map<string, number>();

  for (const t of transactions) {
    if (t.type !== type) continue;

    const name = t.category_id
      ? (categoryNames.get(t.category_id) ?? LAINNYA)
      : t.debt_id
        ? debtLabel
        : LAINNYA;

    totals.set(name, (totals.get(name) ?? 0) + t.amount);
  }

  return rollUp(totals, max);
}

/** Where the month's Pengeluaran went. Totals `exMonth` exactly. */
export function expenseSlices(
  transactions: Transaction[],
  categoryNames: Map<string, string>,
  max = MAX_SLICES
): Slice[] {
  return byCategory(transactions, 'expense', categoryNames, CICILAN, max);
}

/** Where the month's Pemasukan came from. Totals `inMonth` exactly. */
export function incomeSlices(
  transactions: Transaction[],
  categoryNames: Map<string, string>,
  max = MAX_SLICES
): Slice[] {
  return byCategory(transactions, 'income', categoryNames, HUTANG, max);
}

export interface Segment {
  color: string;
  /** `stroke-dasharray` for a circle of the given circumference. */
  dash: string;
  /** `stroke-dashoffset` placing this segment after the previous ones. */
  offset: number;
}

/**
 * Lays slices around a circle as dashed strokes. Cheaper and far less
 * error-prone than arc path maths, and a single full-circle slice renders
 * correctly rather than collapsing to a zero-length arc.
 */
export function segments(slices: Slice[], circumference: number): Segment[] {
  let consumed = 0;
  return slices.map((s) => {
    const length = s.share * circumference;
    const seg = {
      color: s.color,
      dash: `${length} ${circumference - length}`,
      offset: -consumed
    };
    consumed += length;
    return seg;
  });
}
