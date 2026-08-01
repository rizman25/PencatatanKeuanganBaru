# Spec 0001 — Month navigation, category charts, search, and debt payment history

**Status:** ready-for-agent
**Screens touched:** Beranda · Transaksi · Anggaran · Hutang · Catat

---

## Problem Statement

The app only ever shows *now*. Beranda's Pemasukan and Pengeluaran are this month's, the Anggaran bars are this month's, and there is no way to look at last month — the household can record money but cannot review it. Two people trying to work out where February went have nowhere to go.

Transaksi is worse than unhelpful, it is dishonest: its header prints a month label while the list underneath is the last 200 Transactions of all time, unfiltered by date. The month named at the top is not the month you are reading.

Beyond navigation, four things are missing or broken in daily use:

- **Nothing shows where the money went.** Every screen totals Expenses but none breaks them down, so "we spent 4.6 juta" never becomes "on what".
- **Anggaran is a dead end.** A bar says Makan is at 123% and there is no way to ask which Transactions did that. The answer means leaving for Transaksi and scanning by eye.
- **Finding one Transaction is manual.** Both Transaksi and Hutang spend their top line on a title that says what you already know from the nav, and neither can be searched.
- **Recording a Debt payment throws you out of Hutang.** Tap a Debt, record the cicilan, and the app lands you on Transaksi — away from the list you were working through, with no confirmation of the new sisa. The Hutang and Anggaran add-forms compound this: a validation failure closes the form and discards everything typed.

There is also no history on a Debt. The card shows a sisa and a progress bar, but not how it got there — which payments, when, by whom, and whether any money ever came in to begin with.

## Solution

**One month, shared across the app.** Beranda, Transaksi and Anggaran each carry a month stepper — `‹ Juni 2026 ›` — and the selected month travels with you between them, so stepping back on Beranda and tapping Transaksi shows that same June. A fresh open is always the current month; you cannot get stranded in the past. The forward arrow stops at the current month.

**One number deliberately opts out.** Total Saldo on Beranda is what the household has *right now*; it is meaningless "as of June". It stays live and says so, labelled `per hari ini`.

**Charts that add up.** Beranda gains a category breakdown above Transaksi Terakhir, and Anggaran gains one at the top. Beranda's totals exactly the Pengeluaran figure printed above it — including a Cicilan Hutang slice, so Debt payments are not quietly missing from the picture. Anggaran's splits spending across budgeted Categories, and its slices are tappable.

**Anggaran drills down.** Tapping a Category — on the chart or the bar — opens that Category for that month: its limit, its spend, and every Transaction that made up the number.

**Search where the title used to be.** Transaksi and Hutang trade their redundant headings for a search field. Transaksi searches within the month you are looking at, instantly. Hutang searches by the person's name and gains status chips — Aktif, Terlambat, Lunas, Semua — with settled Debts hidden by default so the list is the work still outstanding. Nothing is deleted; Lunas is one tap away.

**Debt payments stay in Hutang.** Recording a cicilan returns you to the Hutang list. The payment form gains a history: every payment, the running sisa after each one, who recorded it, and — where there is one — the moment the money first arrived, marked as such. Where there is not, it says so plainly: this was bought on credit, no money ever came in.

## User Stories

### Month navigation

