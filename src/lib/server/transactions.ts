import { fail } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Shared validation for create and edit. The database enforces the same rules
 * (transfer_shape, classified, debt_role_paired) — this exists to give a readable
 * Indonesian message rather than a constraint violation.
 */
export async function saveTransaction(
  supabase: SupabaseClient,
  opts: { householdId: string; userId: string; form: FormData; id?: string }
) {
  const { form, householdId, userId, id } = opts;

  const type = String(form.get('type') ?? 'expense');
  const amount = Number(form.get('amount') ?? 0);
  const walletId = String(form.get('wallet_id') ?? '');
  const toWalletId = String(form.get('to_wallet_id') ?? '') || null;
  const categoryId = String(form.get('category_id') ?? '') || null;
  const debtId = String(form.get('debt_id') ?? '') || null;
  const occurredOn = String(form.get('occurred_on') ?? '');
  const note = String(form.get('note') ?? '').trim() || null;

  if (!amount || amount <= 0) return fail(400, { message: 'Isi jumlah dulu.' });
  if (!walletId) return fail(400, { message: 'Pilih dompet.' });
  if (!occurredOn) return fail(400, { message: 'Pilih tanggal.' });

  if (type === 'transfer') {
    if (!toWalletId) return fail(400, { message: 'Pilih dompet tujuan.' });
    if (walletId === toWalletId)
      return fail(400, { message: 'Dompet asal dan tujuan harus berbeda.' });
  } else if (!categoryId && !debtId) {
    return fail(400, { message: 'Pilih kategori.' });
  }

  const row = {
    household_id: householdId,
    type,
    amount,
    wallet_id: walletId,
    to_wallet_id: type === 'transfer' ? toWalletId : null,
    category_id: type === 'transfer' ? null : debtId ? null : categoryId,
    debt_id: debtId,
    role: debtId ? ('repayment' as const) : null,
    occurred_on: occurredOn,
    note,
    created_by: userId
  };

  const { error } = id
    ? await supabase
        .from('transactions')
        .update({ ...row, updated_at: new Date().toISOString() })
        .eq('id', id)
    : await supabase.from('transactions').insert(row);

  if (error) return fail(400, { message: error.message });
  return null;
}
