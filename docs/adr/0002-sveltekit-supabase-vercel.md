# SvelteKit + Supabase + Vercel

The app is a SvelteKit application backed by Supabase (Postgres, Auth, RLS) and deployed to Vercel, with the database in `ap-southeast-1`. This supersedes the previous project's ADR-001 and ADR-003, which chose Next.js 14 App Router on the same Supabase foundation.

Supabase is kept for the same reasons it was chosen before — Postgres with row-level security, managed auth, and no operations burden for a two-person app. SvelteKit replaces Next.js because its `load`/form-action model gives us one obvious way to read and one obvious way to write, where the Next.js design ended up specifying three competing paths (Server Actions, REST route handlers, and direct Supabase calls from Server Components) with no rule for choosing between them.

## Consequences

Supabase carries real vendor lock-in, accepted knowingly: it is standard PostgreSQL underneath, so the data can move to self-hosted Postgres if it ever must. The React component ecosystem is unavailable, which is why the design system's shadcn/ui components are replaced by shadcn-svelte — the design *tokens* port unchanged.

React-only tooling is out of reach as a result. Claude Design (claude.ai/design) is one concrete example: it renders React components, so a Svelte component library cannot be synced to it. Evaluated and accepted in July 2026. Claude Design is still used as a *prototyping* surface — the reviewed wireframe prototype is the design reference (see ADR-0009) — but the prototype is reimplemented in Svelte rather than synced as components.
