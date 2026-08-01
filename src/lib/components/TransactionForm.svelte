<script lang="ts">
  import { enhance } from '$app/forms';
  import MoneyInput from '$lib/components/MoneyInput.svelte';
  import type { Category, DebtStatus, WalletWithBalance } from '$lib/types';

  interface Props {
    wallets: WalletWithBalance[];
    categories: Category[];
    debt?: DebtStatus | null;
    tx?: {
      id: string;
      type: string;
      amount: number;
      wallet_id: string;
      to_wallet_id: string | null;
      category_id: string | null;
      debt_id: string | null;
      occurred_on: string;
      note: string | null;
    } | null;
    today: string;
    form?: { message?: string } | null;
  }

  let { wallets, categories, debt = null, tx = null, today, form = null }: Props = $props();

  const isEditing = !!tx;

  let type = $state(tx?.type ?? (debt ? (debt.direction === 'payable' ? 'expense' : 'income') : 'expense'));
  let walletId = $state(tx?.wallet_id ?? wallets[0]?.id ?? '');
  let toWalletId = $state(tx?.to_wallet_id ?? wallets[1]?.id ?? wallets[0]?.id ?? '');
  let categoryId = $state(tx?.category_id ?? '');
  let busy = $state(false);

  const debtId = tx?.debt_id ?? debt?.id ?? null;
  const isTransfer = $derived(type === 'transfer');
  // The category picker disappears once a debt is linked — the prototype's rule,
  // and what the schema's `classified` constraint allows.
  const showCategory = $derived(!isTransfer && !debtId);
  const choices = $derived(categories.filter((c) => c.kind === (type === 'income' ? 'income' : 'expense')));

  const TYPES = [
    ['income', 'Pemasukan'],
    ['expense', 'Pengeluaran'],
    ['transfer', 'Transfer']
  ] as const;
</script>

<form
  method="POST"
  action="?/simpan"
  use:enhance={() => {
    busy = true;
    return async ({ update }) => {
      await update();
      busy = false;
    };
  }}
>
  <input type="hidden" name="type" value={type} />
  {#if debtId}<input type="hidden" name="debt_id" value={debtId} />{/if}

  {#if form?.message}<div class="error" style="margin-bottom:16px">{form.message}</div>{/if}

  {#if !debtId}
    <div class="toggle">
      {#each TYPES as [key, label]}
        <button
          type="button"
          class="tbtn"
          class:on={type === key}
          onclick={() => {
            type = key;
            categoryId = '';
          }}>{label}</button
        >
      {/each}
    </div>
  {/if}

  <div class="label">Jumlah</div>
  <MoneyInput name="amount" value={tx?.amount ?? 0} label="Jumlah" big />

  <div class="label mt">{isTransfer ? 'Dari Dompet' : 'Dompet'}</div>
  <input type="hidden" name="wallet_id" value={walletId} />
  <div class="chips">
    {#each wallets as w}
      <button type="button" class="chip" class:on={walletId === w.id} onclick={() => (walletId = w.id)}>
        {w.name}
      </button>
    {/each}
  </div>

  {#if isTransfer}
    <div class="label mt">Ke Dompet</div>
    <input type="hidden" name="to_wallet_id" value={toWalletId} />
    <div class="chips">
      {#each wallets as w}
        <button
          type="button"
          class="chip"
          class:on={toWalletId === w.id}
          disabled={w.id === walletId}
          onclick={() => (toWalletId = w.id)}
        >
          {w.name}
        </button>
      {/each}
    </div>
  {/if}

  {#if showCategory}
    <div class="label mt">Kategori</div>
    <input type="hidden" name="category_id" value={categoryId} />
    <div class="chips">
      {#each choices as c}
        <button type="button" class="chip" class:on={categoryId === c.id} onclick={() => (categoryId = c.id)}>
          {c.name}
        </button>
      {/each}
    </div>
    {#if !choices.length}
      <p class="hint">Belum ada kategori {type === 'income' ? 'pemasukan' : 'pengeluaran'}. <a href="/kelola">Tambah dulu</a>.</p>
    {/if}
  {/if}

  {#if debt}
    <div class="debt-banner">
      <span class="badge">CICILAN</span>
      <span>Terkait: {debt.party_name}</span>
    </div>
  {/if}

  <div class="label mt">Tanggal</div>
  <input class="field" type="date" name="occurred_on" value={tx?.occurred_on ?? today} />

  <div class="label mt">Catatan</div>
  <input class="field" name="note" value={tx?.note ?? ''} placeholder="opsional" />

  <button class="btn-primary" style="margin-top:22px" disabled={busy}>
    {isEditing ? 'Simpan Perubahan' : 'Simpan'}
  </button>
</form>

{#if isEditing}
  <form method="POST" action="?/hapus" use:enhance style="margin-top:10px">
    <button class="btn-danger">Hapus Transaksi</button>
  </form>
{/if}

<style>
  .toggle {
    display: flex;
    gap: 6px;
    margin-bottom: 18px;
  }
  .tbtn {
    flex: 1;
    text-align: center;
    padding: 11px;
    border-radius: var(--r-chip);
    font-size: 13px;
    font-weight: 700;
    border: 1.5px solid var(--line);
    background: var(--card);
    color: #7a756c;
  }
  .tbtn.on {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--ink-on-dark);
  }

  .label {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 6px;
  }
  .label.mt {
    margin-top: 16px;
  }

  .chips {
    display: flex;
    gap: 7px;
    flex-wrap: wrap;
  }
  .chip {
    padding: 9px 13px;
    border-radius: var(--r-chip);
    font-size: 13px;
    font-weight: 600;
    border: 1.5px solid var(--line);
    background: var(--card);
    color: var(--text-heading);
  }
  .chip.on {
    border-color: var(--accent);
    background: var(--accent-soft-bg);
    color: var(--accent);
  }
  .chip:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .debt-banner {
    display: flex;
    align-items: center;
    gap: 9px;
    background: var(--accent-soft-bg);
    border: 1.5px solid var(--accent-soft-line);
    border-radius: 11px;
    padding: 11px 13px;
    margin-top: 16px;
    font-size: 13px;
    color: var(--accent-deep);
  }
  .badge {
    font-size: 10px;
    font-weight: 700;
    color: var(--accent);
    border: 1px solid var(--accent-soft-line);
    border-radius: 5px;
    padding: 2px 6px;
  }

  .hint {
    font-size: 12.5px;
    color: var(--text-muted);
    margin: 8px 0 0;
  }
</style>
