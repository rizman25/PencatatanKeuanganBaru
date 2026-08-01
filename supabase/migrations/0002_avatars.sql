-- Spec 0004 — profile photos.
--
-- The first migration since 0001_init.sql, and the first use of Supabase
-- Storage anywhere in this project. Nothing here touches the ledger: no table
-- is added, altered, or dropped. `profiles.avatar_url` has existed since the
-- first migration and has never been read — this gives it a purpose.

-- Private. A household photo is not a public URL, so every read goes through a
-- signed URL minted server-side against the policy below.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

-- Objects are keyed `<user-id>/<random>.jpg`. The first path segment being the
-- owner is what makes both predicates below expressible without a lookup table,
-- and the random second segment is what stops an object path being guessable
-- from a user id.

/**
 * Deliberately the same shape as `profiles_read`: your own photo, plus the
 * photos of people you share a Household with. Reusing `is_household_member`
 * keeps one definition of "shares a Household with me" rather than a second one
 * that can drift away from the first.
 */
create policy avatars_read on storage.objects for select using (
  bucket_id = 'avatars'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from public.household_members m
      where m.user_id::text = (storage.foldername(name))[1]
        and public.is_household_member(m.household_id)
    )
  )
);

-- Writes never leave your own folder, whatever the client sends.
create policy avatars_insert on storage.objects for insert with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);

create policy avatars_update on storage.objects for update using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);

/**
 * Delete is granted, which is a deliberate carve-out from ADR-0008 (archive,
 * never destroy). ADR-0008 protects history — rows that past Transactions point
 * at. A superseded avatar has none: nothing references a previous photo, no
 * report renders one, and keeping every version would grow the bucket without
 * anything ever reading it. Deletion here destroys nothing anyone can reach.
 */
create policy avatars_delete on storage.objects for delete using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);
