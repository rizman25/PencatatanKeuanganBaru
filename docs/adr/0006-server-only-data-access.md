# Server-only data access

All Supabase access happens on the server. Every read is a `+page.server.ts` `load` function; every write is a form action. The browser never holds a Supabase client. RLS is still enforced, as defence in depth rather than as the only guard.

There is deliberately exactly one way to read and one way to write. If a feature seems to need a client-side Supabase call, that is a signal to reconsider the feature, not to open a second path. The previous design specified three concurrent mutation paths — Server Actions, REST route handlers, and direct Supabase calls from Server Components — and never wrote down a rule for choosing between them.

The alternative of a browser-side `supabase-js` with RLS as the entire security model was rejected: it would make one wrong policy the difference between private and public household finances, and would put business rules somewhere they can be bypassed.

## Consequences

Forms work as plain HTML posts and progressively enhance. Business rules cannot be bypassed from the browser.

The price is that **realtime is out of scope**: a server-side client cannot hold a subscription, so when one member records a transaction the other sees it on their next page load, not live. Every mutation is also a round trip. Both are acceptable for a household app, and they are what keeps there being exactly one way to do things.
