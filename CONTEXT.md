# Pencatatan Keuangan

Shared household bookkeeping for one family. Code and schema are written in English; every user-facing string is in Bahasa Indonesia.

## Language

### Household

**Household** (UI: Rumah Tangga):
One family's shared set of books. The boundary of all data access — nothing is visible across Households.
_Avoid_: tenant, family, group, account

**Member** (UI: Anggota):
A person with a login who belongs to the Household. All Members have identical rights.
_Avoid_: user (reserve that for the auth identity), admin, role

**Invite Code** (UI: Kode Undangan):
The short code that lets a person join a Household. The only way to become a Member.

### Money movement

**Wallet** (UI: Dompet):
A place money sits — cash, a bank account, an e-wallet.
_Avoid_: account, rekening (a rekening is one *kind* of Wallet)

**Transaction** (UI: Transaksi):
A single movement of money into, out of, or between Wallets. Always exactly one row, whatever its kind.
_Avoid_: entry, record, catatan

**Income** (UI: Pemasukan):
A Transaction bringing money into a Wallet from outside the Household.

**Expense** (UI: Pengeluaran):
A Transaction taking money out of a Wallet to outside the Household.

**Transfer**:
A Transaction moving money between two Wallets. Total assets are unchanged, so it is never counted as Income or Expense.

**Category** (UI: Kategori):
The classification of an Income or Expense. Transfers have none.

### Balances

**Initial Balance** (UI: Saldo Awal):
A Wallet's balance on the day it was added. The only balance figure ever stored.

**Balance** (UI: Saldo):
Initial Balance plus every Transaction touching the Wallet. Always computed, never stored.

### Planning and obligations

**Budget** (UI: Anggaran):
A standing monthly spending limit for one Category, in force from a given month until changed.

**Debt** (UI: Hutang/Piutang):
Money owed by the Household (*payable*, "Hutang") or owed to it (*receivable*, "Piutang").
_Avoid_: loan, pinjaman

**Origination**:
The moment a Debt comes into existence. It produces a Transaction only if money actually crossed a Wallet boundary.

**Repayment** (UI: Cicilan):
A Transaction that settles part of a Debt.

### Lifecycle

**Archive** (UI: Arsip):
Retiring a Wallet or Category from use while leaving all history intact. Nothing with history is ever deleted.
