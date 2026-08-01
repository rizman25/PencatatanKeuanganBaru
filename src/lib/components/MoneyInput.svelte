<script lang="ts">
  /**
   * Every money field in the app. Four screens ask for an amount — Catat,
   * Hutang, Saldo Awal, and Anggaran — and before this they disagreed: two
   * grouped the digits as you typed and two showed a bare number, so `1500000`
   * on one screen was `1.500.000` on another.
   *
   * The split that makes this work is between what is *shown* and what is
   * *sent*. The visible field holds grouped text and is never named, so it
   * never reaches the server; a hidden sibling carries `parseAmount` of it and
   * takes the field name. Every form action keeps reading a plain integer
   * (ADR-0007: BIGINT whole rupiah), so nothing downstream had to change.
   */
  import { grouped, parseAmount } from '$lib/format';

  interface Props {
    /** The name the form action reads. Goes on the hidden field, not the visible one. */
    name: string;
    /** Starting amount, in whole rupiah. Zero shows as empty against the "0" placeholder. */
    value?: number;
    /** The Catat hero field, which is set larger than the rest. */
    big?: boolean;
    required?: boolean;
    /**
     * The accessible name. Every caller sits under a styled `<div class="label">`
     * rather than a real `<label>`, so without this the field has no name at all.
     */
    label: string;
  }

  let { name, value = 0, big = false, required = false, label }: Props = $props();

  let text = $state(grouped(value));
  let el: HTMLInputElement;

  /**
   * Reformatting on every keystroke is what puts the separators in as you type.
   * It also normalises a paste: `Rp 1.500.000` and `1500000` both land as the
   * same digits, because `parseAmount` keeps nothing else.
   *
   * The caret lands at the end afterwards, which is invisible while appending
   * digits — the only way anyone types an amount.
   */
  function onInput() {
    text = grouped(parseAmount(el.value));
  }

  /**
   * `use:enhance`'s `update()` resets the form after a successful save, which
   * restores the DOM but knows nothing about the state above. Most callers
   * unmount their sheet on success and so never notice; this is here so the one
   * that eventually stays open does not show the previous amount still typed.
   */
  $effect(() => {
    const form = el.form;
    if (!form) return;
    const restore = () => (text = grouped(value));
    form.addEventListener('reset', restore);
    return () => form.removeEventListener('reset', restore);
  });
</script>

<input type="hidden" {name} value={parseAmount(text)} />
<div class="money" class:big>
  <span class="rp num" aria-hidden="true">Rp</span>
  <input
    bind:this={el}
    class="num amount"
    inputmode="numeric"
    placeholder="0"
    aria-label={label}
    value={text}
    oninput={onInput}
    {required}
  />
</div>

<style>
  .money {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1.5px solid var(--line);
    border-radius: var(--r-field);
    background: var(--card);
    padding: 0 12px;
  }
  .money:focus-within {
    outline: 1.5px solid var(--accent);
  }
  .rp {
    flex: none;
    font-size: 14px;
    font-weight: 700;
    color: var(--text-muted);
  }
  .amount {
    flex: 1;
    min-width: 0;
    border: none;
    background: none;
    padding: 11px 0;
    font-size: 16px;
    font-weight: 700;
  }
  .amount:focus {
    outline: none;
  }

  /* Catat's amount is the first thing on the screen and reads as the headline. */
  .money.big {
    padding: 12px 14px;
  }
  .money.big .rp {
    font-size: 20px;
    color: var(--text-dim);
  }
  .money.big .amount {
    padding: 0;
    font-size: 22px;
  }
</style>
