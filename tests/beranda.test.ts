import { describe, expect, it } from 'vitest';
import { load } from '../src/routes/(app)/beranda/+page.server';
import { fakeSupabase } from './fake-supabase';
import { AVATAR, fixture, HOUSEHOLD, IDS, TODAY } from './fixtures';
import { resolveMonth } from '$lib/month';
import { CICILAN, HUTANG } from '$lib/chart';

/**
 * The seam is the load function (spec 0001): it is called the way SvelteKit
 * calls it and its returned view model is asserted. Nothing here knows which
 * Supabase methods were used to get there.
 */
function beranda(monthParam: string | null = null, overrides = {}) {
  const month = resolveMonth(monthParam, TODAY);
  return (load as any)({
    locals: { supabase: fakeSupabase(fixture(overrides)) },
    parent: async () => ({
      household: { id: HOUSEHOLD, name: 'Rumah' },
      month,
      user: { id: IDS.ME, email: 'rizman@example.com' }
    })
  });
}

describe('Beranda · month scoping', () => {
  it('reports the selected month, not today', async () => {
    const july = await beranda();
    const june = await beranda('2026-06');

    // July: 8.5jt salary. June: 8.5jt salary + 500rb back from Budi.
    expect(july.inMonth).toBe(8_500_000);
    expect(june.inMonth).toBe(9_000_000);

    expect(july.exMonth).toBe(1_850_000 + 145_000 + 430_000 + 285_000 + 680_000 + 1_000_000 + 500_000);
    expect(june.exMonth).toBe(1_520_000 + 620_000 + 310_000 + 940_000 + 1_000_000 + 500_000);
  });

  it('keeps Total Saldo live, identical in every month', async () => {
    const july = await beranda();
    const april = await beranda('2026-04');

    // Archived wallets are excluded, so Dompet Lama's balance is not counted.
    const live = 1_250_000 + 9_000_000 + 800_000 + 14_000_000;
    expect(july.totalSaldo).toBe(live);
    expect(april.totalSaldo).toBe(live);
  });

  it('excludes Transfers from both monthly figures', async () => {
    // A month whose only movement is a 2jt transfer between two Wallets. Money
    // never left the Household, so neither figure may register it.
    const transfersOnly = fixture({
      transactions: [
        {
          id: 't-x', household_id: HOUSEHOLD, type: 'transfer', amount: 2_000_000,
          wallet_id: 'w-bca', to_wallet_id: 'w-tabungan', category_id: null, debt_id: null,
          role: null, occurred_on: '2026-07-08', note: null, created_by: 'user-rizman',
          created_at: '2026-07-08T09:00:00Z'
        }
      ]
    });

    const data = await (load as any)({
      locals: { supabase: fakeSupabase(transfersOnly) },
      parent: async () => ({
        household: { id: HOUSEHOLD, name: 'Rumah' },
        month: resolveMonth(null, TODAY),
        user: { id: IDS.ME, email: 'rizman@example.com' }
      })
    });

    expect(data.inMonth).toBe(0);
    expect(data.exMonth).toBe(0);
    expect(data.slices).toEqual([]);
  });

  it('lists only the selected month in Transaksi Terakhir', async () => {
    const june = await beranda('2026-06');
    expect(june.recent).toHaveLength(4);
    expect(june.recent.every((r: any) => r.occurred_on.startsWith('2026-06'))).toBe(true);
  });
});

describe('Beranda · cash-flow bars', () => {
  it('ends on the selected month', async () => {
    const july = await beranda();
    expect(july.chart.map((c: any) => c.label)).toEqual(['Apr', 'Mei', 'Jun', 'Jul']);
    expect(july.chart.at(-1).selected).toBe(true);
  });

  it('re-anchors on a past month rather than always ending at today', async () => {
    const may = await beranda('2026-05');
    expect(may.chart.map((c: any) => c.label)).toEqual(['Feb', 'Mar', 'Apr', 'Mei']);
    expect(may.chart.at(-1).selected).toBe(true);
    expect(may.chart.filter((c: any) => c.selected)).toHaveLength(1);
  });
});

describe('Beranda · Perlu Perhatian', () => {
  it('carries both budget and debt alerts in the current month', async () => {
    const july = await beranda();
    const texts = july.alerts.map((a: any) => a.text);

    // Makan is 1.995jt against a 1.5jt limit; Cicilan HP and Budi are both overdue.
    expect(texts.some((t: string) => t.includes('Makan'))).toBe(true);
    expect(texts.some((t: string) => t.includes('Cicilan HP') && t.includes('terlambat'))).toBe(true);
    expect(texts.some((t: string) => t.includes('Budi'))).toBe(true);
  });

  it('drops debt alerts in a past month, keeping budget alerts', async () => {
    const june = await beranda('2026-06');

    expect(june.alerts.every((a: any) => a.href === '/anggaran')).toBe(true);
    expect(june.alerts.some((a: any) => a.text.includes('Cicilan HP'))).toBe(false);
    // Makan spent 1.52jt against the 1.2jt limit in force in June.
    expect(june.alerts.some((a: any) => a.text.includes('Makan'))).toBe(true);
  });

  it('reports against the budget in force at the time, not the current one', async () => {
    const june = await beranda('2026-06');
    const makan = june.alerts.find((a: any) => a.text.includes('Makan'));
    // 1.520.000 of a 1.200.000 limit = 127%, not the 101% today's 1.5jt would give.
    expect(makan.text).toContain('127%');
  });

  it('leaves a genuinely quiet past month with an empty carousel', async () => {
    // March predates every Transaction and every budget, so nothing can fire.
    // This is the case the empty state exists for.
    const march = await beranda('2026-03');
    expect(march.alerts).toEqual([]);
    expect(march.recent).toEqual([]);
  });
});

