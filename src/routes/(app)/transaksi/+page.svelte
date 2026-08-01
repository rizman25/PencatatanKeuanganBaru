<script lang="ts">
  import MonthStepper from '$lib/components/MonthStepper.svelte';
  import { groupByDay, searchRows } from '$lib/rows';
  let { data } = $props();

  const FILTERS = [
    ['semua', 'Semua'],
    ['pemasukan', 'Pemasukan'],
    ['pengeluaran', 'Pengeluaran'],
    ['transfer', 'Transfer']
  ] as const;

  /**
   * Search stays inside the selected month, so the whole result set is already
   * on the client — filtering is instant and needs no round trip or debounce.
   */
  let query = $state('');

  const found = $derived(searchRows(data.rows, query));
  // Regrouped after filtering, so a day header never appears with no rows.
  const groups = $derived(groupByDay(found, data.today));
  const searching = $derived(query.trim().length > 0);

  /**
   * Three narrowings now share this screen — month, type, Dompet — plus search.
   * Every control rebuilds the whole query string from the current state, so no
   * control can silently drop another's parameter.
   */
  function link(over: { f?: string | null; w?: string | null } = {}) {
    const p = new URLSearchParams();
    const f = 'f' in over ? over.f : data.filter;
    const w = 'w' in over ? over.w : (data.wallet?.id ?? null);

    if (f && f !== 'semua') p.set('f', f);
    if (!data.month.isCurrent) p.set('m', data.month.key);
    if (w) p.set('w', w);

    const q = p.toString();
    return q ? `?${q}` : '/transaksi';
  }

  // The month stepper must not drop the type or Dompet filter when it steps.
  const extra = $derived({
    f: data.filter === 'semua' ? null : data.filter,
    w: data.wallet?.id ?? null
  });
</script>

<svelte:head><title>Transaksi · Maalify</title></svelte:head>

<div class="page">
  <!-- The title said "Transaksi" on the Transaksi tab. The search field earns the space. -->
  <div class="search">
    <span class="glass" aria-hidden="true">⌕</span>
    <input
      class="search-field"
      type="search"
      bind:value={query}
      placeholder="Cari di {data.month.label}"
      aria-label="Cari transaksi di {data.month.label}"
    />
    {#if searching}
      <button class="clear" onclick={() => (query = '')} aria-label="Hapus pencarian">✕</button>
    {/if}
  </div>

  <MonthStepper month={data.month} path="/transaksi" {extra} />

  <div class="filters noscroll">
    {#each FILTERS as [key, label]}
      <a href={link({ f: key })} class="chip" class:on={data.filter === key}>{label}</a>
    {/each}
  </div>

  {#if data.wallet}
    <!--
      Arrived at from the Kelola chart rather than set here, so it announces
      itself: a short list is explained instead of looking broken.
    -->
    <div class="scope">
      <span class="scope-text">Dompet · <b>{data.wallet.name}</b></span>
      <a class="scope-clear" href={link({ w: null })} aria-label="Hapus filter dompet">✕</a>
    </div>
  {/if}

  {#if groups.length}
    {#each groups as g}
      <div class="group">
        <div class="day">{g.dateLabel}</div>
        <div class="panel">
          {#each g.items as tx}
            <a class="row" href="/catat/{tx.id}">
              <span class="tile">{tx.sign}</span>
              <span class="row-body">
                <span class="row-title">
                  <span class="ellipsis">{tx.title}</span>
                  {#if tx.isCicilan}<span class="badge">CICILAN</span>{/if}
                </span>
                <span class="row-sub">{tx.sub}</span>
              </span>
              <span class="num row-amt">{tx.signAmount}</span>
            </a>
          {/each}
        </div>
      </div>
    {/each}
  {:else if searching}
    <!-- Distinct from an empty month: the query ran, and found nothing. -->
    <div class="empty">
      <p>Tidak ada yang cocok dengan “{query}” di {data.month.label}.</p>
      <button class="btn-dashed" onclick={() => (query = '')}>Hapus pencarian</button>
    </div>
  {:else}
    <div class="empty">
      <p>
        {#if data.wallet}
          Belum ada transaksi {data.wallet.name} di {data.month.label}{data.filter !== 'semua'
            ? ' untuk filter ini'
            : ''}.
        {:else}
          Belum ada transaksi di {data.month.label}{data.filter !== 'semua'
            ? ' untuk filter ini'
            : ''}.
        {/if}
      </p>
      {#if data.wallet}
        <a href={link({ w: null })} class="btn-dashed">Lihat semua dompet</a>
      {:else}
        <a href="/catat" class="btn-dashed">＋ Catat transaksi</a>
      {/if}
    </div>
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
  .filters {
    display: flex;
    gap: 6px;
    margin-bottom: 16px;
    overflow-x: auto;
  }
  .chip {
    flex: none;
    padding: 8px 14px;
    border-radius: 9px;
    font-size: 12.5px;
    font-weight: 700;
    border: 1.5px solid var(--line);
    background: var(--card);
    color: #7a756c;
    text-decoration: none;
  }
  .chip.on {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--ink-on-dark);
  }

  .scope {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--card-soft);
    border: 1.5px solid var(--line);
    border-radius: 10px;
    padding: 9px 12px;
    margin-bottom: 14px;
  }
  .scope-text {
    flex: 1;
    min-width: 0;
    font-size: 12.5px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .scope-text b {
    color: var(--ink);
  }
  .scope-clear {
    flex: none;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    color: var(--text-dim);
    font-size: 13px;
    line-height: 1;
    text-decoration: none;
  }
  .scope-clear:active {
    background: var(--sunken);
  }

  .group {
    margin-bottom: 16px;
  }
  .day {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 7px;
  }

  .row {
    text-decoration: none;
    color: inherit;
  }
  .row-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .row-title {
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
  .ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .badge {
    font-size: 10px;
    font-weight: 700;
    color: var(--accent);
    border: 1px solid var(--accent-soft-line);
    background: var(--accent-soft-bg);
    border-radius: 5px;
    padding: 1px 5px;
    flex: none;
  }
  .row-sub {
    font-size: 11.5px;
    color: var(--text-dim);
    margin-top: 1px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .row-amt {
    font-size: 14px;
    font-weight: 700;
    white-space: nowrap;
  }

  .empty {
    text-align: center;
    color: var(--text-muted);
    font-size: 13.5px;
    margin-top: 40px;
  }
  .empty p {
    margin: 4px 0 12px;
  }
</style>