1. As a Member, I want a month stepper on Beranda, so that I can review a month that has already ended.
2. As a Member, I want left and right arrows rather than a date picker, so that stepping to last month is one tap while standing up.
3. As a Member, I want the month I chose to still be selected when I move from Beranda to Transaksi, so that I do not re-navigate on every screen.
4. As a Member, I want the app to open on the current month every time, so that I never record or read against a stale month by accident.
5. As a Member, I want the forward arrow to stop at the current month, so that I cannot wander into empty future months.
6. As a Member, I want the selected month visible in the URL, so that I can send my partner a link to the exact month we are discussing.
7. As a Member, I want a hand-typed or stale month in the URL to fall back to the current month, so that a bad link never shows me a broken screen.
8. As a Member, I want Total Saldo to keep showing what we have right now even when I am reading June, so that I am never misled about how much money exists.
9. As a Member, I want Total Saldo labelled `per hari ini`, so that I can see it is deliberately not following the month.
10. As a Member, I want the cash-flow bars to end on the month I selected, so that the month I am reading is the one on the right where I expect it.
11. As a Member, I want Transaksi Terakhir to show the last Transactions within the selected month, so that the section matches the month named above it.
12. As a Member, I want Perlu Perhatian to follow the selected month, so that the warnings belong to the period I am reviewing.
13. As a Member, I want Debt warnings to disappear when I am reading a past month, so that I am not told to act on something I cannot act on in history.
14. As a Member, I want a past month with nothing wrong to say so, so that an empty Perlu Perhatian does not look like a rendering fault.
15. As a Member, I want Transaksi to actually list the month its header names, so that I can trust what the screen tells me.
16. As a Member, I want Anggaran to show the limits and spending for the selected month, so that I can check whether we kept to budget in a month that is over.
17. As a Member, I want a past month's Anggaran to report against the limit that was in force then, so that raising a budget today does not rewrite last quarter.

### Category breakdown

18. As a Member, I want a category breakdown above Transaksi Terakhir, so that I can see where the month's money went without reading every row.
19. As a Member, I want the breakdown to total exactly the Pengeluaran figure above it, so that the two numbers on one screen never contradict each other.
20. As a Member, I want Debt payments to appear as their own slice, so that a month heavy with cicilan is not silently unaccounted for.
21. As a Member, I want small Categories grouped into Lainnya, so that the chart stays readable on a phone.
22. As a Member, I want each slice labelled with its amount and share, so that I can read the numbers without estimating from the angles.
23. As a Member, I want a month with no spending to show a plain empty state, so that I am not shown an empty circle.
24. As a Member, I want a breakdown at the top of Anggaran, so that I can see the shape of our spending before reading the individual bars.
25. As a Member, I want Anggaran's chart to cover budgeted Categories, so that it answers the question that screen is about.
26. As a Member, I want to tap a slice, so that I can go straight from "Makan is the big one" to the Transactions behind it.

### Anggaran drill-down

27. As a Member, I want tapping a Category to open its own screen, so that I get the full list without cramming it under a progress bar.
28. As a Member, I want the drill-down to show the limit, the spend, and the overspend, so that the header repeats what I tapped from.
29. As a Member, I want every Transaction in that Category and month listed, so that I can find the purchase that broke the budget.
30. As a Member, I want that list grouped by day like Transaksi, so that I do not have to learn a second way of reading a list.
31. As a Member, I want to tap a Transaction there to edit it, so that I can correct a miscategorised expense where I found it.
32. As a Member, I want going back to return me to Anggaran on the same month, so that I can check the next Category without re-navigating.
33. As a Member, I want a Category with a limit but no spending to say so, so that an empty screen is explained.

### Search and filtering

34. As a Member, I want the Transaksi title replaced by a search field, so that the top of the screen does something useful.
35. As a Member, I want Transaksi search to filter as I type, so that I find a Transaction without waiting on the network.
36. As a Member, I want search to match the note, the Category, and the Wallet, so that I can find a row by whatever I remember about it.
37. As a Member, I want search to work within the month I am reading, so that results are always about the period I chose.
38. As a Member, I want a search with no matches to say so, so that I know the query ran and found nothing.
39. As a Member, I want the type filters to keep working alongside search, so that I can narrow to Pengeluaran and then search inside it.
40. As a Member, I want the Hutang title replaced by search, so that I can find one person in a long list.
41. As a Member, I want to search Debts by the person's name, so that I can pull up what I owe my sibling immediately.
42. As a Member, I want status chips on Hutang, so that I can see only what is overdue when I am deciding what to pay.
43. As a Member, I want settled Debts hidden by default, so that the list is what still needs doing.
44. As a Member, I want a Lunas chip that brings settled Debts back, so that I can confirm something was paid off without anything being destroyed.
45. As a Member, I want the Hutang and Piutang split to keep working with search and chips, so that the two sides stay separate.

