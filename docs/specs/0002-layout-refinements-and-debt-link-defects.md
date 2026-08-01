# Spec 0002 — Layout refinements and Debt link defects

**Status:** ready-for-human
**Screens touched:** Beranda · Transaksi · Anggaran · Hutang · Catat
**Follows:** Spec 0001 (month navigation, category charts, search, debt payment history)

> **Why not `ready-for-agent`.** Everything below is already built, type-checks,
> and passes 81 tests. Labelling it `ready-for-agent` would instruct an agent to
> re-implement work that exists. Two items — the Jumlah Pokok field and live
> search typing — could not be confirmed in a browser because Chrome's click
> transport is broken on this machine, so what remains is a human sitting with a
> phone. See **Further Notes → Outstanding verification**.

---

## Problem Statement

Spec 0001 landed the features, and using them on a real phone with real money
exposed a second class of problem: the screens are correct but they do not
*read* correctly, and three links go somewhere useless.

**Beranda buries its own control.** The month stepper sits above the balance
card — above the one figure on the entire screen it deliberately does not
govern. Total Saldo is live "per hari ini"; everything below the stepper follows
the selected month. Putting the control first implies it governs the number
underneath it, which is exactly backwards.

**Small things read as mistakes.** The `›` on a Perlu Perhatian card is a bare
glyph sitting above its own optical centre — it reads as a stray character
rather than an affordance. The carousel's first card is flush against the screen
edge with no gutter. The search magnifier on Transaksi and Hutang is smaller
than the placeholder text beside it, so the field looks unfinished. Both pie
charts are drawn small enough that the arc adds nothing the legend does not
already say.

**Anggaran's card fights itself.** "Hentikan anggaran" floats outside the card
it belongs to, so it is unclear which Category it stops — and there is nothing
to say the card is tappable at all.

**The Anggaran drill-down has no way back.** Spec 0001 added
`/anggaran/[kategori]` but gave it a page title and no navigation. On a phone
installed as a PWA there is no browser chrome, so the only exit is the bottom
nav — which loses the selected month.

**Jumlah Pokok takes a raw number.** Every other money field in the app groups
digits as you type. This one does not, so entering a five-million-rupiah Debt
means counting zeroes with no separators — the single easiest place in the app
to be out by a factor of ten.

**Three Debt links go nowhere useful.**

1. A settled Debt's card links to `/hutang` — the page you are already on. The
   payment history, which is the entire reason to open a Lunas row, is
   unreachable.
2. Opening a Piutang leads to `/catat`, but every way back from there lands on
   the **Hutang** tab. The segment is silently lost, so recording a repayment
   for money lent out dumps you in the wrong list.
3. There is no acknowledgement anywhere that a Debt is settled once opened.

---

## Solution

Move the month stepper below the balance card on Beranda, so the live figure
sits above the control it ignores and everything the month governs sits below
it. Give the alert chevron a real box and centre it. Keep the page gutter at
every carousel snap point, not just at rest. Enlarge both search icons and both
donuts.

Make each Anggaran card a container whose upper half is the link and whose lower
half holds the stop control below a divider, with a chevron next to the
percentage so the row reads as tappable. Give the drill-down a mobile top bar —
circular back target on the left, title and month centred.

Group Jumlah Pokok as it is typed, using the same hidden-field pattern the
Transaction amount already uses.

Derive the Debt return path from the Debt's own direction, server-side, so a
Piutang always returns to its own segment. Link settled Debts like any other so
their history is reachable, and say plainly at the top of the form that nothing
is outstanding.

---

## User Stories

### Beranda — month stepper placement

1. As a Member reading Beranda, I want the month stepper below the balance card, so that the control does not appear to govern the live Total Saldo above it.
2. As a Member, I want Total Saldo to stay labelled "per hari ini", so that I never read it as a figure for whatever month is selected.
3. As a Member, I want everything below the stepper — cash-flow bars, alerts, the donut, recent Transactions — to follow the selected month, so that the page has one obvious dividing line.
4. As a Member stepping to a past month, I want the Pemasukan and Pengeluaran figures inside the balance card to follow the month, so that the card's split still answers "what happened in the month I am looking at".

### Beranda — Perlu Perhatian carousel

5. As a Member scanning an alert card, I want its chevron vertically centred against the card, so that it reads as a tap affordance and not a stray character.
6. As a Member, I want the chevron sized proportionally to the card, so that it is visible without competing with the alert text.
7. As a Member swiping the alert carousel, I want the first card to keep the page's left gutter, so that it does not look clipped by the screen edge.
8. As a Member swiping to the second and third alerts, I want each snapped card to keep the same left gutter, so that the strip does not shift its margin as I scroll.
9. As a Member, I want the next card to peek at the right edge, so that I can tell there is more than one alert before I touch anything.
10. As a Member with several alerts, I want position dots below the strip, so that I know how many there are and where I am.
11. As a Member with exactly one alert, I want no dots, so that the page does not imply there is more to see.

