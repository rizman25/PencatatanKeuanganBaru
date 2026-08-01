/**
 * Shaping a list of Transactions for display (spec 0001).
 *
 * Browser-safe on purpose. Search runs client-side so results appear as you
 * type, which means the grouping has to be recomputed client-side too — and
 * the Anggaran drill-down has to reuse exactly this, or the number on a budget
 * bar and the rows behind it will eventually disagree.
 */
import { dateLabel } from '$lib/format';
import type { TxRow } from '$lib/types';

export interface DayGroup {
  dateLabel: string;
  items: TxRow[];
}

/**
 * Groups by day, preserving whatever order the caller established. Groups are
 * built from the rows given, so a filtered list never shows a day header with
 * nothing under it.
 */
export function groupByDay(rows: TxRow[], today: string): DayGroup[] {
  const groups: DayGroup[] = [];
  const byDate = new Map<string, DayGroup>();

  for (const r of rows) {
    let g = byDate.get(r.occurred_on);
    if (!g) {
      g = { dateLabel: dateLabel(r.occurred_on, today), items: [] };
      byDate.set(r.occurred_on, g);
      groups.push(g);
    }
    g.items.push(r);
  }

  return groups;
}

/**
 * Matches against the two lines the row already displays — its title
 * (Category, Debt, or Transfer) and its subtitle (Wallet, party, note).
 * Searching what is on screen is what makes a result explicable: you can
 * always see why a row matched.
 */
export function matches(row: TxRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return row.title.toLowerCase().includes(q) || row.sub.toLowerCase().includes(q);
}

export function searchRows(rows: TxRow[], query: string): TxRow[] {
  if (!query.trim()) return rows;
  return rows.filter((r) => matches(r, query));
}
