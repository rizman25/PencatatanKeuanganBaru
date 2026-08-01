-- Test data for manual verification. Paste into the Supabase SQL editor.
--
-- NOT part of the migration chain. Never run this against real books: it
-- DELETES every transaction, budget, debt and wallet in the household first,
-- so each run gives the same starting point.
--
-- It targets the most recently created household and attributes everything to
-- that household's creator. Run it after signing up and creating a household.
--
-- The data is chosen to exercise the cases the plan lists under Verification:
-- computed balances, transfers, budget history, both debt shapes, an archived
-- wallet with history, and every alert state.

do $$
declare
  hh    uuid;
  who   uuid;
  today date := current_date;
  m0    date := date_trunc('month', current_date)::date;          -- this month
  m1    date := (date_trunc('month', current_date) - interval '1 month')::date;
  m2    date := (date_trunc('month', current_date) - interval '2 month')::date;
  m3    date := (date_trunc('month', current_date) - interval '3 month')::date;

  w_tunai uuid; w_bca uuid; w_gopay uuid; w_tabungan uuid; w_lama uuid;
  c_gaji uuid; c_bonus uuid; c_makan uuid; c_transport uuid;
  c_belanja uuid; c_tagihan uuid; c_sehat uuid;
  d_adik uuid; d_hp uuid; d_budi uuid;
