import { describe, expect, it } from 'vitest';
import { load as loadHutang } from '../src/routes/(app)/hutang/+page.server';
import { load as loadCatat } from '../src/routes/(app)/catat/+page.server';
import { fakeSupabase } from './fake-supabase';
import { fixture } from './fixtures';
import { DEFAULT_FILTER, debtCounts, debtReturnPath, filterDebts } from '$lib/debts';

const hutang = (seg = 'hutang') =>
  (loadHutang as any)({
    locals: { supabase: fakeSupabase(fixture()) },
    url: new URL(`http://x/hutang?seg=${seg}`)
  });

const catat = (debtId?: string) =>
  (loadCatat as any)({
    locals: { supabase: fakeSupabase(fixture()) },
    url: new URL('http://x/catat' + (debtId ? `?hutang=${debtId}` : ''))
  });

describe('Hutang · status flags', () => {
  it('marks a settled debt settled and not overdue', async () => {
    const { rows } = await hutang();
    const koperasi = rows.find((r: any) => r.name === 'Koperasi');
    expect(koperasi.settled).toBe(true);
    expect(koperasi.overdue).toBe(false);
  });

  it('marks an unpaid debt past its due date overdue', async () => {
    const { rows } = await hutang();
    const hp = rows.find((r: any) => r.name === 'Cicilan HP');
    expect(hp.settled).toBe(false);
    expect(hp.overdue).toBe(true);
  });

  it('keeps hutang and piutang on separate segments', async () => {
    const payable = await hutang('hutang');
    const receivable = await hutang('piutang');
    expect(payable.rows.map((r: any) => r.name)).not.toContain('Budi');
    expect(receivable.rows.map((r: any) => r.name)).toEqual(['Budi']);
  });
});

describe('Hutang · filtering', () => {
  it('hides settled debts by default', async () => {
    const { rows } = await hutang();
    const shown = filterDebts(rows, DEFAULT_FILTER);
    expect(shown.map((r: any) => r.name)).not.toContain('Koperasi');
    expect(shown.every((r: any) => !r.settled)).toBe(true);
  });

  it('brings settled debts back under Lunas without destroying anything', async () => {
    const { rows } = await hutang();
    const lunas = filterDebts(rows, 'lunas');
    expect(lunas.map((r: any) => r.name)).toEqual(['Koperasi']);
    // The row was never removed from the underlying data.
    expect(rows.some((r: any) => r.name === 'Koperasi')).toBe(true);
  });

  it('narrows to the overdue subset under Terlambat', async () => {
    const { rows } = await hutang();
    const late = filterDebts(rows, 'terlambat');
    expect(late.map((r: any) => r.name)).toEqual(['Cicilan HP']);
  });

  it('shows everything under Semua', async () => {
    const { rows } = await hutang();
    expect(filterDebts(rows, 'semua')).toHaveLength(rows.length);
  });

  it('searches by party name, case-insensitively', async () => {
    const { rows } = await hutang();
    expect(filterDebts(rows, 'semua', 'adik').map((r: any) => r.name)).toEqual(['Adik']);
    expect(filterDebts(rows, 'semua', 'CICILAN').map((r: any) => r.name)).toEqual(['Cicilan HP']);
    expect(filterDebts(rows, 'semua', 'zzz')).toEqual([]);
  });

  it('reports counts that agree with the filtered sets', async () => {
    const { rows } = await hutang();
    const c = debtCounts(rows);
    for (const key of ['aktif', 'terlambat', 'lunas', 'semua'] as const) {
      expect(c[key]).toBe(filterDebts(rows, key).length);
    }
  });

  it('narrows the counts alongside the search, so an empty list is explained', async () => {
    const { rows } = await hutang();
    const c = debtCounts(rows, 'koperasi');
    expect(c).toEqual({ aktif: 0, terlambat: 0, lunas: 1, semua: 1 });
  });
});

describe('Hutang · return path', () => {
  it('sends a piutang back to its own tab, not the hutang one', () => {
    expect(debtReturnPath('receivable')).toBe('/hutang?seg=piutang');
  });

  it('sends a hutang to the default tab', () => {
    expect(debtReturnPath('payable')).toBe('/hutang');
  });

  it('falls back to the hutang tab for an unknown or missing direction', () => {
    expect(debtReturnPath(null)).toBe('/hutang');
    expect(debtReturnPath(undefined)).toBe('/hutang');
    expect(debtReturnPath('nonsense')).toBe('/hutang');
  });

  it('opens a settled debt like any other, so its history is reachable', async () => {
    const data = await catat('d-lunas');
    expect(data.debt).not.toBeNull();
    expect(data.debt.remaining_amount).toBe(0);
    expect(data.history).not.toBeNull();
  });
});

describe('Catat · debt payment history', () => {
  it('is absent for an ordinary transaction', async () => {
    const data = await catat();
    expect(data.debt).toBeNull();
    expect(data.history).toBeNull();
  });

  it('runs the sisa down by each repayment', async () => {
    const { history } = await catat('d-adik');
    const repayments = history.rows.filter((r: any) => r.kind === 'repayment');

    // 5jt principal, two 1jt repayments.
    expect(repayments.map((r: any) => r.remaining)).toEqual([4_000_000, 3_000_000]);
  });

  it('marks the origination row and leaves it out of the arithmetic', async () => {
    const { history } = await catat('d-adik');
    expect(history.hasOrigination).toBe(true);

    const origin = history.rows.find((r: any) => r.kind === 'origination');
    expect(origin.remaining).toBeNull();
    expect(origin.amount).toBe(5_000_000);
    // Oldest first, so the money arriving comes before the payments.
    expect(history.rows[0].kind).toBe('origination');
  });

  it('flags a credit purchase rather than leaving a gap', async () => {
    const { history } = await catat('d-hp');
    expect(history.hasOrigination).toBe(false);
    // 6jt principal, two 500rb payments — the sisa still works without one.
    expect(history.rows.map((r: any) => r.remaining)).toEqual([5_500_000, 5_000_000]);
  });

  it('names who recorded each payment', async () => {
    const { history } = await catat('d-hp');
    expect(history.rows.map((r: any) => r.by)).toEqual(['Sari', 'Rizman Luqman']);
  });

  it('falls back to a neutral label for an unresolvable member', async () => {
    const data = await (loadCatat as any)({
      locals: { supabase: fakeSupabase(fixture({ profiles: [] })) },
      url: new URL('http://x/catat?hutang=d-adik')
    });
    expect(data.history.rows.every((r: any) => r.by === 'Anggota')).toBe(true);
  });

  it('reports an empty history for a debt with no movements at all', async () => {
    const data = await (loadCatat as any)({
      locals: { supabase: fakeSupabase(fixture({ transactions: [] })) },
      url: new URL('http://x/catat?hutang=d-adik')
    });
    expect(data.history.rows).toEqual([]);
    expect(data.history.hasOrigination).toBe(false);
  });

  it('never lets the sisa go negative on an overpayment', async () => {
    const over = fixture({
      transactions: [
        {
          id: 't-over', household_id: 'hh-1', type: 'expense', amount: 9_000_000,
          wallet_id: 'w-bca', to_wallet_id: null, category_id: null, debt_id: 'd-adik',
          role: 'repayment', occurred_on: '2026-07-01', note: 'Lunasi', created_by: 'user-rizman',
          created_at: '2026-07-01T09:00:00Z'
        }
      ]
    });
    const data = await (loadCatat as any)({
      locals: { supabase: fakeSupabase(over) },
      url: new URL('http://x/catat?hutang=d-adik')
    });
    expect(data.history.rows[0].remaining).toBe(0);
  });
});
