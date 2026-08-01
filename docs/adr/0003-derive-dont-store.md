# Derive, don't store

Wallet balances, debt remainders, debt status, and budget/due-date alerts are all computed at read time from the transactions that cause them. Nothing derived is persisted. Balances come from a `wallet_balances` view (`initial_balance` plus every transaction touching the wallet); a debt's remaining amount is its principal minus the sum of its linked repayments; a debt is `overdue` because `due_date < CURRENT_DATE`, not because a nightly job wrote that word into a column; a budget is at 80% because this month's expenses say so.

The alternative — and what the previous design specified — was a stored `current_balance` column maintained by five Postgres triggers, a stored debt status updated by a nightly cron job, and a `notifications` table filled by hourly and daily scheduled jobs. The vanilla-JS predecessor did the same thing in JavaScript, and had to reverse a transaction's old values before applying new ones on every edit.

We reject that because stored derived state can drift, and drift in a finance app destroys the only thing the app is for: trust in the numbers. Correct-by-construction beats correct-if-every-write-path-remembers.

## Consequences

Deletes and edits become trivially correct, because nothing needs undoing. Five triggers, four scheduled jobs, Supabase Edge Functions, pg_cron, and the `notifications` and `debt_payments` tables are all removed from the design.

The costs are accepted deliberately. Reads are aggregate queries rather than column lookups — fine at household scale (a few thousand rows a year, indexed), and if it ever isn't, a materialized view is a later optimisation to be justified by evidence. More significantly, **no alert can reach you unless you open the app**: there is no push, no email, no unread badge. For a tool checked most days, seeing "jatuh tempo 3 hari lagi" on the dashboard is judged sufficient.
