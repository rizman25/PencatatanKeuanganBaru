# One transactions table for every money movement

Every movement of money is a row in `transactions`, distinguished by `type`: `income`, `expense`, or `transfer`. A transfer carries a `to_wallet_id` and no category. A debt repayment is an ordinary expense row carrying a `debt_id`. There is no `transfers` table and no `debt_payments` table.

The invariant is: **a transaction exists if and only if money crossed a wallet boundary.** This is why creating a debt only produces a transaction when cash actually arrived — borrowing Rp 5.000.000 in cash creates an income row, while buying a phone on twelve months' credit creates none. The previous design had no rule here, and a uniform "always create the matching transaction" approach would have invented income that was never received, corrupting the monthly report the app exists to produce.

The previous ERD put transfers in their own table while its own glossary defined *Transaksi* as "pemasukan, pengeluaran, **atau transfer**" — so transfers were simultaneously a transaction and not one, and consequently had no path into the dashboard or the monthly report.

## Consequences

One table means one history query and one unified timeline, which matches how people actually think about their money. In exchange, every income/expense aggregate must explicitly exclude `type = 'transfer'` — a single filter, but one that must be applied consistently, and the most likely source of a reporting bug in this design.

Two-row double-entry was considered and rejected: it derives per-wallet balances most cleanly, but every edit and delete would have to operate atomically on a pair, and the UI would have to hide the fact that one user action produced two rows.
