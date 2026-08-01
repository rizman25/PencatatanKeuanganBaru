# Spec 0003 — Logout, renaming, and the Dompet chart

**Status:** ready-for-agent
**Screens touched:** Kelola · Transaksi
**Follows:** Spec 0001 (month navigation, charts, search) · Spec 0002 (layout refinements)

---

## Problem Statement

Kelola is where a Member manages the Household's Wallets, Categories, and
membership. Three things are missing from it, and one of them has been quietly
wrong since the app was built.

**There is no way to sign out.** A logout endpoint exists and is wired to the
onboarding screen only. Once you are past onboarding, the app has no exit — you
cannot hand the phone to someone, and you cannot switch accounts to test what
the other Member sees. Worse, that endpoint signs you out of *every* device,
because `signOut()` defaults to a global scope. Nothing in the app says so.

**Nothing can be renamed.** A Wallet or Category can be created and archived,
but never corrected. A Wallet typed as "BCa" stays "BCa" for the life of the
Household, and the only escape is archiving it — which the app refuses while it
still holds money, and which would split the history in two even if it did not.

**Nothing shows where the money sits.** Kelola lists every Wallet's Saldo and a
Total underneath, but the composition is left to the reader. "Is too much
sitting in cash?" is a question the screen holds all the data for and never
answers. Nor does its opposite: which Wallet this month's spending actually came
out of.

Two smaller faults surface alongside these. Nothing prevents two Categories
sharing a name — and because the pie rolls up by name, two Categories called
"Transport" silently merge into one slice whose link points at only one of them.
And there is no database constraint tying a Category's `kind` to a Transaction's
`type`, so a Category flipped from expense to income would leave Expense rows
pointing at an income Category with Postgres raising no objection.

---

## Solution

Give Kelola a footer that names the account you are signed in as and a two-step
logout beneath it, and fix the endpoint to end only this device's session.

Give every active Wallet and Category row an overflow menu holding **Ubah** and
**Arsipkan**. Ubah expands the row into a name field in place. Only the name is
editable — Saldo Awal, Jenis, and `kind` stay immutable — and a name already in
use is refused.

Put a donut at the top of the Dompet tab with a toggle: **Saldo**, the
composition of Total Saldo across active Wallets, and **Pengeluaran**, this
month's spending by the Wallet it left. Tapping a slice opens Transaksi filtered
to that Wallet, which the screen gains a filter for.

---

## User Stories

### Signing out

1. As a Member, I want a logout control on Kelola, so that I can sign out without clearing browser data.
2. As a Member, I want to see which account I am signed in as, so that I know whose books I am looking at before I do anything.
3. As a Member, I want logging out on my phone to leave my other devices signed in, so that signing out of one does not lock me out everywhere.
4. As a Member, I want a confirmation step, so that a mis-tap does not cost me a password re-entry.
5. As a Member, I want to cancel that confirmation, so that changing my mind takes one tap.
6. As a Member, I want the confirmation to happen in the page rather than in a browser dialog, so that it matches the rest of the app and cannot freeze the screen.
7. As a Member, I want logging out to return me to the sign-in screen, so that the next step is obvious.
8. As a Member on the onboarding screen, I want its existing logout to behave the same way, so that the app has one logout, not two.

### Renaming a Dompet

9. As a Member, I want to rename a Dompet, so that a typo made at setup does not last forever.
10. As a Member, I want renaming to leave every past Transaction intact, so that correcting a label never touches the ledger.
11. As a Member, I want the Dompet's Saldo and Saldo Awal to be unaffected by a rename, so that renaming can never move money.
12. As a Member, I want the three-letter tile code to update with the name, so that the tile never contradicts the label beside it.
13. As a Member, I want Saldo Awal shown but not editable, so that I can see what it is without being able to rewrite the Household's balance history.
14. As a Member, I want to be told plainly that Saldo Awal cannot be changed, so that its absence from the form reads as a decision rather than an oversight.
15. As a Member, I want to cancel a rename, so that opening the form by accident costs nothing.
16. As a Member, I want an empty name refused, so that a Dompet can never become unlabelled.
17. As a Member, I want a name already used by another Dompet refused, so that two rows in the picker are never indistinguishable.
18. As a Member, I want that check to ignore capitalisation, so that "bca" and "BCA" are recognised as the same name.
19. As a Member, I want renaming a Dompet to its own current name to succeed, so that opening the form and saving without changes is not an error.

### Renaming a Kategori

