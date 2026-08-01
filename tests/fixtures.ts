/**
 * The same scenarios the manual seed script exercises, as fixture rows: an
 * archived Wallet carrying history, a Debt with an origination row and one
 * without, a Category whose budget was raised mid-history, Transfers alongside
 * Income and Expense. Tests and manual verification then cover the same shapes.
 *
 * The clock is fixed here and nowhere else. Every month in this file is stated
 * absolutely, so a test that passes in July still passes in January.
 */
import type { FakeData } from './fake-supabase';

export const TODAY = '2026-07-15';
export const HOUSEHOLD = 'hh-1';

export const M0 = '2026-07'; // the month TODAY falls in
export const M1 = '2026-06';
export const M2 = '2026-05';
export const M3 = '2026-04';

const ME = 'user-rizman';
const PARTNER = 'user-partner';

/**
 * One Member with a photo and one without, deliberately: the mixed case is the
 * one the initials fallback actually has to survive, and a fixture where
 * everyone has a photo would never exercise it (spec 0004).
 */
export const AVATAR = `${ME}/aa11bb22.jpg`;

const profiles = [
  { id: ME, display_name: 'Rizman Luqman', avatar_url: AVATAR },
  { id: PARTNER, display_name: 'Sari', avatar_url: null }
];

const household_members = [
  { household_id: HOUSEHOLD, user_id: ME, joined_at: '2026-04-01T00:00:00Z' },
  { household_id: HOUSEHOLD, user_id: PARTNER, joined_at: '2026-04-01T00:00:00Z' }
];

const wallets = [
  { id: 'w-tunai', household_id: HOUSEHOLD, name: 'Tunai', tag: 'CASH', type: 'cash', initial_balance: 500000, archived_at: null, created_at: '2026-04-01' },
  { id: 'w-bca', household_id: HOUSEHOLD, name: 'BCA', tag: 'BCA', type: 'bank', initial_balance: 5000000, archived_at: null, created_at: '2026-04-02' },
  { id: 'w-gopay', household_id: HOUSEHOLD, name: 'GoPay', tag: 'GOPAY', type: 'ewallet', initial_balance: 250000, archived_at: null, created_at: '2026-04-03' },
  { id: 'w-tabungan', household_id: HOUSEHOLD, name: 'Tabungan', tag: 'TAB', type: 'savings', initial_balance: 12000000, archived_at: null, created_at: '2026-04-04' },
  // Archived, but with history: excluded from totals, still named by old rows.
  { id: 'w-lama', household_id: HOUSEHOLD, name: 'Dompet Lama', tag: 'OLD', type: 'cash', initial_balance: 100000, archived_at: '2026-07-05T00:00:00Z', created_at: '2026-04-05' }
];

const wallet_balances = [
  { wallet_id: 'w-tunai', household_id: HOUSEHOLD, balance: 1250000 },
  { wallet_id: 'w-bca', household_id: HOUSEHOLD, balance: 9000000 },
  { wallet_id: 'w-gopay', household_id: HOUSEHOLD, balance: 800000 },
  { wallet_id: 'w-tabungan', household_id: HOUSEHOLD, balance: 14000000 },
  { wallet_id: 'w-lama', household_id: HOUSEHOLD, balance: 0 }
];

const categories = [
  { id: 'c-gaji', household_id: HOUSEHOLD, name: 'Gaji', kind: 'income', archived_at: null },
  { id: 'c-bonus', household_id: HOUSEHOLD, name: 'Bonus', kind: 'income', archived_at: null },
  { id: 'c-makan', household_id: HOUSEHOLD, name: 'Makan', kind: 'expense', archived_at: null },
  { id: 'c-transport', household_id: HOUSEHOLD, name: 'Transportasi', kind: 'expense', archived_at: null },
  { id: 'c-belanja', household_id: HOUSEHOLD, name: 'Belanja', kind: 'expense', archived_at: null },
  { id: 'c-tagihan', household_id: HOUSEHOLD, name: 'Tagihan', kind: 'expense', archived_at: null },
  { id: 'c-sehat', household_id: HOUSEHOLD, name: 'Kesehatan', kind: 'expense', archived_at: null }
];

/** Budget history: Makan was 1.2jt from April, raised to 1.5jt in July. */
const budgets = [
  { id: 'b-1', household_id: HOUSEHOLD, category_id: 'c-makan', amount: 1200000, effective_from: '2026-04-01' },
  { id: 'b-2', household_id: HOUSEHOLD, category_id: 'c-makan', amount: 1500000, effective_from: '2026-07-01' },
  { id: 'b-3', household_id: HOUSEHOLD, category_id: 'c-transport', amount: 500000, effective_from: '2026-04-01' },
  { id: 'b-4', household_id: HOUSEHOLD, category_id: 'c-belanja', amount: 1000000, effective_from: '2026-07-01' },
  { id: 'b-5', household_id: HOUSEHOLD, category_id: 'c-tagihan', amount: 900000, effective_from: '2026-07-01' }
];

