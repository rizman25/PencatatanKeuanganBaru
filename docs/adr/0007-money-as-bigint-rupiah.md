# Money as BIGINT whole rupiah

Every amount is stored as a `BIGINT` count of whole rupiah — Rp 1.500.000 is `1500000`. There is no decimal component and no currency column. Formatting to `1.500.000` is a display concern, done in the `id-ID` locale.

The previous ERD used `DECIMAL(15,2)` with a per-wallet `currency CHAR(3)`, while simultaneously declaring multi-currency out of scope. That left the schema carrying a dimension nothing could use, and a "total saldo semua dompet" that would have summed across currencies without converting them. It also carried two decimal places for a currency in which nobody has paid 50 sen in living memory.

## Consequences

No floating point anywhere, no rounding ambiguity, and aggregate queries that cannot silently mix units. Integer arithmetic in JavaScript is exact well past any household's net worth (`Number.MAX_SAFE_INTEGER` is about nine quadrillion rupiah), so no bigint library is needed on the client.

If multi-currency is ever genuinely wanted it is a migration, not a column — it would require a base currency, historical FX rates, and a decision about which rate a past transaction is reported at. That is a real feature, and deferring it costs nothing now.
