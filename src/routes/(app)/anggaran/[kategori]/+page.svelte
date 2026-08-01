<script lang="ts">
  import { rp } from '$lib/format';
  import { withMonth } from '$lib/month';
  import { groupByDay } from '$lib/rows';
  let { data } = $props();

  const groups = $derived(groupByDay(data.rows, data.today));
</script>

<svelte:head><title>{data.name} · Anggaran · Maalify</title></svelte:head>

<div class="page">
  <!-- A mobile header bar: tap target on the left, title centred, nothing else. -->
  <div class="topbar">
    <a href={withMonth('/anggaran', data.month)} class="back" aria-label="Kembali ke Anggaran">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg
      >
    </a>
    <div class="titles">
      <div class="sketch bar-title">{data.name}</div>
      <div class="bar-sub">{data.month.label}</div>
    </div>
    <span class="spacer"></span>
  </div>

  <div class="card">
    <div class="top">
      <div class="spent num">{rp(data.spent)}</div>
      {#if data.pct !== null}
        <div class="pct" class:warn={data.pct >= 80}>{data.pct}%</div>
      {/if}
    </div>
    {#if data.amount !== null}
      <div class="track">
        <div
          class="fill"
          class:over={data.over}
          class:near={!data.over && (data.pct ?? 0) >= 80}
          style="width:{data.barWidth}%"
        ></div>
      </div>
      <div class="foot"><span class="num">Batas {rp(data.amount)}</span></div>
      {#if data.over}
        <div class="over-note">Melebihi batas {rp(data.overBy)}</div>
      {/if}
    {:else}
      <div class="foot">Kategori ini belum punya anggaran di bulan ini.</div>
    {/if}
  </div>

  {#if groups.length}
    {#each groups as g}
      <div class="group">
        <div class="day">{g.dateLabel}</div>
        <div class="panel">
          {#each g.items as tx}
            <a class="row" href="/catat/{tx.id}">
              <span class="tile">{tx.sign}</span>
              <span class="row-body">
                <span class="row-title">{tx.title}</span>
                <span class="row-sub">{tx.sub}</span>
              </span>
              <span class="num row-amt">{tx.signAmount}</span>
            </a>
          {/each}
        </div>
      </div>
    {/each}
  {:else}
    <p class="empty">Belum ada pengeluaran {data.name} di {data.month.label}.</p>
  {/if}
</div>

<style>
  .page {
    padding: 6px 18px 28px;
  }
  .topbar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 2px 0 16px;
  }
  .back,
  .spacer {
    width: 38px;
    height: 38px;
    flex: none;
  }
  .back {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: -9px;
    border-radius: 50%;
    color: var(--ink);
    text-decoration: none;
  }
  .back:active {
    background: var(--sunken);
  }
  .titles {
    flex: 1;
    min-width: 0;
    text-align: center;
  }
  .bar-title {
    font-size: 17px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .bar-sub {
    font-size: 11.5px;
    color: var(--text-muted);
    margin-top: 1px;
  }

  .card {
    background: var(--card);
    border: 1.5px solid var(--line);
    border-radius: var(--r-card);
    padding: 14px;
    margin-bottom: 18px;
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .spent {
    font-size: 22px;
    font-weight: 700;
  }
  .pct {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-muted);
  }
  .pct.warn {
    color: var(--accent);
  }
  .track {
    height: 9px;
    background: var(--sunken);
    border-radius: 5px;
    margin: 10px 0 8px;
    overflow: hidden;
  }
  .fill {
    height: 100%;
    background: var(--ink);
    border-radius: 5px;
  }
  .fill.near {
    background: var(--accent-warn-bar);
  }
  .fill.over {
    background: var(--accent);
  }
  .foot {
    font-size: 12px;
    color: var(--text-muted);
  }
  .over-note {
    font-size: 12px;
    color: var(--accent);
    font-weight: 600;
    margin-top: 6px;
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
    font-size: 13.5px;
    color: var(--text-muted);
    text-align: center;
    margin-top: 30px;
  }
</style>