type TxSeed = {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  wallet_id: string;
  to_wallet_id?: string | null;
  category_id?: string | null;
  debt_id?: string | null;
  role?: 'origination' | 'repayment' | null;
  occurred_on: string;
  note?: string | null;
  created_by?: string;
};

const tx = (t: TxSeed) => ({
  household_id: HOUSEHOLD,
  to_wallet_id: null,
  category_id: null,
  debt_id: null,
  role: null,
  note: null,
  created_by: ME,
  created_at: t.occurred_on + 'T09:00:00Z',
  ...t
});

const transactions = [
  // ---- April (M3)
  tx({ id: 't-401', type: 'income', amount: 8500000, wallet_id: 'w-bca', category_id: 'c-gaji', occurred_on: '2026-04-25', note: 'Gaji bulanan' }),
  tx({ id: 't-402', type: 'expense', amount: 1450000, wallet_id: 'w-tunai', category_id: 'c-makan', occurred_on: '2026-04-11' }),
  tx({ id: 't-403', type: 'expense', amount: 480000, wallet_id: 'w-gopay', category_id: 'c-transport', occurred_on: '2026-04-13' }),
  tx({ id: 't-404', type: 'expense', amount: 920000, wallet_id: 'w-bca', category_id: 'c-tagihan', occurred_on: '2026-04-06', note: 'Listrik + air' }),
  tx({ id: 't-405', type: 'expense', amount: 240000, wallet_id: 'w-lama', category_id: 'c-belanja', occurred_on: '2026-04-19', note: 'Dompet lama' }),

  // ---- May (M2)
  tx({ id: 't-501', type: 'income', amount: 8500000, wallet_id: 'w-bca', category_id: 'c-gaji', occurred_on: '2026-05-25', note: 'Gaji bulanan' }),
  tx({ id: 't-502', type: 'income', amount: 2000000, wallet_id: 'w-bca', category_id: 'c-bonus', occurred_on: '2026-05-27', note: 'Bonus proyek' }),
  tx({ id: 't-503', type: 'expense', amount: 1680000, wallet_id: 'w-tunai', category_id: 'c-makan', occurred_on: '2026-05-09' }),
  tx({ id: 't-504', type: 'expense', amount: 510000, wallet_id: 'w-gopay', category_id: 'c-transport', occurred_on: '2026-05-16' }),
  tx({ id: 't-505', type: 'expense', amount: 875000, wallet_id: 'w-bca', category_id: 'c-belanja', occurred_on: '2026-05-21' }),
  tx({ id: 't-506', type: 'income', amount: 5000000, wallet_id: 'w-bca', debt_id: 'd-adik', role: 'origination', occurred_on: '2026-05-03', note: 'Pinjam dari Adik' }),
  tx({ id: 't-507', type: 'expense', amount: 1500000, wallet_id: 'w-tunai', debt_id: 'd-budi', role: 'origination', occurred_on: '2026-05-12', note: 'Pinjamkan ke Budi' }),

  // ---- June (M1)
  tx({ id: 't-601', type: 'income', amount: 8500000, wallet_id: 'w-bca', category_id: 'c-gaji', occurred_on: '2026-06-25', note: 'Gaji bulanan', created_by: PARTNER }),
  tx({ id: 't-602', type: 'expense', amount: 1520000, wallet_id: 'w-tunai', category_id: 'c-makan', occurred_on: '2026-06-10' }),
  tx({ id: 't-603', type: 'expense', amount: 620000, wallet_id: 'w-gopay', category_id: 'c-transport', occurred_on: '2026-06-15' }),
  tx({ id: 't-604', type: 'expense', amount: 310000, wallet_id: 'w-bca', category_id: 'c-sehat', occurred_on: '2026-06-22', note: 'Obat' }),
  tx({ id: 't-605', type: 'expense', amount: 940000, wallet_id: 'w-bca', category_id: 'c-tagihan', occurred_on: '2026-06-05' }),
  tx({ id: 't-606', type: 'expense', amount: 1000000, wallet_id: 'w-bca', debt_id: 'd-adik', role: 'repayment', occurred_on: '2026-06-03', note: 'Cicilan 1' }),
  tx({ id: 't-607', type: 'expense', amount: 500000, wallet_id: 'w-bca', debt_id: 'd-hp', role: 'repayment', occurred_on: '2026-06-07', note: 'Cicilan HP', created_by: PARTNER }),
  tx({ id: 't-608', type: 'income', amount: 500000, wallet_id: 'w-tunai', debt_id: 'd-budi', role: 'repayment', occurred_on: '2026-06-12', note: 'Budi bayar' }),

  // ---- July (M0, the month TODAY falls in)
  tx({ id: 't-701', type: 'income', amount: 8500000, wallet_id: 'w-bca', category_id: 'c-gaji', occurred_on: '2026-07-10', note: 'Gaji bulanan' }),
  tx({ id: 't-702', type: 'expense', amount: 1850000, wallet_id: 'w-tunai', category_id: 'c-makan', occurred_on: '2026-07-14', note: 'Belanja mingguan' }),
  tx({ id: 't-703', type: 'expense', amount: 145000, wallet_id: 'w-gopay', category_id: 'c-makan', occurred_on: '2026-07-15', note: 'Makan siang' }),
  tx({ id: 't-704', type: 'expense', amount: 430000, wallet_id: 'w-gopay', category_id: 'c-transport', occurred_on: '2026-07-13', note: 'Bensin' }),
  tx({ id: 't-705', type: 'expense', amount: 285000, wallet_id: 'w-bca', category_id: 'c-belanja', occurred_on: '2026-07-11' }),
  tx({ id: 't-706', type: 'expense', amount: 680000, wallet_id: 'w-bca', category_id: 'c-tagihan', occurred_on: '2026-07-09', note: 'Internet' }),
  tx({ id: 't-707', type: 'expense', amount: 1000000, wallet_id: 'w-bca', debt_id: 'd-adik', role: 'repayment', occurred_on: '2026-07-07', note: 'Cicilan 2' }),
  tx({ id: 't-708', type: 'expense', amount: 500000, wallet_id: 'w-bca', debt_id: 'd-hp', role: 'repayment', occurred_on: '2026-07-05', note: 'Cicilan HP' }),
  // Transfers: neither Income nor Expense, and absent from every breakdown.
  tx({ id: 't-709', type: 'transfer', amount: 2000000, wallet_id: 'w-bca', to_wallet_id: 'w-tabungan', occurred_on: '2026-07-12', note: 'Sisihkan tabungan' }),
  tx({ id: 't-710', type: 'transfer', amount: 300000, wallet_id: 'w-bca', to_wallet_id: 'w-tunai', occurred_on: '2026-07-10', note: 'Tarik tunai' })
];