20. As a Member, I want to rename a Kategori, so that "Makanan" can become "Makan" without losing its history.
21. As a Member, I want every Transaction in that Kategori to follow the rename, so that nothing is orphaned.
22. As a Member, I want its Anggaran to follow the rename, so that the Budget stays attached to the Kategori I renamed.
23. As a Member, I want the Anggaran detail page to keep working after a rename, so that a renamed Kategori's drill-down does not break.
24. As a Member, I want a Kategori's kind to stay fixed, so that an expense Kategori can never become an income one and strand the Transactions pointing at it.
25. As a Member, I want a duplicate name within the same kind refused, so that the pie cannot merge two Categories into one slice.
26. As a Member, I want the same name allowed across different kinds, so that "Bonus" can be both something I receive and something I pay.
27. As a Member, I want the refusal to name the conflicting Kategori's kind, so that I understand why a name that looks free is not.

### The row menu

28. As a Member, I want one menu per row holding Ubah and Arsipkan, so that the row is not crowded with buttons.
29. As a Member, I want only one menu open at a time, so that the screen never shows two.
30. As a Member, I want tapping elsewhere to close the menu, so that I am never stuck with it open.
31. As a Member, I want Escape to close the menu, so that a keyboard works as well as a finger.
32. As a Member, I want the archived list to keep its plain Pulihkan button, so that the part of the screen I rarely visit does not change.
33. As a Member, I want archiving a Dompet that still holds money to stay refused, so that the guard protecting Total Saldo is not lost to the new menu.

### The Dompet donut — Saldo

34. As a Member, I want a donut of my Saldo across Dompet, so that I can see the shape of where the Household's money sits.
35. As a Member, I want each slice named with its amount and share, so that nothing depends on judging an angle on a phone.
36. As a Member, I want the centre to show the true Total Saldo, so that it agrees with the Total row below it and with Beranda.
37. As a Member, I want archived Dompet left out, so that the donut matches the list and the Total it is drawn from.
38. As a Member with an overdrawn Dompet, I want it listed with its real negative amount and no percentage, so that the chart does not hide a balance that is probably a mistake.
39. As a Member, I want that negative Dompet absent from the arc, so that a debt is never drawn as though it were an asset.

### The Dompet donut — Pengeluaran

40. As a Member, I want to switch the same donut to this month's spending by Dompet, so that I can see which Dompet I actually pay from.
41. As a Member, I want the month named on that view, so that I never wonder which period it covers.
42. As a Member, I want Transfers excluded from it, so that moving my own money between Dompet is not counted as spending.
43. As a Member, I want cicilan payments included, so that the total matches the month's Pengeluaran exactly.
44. As a Member, I want the toggle to remember nothing between visits, so that Kelola always opens on the same view.
45. As a Member in a month with no spending, I want to be told so, so that an empty donut is not mistaken for a broken one.

### Reaching Transaksi from a slice

46. As a Member, I want to tap a slice and see that Dompet's Transactions, so that the chart is a way in rather than a dead end.
47. As a Member, I want the filtered list to include Transfers into that Dompet as well as out of it, so that the list agrees with how its Saldo is computed.
48. As a Member, I want the active Dompet filter announced above the list, so that a short list is explained rather than alarming.
49. As a Member, I want to clear the Dompet filter in one tap, so that getting back to everything is easy.
50. As a Member, I want clearing it to keep the month I am looking at, so that clearing one filter does not reset another.
51. As a Member, I want to step months with the Dompet filter still on, so that I can follow one Dompet back through time.
52. As a Member, I want the type chips to keep the Dompet filter, so that "Pengeluaran from BCA" is reachable.
53. As a Member, I want search to work inside the filtered set, so that all three narrowings compose.
54. As a Member, I want a Dompet filter naming something that is not mine to be ignored rather than to error, so that a stale or edited link degrades quietly.

---

## Implementation Decisions

### Logout changes an existing endpoint rather than adding one

The endpoint already exists and already redirects to the sign-in screen. It
gains an explicit `scope: 'local'`. This is a behaviour fix, not a new feature:
the default is global, so today one logout revokes every refresh token on every
device. The onboarding screen's existing logout inherits the fix.

The confirmation is component state, not a browser `confirm()` — consistent with
the rest of the app, and a modal dialog would block the automation used to
verify these screens.

### Renaming is name-only, by construction

The edit form exposes one field. Saldo Awal is displayed read-only with a line
saying it cannot be changed, because a Member who opens the form to fix a
starting balance needs an answer, not a missing field.

