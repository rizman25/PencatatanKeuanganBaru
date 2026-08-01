import type { PageServerLoad } from './$types';
import { loadCategories, loadDebts, loadWallets, nameMap, toRow } from '$lib/server/data';
import { notFound } from '$lib/server/session';
import { isoDate } from '$lib/format';
import type { Transaction } from '$lib/types';

/**
 * Keyed by the Category's id rather than a name slug: Categories get renamed,
 * and their names are not unique across income and expense.
 */
export const load: PageServerLoad = async ({ locals, params, parent }) => {
  const { household, month } = await parent();
  const categoryId = params.kategori;

  const [{ data: progress }, categories, wallets, debts, { data: txs }] = await Promise.all([
    locals.supabase.rpc('budget_progress', { p_household: household.id, p_month: month.start }),
    loadCategories(locals.supabase, { includeArchived: true }),
    loadWallets(locals.supabase, { includeArchived: true }),
    loadDebts(locals.supabase),
    locals.supabase
      .from('transactions')
      .select('*')
      .eq('category_id', categoryId)
      .eq('type', 'expense')
      .gte('occurred_on', month.start)
      .lte('occurred_on', month.end)
      .order('occurred_on', { ascending: false })
      .order('created_at', { ascending: false })
  ]);

  const category = categories.find((c) => c.id === categoryId);
  if (!category) notFound();

  const budget = ((progress ?? []) as any[]).find((b) => b.category_id === categoryId);

  const walletNames = nameMap(wallets, 'name');
  const categoryNames = nameMap(categories, 'name');
  const debtNames = new Map(debts.map((d) => [d.id, d.party_name]));

  /**
   * The same row shaping the timeline uses. The drill-down exists to reconcile
   * a number with the rows behind it, so a second way of rendering those rows
   * would defeat the point the moment the two drifted.
   */
  const rows = ((txs ?? []) as Transaction[]).map((t) =>
    toRow(t, walletNames, categoryNames, debtNames)
  );

  const spent = ((txs ?? []) as Transaction[]).reduce((a, t) => a + t.amount, 0);
  const amount = budget ? Number(budget.amount) : null;
  const pct = amount ? Math.round((spent * 100) / amount) : null;

  return {
    name: category.name,
    amount,
    spent,
    pct,
    over: amount !== null && spent > amount,
    overBy: amount === null ? 0 : Math.max(0, spent - amount),
    barWidth: pct === null ? 0 : Math.min(pct, 100),
    rows,
    today: isoDate()
  };
};
