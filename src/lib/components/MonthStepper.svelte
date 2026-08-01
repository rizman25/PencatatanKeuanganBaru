<script lang="ts">
  import type { SelectedMonth } from '$lib/month';

  /**
   * The arrows are ordinary links, not buttons: the selected month lives in the
   * URL, so it stays shareable and browser-back walks through the months you
   * actually visited.
   *
   * `extra` carries the screen's other query parameters (the type filter on
   * Transaksi) so stepping a month does not silently reset them.
   */
  let {
    month,
    path = '',
    extra = {}
  }: {
    month: SelectedMonth;
    path?: string;
    extra?: Record<string, string | null | undefined>;
  } = $props();

  function href(key: string | null) {
    if (key === null) return null;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(extra)) if (v) params.set(k, v);
    // The current month is the default, so it is left out of the URL.
    if (key !== month.currentKey) params.set('m', key);
    const q = params.toString();
    return q ? `${path}?${q}` : path || '.';
  }

  const prevHref = $derived(href(month.prev));
  const nextHref = $derived(href(month.next));
</script>

<div class="stepper">
  <a class="arrow" href={prevHref} aria-label="Bulan sebelumnya" data-sveltekit-noscroll>‹</a>
  <div class="label">{month.label}</div>
  {#if nextHref}
    <a class="arrow" href={nextHref} aria-label="Bulan berikutnya" data-sveltekit-noscroll>›</a>
  {:else}
    <span class="arrow off" aria-hidden="true">›</span>
  {/if}
</div>

<style>
  .stepper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--sunken);
    border-radius: 11px;
    padding: 4px;
    margin-bottom: 14px;
  }
  .arrow {
    width: 38px;
    height: 34px;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    line-height: 1;
    border-radius: 8px;
    color: var(--ink);
    text-decoration: none;
    background: var(--card);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }
  .arrow.off {
    background: none;
    box-shadow: none;
    color: var(--text-ghost);
  }
  .label {
    flex: 1;
    text-align: center;
    font-size: 13.5px;
    font-weight: 700;
    color: var(--ink);
  }
</style>
