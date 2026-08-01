<script lang="ts">
  import { rp } from '$lib/format';
  import { withMonth } from '$lib/month';
  import MonthStepper from '$lib/components/MonthStepper.svelte';
  import CategoryDonut from '$lib/components/CategoryDonut.svelte';
  import CashflowBars from '$lib/components/CashflowBars.svelte';
  import { initials } from '$lib/kelola';
  let { data } = $props();

  // Carousel position, for the dots. Read off the scroll offset rather than
  // driving it, so the strip stays a plain scroll-snap list.
  let strip = $state<HTMLDivElement | null>(null);
  let active = $state(0);

  function onScroll() {
    if (!strip) return;
    const card = strip.firstElementChild as HTMLElement | null;
    if (!card) return;
    active = Math.round(strip.scrollLeft / (card.offsetWidth + 9));
  }
</script>

<svelte:head><title>Beranda · Maalify</title></svelte:head>

<div class="page">
  <header>
    <div>
      <div class="sketch page-title">Beranda</div>
      <div class="page-sub">Rumah Tangga · {data.household.name}</div>
    </div>
    <!-- Tapping your own face goes somewhere about you, not to Wallet management. -->
    <a href="/kelola?tab=profil" class="avatar" aria-label="Profil dan pengaturan">
      {#if data.me.photo}
        <img src={data.me.photo} alt="" />
      {:else}
        {initials(data.me.name ?? data.user.email ?? '')}
      {/if}
    </a>
  </header>

  <!-- Total saldo — tapping it goes to wallet management, as in the prototype. -->
  <a href="/kelola" class="saldo">
    <div class="saldo-label">
      Total Saldo · semua dompet
      <!--
        The one figure that ignores the stepper: it is what the Household has
        right now. Labelling it is what stops it reading as a stale number for
        whatever month is named above.
      -->
      <span class="live">per hari ini</span>
    </div>
    <div class="num saldo-figure">{rp(data.totalSaldo)}</div>
    <div class="saldo-split">
      <div>
        <div class="saldo-sub">Pemasukan · {data.month.label}</div>
        <div class="num saldo-amt">+ {rp(data.inMonth)}</div>
      </div>
      <div>
        <div class="saldo-sub">Pengeluaran · {data.month.label}</div>
        <div class="num saldo-amt">− {rp(data.exMonth)}</div>
      </div>
    </div>
  </a>

  <!--
    Sits under the balance card, which is the one figure it does not govern.
    Everything below this line follows it.
  -->
  <div class="stepper-slot">
    <MonthStepper month={data.month} path="/beranda" />
  </div>

  <CashflowBars months={data.chart} title="Arus Kas · 4 bulan" />

  <section class="block">
    <div class="sketch section-title">Perlu Perhatian</div>
    {#if data.alerts.length}
      <div class="strip noscroll" bind:this={strip} onscroll={onScroll}>
        {#each data.alerts as al}
          <a href={al.href} class="alert">
            <span class="bang">!</span>
            <span class="alert-body">
              <span class="alert-text">{al.text}</span>
              <span class="alert-sub num">{al.sub}</span>
            </span>
            <span class="chev">›</span>
          </a>
        {/each}
      </div>
      {#if data.alerts.length > 1}
        <div class="dots">
          {#each data.alerts as _, i}
            <i class="dot" class:on={i === active}></i>
          {/each}
        </div>
      {/if}
    {:else}
      <p class="quiet">
        Tidak ada yang perlu perhatian di {data.month.label}.
        {#if !data.month.isCurrent}
          <br /><small>Jatuh tempo hutang hanya ditampilkan di bulan berjalan.</small>
        {/if}
      </p>
    {/if}
  </section>

  {#if data.incomeSlices.length}
    <section class="block">
      <div class="sketch section-title">Pemasukan per Kategori</div>
      <div class="panel donut-panel">
        <CategoryDonut slices={data.incomeSlices} total={data.inMonth} caption="Pemasukan" />
      </div>
    </section>
  {/if}

  {#if data.slices.length}
    <section class="block">
      <div class="sketch section-title">Pengeluaran per Kategori</div>
      <div class="panel donut-panel">
        <CategoryDonut slices={data.slices} total={data.exMonth} caption="Pengeluaran" />
      </div>
    </section>
  {/if}

  <section class="block">
    <div class="recent-head">
      <div class="sketch section-title">Transaksi Terakhir</div>
      <a href={withMonth('/transaksi', data.month)} class="see-all">Lihat semua ›</a>
    </div>

    {#if data.recent.length}
      <div class="panel">
        {#each data.recent as tx}
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
    {:else}
      <div class="empty">
        <p>Belum ada transaksi di {data.month.label}.</p>
        <a href="/catat" class="btn-dashed">＋ Catat yang pertama</a>
      </div>
    {/if}
  </section>
</div>

<style>
  .page {
    padding: 6px 18px 28px;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin: 6px 0 14px;
  }
  .avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #dcd6cc;
    color: #6b6459;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    flex: none;
    overflow: hidden;
  }
  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .saldo {
    display: block;
    background: var(--ink);
    border-radius: var(--r-panel);
    padding: 20px 20px 18px;
    color: var(--ink-on-dark);
    text-decoration: none;
  }
  .saldo-label {
    font-size: 12.5px;
    letter-spacing: 0.03em;
    color: var(--text-on-ink);
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
  }
  .live {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ink-on-dark);
    border: 1px solid var(--line-on-ink);
    border-radius: 5px;
    padding: 1px 6px;
  }
  .saldo-figure {
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.01em;
    margin-top: 5px;
  }
  .saldo-split {
    display: flex;
    gap: 22px;
    margin-top: 16px;
    border-top: 1px solid var(--line-on-ink);
    padding-top: 14px;
  }
  .saldo-sub {
    font-size: 11.5px;
    color: var(--text-on-ink);
  }
  .saldo-amt {
    font-size: 15px;
    font-weight: 700;
    margin-top: 2px;
  }

  .stepper-slot {
    margin-top: 16px;
  }
  .block {
    margin-top: 20px;
  }
  .block > .section-title {
    margin-bottom: 9px;
  }

  /* Carousel: plain scroll-snap, no library and no scripted scrolling. */
  .strip {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    /*
      Cards bleed to the screen edge so the next one peeks, but both the resting
      position and every snap point keep the page's 18px gutter.
    */
    margin: 0 -18px;
    padding: 0 18px;
    scroll-padding-left: 18px;
  }
  .alert {
    flex: 0 0 calc(100% - 46px);
    scroll-snap-align: start;
    display: flex;
    gap: 11px;
    align-items: center;
    background: var(--accent-soft-bg);
    border: 1.5px solid var(--accent-soft-line);
    border-radius: 12px;
    padding: 13px;
    text-decoration: none;
  }
  .dots {
    display: flex;
    justify-content: center;
    gap: 5px;
    margin-top: 9px;
  }
  .dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--line-dashed);
  }
  .dot.on {
    background: var(--accent);
  }
  .quiet {
    font-size: 13px;
    color: var(--text-muted);
    background: var(--card);
    border: 1.5px dashed var(--line-dashed);
    border-radius: 12px;
    padding: 14px;
    margin: 0;
    line-height: 1.5;
  }
  .quiet small {
    font-size: 11.5px;
    color: var(--text-dim);
  }

  .bang {
    width: 22px;
    height: 22px;
    flex: none;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 13px;
  }
  .alert-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .alert-text {
    font-size: 13.5px;
    color: var(--accent-deep);
    line-height: 1.35;
  }
  .alert-sub {
    font-size: 11.5px;
    color: var(--accent-mid);
    margin-top: 2px;
  }
  /*
    Sized and centred against the card rather than the text baseline — as a
    bare glyph it sat high and read as a stray character.
  */
  .chev {
    flex: none;
    align-self: center;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    color: #b58a5a;
    font-size: 20px;
    line-height: 1;
  }

  .donut-panel {
    padding: 18px 14px 10px;
  }

  .recent-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 6px;
  }
  .see-all {
    font-size: 12.5px;
    color: #3a4a5a;
    text-decoration: none;
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
    text-align: center;
    color: var(--text-muted);
    font-size: 13.5px;
  }
  .empty p {
    margin: 4px 0 12px;
  }
</style>