### Beranda and Anggaran — chart size

12. As a Member, I want the Beranda category donut drawn large enough to read at arm's length, so that the arc carries information rather than decorating the legend.
13. As a Member, I want the Anggaran donut drawn at the same size as Beranda's, so that the two screens feel like one app.
14. As a Member, I want the donut to keep its proportions when its size changes, so that enlarging it never distorts the ring.

### Transaksi and Hutang — search field

15. As a Member looking at the Transaksi search field, I want the magnifier sized against the field rather than smaller than the placeholder, so that the field looks like a finished control.
16. As a Member, I want the Hutang search field to match Transaksi's exactly, so that two adjacent screens do not differ in a way that looks like a defect.
17. As a Member typing a search, I want a clear button to appear, so that I can get back to the full list in one tap.

### Anggaran — card structure

18. As a Member, I want "Hentikan anggaran" inside the Budget's own card, so that there is no ambiguity about which Category it stops.
19. As a Member, I want a divider between the Budget's progress and its stop control, so that I do not hit the control while aiming for the card.
20. As a Member, I want a chevron beside the percentage, so that I can tell the card opens a detail view.
21. As a Member, I want tapping the upper half of the card to open the Category detail, so that the largest part of the card is the primary action.
22. As a Member viewing a past month, I want no stop control at all, so that the screen never implies I can rewrite what a past month reported against.

### Anggaran — Category detail

23. As a Member on the Category detail page, I want a back control in the top left, so that I can return without using the bottom nav.
24. As a Member, I want the back control to return me to Anggaran **in the month I was viewing**, so that stepping back three months is not undone by one tap.
25. As a Member, I want the Category name and month centred in the top bar, so that the page identifies itself the way a native app screen does.
26. As a Member, I want the back control to have a finger-sized tap target, so that I do not have to aim at a glyph.
27. As a Member, I want the back control to show visible feedback when pressed, so that I know the tap registered before the page changes.
28. As a Member using the app installed as a PWA, I want in-page navigation, so that the absence of browser chrome never traps me.

### Hutang — Jumlah Pokok

29. As a Member entering a Debt's principal, I want thousands separators as I type, so that I can see at a glance whether I typed five million or fifty.
30. As a Member, I want the "Rp" prefix outside the input, so that the field itself only ever contains digits.
31. As a Member, I want a numeric keypad on this field, so that I am not hunting for digits on a text keyboard.
32. As a Member, I want the grouped display to submit as a plain number, so that formatting never reaches the database.
33. As a Member who has saved a Debt, I want the field cleared, so that the next Debt does not start with the previous amount.
34. As a Member whose submission failed validation, I want everything I typed still there, so that I can correct one field instead of starting over.

### Hutang — links and settled Debts

35. As a Member tapping a settled Debt, I want it to open like any other, so that I can read the payment history that is the only reason to open a Lunas row.
36. As a Member opening a settled Debt, I want to be told plainly that nothing is outstanding, so that I do not have to work it out from a zero.
37. As a Member who opened a settled Debt, I want the form still usable, so that I can correct a mistakenly recorded repayment.
38. As a Member recording a repayment on a Piutang, I want to return to the **Piutang** tab, so that I stay in the list I was working through.
39. As a Member closing the form on a Piutang without saving, I want the same Piutang tab, so that closing and saving agree with each other.
40. As a Member recording a repayment on a Hutang, I want to return to the Hutang tab, so that the default case is unchanged.
41. As a Member deleting a Transaction linked to a Debt, I want to return to that Debt's own tab, so that deletion behaves like the other two exits.
42. As a Member arriving at the form from a shared link or a fresh tab, I want the close control to still lead somewhere sensible, so that it is never a dead end.
43. As a Member of the Household, I want the return destination decided from the Debt itself rather than a URL parameter, so that no link can redirect me off the app.

### Catat — payment history wording

44. As a Member opening a Hutang with no origination Transaction, I want it described as a credit purchase with no money in, so that the gap reads as a fact rather than missing data.
45. As a Member opening a Piutang with no origination Transaction, I want it described as no money **out**, so that the wording matches the direction the money actually travels.
46. As a Member, I want that wording to match the checkbox on the add form, so that the app describes the same situation the same way twice.

---

## Implementation Decisions

### Layout only, no data changes

No schema change, no migration, no new load-function output, and no change to
any figure. Everything in the Beranda, Transaksi and Anggaran sections is CSS
and markup structure. This is deliberate: the arithmetic was verified against
real household data under Spec 0001 and must not be disturbed by a visual pass.

