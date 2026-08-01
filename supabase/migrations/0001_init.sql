-- Pencatatan Keuangan — initial schema
--
-- Principles enforced here (see docs/adr/):
--   0003  derive, don't store — balances, debt remainders and budget progress are
--         views over transactions. There are no stored totals and no triggers.
--   0004  one transactions table — income, expense, transfer and debt movements are
--         all rows in `transactions`. A row exists iff money crossed a wallet boundary.
--   0005  no roles — membership is the only access control.
--   0007  money is BIGINT whole rupiah. No decimals, no currency column.
--   0008  archive, never destroy — `archived_at` on wallets and categories.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- enums

create type transaction_type as enum ('income', 'expense', 'transfer');
create type category_kind    as enum ('income', 'expense');
create type wallet_type      as enum ('cash', 'bank', 'ewallet', 'savings');
create type debt_direction   as enum ('payable', 'receivable');
create type debt_role        as enum ('origination', 'repayment');

-- ---------------------------------------------------------------- identity

create table profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

create table households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text not null unique,
  created_by  uuid not null references profiles (id),
  created_at  timestamptz not null default now()
);

create table household_members (
  household_id uuid not null references households (id) on delete cascade,
  user_id      uuid not null references profiles (id)   on delete cascade,
  joined_at    timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index on household_members (user_id);

-- ---------------------------------------------------------------- ledger

create table wallets (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households (id) on delete cascade,
  name            text not null,
  tag             text,                       -- short code shown in lists, e.g. 'BCA'
  type            wallet_type not null default 'cash',
  initial_balance bigint not null default 0,  -- the ONLY balance figure ever stored
  archived_at     timestamptz,
  created_by      uuid not null references profiles (id),
  created_at      timestamptz not null default now()
);

create index on wallets (household_id) where archived_at is null;

create table categories (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name         text not null,
  kind         category_kind not null,
  archived_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index on categories (household_id, kind) where archived_at is null;

create table debts (
  id               uuid primary key default gen_random_uuid(),
  household_id     uuid not null references households (id) on delete cascade,
  direction        debt_direction not null,
  party_name       text not null,
  principal_amount bigint not null check (principal_amount > 0),
  due_date         date,
  description      text,
  created_by       uuid not null references profiles (id),
  created_at       timestamptz not null default now()
);

create index on debts (household_id);

create table transactions (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  type         transaction_type not null,
  amount       bigint not null check (amount > 0),

  wallet_id    uuid not null references wallets (id),  -- target for income, source otherwise
  to_wallet_id uuid references wallets (id),           -- transfers only
  category_id  uuid references categories (id),
  debt_id      uuid references debts (id),
  role         debt_role,

  occurred_on  date not null,
  note         text,
  created_by   uuid not null references profiles (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- A transfer moves money between two distinct wallets and is never categorised.
  constraint transfer_shape check (
    (type = 'transfer' and to_wallet_id is not null and to_wallet_id <> wallet_id and category_id is null)
    or
    (type <> 'transfer' and to_wallet_id is null)
  ),

  -- Every income/expense is explained by either a category or a debt link.
  -- Debt repayments deliberately carry no category — matching the prototype,
  -- where the category picker is hidden once a transaction is linked to a debt.
  constraint classified check (
    type = 'transfer' or category_id is not null or debt_id is not null
  ),

  -- role is meaningful only on debt-linked rows, and mandatory there.
  constraint debt_role_paired check ((debt_id is null) = (role is null))
);

create index on transactions (household_id, occurred_on desc);
create index on transactions (wallet_id);
create index on transactions (to_wallet_id) where to_wallet_id is not null;
create index on transactions (category_id)  where category_id  is not null;
create index on transactions (debt_id)      where debt_id      is not null;

create table budgets (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references households (id) on delete cascade,
  category_id    uuid not null references categories (id) on delete cascade,
  amount         bigint check (amount is null or amount > 0),  -- NULL = budget lifted
  effective_from date not null,
  created_at     timestamptz not null default now(),

  -- Always the first of a month, so "the budget in force" is unambiguous.
  constraint effective_from_is_month_start check (date_trunc('month', effective_from) = effective_from),
  unique (household_id, category_id, effective_from)
);

create index on budgets (household_id, category_id, effective_from desc);

-- ---------------------------------------------------------------- derived views
-- These replace the previous design's five balance triggers and four cron jobs.
-- security_invoker makes them respect the querying user's RLS.

create view wallet_balances with (security_invoker = true) as
select
  w.id           as wallet_id,
  w.household_id,
  w.initial_balance
    + coalesce(inc.total, 0)
    - coalesce(exp.total, 0)
    + coalesce(tin.total, 0)
    - coalesce(tout.total, 0) as balance
from wallets w
left join lateral (select sum(t.amount) total from transactions t
                   where t.wallet_id = w.id and t.type = 'income')   inc  on true
left join lateral (select sum(t.amount) total from transactions t
                   where t.wallet_id = w.id and t.type = 'expense')  exp  on true
left join lateral (select sum(t.amount) total from transactions t
                   where t.to_wallet_id = w.id and t.type = 'transfer') tin on true
left join lateral (select sum(t.amount) total from transactions t
                   where t.wallet_id = w.id and t.type = 'transfer') tout on true;

create view debt_status with (security_invoker = true) as
select
  d.*,
  coalesce(p.total, 0)                          as paid_amount,
  d.principal_amount - coalesce(p.total, 0)     as remaining_amount,
  case
    when d.principal_amount - coalesce(p.total, 0) <= 0        then 'settled'
    when d.due_date is not null and d.due_date < current_date  then 'overdue'
    else 'active'
  end                                           as status,
  case when d.due_date is null then null
       else d.due_date - current_date end       as days_until_due
from debts d
left join lateral (
  select sum(t.amount) total from transactions t
  where t.debt_id = d.id and t.role = 'repayment'
) p on true;

-- Budget in force for a month = the row with the greatest effective_from <= that month.
create function budget_progress(p_household uuid, p_month date)
returns table (
  category_id   uuid,
  category_name text,
  amount        bigint,
  spent         bigint,
  pct           int
)
language sql
stable
as $$
  with month_start as (select date_trunc('month', p_month)::date as d)
  select
    c.id,
    c.name,
    b.amount,
    coalesce(s.total, 0)::bigint,
    case when b.amount is null or b.amount = 0 then null
         else round(coalesce(s.total, 0) * 100.0 / b.amount)::int end
  from categories c
  cross join month_start ms
  join lateral (
    select bu.amount from budgets bu
    where bu.category_id = c.id and bu.effective_from <= ms.d
    order by bu.effective_from desc
    limit 1
  ) b on true
  left join lateral (
    select sum(t.amount) total from transactions t
    where t.category_id = c.id
      and t.type = 'expense'
      and date_trunc('month', t.occurred_on)::date = ms.d
  ) s on true
  where c.household_id = p_household
    and b.amount is not null;
$$;

-- ---------------------------------------------------------------- RLS
-- SECURITY DEFINER breaks what would otherwise be infinite recursion:
-- a policy on household_members that itself queries household_members.

create function is_household_member(hid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

alter table profiles          enable row level security;
alter table households        enable row level security;
alter table household_members enable row level security;
alter table wallets           enable row level security;
alter table categories        enable row level security;
alter table transactions      enable row level security;
alter table budgets           enable row level security;
alter table debts             enable row level security;

-- Own profile, plus the profiles of people you share a household with.
create policy profiles_read on profiles for select using (
  id = auth.uid()
  or exists (
    select 1 from household_members m
    where m.user_id = profiles.id and is_household_member(m.household_id)
  )
);
create policy profiles_write on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_insert on profiles for insert with check (id = auth.uid());

create policy households_read   on households for select using (is_household_member(id));
create policy households_insert on households for insert with check (created_by = auth.uid());
create policy households_update on households for update using (is_household_member(id));

create policy members_read  on household_members for select using (is_household_member(household_id));
-- Joining is done through join_household() below; this covers creating your own.
create policy members_join  on household_members for insert with check (user_id = auth.uid());
create policy members_leave on household_members for delete using (is_household_member(household_id));

-- Every ledger table gets the identical shape: no role predicates anywhere (ADR-0005).
create policy wallets_all      on wallets      for all using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy categories_all   on categories   for all using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy transactions_all on transactions for all using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy budgets_all      on budgets      for all using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy debts_all        on debts        for all using (is_household_member(household_id)) with check (is_household_member(household_id));

-- ---------------------------------------------------------------- onboarding

-- Mirror auth.users into profiles on signup.
create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Invite codes look like RUMAH-4K7Q. Ambiguous characters (I, O, 0, 1) are excluded.
create function generate_invite_code()
returns text
language plpgsql
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := 'RUMAH-' || (
      select string_agg(substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1), '')
      from generate_series(1, 4)
    );
    exit when not exists (select 1 from households where invite_code = code);
  end loop;
  return code;
end;
$$;

-- Creating a household seeds the default categories from the prototype.
create function create_household(p_name text)
returns households
language plpgsql
security definer
set search_path = public
as $$
declare
  h households;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into households (name, invite_code, created_by)
  values (p_name, generate_invite_code(), auth.uid())
  returning * into h;

  insert into household_members (household_id, user_id) values (h.id, auth.uid());

  insert into categories (household_id, name, kind) values
    (h.id, 'Gaji',         'income'),
    (h.id, 'Bonus',        'income'),
    (h.id, 'Makan',        'expense'),
    (h.id, 'Transportasi', 'expense'),
    (h.id, 'Belanja',      'expense'),
    (h.id, 'Tagihan',      'expense'),
    (h.id, 'Kesehatan',    'expense'),
    (h.id, 'Lain-lain',    'expense');

  return h;
end;
$$;

-- Joining by code must bypass RLS: you cannot yet read the household you are joining.
create function join_household(p_code text)
returns households
language plpgsql
security definer
set search_path = public
as $$
declare
  h households;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into h from households where upper(invite_code) = upper(trim(p_code));
  if not found then
    raise exception 'Kode undangan tidak ditemukan';
  end if;

  insert into household_members (household_id, user_id)
  values (h.id, auth.uid())
  on conflict do nothing;

  return h;
end;
$$;

create function regenerate_invite_code(p_household uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
begin
  if not is_household_member(p_household) then
    raise exception 'not a member';
  end if;
  code := generate_invite_code();
  update households set invite_code = code where id = p_household;
  return code;
end;
$$;
