<script lang="ts">
  import { enhance } from '$app/forms';
  let { form } = $props();

  let mode = $state<'gabung' | 'buat'>(form?.mode === 'buat' ? 'buat' : 'gabung');
  let busy = $state(false);

  const submitting = () => {
    busy = true;
    return async ({ update }: any) => {
      await update();
      busy = false;
    };
  };
</script>

<svelte:head><title>Mulai · Maalify</title></svelte:head>

<div class="wrap">
  {#if mode === 'gabung'}
    <div class="sketch title">Gabung ke Rumah Tangga</div>
    <p class="sub">
      Minta Kode Undangan dari anggota yang sudah punya rumah tangga, lalu masukkan di sini.
    </p>

    {#if form?.message}<div class="error" style="margin-top:16px">{form.message}</div>{/if}

    <form method="POST" action="?/gabung" use:enhance={submitting} style="margin-top:22px">
      <div class="label">Kode Undangan</div>
      <input
        class="field code"
        name="code"
        value={form?.code ?? ''}
        placeholder="mis. RUMAH-4K7Q"
        autocapitalize="characters"
      />
      <button class="btn-primary" style="margin-top:16px" disabled={busy}>Gabung</button>
    </form>

    <div class="or"><span></span>atau<span></span></div>

    <button class="btn-ghost" onclick={() => (mode = 'buat')}>Buat Rumah Tangga baru</button>
  {:else}
    <button class="back" onclick={() => (mode = 'gabung')}>‹ Kembali</button>
    <div class="sketch title">Buat Rumah Tangga</div>
    <p class="sub">
      Kami siapkan kategori dasar dan Kode Undangan yang bisa kamu bagikan ke anggota keluarga.
    </p>

    {#if form?.message}<div class="error" style="margin-top:16px">{form.message}</div>{/if}

    <form method="POST" action="?/buat" use:enhance={submitting} style="margin-top:22px">
      <div class="label">Nama Rumah Tangga</div>
      <input class="field" name="name" placeholder="mis. Keluarga Kami" />
      <button class="btn-primary" style="margin-top:16px" disabled={busy}>Buat</button>
    </form>
  {/if}

  <form method="POST" action="/auth/keluar" class="out">
    <button>Keluar</button>
  </form>
</div>

<style>
  .wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 48px 26px 32px;
  }
  .title {
    font-size: 24px;
    color: var(--ink);
  }
  .sub {
    font-size: 14px;
    color: var(--text-muted);
    margin: 8px 0 0;
    line-height: 1.45;
  }
  .label {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 6px;
  }
  .code {
    font-size: 17px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .or {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 22px 0;
    font-size: 12px;
    color: var(--text-ghost);
  }
  .or span {
    flex: 1;
    height: 1px;
    background: var(--line);
  }
  .back {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 20px;
    align-self: flex-start;
  }
  .out {
    margin-top: 28px;
    text-align: center;
  }
  .out button {
    font-size: 13px;
    color: var(--text-ghost);
  }
</style>
