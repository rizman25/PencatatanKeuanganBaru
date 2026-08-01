import { describe, expect, it } from 'vitest';
import { load } from '../src/routes/(app)/transaksi/+page.server';
import { fakeSupabase } from './fake-supabase';
import { fixture, TODAY } from './fixtures';
import { resolveMonth } from '$lib/month';
import { groupByDay, searchRows } from '$lib/rows';

function transaksi(monthParam: string | null = null, filter?: string) {
  const month = resolveMonth(monthParam, TODAY);
  const url = new URL('http://x/transaksi' + (filter ? `?f=${filter}` : ''));
  return (load as any)({
    locals: { supabase: fakeSupabase(fixture()) },
    url,
    parent: async () => ({ month })
  });
}

function byWallet(walletId: string, extra = '') {
  const month = resolveMonth(null, TODAY);
  return (load as any)({
    locals: { supabase: fakeSupabase(fixture()) },
    url: new URL(`http://x/transaksi?w=${walletId}${extra}`),
    parent: async () => ({ month })
  });
}

const ids = (r: { rows: any[] }) => r.rows.map((x: any) => x.id).sort();

describe('Transaksi · wallet filter', () => {
  it('narrows to one wallet and names it back for the banner', async () => {
    const gopay = await byWallet('w-gopay');
    expect(gopay.wallet).toEqual({ id: 'w-gopay', name: 'GoPay' });
    expect(ids(gopay)).toEqual(['t-703', 't-704']);
  });

  it('shows a transfer under the wallet it arrived in, not only the one it left', async () => {
    // t-709 moves 2jt from BCA to Tabungan. Tabungan is never its wallet_id.
    const tabungan = await byWallet('w-tabungan');
    expect(ids(tabungan)).toEqual(['t-709']);
  });

  it('shows a transfer under the wallet it left as well', async () => {
    const bca = await byWallet('w-bca');
    expect(bca.rows.map((r: any) => r.id)).toContain('t-709');
    expect(bca.rows.map((r: any) => r.id)).toContain('t-710');
  });

  it('catches both sides for a wallet that sends and receives', async () => {
    // t-702 is spent from Tunai; t-710 is a transfer into it.
    const tunai = await byWallet('w-tunai');
    expect(ids(tunai)).toEqual(['t-702', 't-710']);
  });

  it('composes with the type filter', async () => {
    const spent = await byWallet('w-bca', '&f=pengeluaran');
    expect(ids(spent)).toEqual(['t-705', 't-706', 't-707', 't-708']);
  });

  it('composes with the month, so one wallet can be followed back in time', async () => {
    const month = resolveMonth('2026-06', TODAY);
    const june = await (load as any)({
      locals: { supabase: fakeSupabase(fixture()) },
      url: new URL('http://x/transaksi?w=w-gopay&m=2026-06'),
      parent: async () => ({ month })
    });
    expect(ids(june)).toEqual(['t-603']);
  });

  it('ignores a wallet that is not the household own, rather than erroring', async () => {
    const unknown = await byWallet('w-tidak-ada');
    const all = await transaksi();

    expect(unknown.wallet).toBeNull();
    // Everything comes back — a stale link degrades to no filter at all.
    expect(ids(unknown)).toEqual(ids(all));
  });
});

describe('Transaksi · month bounding', () => {
  it('returns only the selected month, so the header can be trusted', async () => {
    const june = await transaksi('2026-06');
    expect(june.rows.length).toBeGreaterThan(0);
    expect(june.rows.every((r: any) => r.occurred_on.startsWith('2026-06'))).toBe(true);
  });

  it('returns a different set for a different month', async () => {
    const june = await transaksi('2026-06');
    const july = await transaksi();
    expect(june.rows.map((r: any) => r.id)).not.toEqual(july.rows.map((r: any) => r.id));
    expect(july.rows.every((r: any) => r.occurred_on.startsWith('2026-07'))).toBe(true);
  });

  it('is empty for a month with nothing in it, rather than falling back to all time', async () => {
    const march = await transaksi('2026-03');
    expect(march.rows).toEqual([]);
  });

  it('still narrows by type alongside the month', async () => {
    const june = await transaksi('2026-06', 'pemasukan');
    expect(june.filter).toBe('pemasukan');
    expect(june.rows).toHaveLength(2); // salary, and Budi's repayment
    expect(june.rows.every((r: any) => r.signAmount.startsWith('+'))).toBe(true);
  });

  it('orders newest first', async () => {
    const july = await transaksi();
    const dates = july.rows.map((r: any) => r.occurred_on);
    expect([...dates].sort().reverse()).toEqual(dates);
  });
});

describe('Transaksi · search', () => {
  it('matches the note shown on the row', async () => {
    const { rows } = await transaksi();
    const found = searchRows(rows, 'bensin');
    expect(found).toHaveLength(1);
    expect(found[0].sub).toContain('Bensin');
  });

  it('matches the category title', async () => {
    const { rows } = await transaksi();
    expect(searchRows(rows, 'Makan').length).toBe(2);
  });

  it('matches the wallet name', async () => {
    const { rows } = await transaksi();
    const found = searchRows(rows, 'gopay');
    expect(found.length).toBe(2);
    expect(found.every((r) => r.sub.includes('GoPay'))).toBe(true);
  });

  it('ignores case', async () => {
    const { rows } = await transaksi();
    expect(searchRows(rows, 'INTERNET')).toHaveLength(1);
  });

  it('returns everything for an empty or whitespace query', async () => {
    const { rows } = await transaksi();
    expect(searchRows(rows, '')).toHaveLength(rows.length);
    expect(searchRows(rows, '   ')).toHaveLength(rows.length);
  });

  it('finds nothing outside the loaded month', async () => {
    // "Obat" is a June transaction; searching July must not reach it.
    const july = await transaksi();
    expect(searchRows(july.rows, 'Obat')).toEqual([]);

    const june = await transaksi('2026-06');
    expect(searchRows(june.rows, 'Obat')).toHaveLength(1);
  });
});

describe('Transaksi · day grouping', () => {
  it('groups rows under one header per day', async () => {
    const { rows, today } = await transaksi();
    const groups = groupByDay(rows, today);
    const total = groups.reduce((a, g) => a + g.items.length, 0);
    expect(total).toBe(rows.length);
    expect(new Set(groups.map((g) => g.dateLabel)).size).toBe(groups.length);
  });

  it('recomputes after a search, leaving no empty day headers', async () => {
    const { rows, today } = await transaksi();
    const groups = groupByDay(searchRows(rows, 'Makan'), today);
    expect(groups.every((g) => g.items.length > 0)).toBe(true);
    // The two Makan rows fall on different days, so two headers survive.
    expect(groups).toHaveLength(2);
  });

  it('produces no groups at all when the search matches nothing', async () => {
    const { rows, today } = await transaksi();
    expect(groupByDay(searchRows(rows, 'zzzz'), today)).toEqual([]);
  });
});
