<script lang="ts">
  /**
   * Paired income/expense bars per month. Hand-rolled like the donut — two
   * figure types still do not justify a charting dependency.
   *
   * The pixel scaling lives here rather than in Beranda's `load`, which is where
   * it used to sit. A height in pixels is not something a server should be
   * deciding, and moving it made this reusable: the landing page renders the
   * same component with sample figures, so what a visitor is shown is the real
   * chart rather than a picture of one.
   */
  export interface CashflowMonth {
    label: string;
    /** Marks the month the screen is currently showing. */
    selected: boolean;
    income: number;
    expense: number;
  }

  let { months, title }: { months: CashflowMonth[]; title: string } = $props();

  /** Matches `.pair`'s height below — the tallest bar fills the plot exactly. */
  const MAX_H = 84;
  /** A month with nothing in it still gets a sliver, so the axis reads as a row. */
  const MIN_H = 2;

  const peak = $derived(Math.max(...months.flatMap((m) => [m.income, m.expense]), 1));
  const bars = $derived(
    months.map((m) => ({
      label: m.label,
      selected: m.selected,
      inH: Math.max(Math.round((m.income / peak) * MAX_H), MIN_H),
      exH: Math.max(Math.round((m.expense / peak) * MAX_H), MIN_H)
    }))
  );
</script>

<section class="chart panel">
  <div class="chart-head">
    <div class="chart-title">{title}</div>
    <div class="legend">
      <span><i class="sw ink"></i>Masuk</span>
      <span><i class="sw acc"></i>Keluar</span>
    </div>
  </div>
  <div class="bars">
    {#each bars as m}
      <div class="bar-group">
        <div class="pair">
          <div class="bar ink" style="height:{m.inH}px"></div>
          <div class="bar acc" style="height:{m.exH}px"></div>
        </div>
        <div class="bar-label" class:on={m.selected}>{m.label}</div>
      </div>
    {/each}
  </div>
</section>

<style>
  .chart {
    padding: 15px 16px 13px;
  }
  .chart-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .chart-title {
    font-size: 13.5px;
    font-weight: 700;
  }
  .legend {
    display: flex;
    gap: 11px;
  }
  .legend span {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: var(--text-muted);
  }
  .sw {
    width: 9px;
    height: 9px;
    border-radius: 2px;
    display: inline-block;
  }
  .ink {
    background: var(--ink);
  }
  .acc {
    background: var(--accent);
  }
  .bars {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 16px;
    gap: 8px;
  }
  .bar-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
  }
  .pair {
    display: flex;
    gap: 4px;
    align-items: flex-end;
    height: 84px;
  }
  .bar {
    width: 13px;
    border-radius: 3px 3px 0 0;
  }
  .bar-label {
    font-size: 11px;
    color: var(--text-dim);
    font-weight: 600;
  }
  .bar-label.on {
    color: var(--ink);
    font-weight: 700;
  }
</style>