### The Beranda stepper is moved, not reconfigured

The stepper component and its month resolution are untouched. It is relocated
into a wrapper below the balance card. The rule the layout now encodes: *the one
figure above the stepper is the one figure it does not govern.*

### The carousel gutter uses scroll padding, not margin alone

The alert strip already bleeds to the screen edge via negative margin and
compensating padding, which gives the correct gutter **at rest**. Scroll snap
ignores padding, so every snapped card previously sat flush to the edge. Adding
scroll padding on the leading edge makes the snap position agree with the
resting position. Cards are sized to leave a deliberate sliver of the next one
visible.

### The donut scales from one number

The donut is drawn in a fixed 120-unit viewBox and scaled by CSS, so enlarging
it is a single constant and the ring keeps its proportions. There is still no
charting dependency — the cash-flow bars are hand-rolled and one more figure
type does not justify one.

### Both search fields change together

Transaksi and Hutang use the same search-field pattern side by side in the
bottom nav. Only Transaksi's icon was reported, but changing one and not the
other would present as a defect. They are kept identical.

### The Anggaran card stops being a single anchor

A button cannot be nested inside an anchor. To bring "Hentikan anggaran" inside
the card, the card becomes a plain container: its upper half is the link, and
the stop form sits below a divider. A chevron beside the percentage supplies the
affordance the whole-card anchor used to imply. The stop control renders only in
the current month, unchanged from Spec 0001 — a Budget takes effect from the
month it is set and can only be changed in the present.

### The detail page gets a mobile top bar, not a breadcrumb

Back target on the left, titles centred, and an inert spacer of equal width on
the right so the title is optically centred rather than merely flexed. The back
link carries the selected month, using the same helper the rest of the app uses
to preserve it. It is an ordinary link, so it works with JavaScript off and can
be long-pressed.

### Jumlah Pokok reuses the existing money pattern

The pattern comes from the Transaction amount field and is copied rather than
reinvented: a visible input holds the grouped text and is re-grouped on every
input event, and a sibling hidden field carries the parsed digits under the name
the form action reads. The server contract is unchanged — it still receives a
plain number — so no validation or schema work is implied. Clearing on success
is handled in the same success-only branch that closes the form.

### The Debt return path is derived, never passed

A single function maps a Debt's direction to its list path:

```ts
// Receivable → its own segment; everything else → the default tab.
function debtReturnPath(direction: string | null | undefined): string {
  return direction === 'receivable' ? '/hutang?seg=piutang' : '/hutang';
}
```

Three call sites use it — the save redirect, the delete redirect, and the close
control's fallback — so all three exits agree.

This deliberately rejects a `from=` or `return=` URL parameter. An unvalidated
return URL is an open redirect, and validating one is work that buys nothing
here: the Debt already knows its own direction, and it is loaded server-side
anyway. Because the value is derived from a row the Household owns rather than
from the URL, there is nothing for an attacker to supply. The total function
above also means an unknown or missing direction lands on the default tab rather
than erroring.

### The close control's fallback is the derived path

The close control remains an ordinary link whose `href` is the derived path,
with a click handler that prefers `history.back()` only when history exists
**and** the referrer is same-origin. Arriving from outside the app, or with
JavaScript off, therefore follows the link. The `href` is the correct
destination in its own right, not a placeholder.

### Settled Debts are reachable and labelled

Every Debt row links to the form regardless of remaining amount. When the
remaining amount is at or below zero, a success-toned banner states that the
Debt is settled and points at the history below. The form itself stays enabled
so a mistaken repayment can be corrected — consistent with ADR-0008, since
correcting an entry must not require destroying the Debt.

### Missing-origination wording is direction-aware

Under ADR-0004 a Debt has no origination Transaction whenever nothing crossed a
Wallet boundary. Which direction is absent depends on the Debt: a payable
brought no money **in**, a receivable sent no money **out**. The message
distinguishes the two, matching the wording on the add form's checkbox. The
previous single message described a payable's situation and was wrong on every
Piutang.

### ADR compliance

- **ADR-0003** — nothing is stored or cached; the enlarged charts read the same derived values as before.
- **ADR-0004** — the missing-origination message explains the absence rather than fabricating a row.
- **ADR-0006** — the return path is resolved in a load function and a form action; the browser gains no data access. The client-side pieces (search filtering, chip filtering, digit grouping) operate only on data already delivered.
- **ADR-0008** — settled Debts are reachable, never hidden by destruction; the Lunas filter reveals them.
- **ADR-0009** — the settled banner uses the success tone, not terracotta. Terracotta stays reserved for things needing attention, so it is used for the alert chevron and the over-budget states and nowhere new.

---

## Testing Decisions

### What a good test is here