### Debt payment history

46. As a Member, I want the payment form to list the Debt's payments, so that I can see what has already been paid before adding more.
47. As a Member, I want the sisa shown after each payment, so that I can follow how the balance came down.
48. As a Member, I want the money's arrival marked distinctly from the payments, so that I do not mistake the borrowing for a repayment.
49. As a Member, I want a credit purchase to say plainly that no money came in, so that a missing arrival row reads as intentional rather than lost.
50. As a Member, I want each payment to name who recorded it, so that my partner and I can tell our entries apart.
51. As a Member, I want a Debt with no payments yet to say so, so that an empty history is explained.

### Returning to the right place

52. As a Member, I want recording a cicilan to return me to Hutang, so that I stay in the list I was working through.
53. As a Member, I want a normal Transaction to still land on Transaksi, so that recording a daily expense is unchanged.
54. As a Member, I want the close button to take me back where I came from, so that dismissing a form is never a navigation surprise.
55. As a Member, I want a form that fails validation to stay open with what I typed, so that a missing field does not cost me the whole entry.
56. As a Member, I want the error message to tell me which field is wrong, so that I can fix it and submit again immediately.

## Implementation Decisions

### Month selection

- The selected month lives in the URL as `?m=YYYY-MM` on Beranda, Transaksi and Anggaran. It is the single source of truth; no client store, no cookie, no server-side session state.
- A shared resolver turns the raw parameter into the month a screen renders. It is strict and total: the parameter must match `YYYY-MM` exactly, resolve to a real month, and be no later than the current month. Anything else — absent, malformed, non-existent, or in the future — resolves to the current month. There is no error path and no redirect; a bad link renders today.
- The resolver returns everything a screen needs in one value: the canonical month, the previous and next month parameters (next being `null` at the current month, which is what disables the forward arrow), and the Indonesian display label.
- A shared stepper component renders `‹ label ›` from that value. The arrows are ordinary links, so the month is navigable, shareable, and works with browser back.
- The bottom navigation appends the current `?m=` to its Beranda, Transaksi and Anggaran links, and only when the selected month is not the current month — so ordinary use produces clean URLs. Hutang, Catat and Kelola are not month-scoped and never receive the parameter.
- Recording a Transaction always defaults to today's date regardless of the month being browsed. Browsing history must not change what a new entry means.

### Beranda

- Total Saldo is deliberately exempt from the month. It continues to sum live Wallet balances from the computed-balance view and gains a `per hari ini` sublabel making the exemption visible rather than surprising.
- Pemasukan, Pengeluaran, the category breakdown, Transaksi Terakhir and Perlu Perhatian all resolve against the selected month.
- The cash-flow bars re-anchor: the window is the selected month plus the three preceding it, so the selected month is always the rightmost bar. The Transaction query's lower bound follows the window rather than being pinned to today.
- Perlu Perhatian becomes a horizontally scrolling carousel using CSS scroll-snap with dot indicators. No carousel library, and no JavaScript beyond tracking which dot is active.
- Budget alerts are computed for the selected month by passing that month to the existing budget-progress function. The 80% threshold is unchanged.
- Debt alerts are computed only when the selected month is the current month. A Debt's overdue-ness is a fact about today, not about the month being read, so surfacing it inside a historical month would be an untruth. In a past month, Perlu Perhatian carries budget alerts only.
- An empty Perlu Perhatian renders an explicit empty state rather than a collapsed strip.

### Category breakdown charts

