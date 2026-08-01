<script lang="ts">
  import { rp } from '$lib/format';
  import { segments, type Slice } from '$lib/chart';

  /**
   * Hand-rolled SVG, no charting dependency — the cash-flow bars are already
   * hand-rolled and one more figure type does not justify a library.
   *
   * The legend, not the arc, is the readable surface on a phone: every slice is
   * named with its amount and share, so nothing depends on judging an angle.
   */
  let {
    slices,
    total,
    caption = '',
    href,
    extra = []
  }: {
    slices: Slice[];
    total: number;
    caption?: string;
    /**
     * Where a slice leads, or null where it leads nowhere. Lainnya and Cicilan
     * Hutang stand for several things at once, so they stay unlinked rather
     * than becoming a link that goes nowhere.
     */
    href?: (s: Slice) => string | null;
    /**
     * Legend rows with no arc behind them — a negative Wallet Saldo is not an
     * angle. They carry their real signed amount and no percentage, so the
     * legend stays honest about what the ring left out.
     */
    extra?: { name: string; amount: number; href?: string | null }[];
  } = $props();

  /**
   * Drawn in a fixed 120-unit viewBox and scaled by CSS, so the ring keeps its
   * proportions at any size and only one number has to change.
   */
  const SIZE = 176;
  const R = 50;
  const C = 2 * Math.PI * R;
  const segs = $derived(segments(slices, C));
  const legend = $derived(slices.map((s) => ({ slice: s, link: href?.(s) ?? null })));
</script>

<div class="donut-wrap" style="width:{SIZE}px;height:{SIZE}px">
  <svg viewBox="0 0 120 120" width={SIZE} height={SIZE} role="img" aria-label={caption || 'Rincian kategori'}>
    <!-- Rotated so the first slice starts at twelve o'clock rather than three. -->
    <g transform="rotate(-90 60 60)">
      <circle cx="60" cy="60" r={R} fill="none" stroke="var(--sunken)" stroke-width="16" />
      {#each segs as s}
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke={s.color}
          stroke-width="16"
          stroke-dasharray={s.dash}
          stroke-dashoffset={s.offset}
        />
      {/each}
    </g>
  </svg>

  <div class="middle">
    <div class="mid-label">{caption}</div>
    <div class="num mid-figure">{rp(total)}</div>
  </div>
</div>

<ul class="legend">
  {#each legend as { slice: s, link }}
    <li>
      {#if link}
        <a href={link}>
          <i class="sw" style="background:{s.color}"></i>
          <span class="name">{s.name}</span>
          <span class="num amt">{rp(s.amount)}</span>
          <span class="pct">{s.pct}%</span>
          <span class="chev">›</span>
        </a>
      {:else}
        <span class="static">
          <i class="sw" style="background:{s.color}"></i>
          <span class="name">{s.name}</span>
          <span class="num amt">{rp(s.amount)}</span>
          <span class="pct">{s.pct}%</span>
        </span>
      {/if}
    </li>
  {/each}

  {#each extra as e}
    <li>
      {#if e.href}
        <a href={e.href}>
          <i class="sw hollow"></i>
          <span class="name">{e.name}</span>
          <span class="num amt">{rp(e.amount)}</span>
          <!-- A dash, not 0% — the share of a negative balance is not a number. -->
          <span class="pct">—</span>
          <span class="chev">›</span>
        </a>
      {:else}
        <span class="static">
          <i class="sw hollow"></i>
          <span class="name">{e.name}</span>
          <span class="num amt">{rp(e.amount)}</span>
          <span class="pct">—</span>
        </span>
      {/if}
    </li>
  {/each}
</ul>

<style>
  .donut-wrap {
    position: relative;
    margin: 6px auto 18px;
  }
  .middle {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    pointer-events: none;
  }
  .mid-label {
    font-size: 11.5px;
    color: var(--text-dim);
    letter-spacing: 0.03em;
  }
  .mid-figure {
    font-size: 17px;
    font-weight: 700;
    margin-top: 2px;
  }

  .legend {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .legend a,
  .legend .static {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 7px 2px;
    border-bottom: 1px solid var(--line-soft);
    text-decoration: none;
    color: inherit;
  }
  .legend li:last-child a,
  .legend li:last-child .static {
    border-bottom: none;
  }
  .sw {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    flex: none;
  }
  /* Hollow, because there is no arc in the ring for this row to point at. */
  .sw.hollow {
    background: none;
    border: 1.5px dashed var(--line-dashed);
  }
  .name {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .amt {
    font-size: 12.5px;
    font-weight: 700;
    white-space: nowrap;
  }
  .pct {
    font-size: 11.5px;
    color: var(--text-muted);
    width: 34px;
    text-align: right;
    flex: none;
  }
  .chev {
    color: var(--text-ghost);
    font-size: 16px;
    line-height: 1;
    flex: none;
  }
</style>
