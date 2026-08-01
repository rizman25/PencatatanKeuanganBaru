import type { PageServerLoad } from './$types';
import { loadCategories, loadDebts, loadWallets, nameMap, toRow } from '$lib/server/data';
import { signAvatars } from '$lib/server/avatars';
import { shortMonth } from '$lib/format';
import { monthWindow } from '$lib/month';
import { expenseSlices, incomeSlices } from '$lib/chart';
import type { Transaction } from '$lib/types';

/** Bars for the selected month and the three before it. */
const WINDOW = 4;

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { household, month, user } = await parent();
  const supabase = locals.supabase;

  // The window re-anchors on the selected month, so it is always the rightmost
  // bar rather than the chart always ending at today.
  const window = monthWindow(month.key, WINDOW);
  const fromIso = window[0] + '-01';

  const [wallets, categories, debts, { data: txs }, { data: budgets }, { data: me }] =
    await Promise.all([
    loadWallets(supabase),
    loadCategories(supabase, { includeArchived: true }),
    loadDebts(supabase),
    supabase
      .from('transactions')
      .select('*')
      .gte('occurred_on', fromIso)
      .lte('occurred_on', month.end)
      .order('occurred_on', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.rpc('budget_progress', { p_household: household.id, p_month: month.start }),
    /**
     * The header's own name and photo. Read from `profiles` rather than from
     * auth metadata, because the name is editable now and the metadata copy
     * would go stale the moment it changed.
     */
    supabase.from('profiles').select('display_name, avatar_url').eq('id', user.id).maybeSingle()
  ]);

  const photos = await signAvatars(supabase, [me?.avatar_url]);

  const transactions = (txs ?? []) as Transaction[];
  const walletNames = nameMap(wallets, 'name');
  const categoryNames = nameMap(categories, 'name');
  const debtNames = new Map(debts.map((d) => [d.id, d.party_name]));

  /**
   * Deliberately not month-scoped. Total Saldo is what the Household has right
   * now; "as of June" would be a different and much harder number, and showing
   * a stale one under a month label would mislead about money that exists.
   */
  const totalSaldo = wallets.reduce((a, w) => a + w.balance, 0);

  const ofMonth = transactions.filter((t) => t.occurred_on.slice(0, 7) === month.key);

  const inMonth = ofMonth.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const exMonth = ofMonth.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);

  // Cash-flow bars, oldest first, ending on the selected month.
  const months = window.map((key) => ({ key, label: shortMonth(key + '-01'), in: 0, ex: 0 }));
  for (const t of transactions) {
    const m = months.find((x) => x.key === t.occurred_on.slice(0, 7));
    if (!m) continue;
    if (t.type === 'income') m.in += t.amount;
    else if (t.type === 'expense') m.ex += t.amount;
  }
  // Rupiah, not pixels. Scaling to a bar height is CashflowBars' business —
  // leaving it here was what stopped the chart being reusable off Beranda.
  const chart = months.map((m) => ({
    label: m.label,
    selected: m.key === month.key,
    income: m.in,
    expense: m.ex
  }));

  // Alerts are derived on read — there is no notifications table and no cron (ADR-0003).
  const alerts: { text: string; sub: string; href: string }[] = [];

  for (const b of (budgets ?? []) as {
    category_name: string;
    amount: number;
    spent: number;
    pct: number | null;
  }[]) {
    if (b.pct !== null && b.pct >= 80) {
      alerts.push({
        text: `Anggaran "${b.category_name}" sudah ${b.pct}%`,
        sub: `${Number(b.spent).toLocaleString('id-ID')} dari ${Number(b.amount).toLocaleString('id-ID')}`,
        href: '/anggaran'
      });
    }
  }

  /**
   * Debt alerts only exist in the present. Whether a Debt is overdue is a fact
   * about today, not about the month being read, so surfacing one inside a past
   * month would state something untrue and offer an action that cannot be taken
   * there. Past months carry budget alerts only.
   */
  if (month.isCurrent) {
    for (const d of debts) {
      if (d.remaining_amount <= 0) continue;
      const kind = d.direction === 'payable' ? 'Hutang' : 'Piutang';
      const du = d.days_until_due;
      if (du === null) continue;
      if (du < 0) {
        alerts.push({
          text: `${kind} "${d.party_name}" terlambat ${Math.abs(du)} hari`,
          sub: `Sisa ${d.remaining_amount.toLocaleString('id-ID')}`,
          href: '/hutang'
        });
      } else if (du <= 7) {
        alerts.push({
          text: `${kind} "${d.party_name}" jatuh tempo ${du} hari lagi`,
          sub: `Sisa ${d.remaining_amount.toLocaleString('id-ID')}`,
          href: '/hutang'
        });
      }
    }
  }

  const recent = ofMonth.slice(0, 4).map((t) => toRow(t, walletNames, categoryNames, debtNames));

  return {
    me: {
      name: me?.display_name ?? null,
      photo: (me?.avatar_url && photos.get(me.avatar_url)) || null
    },
    totalSaldo,
    inMonth,
    exMonth,
    // Every Expense lands in exactly one slice, so this totals exMonth exactly.
    slices: expenseSlices(ofMonth, categoryNames),
    // The same guarantee against inMonth.
    incomeSlices: incomeSlices(ofMonth, categoryNames),
    walletCount: wallets.length,
    chart,
    alerts,
    recent
  };
};
