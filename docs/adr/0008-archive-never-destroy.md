# Archive, never destroy

Wallets and categories carry an `archived_at` timestamp. Archiving hides them from pickers and dashboards while every historical transaction keeps pointing at them, so last year's report still reads exactly as it did last year. Only records that have never been used can be hard-deleted.

The previous roadmap left this open as a literal undecided question — "soft atau hard delete" — and its documents contradicted each other on whether a category already used by transactions could be removed at all.

The alternative of deleting with forced reassignment (move these 400 transactions to another wallet, then delete) was rejected because it rewrites history: a past month's report would change after the fact, which is exactly the property a bookkeeping app must not have.

## Consequences

Every wallet and category picker must filter on `archived_at IS NULL`. Forgetting that filter is the predictable bug this decision introduces, and it is worth a shared query helper rather than an ad-hoc `where` clause in each load function.

This also guarantees a wallet can never be deleted out from under the computed-balance view (ADR-0003), which would silently vaporise money. Closed accounts can still be tidied away, so the dompet list does not accumulate clutter forever.
