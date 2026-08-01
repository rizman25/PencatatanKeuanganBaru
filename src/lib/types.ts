export type TransactionType = 'income' | 'expense' | 'transfer';
export type CategoryKind = 'income' | 'expense';
export type DebtDirection = 'payable' | 'receivable';
export type DebtRole = 'origination' | 'repayment';

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface Household {
  id: string;
  name: string;
  invite_code: string;
}

export interface Wallet {
  id: string;
  name: string;
  tag: string | null;
  type: 'cash' | 'bank' | 'ewallet' | 'savings';
  initial_balance: number;
  archived_at: string | null;
}

export interface WalletWithBalance extends Wallet {
  balance: number;
}

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  archived_at: string | null;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  wallet_id: string;
  to_wallet_id: string | null;
  category_id: string | null;
  debt_id: string | null;
  role: DebtRole | null;
  occurred_on: string;
  note: string | null;
  created_by: string;
}

export interface Debt {
  id: string;
  direction: DebtDirection;
  party_name: string;
  principal_amount: number;
  due_date: string | null;
  description: string | null;
}

export interface DebtStatus extends Debt {
  paid_amount: number;
  remaining_amount: number;
  status: 'settled' | 'overdue' | 'active';
  days_until_due: number | null;
}

/**
 * A Transaction as the lists render it: two lines and a signed figure. Lives
 * here rather than beside the loader because the browser needs it too — search
 * and day-grouping both run client-side.
 */
export interface TxRow {
  id: string;
  title: string;
  sub: string;
  sign: string;
  signAmount: string;
  isCicilan: boolean;
  occurred_on: string;
}

export interface BudgetProgress {
  category_id: string;
  category_name: string;
  amount: number;
  spent: number;
  pct: number | null;
}