- Both charts are hand-rolled SVG. No charting dependency is added — the existing cash-flow bars are already hand-rolled, and one figure type should not drag in a library.
- Beranda's slices are computed so that they sum to exactly the Pengeluaran figure displayed above them. The rule: every Expense Transaction in the month contributes to exactly one slice — Transactions carrying a Category contribute to that Category's slice; Transactions carrying a Debt reference instead contribute to a single synthetic **Cicilan Hutang** slice. Transfers are excluded entirely, as they are neither Income nor Expense.
- Anggaran's slices cover spending in budgeted Categories only, matching the bars beneath it. It does not carry the synthetic Debt slice, because Debt payments have no budget.
- Both charts show at most six named slices; the remainder roll into a single **Lainnya** slice. The rollup happens after sorting by amount descending, so the named slices are always the largest ones.
- Slice colours come from a fixed ordered palette derived from the warm-paper tokens (ADR-0009). Colour is assigned by rank within the chart, not by Category identity — a Category's colour is not stable across months, and no meaning is attached to any particular colour.
- Each slice is labelled with the Category name, its formatted amount, and its percentage. The legend, not the arc, is the readable surface on a phone.
- Anggaran's slices are links to the Category drill-down, carrying the selected month.
- A month with no qualifying spending renders an empty state instead of a chart.

### Anggaran drill-down

- A new route, one segment below Anggaran, keyed by the **Category's id** and accepting the same `?m=` parameter. The id is used rather than a name slug because Categories can be renamed and their names are not unique across kinds.
- The screen loads the budget figures for that Category and month from the existing budget-progress function, and the Category's Expense Transactions for that month from the Transactions table.
- The Transaction list reuses the same row-shaping and day-grouping helpers as Transaksi. This is a hard requirement: two implementations of the same list will drift, and the drill-down exists precisely to reconcile a number with the rows behind it.
- Rows link to the existing Transaction edit screen.
- A Category with a budget but no spending renders an empty state under the intact header figures.

### Transaksi

- The load gains a month filter bounded by the selected month's first and last day, replacing today's unbounded query. The existing row cap stays as a safety net but is no longer what defines the result set. This makes the header honest — the screen currently prints a month label over an all-time list.
- The title is replaced by a search field. Search runs entirely in the browser over the already-loaded month, with no server round trip and no debounce, because a single month of a household's Transactions is small.
- The search predicate matches against the two lines each row already displays — its title (Category, Debt description, or Transfer) and its subtitle (Wallet, Debt party, note) — case-insensitively. Matching what is on screen means a result is never inexplicable.
- Search composes with the existing type filter rather than replacing it: the type filter narrows on the server, search narrows further in the browser.
- Day-group headers are recomputed after filtering, so a group never appears with no rows under it.
- A search with no matches renders a distinct empty state, separate from the month-is-empty one.

### Hutang

- The title is replaced by a search field matching the party name, case-insensitively.
- Status chips — Aktif, Terlambat, Lunas, Semua — filter the list. **Lunas is excluded by default**; the Lunas chip shows settled Debts and Semua shows everything. Nothing is deleted or hidden permanently, consistent with ADR-0008.
- Chip status is derived from the same computed values the cards already display: settled when nothing remains, overdue when past due with a remainder, otherwise active.
- Both search and chips run in the browser. Every Debt is already loaded, so filtering needs no round trip. The Hutang/Piutang direction split stays a server-side query parameter, unchanged.
- Chips show counts, so an empty filtered list is explained by the chip rather than looking like data loss.

### Debt payment history

- The Debt payment form gains a history section listing every Transaction linked to that Debt, oldest first.
- Each row shows the date, amount, who recorded it, and the **running sisa after that payment** — the principal less the cumulative sum of repayments up to and including that row. This is derived on read from the Transaction rows; no new column, no stored balance (ADR-0003).
- The origination row, where one exists, is rendered distinctly and marked as the arrival of the money. It is excluded from the running-sisa arithmetic — the principal already accounts for it.
- Where no origination row exists, the section states this explicitly ("cicilan barang — tidak ada uang masuk") rather than leaving a gap. A missing origination row is a deliberate modelling outcome under ADR-0004, not missing data, and the UI should say so.
- Rows are **read-only**. They are context for the payment being recorded, not an editing surface; editing remains on the Transaction edit screen.
- "Who recorded it" resolves the recording Member's display name. The load joins Debt Transactions to Member profiles; an unresolvable id falls back to a neutral label rather than showing a raw id.
- A Debt with no history yet renders an explicit empty state.

