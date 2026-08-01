<script lang="ts">
  import TransactionForm from '$lib/components/TransactionForm.svelte';
  import { fmtDate, rp } from '$lib/format';
  import { debtReturnPath } from '$lib/debts';
  let { data, form } = $props();

  /**
   * Where ✕ goes when there is no history to go back to — a fresh tab, a
   * shared link, or JavaScript off. A cicilan returns to its own Hutang tab,
   * since Piutang is a different segment.
   */
  const fallback = $derived(
    data.debt ? debtReturnPath(data.debt.direction) : '/transaksi'
  );

  function close(e: MouseEvent) {
    // Only hijack the link when going back lands somewhere inside the app.
    const sameOrigin = document.referrer.startsWith(location.origin);
    if (history.length > 1 && sameOrigin) {
      e.preventDefault();
      history.back();
    }
  }
</script>

<svelte:head><title>Transaksi Baru · Maalify</title></svelte:head>

<div class="sheet">
  <div class="head">
    <div class="sketch title">{data.debt ? 'Catat Cicilan' : 'Transaksi Baru'}</div>
    <a href={fallback} class="close" aria-label="Tutup" onclick={close}>✕</a>
  </div>

  {#if data.debt && data.debt.remaining_amount <= 0}
    <!--
      Settled Debts are reachable now, and the history is why you would open
      one. Say plainly that nothing is outstanding — the form below still works
      for correcting a mistaken entry.
    -->
    <p class="lunas">Sudah lunas. Riwayat pembayarannya ada di bawah.</p>
  {/if}

  {#if data.wallets.length}
    <TransactionForm
      wallets={data.wallets}
      categories={data.categories}
      debt={data.debt}
      today={data.today}
      {form}
    />
  {:else}
    <p class="empty">Belum ada dompet. <a href="/kelola">Tambah dompet dulu</a>.</p>
  {/if}

  {#if data.debt && data.history}
    <section class="history">
      <div class="sketch section-title">Riwayat</div>

      {#if !data.history.hasOrigination}
        <!--
          No origination row is a deliberate outcome, not missing data: nothing
          crossed a Wallet boundary when the Debt was created (ADR-0004). Saying
          so is what stops the gap reading as a fault.

          Which direction went missing depends on the Debt: borrowing brings
          money in, lending takes it out, and the checkbox that creates these
          says as much.
        -->
        <p class="credit">
          {data.debt.direction === 'payable'
            ? 'Cicilan barang · tidak ada uang masuk'
            : 'Tanpa transaksi awal · tidak ada uang keluar'}
        </p>
      {/if}

      {#if data.history.rows.length}
        <div class="panel">
          {#each data.history.rows as h}
            <div class="hrow" class:origin={h.kind === 'origination'}>
              <div class="hbody">
                <div class="hline">
                  <span class="hdate">{fmtDate(h.occurred_on)}</span>
                  {#if h.kind === 'origination'}
                    <span class="tag">UANG MASUK</span>
                  {/if}
                </div>
                <div class="hsub">
                  {h.by}{#if h.note} · {h.note}{/if}
                </div>
              </div>
              <div class="hright">
                <div class="num hamt">{rp(h.amount)}</div>
                {#if h.remaining !== null}
                  <div class="num hrem">Sisa {rp(h.remaining)}</div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="credit">Belum ada pembayaran tercatat.</p>
      {/if}
    </section>
  {/if}
</div>

<style>
  .sheet {
    padding: 18px 20px 32px;
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  .title {
    font-size: 20px;
    font-weight: 700;
  }
  .close {
    font-size: 22px;
    color: var(--text-dim);
    line-height: 1;
    text-decoration: none;
  }
  .empty {
    font-size: 14px;
    color: var(--text-muted);
  }
  .lunas {
    font-size: 13px;
    color: var(--ok-text);
    background: var(--ok-bg);
    border-radius: 10px;
    padding: 11px 13px;
    margin: 0 0 16px;
  }

  .history {
    margin-top: 26px;
  }
  .history > .section-title {
    margin-bottom: 9px;
  }
  .credit {
    font-size: 12.5px;
    color: var(--text-muted);
    background: var(--card-soft);
    border: 1.5px dashed var(--line-dashed);
    border-radius: 10px;
    padding: 10px 12px;
    margin: 0 0 10px;
  }
  .hrow {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 11px 13px;
    border-bottom: 1px solid var(--line-soft);
  }
  .hrow:last-child {
    border-bottom: none;
  }
  .hrow.origin {
    background: var(--card-soft);
  }
  .hbody {
    flex: 1;
    min-width: 0;
  }
  .hline {
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .hdate {
    font-size: 13.5px;
    font-weight: 600;
  }
  .tag {
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    border: 1px solid var(--line);
    border-radius: 5px;
    padding: 1px 5px;
  }
  .hsub {
    font-size: 11.5px;
    color: var(--text-dim);
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .hright {
    text-align: right;
    flex: none;
  }
  .hamt {
    font-size: 13.5px;
    font-weight: 700;
  }
  .hrem {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 2px;
  }
</style>
