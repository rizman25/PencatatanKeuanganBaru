import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadCategories, loadDebts, loadWallets } from '$lib/server/data';
import { saveTransaction } from '$lib/server/transactions';
import { notFound, requireHousehold } from '$lib/server/session';
import { debtReturnPath } from '$lib/debts';
import { isoDate } from '$lib/format';
import type { RequestEvent } from '@sveltejs/kit';

/** Where to land after touching a Transaction: its Debt's tab, or the timeline. */
async function returnPath(event: RequestEvent, debtId: string): Promise<string> {
  if (!debtId) return '/transaksi';

  const { data: debt } = await event.locals.supabase
    .from('debts')
    .select('direction')
    .eq('id', debtId)
    .maybeSingle();

  return debtReturnPath(debt?.direction);
}

export const load: PageServerLoad = async ({ locals, params }) => {
  const { data: tx } = await locals.supabase
    .from('transactions')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (!tx) notFound();

  const [wallets, categories, debts] = await Promise.all([
    // Archived wallets stay selectable while editing an old transaction that used one.
    loadWallets(locals.supabase, { includeArchived: true }),
    loadCategories(locals.supabase, { includeArchived: true }),
    tx.debt_id ? loadDebts(locals.supabase) : Promise.resolve([])
  ]);

  return {
    tx,
    wallets,
    categories,
    debt: tx.debt_id ? (debts.find((d) => d.id === tx.debt_id) ?? null) : null,
    today: isoDate()
  };
};

export const actions: Actions = {
  simpan: async (event) => {
    const { householdId, userId } = await requireHousehold(event);
    const form = await event.request.formData();

    const failure = await saveTransaction(event.locals.supabase, {
      householdId,
      userId,
      form,
      id: event.params.id
    });
    if (failure) return failure;

    // Same rule as recording: a debt-linked Transaction belongs to Hutang, on
    // the tab matching its direction.
    const debtId = String(form.get('debt_id') ?? '');
    redirect(303, await returnPath(event, debtId));
  },

  hapus: async (event) => {
    await requireHousehold(event);

    // Read the link before the row goes, or there is nothing left to route by.
    const { data: tx } = await event.locals.supabase
      .from('transactions')
      .select('debt_id')
      .eq('id', event.params.id)
      .maybeSingle();

    const destination = await returnPath(event, tx?.debt_id ?? '');
    await event.locals.supabase.from('transactions').delete().eq('id', event.params.id);
    redirect(303, destination);
  }
};