### Return paths and form behaviour

- The Catat close control uses browser history where a same-origin previous entry exists, falling back to an explicit destination otherwise, so dismissal returns you where you came from rather than to a fixed screen.
- After a successful save, the redirect is chosen by what was recorded: a Transaction linked to a Debt returns to Hutang; everything else continues to Transaksi. This is the narrowest change that fixes the reported problem and leaves the daily-expense path untouched. No `from` or return-URL parameter is introduced — an unvalidated one is an open-redirect, and a validated one is more machinery than this needs.
- The inline add-forms on Hutang and Anggaran currently close on **every** submission outcome, including validation failure, discarding what was typed. They are changed to stay open when the action fails and close only on success. This is a pre-existing defect in the blast radius of this work.

### Constraints held throughout

- **No schema changes and no migration.** Every new figure is derived on read from data already stored (ADR-0003). The existing budget-progress function is already month-parameterised; it is called with a different month, not modified.
- **No new runtime dependencies.** Charts are SVG, the carousel is CSS.
- **Server-only data access is unchanged** (ADR-0006). All new reads are `load` functions; the browser continues to hold no Supabase client. The two browser-side filters operate on data already delivered by a load, which is not a data-access path.
- **Bahasa Indonesia for every user-facing string**; English for code and schema, per the glossary.

## Testing Decisions

**There is no test infrastructure in this repo today** — no runner, no test files, no prior art. This spec establishes it. Vitest is added as the runner, chosen because the project already builds on Vite and needs no second toolchain.

### What is being tested, and where

The seam is the **`load` function**. Each month-aware screen's load is invoked directly with a fake Supabase client and a URL, and its returned view model is asserted. This is the highest seam reachable without a browser and a live database: it covers the URL contract, the month arithmetic, the query bounds, and every derived figure in one call, and it tests the thing the screen actually consumes.

A **single shared fake Supabase client** is built once and used by every test. This is deliberate: a fake per screen would be the real cost of this seam paid over and over. It is constructed from a plain object of table name to rows, plus canned function results, and implements the subset of the query builder the app uses — column selection, equality, range and null filters, ordering, limit, and the budget-progress call — resolving to the same `{ data }` shape the real client returns. Any query method the app does not use is intentionally absent, so a load that starts using a new one fails loudly instead of silently returning everything.

Two behaviours are **not reachable from the load seam**, because they run in the browser: the Transaksi search predicate and the Hutang search-and-chip predicate. These are extracted as pure functions in a browser-safe module and tested directly as functions over row arrays. This is an acknowledged second, much smaller seam — the alternative was making search a server round trip purely to make it testable, which would make the feature worse to use.

### What makes a good test here

- **Assert the view model, never the route to it.** A test says the rightmost cash-flow bar is June and Pengeluaran is 4.6 juta. It does not assert which Supabase methods were called, in what order, or that a particular helper ran.
- **Fix the clock.** Every month calculation depends on today. Today is injected, never read ambiently, so a test that passes in July still passes in January. This is the single largest source of flakiness in this feature and the reason the resolver takes today as an argument.
- **Use realistic fixtures.** The fake client is seeded from the same scenarios the manual seed script already exercises — an archived Wallet with history, a Debt with an origination row and a Debt without one, a Category whose budget was raised mid-history, Transfers alongside Income and Expense — so tests and manual verification cover the same shapes.

### Coverage

