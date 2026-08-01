# Spec 0004 — The Profile tab

**Status:** ready-for-agent
**Screens touched:** Kelola · Beranda
**Follows:** Spec 0003 (logout, renaming, the Dompet chart)
**Carries the project's first migration since `0001_init.sql`**

---

## Problem Statement

Every Member has an identity in this app, and none of it is theirs to control.

**Your name was chosen for you and cannot be changed.** `display_name` is
written once, by the signup trigger, from Google metadata or from whatever sits
in front of the `@` in your email address. It is the name printed beside every
Transaction you record — the answer to "who paid for this?" — and there is no
screen anywhere in the app that can edit it. A Member who signed up as
`rizman25@gmail.com` is called "rizman25" to their own household, permanently.

**Nobody has a face.** The `avatar_url` column has existed since the first
migration and is null for every account in the project, because it is only ever
populated from Google sign-in metadata and Google sign-in is disabled. Nothing
in the app reads it. The Household member list is a column of text; the Beranda
header is a generic glyph. In a set of books shared by two people, telling at a
glance whose entry you are looking at is the whole point of attribution, and
the app renders it as a string.

**A password cannot be changed.** Not after a shared phone, not after a
suspicion, not for any reason. The only credential path in the app is the one
that created the account.

**And nothing that is actually about a person lives in one place.** The
Household block — its name, its members, its invite code — sits at the bottom
of the Dompet tab, underneath the Wallet list, because that is where there
happened to be room. Logout sits below both tabs in a footer. Wallets,
Categories, membership, and identity are four different subjects sharing two
tabs, and a Member looking for "my account" has nowhere to look.

---

## Solution

A third tab on Kelola, beside Dompet and Kategori, called **Profil**. It holds
everything about you and everything about the Household you belong to.

Your photo, with a real camera roll behind it — pick an image, see it cropped
square, save it. Your name, editable in place, the same one-field edit already
built for Wallets and Categories. The email you signed in with, stated plainly
and not editable. A password change that asks for your current password first.
The Household — its name now editable, its members now with faces, its invite
code where it always was. And logout, moved off the footer into the section it
belongs to.

The three tabs become addressable — `?tab=profil` — so a refresh lands where you
were, the back button walks between tabs, and the Beranda avatar can point at
your profile instead of dropping you on Wallet management.

---

## User Stories

### The tab itself

1. As a Member, I want a third tab on Kelola called Profil, so that everything about me and my Household has one place to live.
2. As a Member, I want Profil to sit to the right of Kategori, so that the order runs from the things I touch daily to the things I touch rarely.
3. As a Member, I want the selected tab to appear in the address bar, so that refreshing the page leaves me where I was rather than back on Dompet.
4. As a Member, I want the browser back button to walk back through the tabs I opened, so that the tab control behaves like the rest of the app.
5. As a Member, I want an unrecognised tab in the URL to land me on Dompet, so that a mistyped or stale link opens the screen rather than an error.
6. As a Member, I want the Beranda avatar to take me to my Profile, so that tapping my own face goes somewhere about me instead of to Wallet management.
7. As a Member, I want the tab control to look and behave exactly as it does today, so that a third tab is a longer row and not a new interaction to learn.

### My photo

8. As a Member, I want to set a profile photo from my phone's camera roll, so that my entries are recognisable at a glance rather than only by name.
9. As a Member, I want my photo shown as a circle, so that it matches the avatar shape already used on Beranda.
10. As a Member, I want a photo I picked to be cropped square from its centre, so that a portrait or landscape shot fills the circle without stretching.
11. As a Member, I want a large photo to upload quickly on mobile data, so that setting a picture is not a minute of waiting.
12. As a Member, I want to see that the upload is in progress, so that I do not tap twice and wonder which one took.
13. As a Member, I want my new photo to appear immediately after saving, so that I can see it worked without reloading.
14. As a Member, I want replacing my photo to actually replace it, so that I never see the old one again through a cache.
15. As a Member, I want to remove my photo and go back to initials, so that changing my mind is as easy as changing the photo.
16. As a Member, I want my initials shown when I have no photo, so that the space is never empty.
17. As a Member, I want a file that is not an image to be refused with a reason, so that a mis-tap on a PDF explains itself.
18. As a Member, I want an enormous file to be refused rather than attempted, so that a bad pick fails fast instead of timing out.
19. As a Member, I want my photo visible to the people I share a Household with, so that their member list shows my face.
20. As a Member, I want my photo *not* visible to anyone outside my Household, so that a family photo is not a public URL.
21. As a Member, I want my photo to appear beside my name in the Household member list, so that I can see who is who.
22. As a Member, I want my photo in the Beranda header, so that the app looks like mine when I open it.
23. As a Member, I want another Member's photo to appear even though it is not mine, so that the member list is faces rather than one face and some initials.

