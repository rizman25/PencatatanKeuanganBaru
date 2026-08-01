<script lang="ts">
  import { page } from '$app/stores';
  import { withMonth, type SelectedMonth } from '$lib/month';

  let { month }: { month: SelectedMonth } = $props();

  // Lucide outlines, lifted from the reviewed prototype.
  const ICONS: Record<string, string> = {
    beranda:
      '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    transaksi:
      '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
    anggaran:
      '<path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"/><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>',
    hutang:
      '<path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17"/><path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/><path d="m2 16 6 6"/><circle cx="16" cy="9" r="2.9"/><circle cx="6" cy="5" r="3"/>'
  };

  /**
   * `monthly` marks the screens that read the selected month. They carry it
   * between each other so stepping back on Beranda and tapping Transaksi shows
   * that same month. Hutang is not month-scoped and never receives it.
   */
  const items = [
    { key: 'beranda', label: 'Beranda', href: '/beranda', monthly: true },
    { key: 'transaksi', label: 'Transaksi', href: '/transaksi', monthly: true },
    { key: 'anggaran', label: 'Anggaran', href: '/anggaran', monthly: true },
    { key: 'hutang', label: 'Hutang', href: '/hutang', monthly: false }
  ];

  const path = $derived($page.url.pathname);
  // No special case for Beranda any more: since it moved off `/`, every tab is a
  // real path prefix and `/` belongs to the public landing page, which has no nav.
  const isActive = (href: string) => path.startsWith(href);
  const linkFor = (it: (typeof items)[number]) =>
    it.monthly ? withMonth(it.href, month) : it.href;
</script>

<nav>
  {#each items.slice(0, 2) as it}
    <a href={linkFor(it)} class="item" class:active={isActive(it.href)}>
      <svg
        width="23"
        height="23"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round">{@html ICONS[it.key]}</svg
      >
      <span>{it.label}</span>
    </a>
  {/each}

  <a href="/catat" class="item fab-slot" aria-label="Catat transaksi">
    <span class="fab">
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        stroke-width="2.4"
        stroke-linecap="round"
        stroke-linejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg
      >
    </span>
    <span class="spacer"></span>
    <span class="catat">Catat</span>
  </a>

  {#each items.slice(2) as it}
    <a href={linkFor(it)} class="item" class:active={isActive(it.href)}>
      <svg
        width="23"
        height="23"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round">{@html ICONS[it.key]}</svg
      >
      <span>{it.label}</span>
    </a>
  {/each}
</nav>

<style>
  nav {
    flex: none;
    height: 66px;
    background: var(--card);
    border-top: 1.5px solid var(--tile-line);
    display: flex;
    padding: 0 6px;
    position: sticky;
    bottom: 0;
    z-index: 20;
    padding-bottom: env(safe-area-inset-bottom);
  }
  .item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding-top: 6px;
    text-decoration: none;
    color: var(--nav-inactive);
    position: relative;
  }
  .item.active {
    color: var(--ink);
  }
  .item span {
    font-size: 10.5px;
    font-weight: 600;
  }
  .fab-slot {
    color: var(--accent);
  }
  .fab {
    position: absolute;
    top: -24px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 18px rgba(168, 107, 60, 0.42);
    border: 4px solid var(--surface);
  }
  .spacer {
    height: 32px;
  }
  .catat {
    font-weight: 700;
    color: var(--accent);
  }
</style>