describe('Beranda · category breakdown', () => {
  it('totals exactly the Pengeluaran figure shown above it', async () => {
    for (const m of [null, '2026-06', '2026-05', '2026-04']) {
      const data = await beranda(m);
      const sum = data.slices.reduce((a: number, s: any) => a + s.amount, 0);
      expect(sum).toBe(data.exMonth);
    }
  });

  it('gathers debt payments into their own slice', async () => {
    const july = await beranda();
    const cicilan = july.slices.find((s: any) => s.name === CICILAN);
    // 1jt to Adik + 500rb on the phone.
    expect(cicilan.amount).toBe(1_500_000);
  });

  it('excludes Transfers entirely', async () => {
    const july = await beranda();
    expect(july.slices.some((s: any) => s.name === 'Transfer')).toBe(false);
    expect(july.slices.reduce((a: number, s: any) => a + s.amount, 0)).toBe(4_890_000);
  });

  it('ranks slices largest first', async () => {
    const july = await beranda();
    const amounts = july.slices.map((s: any) => s.amount);
    expect([...amounts].sort((a, b) => b - a)).toEqual(amounts);
  });

  it('is empty in a month with no spending', async () => {
    const empty = await beranda(null, { transactions: [] });
    expect(empty.slices).toEqual([]);
    expect(empty.exMonth).toBe(0);
  });
});

describe('Beranda · income breakdown', () => {
  it('totals exactly the Pemasukan figure shown above it', async () => {
    for (const m of [null, '2026-06', '2026-05', '2026-04']) {
      const data = await beranda(m);
      const sum = data.incomeSlices.reduce((a: number, s: any) => a + s.amount, 0);
      expect(sum).toBe(data.inMonth);
    }
  });

  it('splits the month by income Category, borrowing included', async () => {
    // May is the richest income month in the fixture: salary, a bonus, and a
    // 5jt borrowing from Adik that carries no Category at all.
    const may = await beranda('2026-05');
    const byName = Object.fromEntries(may.incomeSlices.map((s: any) => [s.name, s.amount]));
    expect(byName).toEqual({ Gaji: 8_500_000, Bonus: 2_000_000, [HUTANG]: 5_000_000 });
  });

  it('gathers a Piutang repayment into the same slice as borrowing', async () => {
    // June: Budi repays 500rb. Money in, no Category, opposite direction to a
    // borrowing — one slice covers both.
    const june = await beranda('2026-06');
    const debt = june.incomeSlices.find((s: any) => s.name === HUTANG);
    expect(debt.amount).toBe(500_000);
  });

  it('excludes Transfers, which bring nothing into the Household', async () => {
    const transfersOnly = fixture({
      transactions: [
        {
          id: 't-x', household_id: HOUSEHOLD, type: 'transfer', amount: 2_000_000,
          wallet_id: 'w-bca', to_wallet_id: 'w-tabungan', category_id: null, debt_id: null,
          role: null, occurred_on: '2026-07-08', note: null, created_by: 'user-rizman',
          created_at: '2026-07-08T09:00:00Z'
        }
      ]
    });
    const data = await (load as any)({
      locals: { supabase: fakeSupabase(transfersOnly) },
      parent: async () => ({
        household: { id: HOUSEHOLD, name: 'Rumah' },
        month: resolveMonth(null, TODAY),
        user: { id: IDS.ME, email: 'rizman@example.com' }
      })
    });
    expect(data.incomeSlices).toEqual([]);
    expect(data.inMonth).toBe(0);
  });

  it('excludes Expenses, so the two rings never share a slice', async () => {
    const july = await beranda();
    const names = july.incomeSlices.map((s: any) => s.name);
    expect(names).not.toContain('Makan');
    expect(names).not.toContain(CICILAN);
  });

  it('ranks slices largest first', async () => {
    const july = await beranda();
    const amounts = july.incomeSlices.map((s: any) => s.amount);
    expect([...amounts].sort((a, b) => b - a)).toEqual(amounts);
  });

  it('is empty in a month with no income, rather than a zero ring', async () => {
    const empty = await beranda(null, { transactions: [] });
    expect(empty.incomeSlices).toEqual([]);
    expect(empty.inMonth).toBe(0);
  });
});

describe('Beranda · the header identity', () => {
  it('carries a signed photo for the signed-in Member', async () => {
    const { me } = await beranda();
    expect(me.photo).toBe(`signed:avatars/${AVATAR}?exp=3600`);
  });

  it('names the Member from their profile, not from auth metadata', async () => {
    // display_name is editable now, so a metadata copy would go stale the
    // moment someone renamed themselves.
    const { me } = await beranda();
    expect(me.name).toBe('Rizman Luqman');
  });

  it('falls back to no photo rather than failing when the Member has none', async () => {
    const { me } = await beranda(null, {
      profiles: [{ id: IDS.ME, display_name: 'Rizman Luqman', avatar_url: null }]
    });
    expect(me.photo).toBeNull();
    expect(me.name).toBe('Rizman Luqman');
  });

  it('falls back when the stored path no longer resolves', async () => {
    const { me } = await beranda(null, {
      profiles: [{ id: IDS.ME, display_name: 'Rizman Luqman', avatar_url: 'user-rizman/gone.jpg' }]
    });
    expect(me.photo).toBeNull();
  });
});
