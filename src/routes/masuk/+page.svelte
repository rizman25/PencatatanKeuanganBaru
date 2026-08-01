<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();

  let mode = $state<'masuk' | 'daftar'>(form?.mode === 'daftar' ? 'daftar' : 'masuk');
  let busy = $state(false);
  let showPassword = $state(false);

  const isDaftar = $derived(mode === 'daftar');

  // Lucide eye / eye-off, the same source as every other icon in the app.
  const EYE =
    '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>';
  const EYE_OFF =
    '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>';
</script>

<svelte:head><title>Masuk · Maalify</title></svelte:head>

<!--
  Sits outside `.wrap` rather than inside it: `.wrap` centres its contents
  vertically, so a link placed in there would float in the middle of the screen
  instead of resting at the top where a back control belongs.

  Outside the `{#if}` too, so it is still there on the "cek emailmu" screen —
  that is the one state with no other way out.
-->
<div class="topbar">
  <a class="back" href="/">← Kembali</a>
</div>

<div class="wrap">
  {#if form?.checkEmail}
    <div class="centered">
      <div class="check">✓</div>
      <div class="sketch title">Cek emailmu</div>
      <p class="sub">
        Kami kirim tautan konfirmasi ke <b>{form.email}</b>. Buka tautan itu untuk
        menyelesaikan pendaftaran.
      </p>
    </div>
  {:else}
    <div class="brand">Rp</div>
    <div class="sketch title">Maalify</div>
    <p class="sub">
      Buku kas bersama untuk satu keluarga. {isDaftar
        ? 'Buat akun untuk mulai mencatat.'
        : 'Masuk untuk melanjutkan.'}
    </p>

    {#if form?.message || data.error}
      <div class="error" style="margin-top:18px">{form?.message ?? data.error}</div>
    {/if}

    <form
      method="POST"
      action="?/google"
      use:enhance={() => {
        busy = true;
        return async ({ update }) => {
          await update();
          busy = false;
        };
      }}
      style="margin-top:22px"
    >
      <button class="btn-ghost google" disabled={busy}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.14 6.16-4.14z"
          />
        </svg>
        Lanjut dengan Google
      </button>
    </form>

    <div class="or"><span></span>atau<span></span></div>

    <form
      method="POST"
      action={isDaftar ? '?/daftar' : '?/masuk'}
      use:enhance={() => {
        busy = true;
        return async ({ update }) => {
          await update();
          busy = false;
        };
      }}
    >
      {#if isDaftar}
        <div class="label">Nama</div>
        <input class="field" name="name" value={form?.name ?? ''} placeholder="mis. Rizman" />
      {/if}

      <div class="label" class:mt={isDaftar}>Email</div>
      <input
        class="field"
        name="email"
        type="email"
        inputmode="email"
        autocomplete="email"
        value={form?.email ?? ''}
        placeholder="nama@email.com"
      />

      <div class="label mt">Kata sandi</div>
      <!--
        A typed password is invisible by default and stays that way unless asked
        for — this only exists because a mistyped one on a phone keyboard is
        otherwise impossible to spot, and the sign-in error never says which of
        the two fields was wrong.
      -->
      <div class="pw">
        <input
          class="field pw-field"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autocomplete={isDaftar ? 'new-password' : 'current-password'}
          placeholder={isDaftar ? 'minimal 8 karakter' : '••••••••'}
        />
        <!--
          `type="button"`, or it would submit the form: a bare <button> inside a
          <form> defaults to submit, so tapping the eye would try to sign in.
        -->
        <button
          type="button"
          class="peek"
          aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          aria-pressed={showPassword}
          onclick={() => (showPassword = !showPassword)}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round">{@html showPassword ? EYE_OFF : EYE}</svg
          >
        </button>
      </div>

      <button class="btn-primary" style="margin-top:18px" disabled={busy}>
        {isDaftar ? 'Buat akun' : 'Masuk'}
      </button>
    </form>

    <button
      class="switch"
      onclick={() => {
        mode = isDaftar ? 'masuk' : 'daftar';
        // Hide it again on the way through. Switching modes is a fresh start,
        // and leaving a revealed password on screen is not what anyone expects.
        showPassword = false;
      }}
    >
      {isDaftar ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
    </button>

    <!--
      The policy is linked from the screen where an account is actually created,
      which is where consent is given and where Google looks for it.
    -->
    <p class="fine">
      Data kamu hanya terlihat oleh anggota rumah tanggamu.
      <a href="/privasi">Kebijakan Privasi</a>
    </p>
  {/if}
</div>

<style>
  .topbar {
    padding: 16px 26px 0;
  }
  .back {
    display: inline-block;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-muted);
    text-decoration: none;
  }

  .wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    /* Top padding trimmed by the topbar's height, so the form stays centred. */
    padding: 20px 26px 32px;
  }
  .brand {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: var(--ink);
    color: var(--ink-on-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 800;
    margin-bottom: 20px;
  }
  .title {
    font-size: 28px;
    color: var(--ink);
    line-height: 1.1;
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
  .label.mt {
    margin-top: 14px;
  }
  .google {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .pw {
    position: relative;
  }
  /* Room for the eye, so a long password never runs underneath it. */
  .pw-field {
    padding-right: 44px;
  }
  .peek {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    width: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-dim);
  }
  .peek:hover {
    color: var(--text-heading);
  }
  .or {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 20px 0;
    font-size: 12px;
    color: var(--text-ghost);
  }
  .or span {
    flex: 1;
    height: 1px;
    background: var(--line);
  }
  .switch {
    margin-top: 16px;
    font-size: 13.5px;
    color: var(--text-muted);
    text-align: center;
    width: 100%;
    font-weight: 600;
  }
  .fine {
    font-size: 12px;
    color: var(--text-ghost);
    text-align: center;
    margin-top: 20px;
    line-height: 1.6;
  }
  .fine a {
    color: var(--text-muted);
  }
  .centered {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .check {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--ok-bg);
    color: var(--ok-text);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
    margin-bottom: 18px;
  }
</style>
