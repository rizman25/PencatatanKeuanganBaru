<script lang="ts">
  import { enhance } from '$app/forms';
  import { rp } from '$lib/format';
  import CategoryDonut from '$lib/components/CategoryDonut.svelte';
  import MoneyInput from '$lib/components/MoneyInput.svelte';
  import { AVATAR_PX, cropBox, initials, MIN_PASSWORD, TABS } from '$lib/kelola';
  let { data, form } = $props();

  let view = $state<'saldo' | 'pengeluaran'>('saldo');
  let addingWallet = $state(false);
  let addingCategory = $state<'income' | 'expense' | null>(null);
  let copied = $state(false);
  let confirming = $state(false);
  let changingPassword = $state(false);
  let uploading = $state(false);

  const TAB_LABELS: Record<string, string> = {
    dompet: 'Dompet',
    kategori: 'Kategori',
    profil: 'Profil'
  };

  /**
   * One id at a time for each: the open menu, and the row being edited. Holding
   * an id rather than a boolean per row is what makes "only one open" free.
   */
  let menu = $state<string | null>(null);
  let editing = $state<string | null>(null);

  const activeWallets = $derived(data.wallets.filter((w) => !w.archived_at));
  const archivedWallets = $derived(data.wallets.filter((w) => w.archived_at));
  const total = $derived(activeWallets.reduce((a, w) => a + w.balance, 0));

  const chart = $derived(view === 'saldo' ? data.saldo : data.spend);
  const excluded = $derived(
    chart.excluded.map((e) => ({ name: e.name, amount: e.amount, href: `/transaksi?w=${e.id}` }))
  );

  const cats = (kind: 'income' | 'expense', archived: boolean) =>
    data.categories.filter((c) => c.kind === kind && !!c.archived_at === archived);

  function edit(id: string) {
    editing = id;
    menu = null;
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(data.household.invite_code);
      copied = true;
      setTimeout(() => (copied = false), 1800);
    } catch {
      copied = false;
    }
  }

  /**
   * Shrink to a 256px square before anything is sent. A 4 MB phone photo
   * becomes roughly 30 KB, which is the difference between an upload that feels
   * instant on mobile data and one that does not — and it means the server
   * never handles a large body. The server validates independently regardless.
   */
  async function shrink(file: File): Promise<File> {
    const bitmap = await createImageBitmap(file);
    const { x, y, size } = cropBox(bitmap.width, bitmap.height);

    const canvas = document.createElement('canvas');
    canvas.width = AVATAR_PX;
    canvas.height = AVATAR_PX;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, x, y, size, size, 0, 0, AVATAR_PX, AVATAR_PX);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.85)
    );
    return blob ? new File([blob], 'avatar.jpg', { type: 'image/jpeg' }) : file;
  }
</script>

<!-- Escape closes the menu but never the edit form, which holds typing. -->
<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape') menu = null;
  }}
/>

<svelte:head><title>Kelola · Maalify</title></svelte:head>