const daysUntil = (iso: string) =>
  Math.round((new Date(iso + 'T00:00:00').getTime() - new Date(TODAY + 'T00:00:00').getTime()) / 86400000);

const debt = (d: {
  id: string;
  direction: 'payable' | 'receivable';
  party_name: string;
  principal_amount: number;
  due_date: string | null;
  paid_amount: number;
}) => {
  const remaining_amount = d.principal_amount - d.paid_amount;
  return {
    ...d,
    household_id: HOUSEHOLD,
    description: null,
    created_by: ME,
    remaining_amount,
    status:
      remaining_amount <= 0
        ? 'settled'
        : d.due_date && daysUntil(d.due_date) < 0
          ? 'overdue'
          : 'active',
    days_until_due: d.due_date === null ? null : daysUntil(d.due_date)
  };
};

/** Cash borrowed (has an origination row), bought on credit (has none), lent out. */
const debt_status = [
  debt({ id: 'd-adik', direction: 'payable', party_name: 'Adik', principal_amount: 5000000, due_date: '2026-08-04', paid_amount: 2000000 }),
  debt({ id: 'd-hp', direction: 'payable', party_name: 'Cicilan HP', principal_amount: 6000000, due_date: '2026-07-12', paid_amount: 1000000 }),
  debt({ id: 'd-budi', direction: 'receivable', party_name: 'Budi', principal_amount: 1500000, due_date: '2026-07-03', paid_amount: 500000 }),
  debt({ id: 'd-lunas', direction: 'payable', party_name: 'Koperasi', principal_amount: 800000, due_date: '2026-06-30', paid_amount: 800000 })
];

/**
 * Models the budget_progress function, including its defining rule: the budget
 * in force for a month is the row with the greatest effective_from on or before
 * it. Without that here, "a past month reports against the old limit" would be
 * asserted against a fake that could not get it wrong.
 */
function budgetProgress(args: Record<string, any>) {
  const month: string = args.p_month.slice(0, 7);
  const monthStart = month + '-01';

  return categories
    .map((c) => {
      const inForce = budgets
        .filter((b) => b.category_id === c.id && b.effective_from <= monthStart)
        .sort((a, b) => (a.effective_from < b.effective_from ? 1 : -1))[0];
      if (!inForce) return null;

      const spent = transactions
        .filter(
          (t) =>
            t.type === 'expense' &&
            t.category_id === c.id &&
            t.occurred_on.slice(0, 7) === month
        )
        .reduce((a, t) => a + t.amount, 0);

      return {
        category_id: c.id,
        category_name: c.name,
        amount: inForce.amount,
        spent,
        pct: inForce.amount ? Math.round((spent * 100) / inForce.amount) : null
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
}

export function fixture(overrides: Partial<FakeData['tables']> = {}): FakeData {
  return {
    tables: {
      wallets,
      wallet_balances,
      categories,
      transactions,
      budgets,
      debt_status,
      profiles,
      household_members,
      ...overrides
    },
    rpc: { budget_progress: budgetProgress },
    buckets: { avatars: [AVATAR] },
    user: { id: ME, email: 'rizman@example.com' }
  };
}

export const IDS = { ME, PARTNER };
