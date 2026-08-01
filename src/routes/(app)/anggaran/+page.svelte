<script lang="ts">
  import { enhance } from '$app/forms';
  import { rp } from '$lib/format';
  import { withMonth } from '$lib/month';
  import MonthStepper from '$lib/components/MonthStepper.svelte';
  import CategoryDonut from '$lib/components/CategoryDonut.svelte';
  import MoneyInput from '$lib/components/MoneyInput.svelte';
  let { data, form } = $props();

  let adding = $state(false);

  const detail = (categoryId: string) =>
    withMonth(`/anggaran/${categoryId}`, data.month);
</script>

<svelte:head><title>Anggaran · Maalify</title></svelte:head>

<div class="page">
  <div class="head">
    <div class="sketch page-title">Anggaran</div>
    <div class="page-sub">batas bulanan per kategori</div>
  </div>

  <MonthStepper month={data.month} path="/anggaran" />

  {#if form?.message}<div class="error" style="margin-bottom:14px">{form.message}</div>{/if}

  {#if data.slices.length}
    <div class="panel donut-panel">
      <CategoryDonut
        slices={data.slices}
        total={data.spentTotal}
        caption="Terpakai"
        href={(s) => (s.key ? detail(s.key) : null)}
      />
    </div>
  {/if}

  {#each data.rows as b}
    <!--
      The card is the container; only its upper half is the link, so the stop
      control can live inside it without nesting a button in an anchor.
    -->
    <div class="card">
      <a class="card-link" href={detail(b.categoryId)}>
        <div class="top">
          <div class="name">{b.name}</div>
          <div class="right">
            <span class="pct" class:warn={b.pct >= 80}>{b.pct}%</span>
            <span class="chev">›</span>
          </div>
        </div>
        <div class="track">
          <div
            class="fill"
            class:over={b.over}
            class:near={!b.over && b.pct >= 80}
            style="width:{b.barWidth}%"
          ></div>
        </div>
        <div class="foot">
          <span class="num">Terpakai {rp(b.spent)}</span>
          <span class="num">Batas {rp(b.amount)}</span>
        </div>
        {#if b.over}
          <div class="over-note">Melebihi batas {rp(b.overBy)}</div>
        {/if}
      </a>

      {#if data.month.isCurrent}
        <form method="POST" action="?/hentikan" use:enhance class="stop">
          <input type="hidden" name="category_id" value={b.categoryId} />
          <button class="mini">Hentikan anggaran</button>
        </form>
      {/if}
    </div>
  {:else}
    <p class="empty">Belum ada anggaran di {data.month.label}.</p>
  {/each}

  {#if !data.month.isCurrent}
    <!--
      A budget takes effect from the month it is set, so it can only ever be
      changed in the present. Offering the controls here would imply we could
      rewrite what a past month reported against.
    -->
    <p class="note">Anggaran hanya bisa diubah di bulan berjalan.</p>
  {:else if adding}
    <form
      method="POST"
      action="?/simpan"
      use:enhance={() =>
        async ({ update, result }) => {
          await update();
          // Only close on success. Closing on a validation failure threw away
          // everything typed and left the error with nothing to correct.
          if (result.type === 'success') adding = false;
        }}
      class="add"
    >
      <div class="label">Kategori</div>
      <select class="field" name="category_id" required>
        {#each data.available as c}
          <option value={c.id}>{c.name}</option>
        {/each}
      </select>
      <div class="label mt">Batas per bulan</div>
      <MoneyInput name="amount" label="Batas per bulan" required />
      <div class="actions">
        <button class="btn-primary">Simpan</button>
        <button type="button" class="btn-ghost" onclick={() => (adding = false)}>Batal</button>
      </div>
    </form>
  {:else if data.available.length}
    <button class="btn-dashed" onclick={() => (adding = true)}>＋ Tambah Anggaran</button>
  {:else if data.rows.length}
    <p class="note">Semua kategori pengeluaran sudah punya anggaran.</p>
  {/if}
</div>

<style>
  .page {
    padding: 6px 18px 28px;
  }
  .head {
    margin: 6px 0 16px;
  }
  .donut-panel {
    padding: 16px 14px 8px;
    margin-bottom: 16px;
  }
  .card {
    background: var(--card);
    border: 1.5px solid var(--line);
    border-radius: var(--r-card);
    padding: 14px;
    margin-bottom: 11px;
  }
  .card-link {
    display: block;
    text-decoration: none;
    color: inherit;
  }
  .right {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .chev {
    font-size: 17px;
    line-height: 1;
    color: var(--text-ghost);
  }
  .stop {
    margin-top: 12px;
    padding-top: 11px;
    border-top: 1px solid var(--line-soft);
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .name {
    font-size: 14.5px;
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
    margin: 9px 0 8px;
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
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--text-muted);
  }
  .over-note {
    font-size: 12px;
    color: var(--accent);
    font-weight: 600;
    margin-top: 6px;
  }
  .mini {
    font-size: 12px;
    color: var(--text-muted);
    border: 1.5px solid var(--line);
    border-radius: 7px;
    padding: 4px 9px;
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
  .actions {
    display: flex;
    gap: 8px;
    margin-top: 14px;
  }
  .empty,
  .note {
    font-size: 13.5px;
    color: var(--text-muted);
    margin: 4px 0 14px;
  }
</style>