{#if menu}
  <!-- Catches the tap that closes the menu, and nothing else. -->
  <button class="backdrop" onclick={() => (menu = null)} tabindex="-1" aria-label="Tutup menu"
  ></button>
{/if}

<div class="page">
  <div class="sketch page-title" style="margin:6px 0 12px">Kelola</div>

  <!--
    Links rather than buttons, so the tab lives in the URL: a refresh lands
    where you were and the back button walks between tabs, both for free.
  -->
  <nav class="seg">
    {#each TABS as t}
      <a href="?tab={t}" class:on={data.tab === t}>
        {TAB_LABELS[t]}
      </a>
    {/each}
  </nav>

  <!-- Section-scoped messages render inside their own form, not up here. -->
  {#if form?.message && !form?.section}
    <div class="error" style="margin-bottom:14px">{form.message}</div>
  {/if}

  {#if data.tab === 'dompet'}
    <div class="toggle">
      <button class:on={view === 'saldo'} onclick={() => (view = 'saldo')}>Saldo</button>
      <button class:on={view === 'pengeluaran'} onclick={() => (view = 'pengeluaran')}>
        Pengeluaran
      </button>
    </div>

    {#if chart.slices.length || chart.excluded.length}
      <div class="panel donut-panel">
        {#if view === 'pengeluaran'}
          <!--
            Kelola has no stepper, so the month is stated rather than steppable.
            Leaving it unnamed would make the figure ambiguous.
          -->
          <div class="chart-cap">Pengeluaran · {data.spendMonth}</div>
        {/if}
        <CategoryDonut
          slices={chart.slices}
          total={chart.total}
          caption={view === 'saldo' ? 'Total Saldo' : 'Pengeluaran'}
          extra={excluded}
          href={(s) => (s.key ? `/transaksi?w=${s.key}` : null)}
        />
      </div>
    {:else}
      <p class="quiet">
        {view === 'saldo'
          ? 'Belum ada dompet berisi saldo.'
          : `Belum ada pengeluaran di ${data.spendMonth}.`}
      </p>
    {/if}

    <div class="panel" style="margin-bottom:14px">
      {#each activeWallets as w}
        {#if editing === w.id}
          <form
            method="POST"
            action="?/ubahDompet"
            use:enhance={() =>
              async ({ update, result }) => {
                await update();
                if (result.type === 'success') editing = null;
              }}
            class="edit"
          >
            <input type="hidden" name="id" value={w.id} />
            <div class="label">Nama Dompet</div>
            <input class="field" name="name" value={w.name} required />
            <!--
              Shown, not editable. Saldo Awal is the only balance figure stored
              anywhere, so changing it would rewrite every past Saldo with no
              Transaction to account for it. Saying so beats an absent field.
            -->
            <p class="locked">
              <span class="num">Saldo awal {rp(w.initial_balance)}</span> · tidak bisa diubah
            </p>
            <div class="add-actions">
              <button class="btn-primary">Simpan</button>
              <button type="button" class="btn-ghost" onclick={() => (editing = null)}>Batal</button>
            </div>
          </form>
        {:else}
          <div class="row">
            <span class="tile">{w.tag ?? w.name.slice(0, 3).toUpperCase()}</span>
            <span class="row-body">
              <span class="row-title">{w.name}</span>
              <span class="row-sub num">Saldo awal {rp(w.initial_balance)}</span>
            </span>
            <span class="right">
              <span class="num bal">{rp(w.balance)}</span>
            </span>
            <span class="menu-wrap" class:on={menu === w.id}>
              <button
                class="kebab"
                onclick={() => (menu = menu === w.id ? null : w.id)}
                aria-expanded={menu === w.id}
                aria-label="Aksi untuk {w.name}">⋮</button
              >
              {#if menu === w.id}
                <span class="menu">
                  <button class="menu-item" onclick={() => edit(w.id)}>Ubah</button>
                  <form
                    method="POST"
                    action="?/arsipDompet"
                    use:enhance={() =>
                      async ({ update }) => {
                        await update();
                        menu = null;
                      }}
                  >
                    <input type="hidden" name="id" value={w.id} />
                    <input type="hidden" name="archived" value="false" />
                    <button class="menu-item">Arsipkan</button>
                  </form>
                </span>
              {/if}
            </span>
          </div>
        {/if}
      {/each}

      {#if activeWallets.length}
        <div class="total">
          <span>Total</span>
          <span class="num">{rp(total)}</span>
        </div>
      {:else}
        <div class="row"><span class="row-sub">Belum ada dompet.</span></div>
      {/if}
    </div>

    {#if addingWallet}
      <form
        method="POST"
        action="?/tambahDompet"
        use:enhance={() =>
          async ({ update, result }) => {
            await update();
            if (result.type === 'success') addingWallet = false;
          }}
        class="add"
      >
        <div class="label">Nama Dompet</div>
        <input class="field" name="name" placeholder="mis. BCA" required />
        <div class="label mt">Jenis</div>
        <select class="field" name="type">
          <option value="cash">Tunai</option>
          <option value="bank">Rekening Bank</option>
          <option value="ewallet">E-Wallet</option>
          <option value="savings">Tabungan</option>
        </select>
        <div class="label mt">Saldo Awal</div>
        <MoneyInput name="initial_balance" label="Saldo Awal" />
        <div class="add-actions">
          <button class="btn-primary">Simpan</button>
          <button type="button" class="btn-ghost" onclick={() => (addingWallet = false)}>Batal</button>
        </div>
      </form>
    {:else}
      <button class="btn-dashed" onclick={() => (addingWallet = true)}>＋ Tambah Dompet</button>
    {/if}

    {#if archivedWallets.length}
      <div class="label section">Dompet Diarsipkan</div>
      <div class="panel archived">
        {#each archivedWallets as w}
          <div class="row">
            <span class="row-body"><span class="struck">{w.name}</span></span>
            <form method="POST" action="?/arsipDompet" use:enhance>
              <input type="hidden" name="id" value={w.id} />
              <input type="hidden" name="archived" value="true" />
              <button class="mini strong">Pulihkan</button>
            </form>
          </div>
        {/each}
      </div>
    {/if}

  {:else if data.tab === 'kategori'}
    {#each [['income', 'Kategori Pemasukan'], ['expense', 'Kategori Pengeluaran']] as [kind, title]}
      <div class="label">{title}</div>
      <div class="panel" style="margin-bottom:10px">
        {#each cats(kind as 'income' | 'expense', false) as c}
          {#if editing === c.id}
            <form
              method="POST"
              action="?/ubahKategori"
              use:enhance={() =>
                async ({ update, result }) => {
                  await update();
                  if (result.type === 'success') editing = null;
                }}
              class="edit"
            >
              <input type="hidden" name="id" value={c.id} />
              <div class="label">Nama Kategori</div>
              <input class="field" name="name" value={c.name} required />
              <div class="add-actions">
                <button class="btn-primary">Simpan</button>
                <button type="button" class="btn-ghost" onclick={() => (editing = null)}>
                  Batal
                </button>
              </div>
            </form>
          {:else}
            <div class="row">
              <span class="row-body"><span class="row-title">{c.name}</span></span>
              <span class="menu-wrap" class:on={menu === c.id}>
                <button
                  class="kebab"
                  onclick={() => (menu = menu === c.id ? null : c.id)}
                  aria-expanded={menu === c.id}
                  aria-label="Aksi untuk {c.name}">⋮</button
                >
                {#if menu === c.id}
                  <span class="menu">
                    <button class="menu-item" onclick={() => edit(c.id)}>Ubah</button>
                    <form
                      method="POST"
                      action="?/arsipKategori"
                      use:enhance={() =>
                        async ({ update }) => {
                          await update();
                          menu = null;
                        }}
                    >
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="archived" value="false" />
                      <button class="menu-item">Arsipkan</button>
                    </form>
                  </span>
                {/if}
              </span>
            </div>
          {/if}
        {:else}
          <div class="row"><span class="row-sub">Belum ada.</span></div>
        {/each}
      </div>

      {#if addingCategory === kind}
        <form
          method="POST"
          action="?/tambahKategori"
          use:enhance={() =>
            async ({ update, result }) => {
              await update();
              if (result.type === 'success') addingCategory = null;
            }}
          class="add"
        >
          <input type="hidden" name="kind" value={kind} />
          <input class="field" name="name" placeholder="Nama kategori" required />
          <div class="add-actions">
            <button class="btn-primary">Simpan</button>
            <button type="button" class="btn-ghost" onclick={() => (addingCategory = null)}>Batal</button>
          </div>
        </form>
      {:else}
        <button
          class="btn-dashed"
          style="margin-bottom:18px"
          onclick={() => (addingCategory = kind as 'income' | 'expense')}
        >
          ＋ Tambah {kind === 'income' ? 'Kategori Pemasukan' : 'Kategori Pengeluaran'}
        </button>
      {/if}
    {/each}

    {#if data.categories.some((c) => c.archived_at)}
      <div class="label section">Arsip</div>
      <div class="panel archived">
        {#each data.categories.filter((c) => c.archived_at) as c}
          <div class="row">
            <span class="row-body"><span class="struck">{c.name}</span></span>
            <form method="POST" action="?/arsipKategori" use:enhance>
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="archived" value="true" />
              <button class="mini strong">Pulihkan</button>
            </form>
          </div>
        {/each}
      </div>
    {/if}
  {:else}
    <!-- ------------------------------------------------------------ profil -->

    <div class="me">
      <form
        method="POST"
        action="?/ubahFoto"
        enctype="multipart/form-data"
        use:enhance={async ({ formData, cancel }) => {
          const picked = formData.get('photo');
          if (!(picked instanceof File) || !picked.size) {
            cancel();
            return;
          }
          uploading = true;
          try {
            formData.set('photo', await shrink(picked));
          } catch {
            // A file the browser cannot decode goes up as-is and is refused
            // server-side, which is where the real check lives anyway.
          }
          return async ({ update }) => {
            await update();
            uploading = false;
          };
        }}
      >
        <label class="photo" class:busy={uploading}>
          <!--
            The frame clips, the label does not. Putting the badge inside the
            circle would have `overflow: hidden` cut it in half.
          -->
          <span class="photo-frame">
            {#if data.profile.photo}
              <img src={data.profile.photo} alt="Foto profil" />
            {:else}
              <span class="photo-initials">{initials(data.profile.name)}</span>
            {/if}
          </span>
          <span class="photo-badge">{uploading ? '…' : '✎'}</span>
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            onchange={(e) => e.currentTarget.form?.requestSubmit()}
          />
        </label>
      </form>

      <div class="me-name">{data.profile.name ?? 'Anggota'}</div>
      <div class="me-mail">{data.account ?? '—'}</div>

      {#if data.profile.photo}
        <form method="POST" action="?/hapusFoto" use:enhance>
          <button class="mini">Hapus foto</button>
        </form>
      {/if}
    </div>

    {#if form?.section === 'foto' && form?.message}
      <div class="error" style="margin-bottom:14px">{form.message}</div>
    {/if}

    <div class="label section">Nama</div>
    <form
      method="POST"
      action="?/ubahNama"
      use:enhance={() =>
        async ({ update, result }) => {
          await update({ reset: false });
          if (result.type === 'success') editing = null;
        }}
      class="add"
    >
      {#if editing === 'nama'}
        <input class="field" name="name" value={data.profile.name ?? ''} required />
        <p class="locked">Nama ini muncul di setiap transaksi yang kamu catat.</p>
        {#if form?.section === 'nama' && form?.message}
          <div class="error" style="margin-top:10px">{form.message}</div>
        {/if}
        <div class="add-actions">
          <button class="btn-primary">Simpan</button>
          <button type="button" class="btn-ghost" onclick={() => (editing = null)}>Batal</button>
        </div>
      {:else}
        <div class="line">
          <span class="line-value">{data.profile.name ?? 'Anggota'}</span>
          <button type="button" class="mini strong" onclick={() => (editing = 'nama')}>Ubah</button>
        </div>
      {/if}
    </form>

    <div class="label section">Email</div>
    <div class="add">
      <div class="line">
        <span class="line-value break">{data.account ?? '—'}</span>
      </div>
      <!--
        Read-only on purpose, and said so. Changing it needs confirmation on the
        old address and the new one; an editable-looking field that cannot work
        would be worse than this sentence.
      -->
      <p class="locked">Email tidak bisa diubah di sini.</p>
    </div>

    <div class="label section">Sandi</div>
    {#if changingPassword}
      <form
        method="POST"
        action="?/ubahSandi"
        use:enhance={() =>
          async ({ update, result }) => {
            // A rejected attempt keeps what was typed, so a wrong current
            // password does not also cost the new one.
            await update({ reset: false });
            if (result.type === 'success') changingPassword = false;
          }}
        class="add"
      >
        <div class="label">Sandi saat ini</div>
        <input
          class="field"
          name="current"
          type="password"
          autocomplete="current-password"
          required
        />
        <div class="label mt">Sandi baru</div>
        <input
          class="field"
          name="next"
          type="password"
          autocomplete="new-password"
          minlength={MIN_PASSWORD}
          required
        />
        <div class="label mt">Ulangi sandi baru</div>
        <input
          class="field"
          name="confirm"
          type="password"
          autocomplete="new-password"
          minlength={MIN_PASSWORD}
          required
        />
        <p class="locked">Minimal {MIN_PASSWORD} karakter.</p>
        {#if form?.section === 'sandi' && form?.message}
          <div class="error" style="margin-top:10px">{form.message}</div>
        {/if}
        <div class="add-actions">
          <button class="btn-primary">Simpan</button>
          <button type="button" class="btn-ghost" onclick={() => (changingPassword = false)}>
            Batal
          </button>
        </div>
      </form>
    {:else}
      <div class="add">
        <div class="line">
          <span class="line-value">••••••••</span>
          <button type="button" class="mini strong" onclick={() => (changingPassword = true)}>
            Ubah
          </button>
        </div>
        {#if form?.section === 'sandi' && form?.ok}
          <p class="locked ok">{form.ok}</p>
        {/if}
      </div>
    {/if}

    <div class="label section">Rumah Tangga</div>
    <div class="panel">
      {#if editing === 'rumah'}
        <form
          method="POST"
          action="?/ubahRumah"
          use:enhance={() =>
            async ({ update, result }) => {
              await update({ reset: false });
              if (result.type === 'success') editing = null;
            }}
          class="edit"
        >
          <div class="label">Nama Rumah Tangga</div>
          <input class="field" name="name" value={data.household.name} required />
          {#if form?.section === 'rumah' && form?.message}
            <div class="error" style="margin-top:10px">{form.message}</div>
          {/if}
          <div class="add-actions">
            <button class="btn-primary">Simpan</button>
            <button type="button" class="btn-ghost" onclick={() => (editing = null)}>Batal</button>
          </div>
        </form>
      {:else}
        <div class="row">
          <span class="row-body">
            <span class="row-title">{data.household.name}</span>
            <span class="row-sub">{data.members.length} anggota</span>
          </span>
          <button class="mini strong" onclick={() => (editing = 'rumah')}>Ubah</button>
        </div>
      {/if}

      {#each data.members as m}
        <div class="row">
          <span class="circle">
            {#if m.photo}
              <img src={m.photo} alt="" />
            {:else}
              {initials(m.name)}
            {/if}
          </span>
          <span class="row-body"><span class="row-title">{m.name}</span></span>
          <span class="row-sub">{m.isMe ? 'Kamu' : 'Anggota'}</span>
        </div>
      {/each}

      <div class="invite">
        <div class="row-sub" style="margin-bottom:7px">
          Kode Undangan · bagikan untuk mengajak anggota
        </div>
        <div class="invite-row">
          <div class="num code">{data.household.invite_code}</div>
          <button class="copy" onclick={copyCode}>{copied ? 'Tersalin' : 'Salin'}</button>
        </div>
        <form method="POST" action="?/kodeBaru" use:enhance>
          <button class="mini" style="margin-top:9px">Ganti kode</button>
        </form>
      </div>
    </div>

    <!--
      Two steps, and the account named beside it: that is what makes signing out
      safe to reach on a shared device. Scope stays local (spec 0003), so this
      never signs the same Member out on another phone.
    -->
    <div class="footer">
      <div class="label">Masuk sebagai</div>
      <div class="account">{data.account ?? 'Anggota'}</div>

      {#if confirming}
        <div class="confirm">
          <form method="POST" action="/auth/keluar">
            <button class="out danger">Yakin keluar?</button>
          </form>
          <button class="out" onclick={() => (confirming = false)}>Batal</button>
        </div>
      {:else}
        <button class="out" onclick={() => (confirming = true)}>Keluar</button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .page {
    padding: 6px 18px 28px;
  }
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 5;
    background: none;
    border: none;
    padding: 0;
  }
  .seg {
    display: flex;
    background: var(--sunken);
    border-radius: 11px;
    padding: 4px;
    margin-bottom: 16px;
  }
  .seg a {
    flex: 1;
    text-align: center;
    padding: 9px;
    border-radius: 8px;
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text-muted);
    text-decoration: none;
  }
  .seg a.on {
    background: var(--card);
    color: var(--ink);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  /* Smaller than the segment control above it: this switches a figure, not a screen. */
  .toggle {
    display: flex;
    gap: 6px;
    margin-bottom: 12px;
  }
  .toggle button {
    flex: none;
    padding: 7px 13px;
    border-radius: 9px;
    font-size: 12.5px;
    font-weight: 700;
    border: 1.5px solid var(--line);
    background: var(--card);
    color: #7a756c;
  }
  .toggle button.on {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--ink-on-dark);
  }
  .donut-panel {
    padding: 14px 14px 8px;
    margin-bottom: 16px;
  }
  .chart-cap {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .quiet {
    font-size: 13px;
    color: var(--text-muted);
    background: var(--card);
    border: 1.5px dashed var(--line-dashed);
    border-radius: 12px;
    padding: 14px;
    margin: 0 0 16px;
  }

  .row-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .row-title {
    font-size: 14.5px;
    font-weight: 600;
  }
  .row-sub {
    font-size: 11.5px;
    color: var(--text-faint);
    margin-top: 1px;
  }
  .right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }
  .bal {
    font-size: 15px;
    font-weight: 700;
  }
  .total {
    display: flex;
    justify-content: space-between;
    padding: 13px 14px;
    background: var(--card-soft);
    font-size: 14px;
    font-weight: 700;
    color: var(--text-heading);
  }

  /* Only the open row rises above the backdrop that closes it. */
  .menu-wrap {
    position: relative;
    flex: none;
  }
  .menu-wrap.on {
    z-index: 6;
  }
  .kebab {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    font-size: 18px;
    line-height: 1;
    color: var(--text-muted);
    background: none;
  }
  .kebab:active {
    background: var(--sunken);
  }
  .menu {
    position: absolute;
    top: 32px;
    right: 0;
    min-width: 132px;
    display: flex;
    flex-direction: column;
    background: var(--card);
    border: 1.5px solid var(--line);
    border-radius: 10px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
    overflow: hidden;
  }
  .menu-item {
    width: 100%;
    text-align: left;
    padding: 11px 13px;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--ink);
    background: none;
    border-bottom: 1px solid var(--line-soft);
  }
  .menu form:last-child .menu-item {
    border-bottom: none;
  }
  .menu-item:active {
    background: var(--sunken);
  }

  .mini {
    font-size: 12px;
    color: var(--text-muted);
    border: 1.5px solid var(--line);
    border-radius: 7px;
    padding: 4px 9px;
    background: var(--card);
  }
  .mini.strong {
    color: var(--text-heading);
  }

  .label {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 7px;
  }
  .label.mt {
    margin-top: 12px;
  }
  .label.section {
    margin: 22px 0 7px;
  }

  .add,
  .edit {
    background: var(--card);
    border: 1.5px solid var(--line);
    border-radius: var(--r-card);
    padding: 14px;
  }
  .edit {
    border-bottom: 1px solid var(--line-soft);
    border-radius: 0;
  }
  .locked {
    font-size: 11.5px;
    color: var(--text-muted);
    margin: 9px 0 0;
  }
  .add-actions {
    display: flex;
    gap: 8px;
    margin-top: 14px;
  }

  .archived {
    background: #f4f1ea;
    border-style: dashed;
    border-color: #d5cfc4;
  }
  .struck {
    font-size: 13.5px;
    color: var(--text-faint);
    text-decoration: line-through;
  }

  .circle {
    width: 34px;
    height: 34px;
    flex: none;
    border-radius: 50%;
    background: #e7e1d6;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    color: #6b6459;
    font-size: 14px;
    overflow: hidden;
  }
  .circle img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  /* ------------------------------------------------------------- profil */

  .me {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 6px 0 20px;
  }
  /* The label is the control: the whole circle is the file picker. */
  /* A label is inline by default, which would drop the width and height. */
  .photo {
    display: block;
    position: relative;
    width: 92px;
    height: 92px;
    cursor: pointer;
    margin-bottom: 10px;
  }
  .photo.busy {
    opacity: 0.55;
  }
  .photo-frame {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #e7e1d6;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .photo-initials {
    font-size: 30px;
    font-weight: 800;
    color: #6b6459;
  }
  .photo-badge {
    position: absolute;
    right: 0;
    bottom: 2px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--ink);
    color: var(--ink-on-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    border: 2.5px solid var(--paper, #faf7f0);
  }
  .photo input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
  .me-name {
    font-size: 17px;
    font-weight: 800;
    color: var(--text-heading);
  }
  .me-mail {
    font-size: 12.5px;
    color: var(--text-faint);
    margin-bottom: 10px;
    word-break: break-all;
  }

  /* A stated value with its own control beside it, not a field. */
  .line {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .line-value {
    flex: 1;
    min-width: 0;
    font-size: 14.5px;
    font-weight: 600;
  }
  .line-value.break {
    word-break: break-all;
  }
  .locked.ok {
    color: var(--text-heading);
  }

  .invite {
    padding: 13px 14px;
    background: var(--card-soft);
  }
  .invite-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .code {
    flex: 1;
    letter-spacing: 0.14em;
    font-size: 18px;
    font-weight: 800;
    background: var(--card);
    border: 1.5px dashed #cfc9bd;
    border-radius: 10px;
    padding: 9px 12px;
    text-align: center;
  }
  .copy {
    flex: none;
    background: var(--ink);
    color: var(--ink-on-dark);
    border-radius: 10px;
    padding: 11px 14px;
    font-size: 13px;
    font-weight: 700;
  }

  .footer {
    margin-top: 26px;
    padding-top: 18px;
    border-top: 1px solid var(--line-soft);
  }
  .account {
    font-size: 13.5px;
    font-weight: 600;
    margin-bottom: 12px;
    word-break: break-all;
  }
  .confirm {
    display: flex;
    gap: 8px;
  }
  .out {
    padding: 11px 16px;
    border-radius: 10px;
    border: 1.5px solid var(--line);
    background: var(--card);
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text-muted);
  }
  /*
    The one place terracotta is right on this screen: it marks the tap that
    actually ends the session (ADR-0009).
  */
  .out.danger {
    border-color: var(--accent-soft-line);
    background: var(--accent-soft-bg);
    color: var(--accent-deep);
  }
</style>
