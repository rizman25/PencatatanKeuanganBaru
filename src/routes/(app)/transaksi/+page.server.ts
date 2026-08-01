import type { PageServerLoad } from './$types';
import { loadCategories, loadDebts, loadWallets, nameMap, toRow } from '$lib/server/data';
import { isoDate } from '$lib/format';
import type { Transaction } from '$lib/types';

const FILTERS = {
  semua: null,
  pemasukan: 'income',
  pengeluaran: 'expense',
  transfer: 'transfer'
} as const;

/**
 * A safety net, not the definition of the result set. One Household's month
 * will never approach this; the bound that matters is the month itself.
 */
const CAP = 500;

export const load: PageServerLoad = async ({ locals, url, parent }) => {
  const { month } = await parent();
  const filter = (url.searchParams.get('f') ?? 'semua') as keyof typeof FILTERS;
  const type = FILTERS[filter] ?? null;

  /**
   * Bounded by the selected month. Before this the screen printed a month label
   * over the last 200 Transactions of all time — it named a month it had never
   * filtered by.
   */
  /**
   * Loaded before the query because the Wallet filter is validated against the
   * Household's own Wallets: a `w` naming nothing is ignored, so a stale or
   * hand-edited link shows everything rather than an empty list it cannot
   * explain. RLS already makes a foreign id return no rows; this is about what
   * the Member sees, not about access.
   */
  const wallets = await loadWallets(locals.supabase, { includeArchived: true });
  const wallet = wallets.find((w) => w.id === url.searchParams.get('w')) ?? null;

  let q = locals.supabase
    .from('transactions')
    .select('*')
    .gte('occurred_on', month.start)
    .lte('occurred_on', month.end)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(CAP);

  if (type) q = q.eq('type', type);

  /**
   * Either side of the Transaction. Matching only `wallet_id` would hide a
   * Transfer *into* this Wallet from its own list while still counting it in
   * the Balance — the list and the figure would disagree.
   */
  if (wallet) q = q.or(`wallet_id.eq.${wallet.id},to_wallet_id.eq.${wallet.id}`);

  const [{ data: txs }, categories, debts] = await Promise.all([
    q,
    loadCategories(locals.supabase, { includeArchived: true }),
    loadDebts(locals.supabase)
  ]);

  const walletNames = nameMap(wallets, 'name');
  const categoryNames = nameMap(categories, 'name');
  const debtNames = new Map(debts.map((d) => [d.id, d.party_name]));

  /**
   * Flat rows, not day groups: search runs in the browser and has to regroup
   * whatever survives it, so grouping is the component's job.
   */
  const rows = ((txs ?? []) as Transaction[]).map((t) =>
    toRow(t, walletNames, categoryNames, debtNames)
  );

  return {
    rows,
    filter,
    wallet: wallet ? { id: wallet.id, name: wallet.name } : null,
    today: isoDate()
  };
};
