import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadCategories } from '$lib/server/data';
import { requireHousehold } from '$lib/server/session';
import { isoDate, monthStart } from '$lib/format';
import { rollUp } from '$lib/chart';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { household, month } = await parent();

  const [{ data: progress }, categories] = await Promise.all([
    // The function is already month-parameterised, so reading a past month is
    // a different argument rather than a different query.
    locals.supabase.rpc('budget_progress', { p_household: household.id, p_month: month.start }),
    loadCategories(locals.supabase)
  ]);

  const rows = ((progress ?? []) as any[]).map((b) => {
    const amount = Number(b.amount);
    const spent = Number(b.spent);
    const pct = b.pct === null ? 0 : Number(b.pct);
    return {
      categoryId: b.category_id,
      name: b.category_name,
      amount,
      spent,
      pct,
      over: spent > amount,
      overBy: Math.max(0, spent - amount),
      barWidth: Math.min(pct, 100)
    };
  });

  /**
   * Spending across budgeted Categories only, matching the bars beneath it.
   * The whole-month picture, including Debt payments and unbudgeted spending,
   * is Beranda's job.
   */
  const slices = rollUp(
    new Map(rows.map((r) => [r.name, r.spent])),
    6,
    new Map(rows.map((r) => [r.name, r.categoryId]))
  );

  const budgeted = new Set(rows.map((r) => r.categoryId));

  return {
    rows,
    slices,
    spentTotal: rows.reduce((a, r) => a + r.spent, 0),
    // Only expense categories can carry a budget, and only ones without one already.
    available: categories.filter((c) => c.kind === 'expense' && !budgeted.has(c.id))
  };
};

export const actions: Actions = {
  simpan: async (event) => {
    const { householdId } = await requireHousehold(event);
    const form = await event.request.formData();
    const categoryId = String(form.get('category_id') ?? '');
    const amount = Number(form.get('amount') ?? 0);

    /**
     * Always effective from the current month, whatever month is being browsed.
     * Backdating a limit would rewrite what a past month reported against, and
     * the whole point of effective_from is that it never does.
     */
    const month = monthStart(isoDate());

    if (!categoryId) return fail(400, { message: 'Pilih kategori.' });
    if (!amount || amount <= 0) return fail(400, { message: 'Isi batas anggaran.' });

    const { error } = await event.locals.supabase.from('budgets').upsert(
      { household_id: householdId, category_id: categoryId, amount, effective_from: month },
      { onConflict: 'household_id,category_id,effective_from' }
    );
    if (error) return fail(400, { message: error.message });
  },

  hentikan: async (event) => {
    const { householdId } = await requireHousehold(event);
    const form = await event.request.formData();
    const categoryId = String(form.get('category_id') ?? '');
    const month = monthStart(isoDate());

    // NULL amount = budget lifted from this month onward, history intact.
    await event.locals.supabase.from('budgets').upsert(
      { household_id: householdId, category_id: categoryId, amount: null, effective_from: month },
      { onConflict: 'household_id,category_id,effective_from' }
    );
  }
};
