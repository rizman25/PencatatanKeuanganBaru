# Supabase setup

Do these once. Everything else is blocked until step 5 hands back two values.

## 1. Create the project

At [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.

| Field | Value |
|---|---|
| Name | `pencatatan-keuangan` |
| Region | **Southeast Asia (Singapore)** — `ap-southeast-1` |
| Database password | generate one and save it in your password manager |

Region matters: it is the difference between ~20 ms and ~200 ms per query from Indonesia, and every page load makes several.

## 2. Run the schema

Dashboard → **SQL Editor** → **New query**. Paste the whole of
[`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql) and run it.

It should complete with no errors and create 8 tables, 2 views, 6 functions, and RLS policies on every table. Verify in **Table Editor** that you see `households`, `household_members`, `wallets`, `categories`, `transactions`, `budgets`, `debts`, `profiles` — each showing **RLS enabled**.

## 3. Enable the two sign-in methods

Per ADR-0002: Google OAuth **and** email/password.

**Authentication → Providers → Email** — leave enabled. For a household of two, turn **Confirm email** *off* so signup isn't gated on an email arriving; turn it on later if the app is ever exposed more widely.

**Authentication → Providers → Google** — enable, then supply a client ID and secret from [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. Create an **OAuth 2.0 Client ID**, type **Web application**.
2. Authorised redirect URI: copy the callback URL Supabase shows you on that provider page — it looks like `https://<project-ref>.supabase.co/auth/v1/callback`.
3. Paste the client ID and secret back into Supabase and save.

**Authentication → URL Configuration** — set **Site URL** to `http://localhost:5173` for now, and add the Vercel URL later once it exists.

Both methods must land on the same account when you use the same email. Supabase links them automatically as long as **Authentication → Providers → Email → "Allow manual linking"** stays at its default.

## 4. Turn off what we don't use

Per ADR-0003, there are no scheduled jobs and no stored notifications — nothing to enable under Database → Cron or Edge Functions. Skip both.

## 5. Hand back two values

**Settings → API**:

- **Project URL** — `https://<project-ref>.supabase.co`
- **anon public** key

Both are safe to share with me: the anon key is designed to be shipped in a browser, and RLS is what actually protects the data.

**Do not send the `service_role` key.** It bypasses RLS entirely. The app never needs it, and I will never ask for it.

---

## Then what

I build the SvelteKit app against the real database — every screen from the reviewed prototype
([`docs/prototype/`](./prototype/)), in the warm paper palette (ADR-0009), Bahasa Indonesia throughout.

First thing to verify once it runs, before any feature work: create a second account in a second household and confirm every table returns zero rows across the boundary. The previous project listed that check in its definition of done and never ran it.