begin
  select id, created_by into hh, who
  from households order by created_at desc limit 1;

  if hh is null then
    raise exception 'No household found. Sign up and create one first.';
  end if;
  raise notice 'Seeding household %', hh;

  -- Clean slate, in dependency order.
  delete from transactions where household_id = hh;
  delete from budgets      where household_id = hh;
  delete from debts        where household_id = hh;
  delete from wallets      where household_id = hh;

  -- ---------------------------------------------------------------- wallets
  insert into wallets (household_id, name, tag, type, initial_balance, created_by)
  values (hh, 'Tunai',    'CASH', 'cash',      500000,   who) returning id into w_tunai;
  insert into wallets (household_id, name, tag, type, initial_balance, created_by)
  values (hh, 'BCA',      'BCA',  'bank',      5000000,  who) returning id into w_bca;
  insert into wallets (household_id, name, tag, type, initial_balance, created_by)
  values (hh, 'GoPay',    'GOPAY','ewallet',   250000,   who) returning id into w_gopay;
  insert into wallets (household_id, name, tag, type, initial_balance, created_by)
  values (hh, 'Tabungan', 'TAB',  'savings',   12000000, who) returning id into w_tabungan;

  -- Archived, but carrying history: it must vanish from pickers while its
  -- transactions still count toward past months.
  insert into wallets (household_id, name, tag, type, initial_balance, created_by, archived_at)
  values (hh, 'Dompet Lama', 'OLD', 'cash', 100000, who, now() - interval '10 days')
  returning id into w_lama;

  -- ------------------------------------------------------------- categories
  -- create_household() already seeded these; look them up rather than re-insert.
  select id into c_gaji      from categories where household_id = hh and name = 'Gaji';
  select id into c_bonus     from categories where household_id = hh and name = 'Bonus';
  select id into c_makan     from categories where household_id = hh and name = 'Makan';
  select id into c_transport from categories where household_id = hh and name = 'Transportasi';
  select id into c_belanja   from categories where household_id = hh and name = 'Belanja';
  select id into c_tagihan   from categories where household_id = hh and name = 'Tagihan';
  select id into c_sehat     from categories where household_id = hh and name = 'Kesehatan';

  -- ------------------------------------------------------------------ debts
  -- Cash borrowed: money really crossed a wallet boundary, so it gets an
  -- origination transaction (ADR-0004).
  insert into debts (household_id, direction, party_name, principal_amount, due_date, created_by)
  values (hh, 'payable', 'Adik', 5000000, today + 20, who) returning id into d_adik;

  -- Phone bought on credit: no money moved, so NO origination transaction.
  -- The monthly report must show no income from this.
  insert into debts (household_id, direction, party_name, principal_amount, due_date, created_by)
  values (hh, 'payable', 'Cicilan HP', 6000000, today - 3, who) returning id into d_hp;

  -- Lent out, already overdue.
  insert into debts (household_id, direction, party_name, principal_amount, due_date, created_by)
  values (hh, 'receivable', 'Budi', 1500000, today - 12, who) returning id into d_budi;

  -- ----------------------------------------------------------- transactions
  -- Three months back: salary, living costs.
  insert into transactions (household_id, type, amount, wallet_id, category_id, occurred_on, note, created_by) values
    (hh, 'income',  8500000, w_bca,   c_gaji,      m3 + 24, 'Gaji bulanan',    who),
    (hh, 'expense', 1450000, w_tunai, c_makan,     m3 + 10, null,              who),
    (hh, 'expense',  480000, w_gopay, c_transport, m3 + 12, null,              who),
    (hh, 'expense',  920000, w_bca,   c_tagihan,   m3 + 5,  'Listrik + air',   who),
    (hh, 'expense',  240000, w_lama,  c_belanja,   m3 + 18, 'Dompet lama',     who);

  insert into transactions (household_id, type, amount, wallet_id, category_id, occurred_on, note, created_by) values
    (hh, 'income',  8500000, w_bca,   c_gaji,      m2 + 24, 'Gaji bulanan',    who),
    (hh, 'income',  2000000, w_bca,   c_bonus,     m2 + 26, 'Bonus proyek',    who),
    (hh, 'expense', 1680000, w_tunai, c_makan,     m2 + 8,  null,              who),
    (hh, 'expense',  510000, w_gopay, c_transport, m2 + 15, null,              who),
    (hh, 'expense',  875000, w_bca,   c_belanja,   m2 + 20, null,              who);

  insert into transactions (household_id, type, amount, wallet_id, category_id, occurred_on, note, created_by) values
    (hh, 'income',  8500000, w_bca,   c_gaji,      m1 + 24, 'Gaji bulanan',    who),
    (hh, 'expense', 1520000, w_tunai, c_makan,     m1 + 9,  null,              who),
    (hh, 'expense',  620000, w_gopay, c_transport, m1 + 14, null,              who),
    (hh, 'expense',  310000, w_bca,   c_sehat,     m1 + 21, 'Obat',            who),
    (hh, 'expense',  940000, w_bca,   c_tagihan,   m1 + 4,  null,              who);

  -- This month. Makan deliberately blows past its budget; Transportasi lands
  -- in the 80-100% amber band.
  insert into transactions (household_id, type, amount, wallet_id, category_id, occurred_on, note, created_by) values
    (hh, 'income',  8500000, w_bca,   c_gaji,      least(m0 + 24, today), 'Gaji bulanan', who),
    (hh, 'expense', 1850000, w_tunai, c_makan,     today - 1, 'Belanja mingguan', who),
    (hh, 'expense',  145000, w_gopay, c_makan,     today,     'Makan siang',      who),
    (hh, 'expense',  430000, w_gopay, c_transport, today - 2, 'Bensin',           who),
    (hh, 'expense',  285000, w_bca,   c_belanja,   today - 4, null,               who),
    (hh, 'expense',  680000, w_bca,   c_tagihan,   today - 6, 'Internet',         who);

  -- Transfer: total assets must be unchanged by it.
  insert into transactions (household_id, type, amount, wallet_id, to_wallet_id, occurred_on, note, created_by)
  values (hh, 'transfer', 2000000, w_bca, w_tabungan, today - 3, 'Sisihkan tabungan', who);

  insert into transactions (household_id, type, amount, wallet_id, to_wallet_id, occurred_on, note, created_by)
  values (hh, 'transfer', 300000, w_bca, w_tunai, today - 5, 'Tarik tunai', who);

  -- Debt movements. Borrowing cash from Adik brought money in; repayments go out.
  insert into transactions (household_id, type, amount, wallet_id, debt_id, role, occurred_on, note, created_by) values
    (hh, 'income',  5000000, w_bca,   d_adik, 'origination', m2 + 2,    'Pinjam dari Adik', who),
    (hh, 'expense', 1000000, w_bca,   d_adik, 'repayment',   m1 + 2,    'Cicilan 1',        who),
    (hh, 'expense', 1000000, w_bca,   d_adik, 'repayment',   today - 8, 'Cicilan 2',        who);

  -- The phone: repayments only. There is no origination row by design.
  insert into transactions (household_id, type, amount, wallet_id, debt_id, role, occurred_on, note, created_by) values
    (hh, 'expense', 500000, w_bca, d_hp, 'repayment', m1 + 6,     'Cicilan HP', who),
    (hh, 'expense', 500000, w_bca, d_hp, 'repayment', today - 10, 'Cicilan HP', who);

  -- Lending Budi money took cash out; he has paid part of it back.
  insert into transactions (household_id, type, amount, wallet_id, debt_id, role, occurred_on, note, created_by) values
    (hh, 'expense', 1500000, w_tunai, d_budi, 'origination', m2 + 11, 'Pinjamkan ke Budi', who),
    (hh, 'income',   500000, w_tunai, d_budi, 'repayment',   m1 + 11, 'Budi bayar',        who);

  -- ---------------------------------------------------------------- budgets
  -- An old limit and a newer one for the same category: past months must still
  -- report against the amount that was actually in force.
  insert into budgets (household_id, category_id, amount, effective_from) values
    (hh, c_makan,     1200000, m3),
    (hh, c_makan,     1500000, m0),
    (hh, c_transport,  500000, m3),
    (hh, c_belanja,   1000000, m0),
    (hh, c_tagihan,    900000, m0);

  raise notice 'Done. Wallets, 4 months of transactions, 3 debts, 5 budget rows.';
end $$;