### My name

24. As a Member, I want to change my display name, so that the books show what I am actually called rather than a fragment of my email.
25. As a Member, I want the name edit to work like the Wallet and Category renames, so that I already know how to use it.
26. As a Member, I want an empty name refused, so that I cannot become anonymous by accident.
27. As a Member, I want an absurdly long name refused, so that one Member cannot break the layout of every screen that prints a name.
28. As a Member, I want my new name to appear on my past Transactions too, so that attribution is about the person and not about what they were called that day.
29. As a Member, I want to be allowed a name another Member already uses, so that two people who genuinely share a name are not blocked by the app.
30. As a Member, I want to cancel a name edit without saving, so that opening the field is not a commitment.

### My email

31. As a Member, I want to see the email address I signed in with, so that I know which account these books are attached to.
32. As a Member, I want the email shown as plain text rather than an editable field, so that I am not invited to attempt something the app cannot do.
33. As a Member, I want it stated that the email cannot be changed here, so that its being read-only reads as deliberate rather than broken.

### My password

34. As a Member, I want to change my password from inside the app, so that I do not have to sign out and use a reset link.
35. As a Member, I want to be asked for my current password first, so that someone holding my unlocked phone cannot lock me out of my own books.
36. As a Member, I want a wrong current password refused clearly, so that I know it was the old one that was wrong and not the new one.
37. As a Member, I want to type the new password twice, so that a typo does not become my password.
38. As a Member, I want a mismatch between the two refused before anything is sent, so that the failure is instant.
39. As a Member, I want the same minimum length signup enforces, so that the rule does not change depending on which screen I am on.
40. As a Member, I want to stay signed in after changing my password, so that success does not look like being thrown out.
41. As a Member, I want plain confirmation that the password changed, so that I am not left guessing whether to try the old one next time.
42. As a Member, I want the password fields cleared after a successful change, so that my new password is not sitting on screen.

### My Household

43. As a Member, I want the Household section on the Profil tab, so that it stops sitting under the Wallet list where it never belonged.
44. As a Member, I want to rename the Household, so that "Rumah Tangga Rizman" can become what we actually call ourselves.
45. As a Member, I want the new Household name to appear immediately in the Beranda header, so that the change is visible where I read it every day.
46. As a Member, I want an empty Household name refused, so that the header cannot go blank.
47. As a Member, I want to see everyone in the Household with their photo and name, so that I know exactly who can see these books.
48. As a Member, I want myself marked in that list, so that I can tell which row is me.
49. As a Member, I want the invite code still here with its copy button, so that adding my partner works exactly as it did.
50. As a Member, I want to still be able to regenerate the invite code, so that a code shared too widely can be retired.

### Signing out

51. As a Member, I want logout on the Profil tab, so that it sits with my account rather than in a footer under everything.
52. As a Member, I want the two-step confirmation kept, so that I cannot sign out with one stray tap.
53. As a Member, I want to see which account I am signing out of, so that the button is unambiguous on a shared device.
54. As a Member, I want signing out here to leave my other devices signed in, so that the behaviour spec 0003 established does not silently change.

### Not losing my work

55. As a Member, I want a failed save to keep what I typed, so that an error costs me a tap and not the whole form.
56. As a Member, I want each section to save independently, so that a rejected password does not discard a name I also changed.

---

## Implementation Decisions

### Tab addressing

The Kelola tab becomes URL state rather than component state, read from a `tab`
search parameter and resolved server-side against a known list, falling back to
Dompet for anything unrecognised. This mirrors how Hutang already addresses its
segments, and how the month resolver already sanitises `?m=` in exactly one
place. Tabs are ordinary links, so the browser supplies the history behaviour
for free.

The Beranda header avatar's target changes from Kelola's default tab to the
Profile tab.

### Storage — the first binary data in the app

A **migration** creates a `avatars` **private** bucket plus storage policies.
This is the project's first migration since `0001_init.sql` and the first use of
Supabase Storage anywhere.

Objects are keyed by owner as the first path segment, which is what makes both
policies expressible:

- **Write/update/delete**: the first path segment equals `auth.uid()`. You can
  only ever touch your own folder.
- **Read**: mirrors the existing `profiles_read` policy — your own objects, plus
  the objects of anyone you share a Household with. Reusing the existing
  `is_household_member` helper keeps one definition of "shares a Household with
  me" rather than a second one that can drift:

  ```sql
  exists (
    select 1 from household_members m
    where m.user_id = (storage.foldername(name))[1]::uuid
      and is_household_member(m.household_id)
  )
  ```

