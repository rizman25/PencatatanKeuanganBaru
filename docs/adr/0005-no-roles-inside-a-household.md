# No roles inside a Household

Every Member of a Household has identical rights: anyone can add, edit, or delete any transaction, wallet, category, budget, or debt. `created_by` on each row records who entered it, for attribution only — never for permission. Membership itself is the only access control: non-members see nothing.

The previous design had *Kepala Keuangan (Admin)* and *Anggota Keluarga (Member)*, with a rule that "Member hanya dapat mengedit transaksi milik sendiri". Applied to a household of trusted adults sharing one pot of money, that rule means you cannot fix your spouse's typo — you have to ask them to. It is friction with no security benefit, and it puts a role predicate into every RLS policy and every screen.

## Consequences

RLS policies reduce to a single shape — "is `auth.uid()` a member of this row's household?" — and no screen branches on permission. Protection against accidents comes from confirmation dialogs and from never hard-deleting anything (see ADR-0006 on archiving), not from permissions.

The accepted risk: any member can remove any other member, or archive a wallet with years of history. In a household of trusted adults this is the correct trade. It would be the wrong trade if a child or a housemate ever needed limited access, and that is the signal that this decision needs revisiting.