A test asserts what a Member would observe: a destination, a filtered set, a
running balance, a flag. It does not assert that a particular helper was called
or that a class name exists. Two tests written during Spec 0001 were deleted for
failing this bar — one asserted `not.toContain` on a number, which cannot fail,
and another asserted only that an array was an array. A test that cannot fail is
worse than no test, because it reports green.

### Layout is deliberately untested

Nothing in the Beranda, Transaksi or Anggaran layout work has a test. This is a
decision, not an omission. Asserting a font size, a padding value, or a DOM
nesting shape would pin the implementation without describing anything a Member
can perceive, and every such test would have to be rewritten by the next visual
pass. Visual correctness is verified by looking at the screen. What *is* tested
is everything with a decidable answer — which is why the Debt link work carries
tests and the chevron does not.

### Modules under test

- **Debt return path** — the pure direction-to-path function, covering receivable, payable, unknown, `null` and `undefined`. It is total by construction, so each input has an asserted output rather than a thrown error.
- **Settled Debt reachability** — the Catat load function with a settled Debt, asserting the Debt resolves, its remaining amount is zero, and a history is returned. This is the assertion that would have caught the original defect: the old code made a settled Debt unreachable, and the test says it is reachable.
- **Payment history** — already covered by Spec 0001: running remainder, origination excluded from the arithmetic, the credit-purchase case with no origination, attribution by Member name, the empty case, and the overpayment clamp that keeps the remainder at zero rather than negative.

### Prior art

Both new areas extend `tests/hutang.test.ts` from Spec 0001 and use its existing
scaffolding unchanged: the shared fake Supabase client and the household
fixture, which already contains a settled Debt, a Debt with an origination
Transaction, a credit purchase with none, and a receivable. No new fixture and
no new test seam were introduced — the point of building one shared fake was
that follow-up work like this costs nothing to test.

The fake throws by name on any table it has no fixture for and on any embedded
select, so a query added without a fixture fails loudly rather than returning
empty and passing.

### Suite state

81 tests across six files, all passing. Type-check reports zero errors. The
production build succeeds.

---

## Out of Scope

- **Any change to a figure.** No total, remainder, percentage or slice changes value.
- **Schema, migrations, RLS.** Nothing in the database is touched.
- **New features.** This spec refines Spec 0001's surface; it adds no capability beyond reaching a settled Debt's history.
- **Dark mode.** The token pairs exist but are not implemented, and enlarging a chart does not change that.
- **Animation and transitions.** The carousel remains a plain scroll-snap list with no scripted scrolling; no page transitions are added.
- **A charting library.** Both figures stay hand-rolled.
- **Editing a Budget from a past month.** Unchanged from Spec 0001 and deliberately still impossible.
- **The Anggaran drill-down's own filtering or search.** It lists one Category in one month; narrowing further is Transaksi's job.
- **Screenshot or visual-regression testing.** No baseline images, no snapshot harness; the reasoning is in Testing Decisions.

---

## Further Notes

### One defect introduced and caught during this work

Making the missing-origination message appear for settled and receivable Debts
surfaced it on Piutang rows for the first time, where it read *"Cicilan barang ·
tidak ada uang masuk"* — a payable's framing applied to money lent out. Money
lent out goes **out**. This was my own error, found by reading the rendered page
rather than by a test, and it is the reason the message is now direction-aware.
Worth recording because it is the shape of mistake this area invites: the two
Debt directions are near-mirror images, and prose written for one is wrong for
the other in a way that type-checks.

### Outstanding verification

Chrome's automation on this machine accepts navigation but times out on every
click (`Input.dispatchMouseEvent`, 30s, renderer unresponsive). Two things
consequently have **not** been seen working, because reaching either requires a
click:

1. **Jumlah Pokok grouping.** Opening the add form needs a tap. The logic is
   copied verbatim from the Transaction amount field, which is in daily use, and
   it type-checks — but it has not been typed into.
2. **Live search typing** on Transaksi and Hutang. Focusing the field needs a
   tap. The filter predicates are unit-tested directly; the binding between the
   input and those predicates is not.

Both need a human with the app open. This is the whole reason the Status line
reads `ready-for-human`.

### What was verified in a browser

Against real Household data, by navigation alone: the Beranda stepper below the
balance card with the enlarged donut, centred chevrons and a peeking next card;
Anggaran's stop control inside each card below its divider; the drill-down top
bar with its centred title; a Piutang row linking to the Catat form; and that
form's close control resolving to `/hutang?seg=piutang`.

### Relationship to Spec 0001

Every item here arose from using Spec 0001's output on a phone. Spec 0001
remains the authority on behaviour — month resolution, slice composition, filter
semantics, history arithmetic. This spec changes only presentation, plus the
three link destinations Spec 0001 got wrong.