Filenames are randomised per upload rather than fixed per user. Two consequences,
both wanted: an object path is never guessable from a user id, and a replacement
never collides with the object it replaces.

**Signed URLs, minted in the `load`, batched.** Kelola's load and Beranda's load
each make exactly one signed-URL call covering every avatar that screen needs,
alongside the queries they already run in parallel. A one-hour expiry is ample
for a page view. Because a fresh URL is minted every render, the cache-busting
problem that a fixed public URL would create does not exist — a changed photo
can never render as the old one.

`profiles.avatar_url` stores the **object path**, not a URL. No schema change:
the column already exists and is unused. A row whose `avatar_url` is null is
simply omitted from the signed-URL batch.

**Superseded objects are deleted, not archived.** This is a deliberate carve-out
from ADR-0008, and the reasoning is that ADR-0008 protects *history* — rows that
past Transactions point at. An avatar has no history: nothing references a
previous photo, no report renders it, and keeping every version would grow the
bucket without ever being read. Deletion here destroys nothing anyone can reach.

### Image handling

**Resize happens in the browser, before upload.** A canvas cover-crop to
256×256 JPEG at quality 0.85 turns a typical 4 MB phone photo into roughly
30 KB. This is the difference between an upload that feels instant on mobile
data and one that does not, and it means the server never handles a large body.

**The server still validates independently.** The browser is not trusted: the
form action checks the content type against an allowed image list and enforces a
hard byte cap well above what the resize produces but far below what an
un-resized photo would be. A client that skips the resize is rejected, not
accommodated.

The crop geometry — which square of a non-square source is kept — is a pure
function and lives with the other Kelola pure logic, so it can be tested without
a canvas.

### Profile writes

`display_name` and `avatar_url` are updated through the existing
`profiles_write` policy (`using (id = auth.uid()) with check (id = auth.uid())`).
**No migration and no policy change** — the permission has been there since the
first migration and has never been used.

Name validation: trimmed, non-empty, capped at a length that cannot break the
layouts that print it. **Deliberately no uniqueness check**, unlike Wallets and
Categories. Two Members called "Rizman" is confusing to read; two Categories
called "Makan" genuinely merges two things in the pie chart. Only the second is
a correctness problem, and the app should not refuse a real person's real name
to prevent a cosmetic one.

The Household rename goes through the existing `households_update` policy
(`using (is_household_member(id))`), which likewise already permits it. Same
validation shape as the name.

### Password change

The form action takes the current password, the new password, and its
confirmation. It verifies the current password by attempting a sign-in with it
against the session's own email address, and only on success calls the update.
There is no Supabase API that verifies a password without signing in, so this is
the mechanism available; the sign-in is for the same user who is already signed
in, so the session it returns is the session that was already there.

Minimum length matches signup exactly. Confirmation mismatch is caught before
any network call. On any failure the form keeps what was typed, so a wrong
current password does not cost the new one.

**Whether a password change ends the Member's sessions on other devices is a
Supabase project setting, not something this code controls.** It should be
checked against what spec 0003 deliberately established for logout — that
signing out is local to the device. If the project is configured to revoke other
sessions on password change, that is defensible, but it should be a known
behaviour rather than a surprise.

### Layout

The Household block — name, member list, invite code, regenerate — moves off the
Dompet tab wholesale. The Dompet tab is then only Wallets, which is what its
label says.

The logout footer moves off the bottom of the screen and into the Profile tab,
keeping its two-step confirm, its account label, and its local-scope sign-out.

Each section on the Profile tab is its own form posting to its own action, so a
rejected password change cannot discard an unsaved name.

Photos render at three sizes — large on the Profile tab, small in the member
list, small in the Beranda header — with an initials fallback wherever a Member
has no photo.

---

## Testing Decisions

### What a good test looks like here

The standard this repo has kept since spec 0001: assert what a Member would
observe, never how it was computed. A test that names a helper function or
counts Supabase calls will pass while the screen is wrong. Two specific traps
already caught and recorded in spec 0002 stay banned — `not.toContain(...)` on a
value that was never a candidate, and `Array.isArray(...)` — because neither can
fail and both bank false confidence.

### The seam

**Unchanged: the `load` function, through the fake Supabase client.** Profile is
a tab on Kelola, so its data arrives through the load that `tests/kelola.test.ts`
already exercises. No new seam.

