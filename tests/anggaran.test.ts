import { describe, expect, it } from 'vitest';
import { load as loadList } from '../src/routes/(app)/anggaran/+page.server';
import { load as loadDetail } from '../src/routes/(app)/anggaran/[kategori]/+page.server';
import { fakeSupabase } from './fake-supabase';
import { fixture, HOUSEHOLD, TODAY } from './fixtures';
import { resolveMonth } from '$lib/month';

const parentFor = (monthParam: string | null) => async () => ({
  household: { id: HOUSEHOLD, name: 'Rumah' },
  month: resolveMonth(monthParam, TODAY)
});

const anggaran = (monthParam: string | null = null) =>
  (loadList as any)({
    locals: { supabase: fakeSupabase(fixture()) },
    parent: parentFor(monthParam)
  });

const detail = (categoryId: string, monthParam: string | null = null) =>
  (loadDetail as any)({
    locals: { supabase: fakeSupabase(fixture()) },
    params: { kategori: categoryId },
    parent: parentFor(monthParam)
  });

describe('Anggaran · budget history', () => {
  it('reports a past month against the limit in force then, not the current one', async () => {
    const june = await anggaran('2026-06');
    const makan = june.rows.find((r: any) => r.name === 'Makan');

    // Makan was 1.2jt from April and was only raised to 1.5jt in July.
    expect(makan.amount).toBe(1_200_000);
    expect(makan.spent).toBe(1_520_000);
    expect(makan.over).toBe(true);
    expect(makan.overBy).toBe(320_000);
  });

  it('reports the current month against the raised limit', async () => {
    const july = await anggaran();
    const makan = july.rows.find((r: any) => r.name === 'Makan');

    expect(makan.amount).toBe(1_500_000);
    expect(makan.spent).toBe(1_850_000 + 145_000);
  });

  it('omits categories with no budget in force in that month', async () => {
    // Belanja's budget only starts in July.
    const june = await anggaran('2026-06');
    expect(june.rows.some((r: any) => r.name === 'Belanja')).toBe(false);

    const july = await anggaran();
    expect(july.rows.some((r: any) => r.name === 'Belanja')).toBe(true);
  });
});

describe('Anggaran · chart', () => {
  it('totals the spending across budgeted categories', async () => {
    const july = await anggaran();
    const sum = july.slices.reduce((a: number, s: any) => a + s.amount, 0);
    expect(sum).toBe(july.spentTotal);
    expect(july.spentTotal).toBe(july.rows.reduce((a: number, r: any) => a + r.spent, 0));
  });

  it('gives every named slice a category to link to', async () => {
    const july = await anggaran();
    for (const s of july.slices) {
      if (s.name === 'Lainnya') continue;
      expect(s.key).toBeTruthy();
      expect(july.rows.some((r: any) => r.categoryId === s.key)).toBe(true);
    }
  });

  it('carries no Cicilan Hutang slice — debt payments have no budget', async () => {
    const july = await anggaran();
    expect(july.slices.some((s: any) => s.name === 'Cicilan Hutang')).toBe(false);
  });

  it('drops categories with a budget but no spending from the chart', async () => {
    const july = await anggaran();
    // Kesehatan has no budget at all; Transportasi has one and was spent on.
    expect(july.slices.every((s: any) => s.amount > 0)).toBe(true);
  });
});

describe('Anggaran · category drill-down', () => {
  it('agrees exactly with the bar it was opened from', async () => {
    for (const month of [null, '2026-06', '2026-05']) {
      const list = await anggaran(month);
      for (const row of list.rows) {
        const d = await detail(row.categoryId, month);
        expect(d.spent).toBe(row.spent);
        expect(d.amount).toBe(row.amount);
        expect(d.name).toBe(row.name);
        expect(d.over).toBe(row.over);
      }
    }
  });

  it('lists only that category, only that month, only expenses', async () => {
    const d = await detail('c-makan', '2026-06');
    expect(d.rows).toHaveLength(1);
    expect(d.rows[0].occurred_on).toBe('2026-06-10');
    expect(d.spent).toBe(1_520_000);
  });

  it('sums its rows to the figure in its own header', async () => {
    const d = await detail('c-makan');
    expect(d.rows).toHaveLength(2);
    expect(d.spent).toBe(1_995_000);
  });

  it('renders a category with a budget but no spending as empty, not broken', async () => {
    const d = await detail('c-transport', '2026-03');
    expect(d.rows).toEqual([]);
    expect(d.spent).toBe(0);
  });

  it('handles a category with no budget by reporting spending and no limit', async () => {
    const d = await detail('c-sehat', '2026-06');
    expect(d.amount).toBeNull();
    expect(d.pct).toBeNull();
    expect(d.spent).toBe(310_000);
    expect(d.rows).toHaveLength(1);
  });
});
