import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadCategories, loadDebts, loadWallets } from '$lib/server/data';
import { saveTransaction } from '$lib/server/transactions';
import { requireHousehold } from '$lib/server/session';
import { debtReturnPath, paymentHistory } from '$lib/debts';
import { isoDate } from '$lib/format';

export const load: PageServerLoad = async ({ locals, url }) => {
  const debtId = url.searchParams.get('hutang');

  const [wallets, categories, debts] = await Promise.all([
    loadWallets(locals.supabase),
    loadCategories(locals.supabase),
    debtId ? loadDebts(locals.supabase) : Promise.resolve([])
  ]);

  const debt = debtId ? (debts.find((d) => d.id === debtId) ?? null) : null;

  /**
   * The Debt's own record: what has been paid, what is left after each payment,
   * and who entered it. Context for the payment being recorded, not an editing
   * surface — editing stays on the Transaction screen.
   */
  let history = null;
  if (debt) {
    const [{ data: txs }, { data: members }] = await Promise.all([
      locals.supabase
        .from('transactions')
        .select('*')
        .eq('debt_id', debt.id)
        // Oldest first: a running balance in any other order means nothing.
        .order('occurred_on', { ascending: true })
        .order('created_at', { ascending: true }),
      // Loaded separately rather than as an embedded select, so the join stays
      // in TypeScript where it can be read.
      locals.supabase.from('profiles').select('id, display_name')
    ]);

    const names = new Map(
      ((members ?? []) as { id: string; display_name: string | null }[]).map((m) => [
        m.id,
        m.display_name ?? 'Anggota'
      ])
    );

    history = paymentHistory(debt.principal_amount, (txs ?? []) as any[], names);
  }

  return {
    wallets,
    categories,
    debt,
    history,
    today: isoDate()
  };
};

export const actions: Actions = {
  simpan: async (event) => {
    const { householdId, userId } = await requireHousehold(event);
    const form = await event.request.formData();

    const failure = await saveTransaction(event.locals.supabase, { householdId, userId, form });
    if (failure) return failure;

    /**
     * A cicilan belongs to the Hutang list you were working through, so that is
     * where it returns you — and to the right tab, since a Piutang lives under
     * a different segment. Everything else still lands on the timeline.
     *
     * Chosen from what was recorded rather than from a `from=` parameter: an
     * unvalidated return URL is an open redirect, and a validated one is more
     * machinery than two destinations need.
     */
    const debtId = String(form.get('debt_id') ?? '');
    if (!debtId) redirect(303, '/transaksi');

    const { data: debt } = await event.locals.supabase
      .from('debts')
      .select('direction')
      .eq('id', debtId)
      .maybeSingle();

    redirect(303, debtReturnPath(debt?.direction));
  }
};
