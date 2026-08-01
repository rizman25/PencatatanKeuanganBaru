<script lang="ts">
  import TransactionForm from '$lib/components/TransactionForm.svelte';
  let { data, form } = $props();
</script>

<svelte:head><title>Edit Transaksi · Maalify</title></svelte:head>

<div class="sheet">
  <div class="head">
    <div class="sketch title">Edit Transaksi</div>
    <a href="/transaksi" class="close" aria-label="Tutup">✕</a>
  </div>

  <TransactionForm
    wallets={data.wallets}
    categories={data.categories}
    debt={data.debt}
    tx={data.tx}
    today={data.today}
    {form}
  />
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
</style>
