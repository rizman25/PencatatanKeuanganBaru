import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadDebts, loadWallets } from '$lib/server/data';
import { requireHousehold } from '$lib/server/session';
import { fmtDate, isoDate } from '$lib/format';

export const load: PageServerLoad = async ({ locals, url }) => {
  const seg = url.searchParams.get('seg') === 'piutang' ? 'receivable' : 'payable';

  const [debts, wallets] = await Promise.all([
    loadDebts(locals.supabase),
    loadWallets(locals.supabase)
  ]);

  const rows = debts
    .filter((d) => d.direction === seg)
    .map((d) => {
      const du = d.days_until_due;
      let statusLabel: string;
      let statusTone: 'ok' | 'late' | 'soon' | 'idle';

      if (d.remaining_amount <= 0) {
        statusLabel = 'Lunas';
        statusTone = 'ok';
      } else if (du !== null && du < 0) {
        statusLabel = `Terlambat ${Math.abs(du)}h`;
        statusTone = 'late';
      } else if (du !== null && du <= 7) {
        statusLabel = `${du} hari lagi`;
        statusTone = 'soon';
      } else {
        statusLabel = 'Aktif';
        statusTone = 'idle';
      }

      return {
        id: d.id,
        name: d.party_name,
        principal: d.principal_amount,
        remaining: Math.max(d.remaining_amount, 0),
        paidWidth: Math.min(Math.round((d.paid_amount / d.principal_amount) * 100), 100),
        statusLabel,
        statusTone,
        dueLabel: d.remaining_amount <= 0 ? 'Selesai' : d.due_date ? 'Tempo ' + fmtDate(d.due_date) : 'Tanpa tempo',
        settled: d.remaining_amount <= 0,
        // Both flags feed the status chips, which filter in the browser.
        overdue: d.remaining_amount > 0 && du !== null && du < 0
      };
    });

  return {
    rows,
    seg: seg === 'payable' ? 'hutang' : 'piutang',
    wallets,
    today: isoDate(),
    intro:
      seg === 'payable'
        ? 'Uang yang kita pinjam. Ketuk untuk catat cicilan.'
        : 'Uang yang dipinjamkan. Ketuk untuk catat penerimaan.'
  };
};

export const actions: Actions = {
  tambah: async (event) => {
    const { householdId, userId } = await requireHousehold(event);
    const form = await event.request.formData();

    const direction = String(form.get('direction') ?? 'payable');
    const partyName = String(form.get('party_name') ?? '').trim();
    const principal = Number(form.get('principal_amount') ?? 0);
    const dueDate = String(form.get('due_date') ?? '') || null;
    const walletId = String(form.get('wallet_id') ?? '') || null;
    const moneyMoved = String(form.get('money_moved') ?? '') === 'on';

    if (!partyName) return fail(400, { message: 'Isi nama pihak.' });
    if (!principal || principal <= 0) return fail(400, { message: 'Isi jumlah pokok.' });
    if (moneyMoved && !walletId) return fail(400, { message: 'Pilih dompet penerima.' });

    const { data: debt, error } = await event.locals.supabase
      .from('debts')
      .insert({
        household_id: householdId,
        direction,
        party_name: partyName,
        principal_amount: principal,
        due_date: dueDate,
        created_by: userId
      })
      .select()
      .single();

    if (error) return fail(400, { message: error.message });

    /**
     * ADR-0004: a transaction exists if and only if money crossed a wallet
     * boundary. Borrowing cash creates one; buying on credit does not.
     */
    if (moneyMoved && debt) {
      const { error: txError } = await event.locals.supabase.from('transactions').insert({
        household_id: householdId,
        type: direction === 'payable' ? 'income' : 'expense',
        amount: principal,
        wallet_id: walletId,
        debt_id: debt.id,
        role: 'origination',
        occurred_on: isoDate(),
        note: direction === 'payable' ? 'Terima pinjaman ' + partyName : 'Beri pinjaman ' + partyName,
        created_by: userId
      });
      if (txError) return fail(400, { message: txError.message });
    }
  }
};