| Area | Asserted |
|---|---|
| Month resolver | absent, valid, malformed, non-existent and future parameters all resolve correctly; next is null at the current month |
| Beranda load | figures follow the month; Total Saldo does **not**; bars re-anchor with the selected month rightmost; debt alerts present in the current month and absent in a past one |
| Beranda slices | slices sum exactly to the month's Pengeluaran; Debt-linked Expenses land in the Cicilan Hutang slice; Transfers are excluded; the seventh-largest Category rolls into Lainnya |
| Transaksi load | results are bounded by the selected month; the header label matches the rows returned; the type filter still narrows |
| Transaksi search | matches title and subtitle case-insensitively; day groups are recomputed; no matches yields the empty result |
| Anggaran load | the month reaches the budget function; a past month reports against the limit in force then, not the current one |
| Anggaran drill-down load | returns only that Category's Expenses in that month; header figures agree with the Anggaran row for the same Category and month |
| Hutang filters | Lunas excluded by default; each chip selects the right set; search matches party name; counts agree with the filtered sets |
| Payment history | running sisa decreases by each repayment; the origination row is excluded from the arithmetic; a Debt with no origination is flagged rather than blank; the recorder's name resolves and falls back safely |

### What stays manual

Anything crossing the real database keeps its existing manual verification against the seed script: RLS isolation, the computed-balance and debt-status views, migration correctness, and visual rendering of the charts and carousel. The fake client tests the app's arithmetic, not Postgres's — and asserting SQL through a fake would be asserting the fake.

## Out of Scope

- **Any schema change, migration, or new view.** If something appears to need one, that is a signal to re-read ADR-0003, not to write one.
- **A date-range picker or a year picker.** Stepping one month at a time is the whole interaction; arbitrary ranges are a different feature.
- **Future months.** The forward arrow stops at the current month. Budgets can be set with a future effective date, but there is no screen for reading a month that has not happened.
- **Search across months.** Search deliberately stays inside the selected month. A global search is a server-side feature with its own pagination and ranking questions.
- **Making the Anggaran chart cover unbudgeted spending.** It matches the bars beneath it; the whole-month picture is Beranda's job.
- **Editing from the payment history.** It is read-only; editing stays on the Transaction edit screen.
- **A `from`/return-URL parameter for Catat.** Rejected as open-redirect surface for a problem that a two-branch redirect solves.
- **Dark mode, animation, and chart interactivity beyond tapping a slice.** No tooltips, no legends that toggle series, no transitions between months.
- **The two outstanding project tasks** — RLS isolation between two Households, and Vercel deployment with PWA install. Independent of this work.
- **Google OAuth**, which is currently disabled in the Supabase project. Either enable it or drop the button; not this spec's concern.

## Further Notes

**The Cicilan Hutang slice is slightly broader than its name.** It gathers every Expense carrying a Debt reference, which includes the origination of a *Piutang* — money lent out. That money genuinely left the household and belongs in the Expense breakdown, so the arithmetic is right and the exactness guarantee holds; the label is loose in a case that will be rare in practice. Worth revisiting if lending out becomes common.

**Colour carries no meaning in the charts.** Slice colours are assigned by rank, so a Category is not the same colour in June as in July. This is a deliberate trade: stable per-Category colours would need either a stored colour or a hash, and the legend already names every slice. Do not let anyone infer meaning from a colour later.

**One decision was taken against the recommendation and is worth watching.** Perlu Perhatian follows the selected month rather than staying live. Combined with debt alerts dropping out of past months, browsing a quiet historical month will often produce an empty carousel — which is why the empty state is a requirement and not a nicety. If it reads as broken in use, the fallback is to pin Perlu Perhatian to today the way Total Saldo is.

**Two pre-existing defects are folded in** rather than filed separately, because both sit inside the screens this work rewrites: the add-forms on Hutang and Anggaran discarding input on validation failure, and Transaksi printing a month label over an unfiltered all-time list. The second is the more serious — it is the screen stating something untrue about its own contents.

**The `?m=` parameter is untrusted input.** It is validated by shape and range, never interpolated into a query, and never used to build a redirect target. The resolver's total behaviour — every invalid input resolving to the current month with no error path — is the security property as much as it is the usability one.

**Charts and the carousel are the one part of this that cannot be verified by the tests above.** Budget the manual pass accordingly: arc geometry, label overflow at long Category names, and scroll-snap behaviour on a real phone all need eyes.
