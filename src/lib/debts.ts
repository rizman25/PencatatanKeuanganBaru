/**
 * Filtering the Hutang list (spec 0001). Browser-safe: every Debt is already
 * loaded, so narrowing needs no round trip.
 */

/**
 * `aktif` means still owing — including overdue ones, because a late Debt is
 * the most active thing on the list. `terlambat` is the overdue subset of it.
 * Settled Debts appear only under `lunas` or `semua`; nothing is ever deleted
 * (ADR-0008), it is just not what you came to the screen to do.
 */
export type DebtFilter = 'aktif' | 'terlambat' | 'lunas' | 'semua';

export const DEBT_FILTERS: { key: DebtFilter; label: string }[] = [
  { key: 'aktif', label: 'Aktif' },
  { key: 'terlambat', label: 'Terlambat' },
  { key: 'lunas', label: 'Lunas' },
  { key: 'semua', label: 'Semua' }
];

/** The default view: what still needs doing. */
export const DEFAULT_FILTER: DebtFilter = 'aktif';

export interface DebtRow {
  id: string;
  name: string;
  settled: boolean;
  overdue: boolean;
  [key: string]: unknown;
}

function inStatus(row: DebtRow, status: DebtFilter): boolean {
  switch (status) {
    case 'aktif':
      return !row.settled;
    case 'terlambat':
      return !row.settled && row.overdue;
    case 'lunas':
      return row.settled;
    case 'semua':
      return true;
  }
}

/** Matches the party name — the only thing you know when hunting for a Debt. */
export function matchesParty(row: DebtRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  return !q || row.name.toLowerCase().includes(q);
}

export function filterDebts<T extends DebtRow>(
  rows: T[],
  status: DebtFilter,
  query = ''
): T[] {
  return rows.filter((r) => inStatus(r, status) && matchesParty(r, query));
}

/**
 * Which Hutang tab a Debt belongs to. Derived from the Debt itself rather than
 * carried as a return URL — same reasoning as the save redirect: an
 * unvalidated return path is an open redirect, and this needs no parameter.
 */
export function debtReturnPath(direction: string | null | undefined): string {
  return direction === 'receivable' ? '/hutang?seg=piutang' : '/hutang';
}

export interface HistoryRow {
  id: string;
  occurred_on: string;
  amount: number;
  note: string | null;
  /** Display name of the Member who recorded it. */
  by: string;
  kind: 'origination' | 'repayment';
  /**
   * Sisa after this payment. Null on the origination row, which is not part of
   * the arithmetic — the principal already accounts for the money arriving.
   */
  remaining: number | null;
}

export interface History {
  rows: HistoryRow[];
  /**
   * False for a Debt that never involved money changing hands — a purchase on
   * credit (ADR-0004). The absence of an origination row is a modelling
   * outcome, not missing data, and the screen has to say so.
   */
  hasOrigination: boolean;
}

/**
 * Builds the running record of a Debt. `transactions` must be oldest first;
 * the sisa is meaningless in any other order.
 */
export function paymentHistory(
  principal: number,
  transactions: {
    id: string;
    amount: number;
    occurred_on: string;
    note: string | null;
    role: string | null;
    created_by: string;
  }[],
  memberNames: Map<string, string>
): History {
  let paid = 0;
  const rows: HistoryRow[] = [];

  for (const t of transactions) {
    const isOrigination = t.role === 'origination';
    if (!isOrigination) paid += t.amount;

    rows.push({
      id: t.id,
      occurred_on: t.occurred_on,
      amount: t.amount,
      note: t.note,
      // An id we cannot resolve is still a person; it just is not one we know.
      by: memberNames.get(t.created_by) ?? 'Anggota',
      kind: isOrigination ? 'origination' : 'repayment',
      remaining: isOrigination ? null : Math.max(principal - paid, 0)
    });
  }

  return { rows, hasOrigination: rows.some((r) => r.kind === 'origination') };
}

/**
 * Counts shown on the chips, computed after the search so an empty list is
 * always explained by a chip reading 0 rather than looking like lost data.
 */
export function debtCounts(rows: DebtRow[], query = ''): Record<DebtFilter, number> {
  const found = rows.filter((r) => matchesParty(r, query));
  return {
    aktif: found.filter((r) => inStatus(r, 'aktif')).length,
    terlambat: found.filter((r) => inStatus(r, 'terlambat')).length,
    lunas: found.filter((r) => inStatus(r, 'lunas')).length,
    semua: found.length
  };
}
