# Reset scope from SaaS product to a single household

A previous attempt at this app ("Maalify") was specified as a multi-tenant SaaS for a thousand families, with freemium billing, subscription plans, invite-by-email onboarding, and a scaling plan to 10.000+ tenants. It produced five complete design documents and no working software — every document is still marked `Status: Draft` and all twelve of its own MVP definition-of-done items are unchecked. We are therefore rebuilding for exactly one household: our own. There are no subscriptions, no plan quotas, no monetization, and no tenant-scaling design.

## Consequences

The `subscriptions` table, the freemium member limit, and the entire billing story are gone. `household_id` still exists and is still the access boundary, because two people genuinely share the books — but it is a family boundary, not a commercial one. If this ever becomes a product, that is a new project with a new decision, not a switch we have left flipped.
