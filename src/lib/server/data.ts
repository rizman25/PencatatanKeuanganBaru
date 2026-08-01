import type { SupabaseClient } from '@supabase/supabase-js';
import type { Category, DebtStatus, Transaction, TxRow, WalletWithBalance } from '$lib/types';
import { signGlyph, signed } from '$lib/format';

/** Wallets joined to the computed-balance view (ADR-0003 — no stored balance). */
export async function loadWallets(
  supabase: SupabaseClient,
  { includeArchived = false } = {}
): Promise<WalletWithBalance[]> {
  let q = supabase.from('wallets').select('*').order('created_at');
  if (!includeArchived) q = q.is('archived_at', null);

  const [{ data: wallets }, { data: balances }] = await Promise.all([
    q,
    supabase.from('wallet_balances').select('wallet_id, balance')
  ]);

  const byId = new Map((balances ?? []).map((b) => [b.wallet_id, Number(b.balance)]));
  return (wallets ?? []).map((w) => ({ ...w, balance: byId.get(w.id) ?? w.initial_balance }));
}

export async function loadCategories(
  supabase: SupabaseClient,
  { includeArchived = false } = {}
): Promise<Category[]> {
  let q = supabase.from('categories').select('*').order('name');
  if (!includeArchived) q = q.is('archived_at', null);
  const { data } = await q;
  return data ?? [];
}

export async function loadDebts(supabase: SupabaseClient): Promise<DebtStatus[]> {
  const { data } = await supabase.from('debt_status').select('*').order('due_date', { nullsFirst: false });
  return (data ?? []).map((d) => ({
    ...d,
    principal_amount: Number(d.principal_amount),
    paid_amount: Number(d.paid_amount),
    remaining_amount: Number(d.remaining_amount)
  }));
}

/**
 * Turns a transaction into the two lines and the signed figure the lists show.
 * Mirrors the prototype's buildTx so the screens read the same as the design.
 */
export function toRow(
  t: Transaction,
  wallets: Map<string, string>,
  categories: Map<string, string>,
  debts: Map<string, string>
): TxRow {
  const wallet = wallets.get(t.wallet_id) ?? '—';
  let title: string;
  let sub: string;

  if (t.type === 'transfer') {
    title = 'Transfer';
    sub = `${wallet} → ${wallets.get(t.to_wallet_id ?? '') ?? '—'}`;
  } else {
    if (t.category_id) title = categories.get(t.category_id) ?? 'Tanpa kategori';
    else if (t.debt_id)
      title = t.type === 'expense' ? 'Pembayaran Hutang' : 'Penerimaan Piutang';
    else title = t.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
    sub = wallet;
  }

  if (t.debt_id && debts.has(t.debt_id)) sub += ' · ' + debts.get(t.debt_id);
  if (t.note) sub += ' · ' + t.note;

  return {
    id: t.id,
    title,
    sub,
    sign: signGlyph(t.type),
    signAmount: signed(t.type, t.amount),
    isCicilan: !!t.debt_id,
    occurred_on: t.occurred_on
  };
}

export function nameMap<T extends { id: string }>(rows: T[], key: keyof T): Map<string, string> {
  return new Map(rows.map((r) => [r.id, String(r[key])]));
}