Immutability here is not caution:

- **Saldo Awal** is the only balance figure stored anywhere. Editing it rewrites every historical Balance with no Transaction to explain the change.
- **Kind** has no database constraint tying it to a Transaction's type. The schema was specified with that check living in a form action, and the migration never added it. Flipping a Category's kind would leave Expense rows pointing at an income Category, and Postgres would accept it.

Renaming is safe precisely because everything references ids: Transactions
reference `category_id` and `wallet_id`, Budgets reference `category_id`, and the
Anggaran drill-down is routed by Category id — a choice made in Spec 0001 with
"names get renamed" as the recorded reason.

### The Wallet tag is derived, not stored input

The three-letter tile code is generated from the name at creation and was never
a field a Member filled in. A rename re-derives it by the same rule, so the tile
and the label cannot disagree.

### Uniqueness is enforced in the form action, not the database

A pure predicate decides whether a name is taken, and both the create and the
rename actions call it. It is case-insensitive, trims surrounding whitespace,
and excludes the row being edited so saving an unchanged name succeeds.

Scope differs by table:

- **Wallets** — unique across the whole Household, archived rows included. A name freed by archiving stays reserved, so restoring an archived Wallet can never produce a collision.
- **Categories** — unique within a kind, archived rows included. The two kinds are never displayed in the same list and kind is part of a Category's identity everywhere it is used.

A unique index would be more robust than an application check, and is
deliberately not added: it needs a migration, and existing Households may already
hold duplicates that the migration would fail on. The check therefore prevents
new duplicates without asserting anything about old ones. This is recorded as a
known limitation rather than presented as an invariant.

### The row menu is state, not a native popover

One piece of component state holds the id of the open row, which gives "only one
open at a time" for free. A transparent full-screen layer beneath the menu
closes it on an outside tap, and Escape closes it too. This avoids the top-layer
positioning problem the native popover attribute brings, which would otherwise
need CSS anchor positioning that is not yet portable.

Archiving remains a form post, so the existing guard — a Wallet holding money
cannot be archived, with the error naming the balance — is untouched.

### The donut reuses the existing chart module

Both views produce the same ranked-slice shape the category charts already use,
including the top-six rollup into Lainnya. With a handful of Wallets that rollup
never fires; sharing it is still right, because a Household with a dozen Wallets
gets sensible behaviour without a second code path.

Slices are keyed by Wallet id so they can link, and named by Wallet name so they
can be read — the same pairing Anggaran uses.

The rollup already discards non-positive amounts, which is what makes negative
balances safe: they cannot reach the arc. They are returned separately so the
legend can still show them, with their real signed amount and a dash where the
percentage would be. The centre figure is the true total including negatives, so
it continues to match the Total row directly beneath it.

### Pengeluaran is the current month, resolved independently of the URL

Kelola is not month-navigable. It is absent from the bottom nav and is reached
from the Beranda avatar, which carries no month parameter. Rather than read the
month the layout resolved — which would let `?m=` reach a screen with no stepper
to explain it — this view resolves the current month directly. The month is
named in the heading.

Its slices are built from Expenses only, attributed to the Wallet the money left.
Transfers take no part, for the same reason they take no part in the category
pie: money moving between the Household's own Wallets is not spending. Debt
repayments are Expenses and do count, which is what makes the view total the
month's Pengeluaran exactly.

### Transaksi gains a Wallet filter

A new query parameter names a Wallet. It is validated against the Household's
own Wallets and ignored when it matches none — a stale link shows everything
rather than erroring or showing an empty list it cannot explain. RLS already
makes a foreign id return nothing; ignoring it is about the Member's experience,
not about access.

The filter matches a Transaction where the Wallet is **either** side of it:

```
wallet_id = :w OR to_wallet_id = :w
```

Source-only matching was rejected because a Transfer into a Wallet would then be
absent from that Wallet's own list while still counted in its Balance — the list
and the number would disagree.

Transfer rendering needs no change. A Transfer already renders with a
direction-neutral glyph, an unsigned amount, and a "from → to" sub-line, so it
reads correctly from either side without knowing which side is being viewed.

The active filter is announced in a dismissible banner above the list rather
than as another row of chips: it is arrived at from Kelola rather than set from
scratch, and Transaksi already carries a search field, a month stepper, and four
type chips above the list on a 390px screen.