**The fake needs a `storage` stub, and it must be as strict as the rest of it.**
The fake's whole value is that an unimplemented call throws by name rather than
returning something plausible; a permissive storage stub would let a broken
signed-URL path pass green. It implements exactly `createSignedUrls` over a
fixtured bucket, throws for an unknown bucket, and returns a deterministic URL
per path so tests can assert *which* paths were signed.

The shared fixture gains an `avatar_url` on one Member and leaves the other null
— the mixed case is the one the fallback logic actually has to survive.

### What gets tested at the load seam

- Tab resolution: each known tab, and an unrecognised one falling back to Dompet.
- The Profile payload: display name, account email, Household name, and the
  member list.
- Signed URLs are requested for exactly the Members who have a photo, and not
  for the one who does not.
- A Member with no photo arrives with a null URL, so the component can fall back.
- Beranda's load carries the signed URL for the signed-in Member's own photo.

### What gets tested as pure functions

These live with the existing Kelola pure logic, which already holds `nameTaken`
and `walletTag` and is already covered by `tests/kelola.test.ts`:

- Initials derivation, including a single-word name and a name with extra spaces.
- The centre-crop box for portrait, landscape, and already-square sources.
- Password-change validation: too short, mismatch, empty, and the passing case.
- The object path shape for a new upload.

### What is deliberately not tested

**The form actions.** The fake has no writes — `"Writes are absent entirely —
the seam is reads"` — and no form action in this repo is tested. Building a
write-fake to cover the upload and the password change would produce tests that
assert the fake's behaviour and tell us nothing about Supabase's. The decisions
inside those actions are extracted as pure functions and tested; the Supabase
round-trips are verified by hand.

**The browser-side resize**, which needs a real canvas.

**The storage RLS policies.** Like every other policy in this project, they are
verified against a live second account, which is the outstanding RLS-isolation
task — not against a fake that cannot enforce them.

### Prior art

`tests/kelola.test.ts` for the load-seam shape and the pure-function tests.
`tests/transaksi.test.ts` for URL-parameter resolution, including its test that
an unrecognised value degrades rather than errors — the exact pattern the `tab`
parameter needs. `tests/fake-supabase.ts` for how a new capability gets added to
the fake without loosening it.

---

## Out of Scope

**Changing the registered email.** It requires confirmation round-trips on both
the old and the new address, and a recovery story for a half-completed change.
It is its own feature, and pretending otherwise on this screen would be worse
than the read-only field.

**Leaving a Household.** There is no way back in without an invite code, and it
collides with ADR-0008: the leaver's past Transactions still name them, and
their `created_by` rows still point at a profile the Household could no longer
read. Settled as out of scope during the interview.

**Removing another Member.** Same problems, plus ADR-0005 — there are no roles,
so there is nobody with the standing to do it.

**Multiple Households per Member.** The app has assumed one throughout.

**Image cropping the Member controls.** Centre-crop only; a drag-to-position
cropper is a real interaction to build and the photo is rendered at 34px in the
place it matters most.

**Public avatar URLs or a CDN.** Private bucket, signed per render. Revisit only
if signed-URL latency becomes measurable.

**Google account linking**, which stays blocked on Google sign-in being enabled
in the Supabase project at all.

**Two-factor authentication and session management.** No listing of active
sessions, no remote sign-out.

---

## Further Notes

**This spec carries more genuinely new machinery than the three before it.** A
migration, a storage bucket, multipart handling, and password handling are each
a first for this project. Specs 0001–0003 rearranged and computed things the app
already had; this one adds infrastructure. Worth building in that order — bucket
and policies first, verified with a real upload, before any of the UI is written
— because a storage policy that is subtly wrong is invisible until someone
outside the Household can read a family photo.

**The avatar column has been dead since day one.** It was added for Google OAuth
metadata, Google sign-in was never enabled, and nothing has ever read it. This
spec is the first thing to give it a purpose, which is also why no schema change
is needed.

**The Beranda signed-URL call is the one place to watch for cost.** It adds a
storage round-trip to the app's most-loaded screen for a 34px image. It runs in
parallel with queries already in flight, so it should disappear into the
existing wait — but if Beranda gets measurably slower, dropping the header photo
back to initials costs one component and no data model.

**`display_name` becoming editable makes attribution mutable for the first
time.** This is correct — attribution is to a person, not to a string — but it
means a Transaction's "recorded by" label is now derived live rather than
effectively frozen. Nothing in the app stores a name alongside a Transaction, so
nothing needs changing; it is worth knowing.

**The name-uniqueness decision differs from Wallets and Categories on purpose.**
If that inconsistency ever looks like an oversight, this paragraph is the record
that it was a decision: merging two Categories with one name corrupts a chart,
and two Members with one name merely reads oddly.
