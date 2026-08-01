<script lang="ts">
  import { enhance } from '$app/forms';
  import { rp } from '$lib/format';
  import MoneyInput from '$lib/components/MoneyInput.svelte';
  import { DEBT_FILTERS, DEFAULT_FILTER, debtCounts, filterDebts, type DebtFilter } from '$lib/debts';
  let { data, form } = $props();

  let adding = $state(false);
  let moneyMoved = $state(false);
  let query = $state('');
  let status = $state<DebtFilter>(DEFAULT_FILTER);

  const isHutang = $derived(data.seg === 'hutang');
  const shown = $derived(filterDebts(data.rows, status, query));
  const counts = $derived(debtCounts(data.rows, query));
</script>

<svelte:head><title>Hutang &amp; Piutang · Maalify</title></svelte:head>

<div class="page">
  <!-- Search takes the title's place; the tab already says where you are. -->
  <div class="search">
    <span class="glass" aria-hidden="true">⌕</span>
    <input
      class="search-field"
      type="search"
      bind:value={query}
      placeholder="Cari nama"
      aria-label="Cari hutang atau piutang berdasarkan nama"
    />
    {#if query.trim()}
      <button class="clear" onclick={() => (query = '')} aria-label="Hapus pencarian">✕</button>
    {/if}
  </div>

  <div class="seg">
    <a href="?seg=hutang" class:on={isHutang}>Hutang</a>
    <a href="?seg=piutang" class:on={!isHutang}>Piutang</a>
  </div>

  <div class="chips noscroll">
    {#each DEBT_FILTERS as f}
      <button class="chip" class:on={status === f.key} onclick={() => (status = f.key)}>
        {f.label}
        <span class="count">{counts[f.key]}</span>
      </button>
    {/each}
  </div>

  <p class="intro">{data.intro}</p>

  {#if form?.message}<div class="error" style="margin-bottom:14px">{form.message}</div>{/if}

  {#each shown as d}
    <!--
      Settled Debts link to the same place as active ones. They used to point
      back at this page, which went nowhere; the payment history is the reason
      to open a Lunas row at all.
    -->
    <a class="card" href="/catat?hutang={d.id}">
      <div class="top">
        <div>
          <div class="name">{d.name}</div>
          <div class="principal num">Pokok {rp(d.principal)}</div>
        </div>
        <span class="status {d.statusTone}">{d.statusLabel}</span>
      </div>
      <div class="track"><div class="fill" style="width:{d.paidWidth}%"></div></div>
      <div class="foot">
        <span>Sisa <b class="num">{rp(d.remaining)}</b></span>
        <span>{d.dueLabel}</span>
      </div>
    </a>
  {:else}
    <p class="empty">
      {#if query.trim()}
        Tidak ada nama yang cocok dengan “{query}”.
      {:else if status === 'lunas'}
        Belum ada yang lunas.
      {:else if status === 'terlambat'}
        Tidak ada yang terlambat. Bagus.
      {:else}
        Belum ada {isHutang ? 'hutang' : 'piutang'} tercatat.
      {/if}
    </p>
  {/each}

  {#if adding}
    <form
      method="POST"
      action="?/tambah"
      use:enhance={() =>
        async ({ update, result }) => {
          await update();
          // Only close on success. Closing on a validation failure threw away
          // everything typed and left the error with nothing to correct.
          if (result.type === 'success') {
            adding = false;
            moneyMoved = false;
          }
        }}
      class="add"
    >
      <input type="hidden" name="direction" value={isHutang ? 'payable' : 'receivable'} />

      <div class="label">{isHutang ? 'Pinjam dari' : 'Dipinjam oleh'}</div>
      <input class="field" name="party_name" placeholder="mis. Adik" required />

      <div class="label mt">Jumlah Pokok</div>
      <MoneyInput name="principal_amount" label="Jumlah Pokok" required />

      <div class="label mt">Jatuh Tempo (opsional)</div>
      <input class="field" type="date" name="due_date" />

      <!--
        ADR-0004: only tick this when money actually moved. Borrowing cash did;
        buying a phone on credit did not, and inventing income there would
        corrupt the monthly report.
      -->
      <label class="check">
        <input type="checkbox" name="money_moved" bind:checked={moneyMoved} />
        <span>
          {isHutang ? 'Uang masuk ke dompet sekarang' : 'Uang keluar dari dompet sekarang'}
          <small>Kosongkan jika ini cicilan barang — tidak ada uang yang berpindah.</small>
        </span>
      </label>

      {#if moneyMoved}
        <div class="label mt">{isHutang ? 'Masuk ke Dompet' : 'Keluar dari Dompet'}</div>
        <select class="field" name="wallet_id">
          {#each data.wallets as w}<option value={w.id}>{w.name}</option>{/each}
        </select>
      {/if}

      <div class="actions">
        <button class="btn-primary">Simpan</button>
        <button type="button" class="btn-ghost" onclick={() => (adding = false)}>Batal</button>
      </div>
    </form>
  {:else}
    <button class="btn-dashed" onclick={() => (adding = true)}>
      ＋ Tambah {isHutang ? 'Hutang' : 'Piutang'}
    </button>
  {/if}
</div>

<style>
  .page {
    padding: 6px 18px 28px;
  }
  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--card);
    border: 1.5px solid var(--line);
    border-radius: var(--r-field);
    padding: 0 12px;
    margin: 8px 0 12px;
  }
  .glass {
    font-size: 22px;
    line-height: 1;
    color: var(--text-muted);
    flex: none;
  }
  .search-field {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: none;
    font: inherit;
    font-size: 14px;
    padding: 11px 0;
    color: var(--ink);
  }
  .search-field::-webkit-search-cancel-button {
    display: none;
  }
  .clear {
    flex: none;
    border: none;
    background: none;
    color: var(--text-dim);
    font-size: 14px;
    padding: 4px;
    line-height: 1;
  }
  .chips {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    margin-bottom: 14px;
  }
  .chip {
    flex: none;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    border-radius: 9px;
    font-size: 12.5px;
    font-weight: 700;
    border: 1.5px solid var(--line);
    background: var(--card);
    color: #7a756c;
  }
  .chip.on {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--ink-on-dark);
  }
  .count {
    font-size: 11px;
    font-weight: 700;
    opacity: 0.65;
  }
  .seg {
    display: flex;
    background: var(--sunken);
    border-radius: 11px;
    padding: 4px;
    margin-bottom: 16px;
  }
  .seg a {
    flex: 1;
    text-align: center;
    padding: 9px;
    border-radius: 8px;
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text-muted);
    text-decoration: none;
  }
  .seg a.on {
    background: var(--card);
    color: var(--ink);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  .intro {
    font-size: 12.5px;
    color: var(--text-muted);
    margin: 0 0 12px;
  }

  .card {
    display: block;
    background: var(--card);
    border: 1.5px solid var(--line);
    border-radius: var(--r-card);
    padding: 14px;
    margin-bottom: 11px;
    text-decoration: none;
    color: inherit;
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .name {
    font-size: 14.5px;
    font-weight: 700;
  }
  .principal {
    font-size: 11.5px;
    color: var(--text-dim);
    margin-top: 2px;
  }
  .status {
    font-size: 11px;
    font-weight: 700;
    border-radius: 6px;
    padding: 3px 8px;
    flex: none;
  }
  .status.ok {
    background: var(--ok-bg);
    color: var(--ok-text);
  }
  .status.late {
    background: var(--danger-bg);
    color: var(--danger-text);
  }
  .status.soon {
    background: var(--accent-soft-bg);
    color: var(--accent);
  }
  .status.idle {
    background: var(--sunken);
    color: #7a756c;
  }
  .track {
    height: 8px;
    background: var(--sunken);
    border-radius: 5px;
    margin: 11px 0 8px;
    overflow: hidden;
  }
  .fill {
    height: 100%;
    background: var(--text-muted);
    border-radius: 5px;
  }
  .foot {
    display: flex;
    justify-content: space-between;
    font-size: 12.5px;
    color: var(--text-muted);
  }
  .foot b {
    color: var(--ink);
  }

  .add {
    background: var(--card);
    border: 1.5px solid var(--line);
    border-radius: var(--r-card);
    padding: 14px;
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
    margin-top: 12px;
  }
  /* "Rp" as a fixed prefix, so the field itself only ever holds digits. */
  .check {
    display: flex;
    gap: 9px;
    align-items: flex-start;
    margin-top: 14px;
    font-size: 13.5px;
    cursor: pointer;
  }
  .check input {
    margin-top: 2px;
    accent-color: var(--accent);
  }
  .check small {
    display: block;
    font-size: 11.5px;
    color: var(--text-muted);
    margin-top: 2px;
  }
  .actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }
  .empty {
    font-size: 13.5px;
    color: var(--text-muted);
    margin: 4px 0 14px;
  }
</style>