All three narrowings compose. The month stepper, the type chips, and the banner's
dismiss control each rebuild the query string from the current state, so no
control silently drops another's parameter.

---

## Testing Decisions

### What a good test is here

Same bar as Specs 0001 and 0002: assert what a Member would observe — which rows
come back, what a slice totals, which name is refused — never that a helper was
called or a class name exists. Layout remains untested for the reasons recorded
in Spec 0002.

### The write problem, and how it is handled

The established seam is the `load` function, and the fake Supabase client
implements reads only. Renaming and the uniqueness rule are **writes**, so they
are unreachable from that seam.

Rather than grow the fake to support writes — which would mean modelling insert,
update, and constraint violation, and would make the fake a small database whose
own correctness nobody checks — the decidable part is extracted as a pure
predicate and tested directly. This is the same move already made for the Debt
filters and the Debt return path, both of which run outside the load seam.

What this does **not** cover is that the form action calls the predicate with the
right arguments. That gap is real and is named here rather than papered over.

### Modules under test

- **Name uniqueness** — the pure predicate: exact match, case difference, surrounding whitespace, a row against itself, an empty candidate, and the kind-scoping that lets one name exist as both an income and an expense Category.
- **Balance composition** — slices ranked by size, shares summing to one, archived Wallets absent, a negative Wallet excluded from the slices but present in the returned list with its real amount, and the total remaining the true total.
- **Spending composition** — Transfers absent, cicilan Expenses present, the slice total equal to the month's Pengeluaran figure, and an empty month yielding no slices rather than a zero-slice ring.
- **The Wallet filter** — the Transaksi load function with a Wallet parameter: only that Wallet's rows return; a Transfer appears under both its source and its target; the filter composes with the month and the type filter; and an unknown Wallet id is ignored rather than returning nothing.

### One addition to the fake

The Wallet filter needs a disjunction, which the fake does not implement. It
gains one, restricted to the exact shape the app uses — comma-separated equality
terms — and throwing by name on anything else. That restriction is the point: the
fake stays a description of what the app actually does rather than drifting into
a general query engine that could pass while the real query fails.

### Fixtures

The existing Household fixture already contains everything these tests need: an
archived Wallet with history, four active Wallets, two Transfers in the current
month, cicilan Expenses, and Categories across both kinds. The negative-balance
case is supplied by overriding the balances table in that one test rather than by
adding a negative Wallet to the shared fixture, which would move the totals every
other test asserts against.

---

## Out of Scope

- **Editing Saldo Awal, Jenis, or a Category's kind.** Recorded above with reasons.
- **A unique index on names.** Application-level check only; the limitation is stated rather than hidden.
- **Deleting a Wallet or Category.** ADR-0008 stands — archive, never destroy.
- **A month stepper on Kelola.** The Pengeluaran view is the current month, full stop.
- **A Dompet detail page.** Slices lead to Transaksi, not to a new screen.
- **Setting the Wallet filter from Transaksi itself.** It is arrived at from Kelola; there is no Wallet picker on Transaksi.
- **Icons or colours for Wallets and Categories.** The columns do not exist and no migration is added.
- **Changing a display name, avatar, or password.** Account management beyond signing out.
- **Leaving a Household, or removing a Member.** The logout footer is about the session, not membership.
- **Editing archived rows.** Restore first.
- **Persisting which donut view was last used.**

---

## Further Notes

### The logout fix is the most valuable line in this spec

Everything else here adds capability. The `scope: 'local'` change fixes
behaviour that is wrong today and would have been discovered the confusing way —
by being signed out of a laptop while tapping a button on a phone. It is worth
noting that this was found by reading the endpoint rather than by anyone
reporting it, which is the argument for reading code adjacent to the code you are
about to change.

### Two schema gaps are now documented rather than fixed

Neither is addressed here, because both need a migration and neither is
triggerable through the UI as it now stands:

1. **No constraint ties `category.kind` to `transaction.type`.** Handled by making kind immutable. If a future spec makes kind editable, this constraint must land first.
2. **No unique index on Wallet or Category names.** Handled by an application check that stops new duplicates. Pre-existing duplicates, if any, keep working and keep merging in the pie.

### Where the tests genuinely stop

Three things in this spec are not test-covered, listed so nobody reads a green
suite as more than it is:

- That the rename form actions call the uniqueness predicate correctly. The seam is reads; the predicate is tested, its wiring is not.
- The row menu's open, outside-tap, and Escape behaviour, which is component interaction.
- Every layout and styling decision, as in Spec 0002.
