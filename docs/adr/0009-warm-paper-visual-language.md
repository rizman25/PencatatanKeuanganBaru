# Warm paper visual language, superseding Calm Clarity

The app's visual language is the warm paper palette from the reviewed Claude Design prototype: paper backgrounds (`#e9e5df` page, `#fbfaf8` surface), near-black ink (`#2b2b2b`), a terracotta accent (`#a86b3c`) for the record-transaction action and for attention states, and Nunito throughout with `font-variant-numeric: tabular-nums` on every figure. This supersedes the "Calm Clarity" system (Deep Ocean Navy, Growth Green, Inter + JetBrains Mono) inherited from the previous project's `DESIGN.md` and built out in Figma.

The deciding factor was not aesthetics but evidence: the warm palette exists as a clickable prototype whose whole flow was reviewed end to end, while Calm Clarity was never reviewed as a working app — only as tokens and two static frames. A design you have used beats a design you have only looked at.

## Consequences

The Figma file (`gZ9K8ugxl0yqNA98luIgmE`) is retired as the design reference. Its tokens, components, and two screens are superseded, and the third screen will not be built. Its cost is already sunk; leaving it in place as a rival source of truth would be worse than abandoning it.

Two things from Calm Clarity survive on their merits, because the prototype independently arrived at them: money figures are tabular so digits align in columns, and routine expenses are rendered in plain ink rather than red — terracotta is reserved for things genuinely needing attention (budget over 80%, debts near or past due).

Dark mode is not part of the prototype and is out of scope. The earlier plan to carry `DESIGN.md`'s dark token pairs into CSS lapses with the palette they belonged to.
