<script lang="ts">
  /**
   * The public landing page. The only screen written for someone who is not a
   * Member yet, so it is the only one allowed to explain the app rather than
   * simply be it. Signed-in Members never reach it — `+page.server.ts` sends
   * them to their books first.
   *
   * Vocabulary is CONTEXT.md's throughout: Dompet, Transaksi, Kategori,
   * Anggaran, Hutang, Saldo Awal. Someone who reads this page and then signs in
   * should meet exactly the words they were just promised.
   */
  import { rp } from '$lib/format';
  import { rollUp } from '$lib/chart';
  import CategoryDonut from '$lib/components/CategoryDonut.svelte';
  import CashflowBars from '$lib/components/CashflowBars.svelte';

  /**
   * The preview below renders the *real* chart components against invented
   * figures — not screenshots, and not a second implementation that could drift
   * away from what the app actually draws. Redesign a chart and this page
   * follows automatically.
   *
   * Every figure is internally consistent: the donut sums to the same
   * `SAMPLE_SPEND` printed in its centre and in August's bar, and the budget
   * rows below use the same per-category amounts as the donut slices. A visitor
   * who adds the numbers up should find they agree.
   */
  const SAMPLE_SPEND = 5_810_000;
  const SAMPLE_INCOME = 8_500_000;

  const SAMPLE_SLICES = rollUp(
    new Map([
      ['Belanja Dapur', 2_450_000],
      ['Transportasi', 1_180_000],
      ['Listrik & Air', 720_000],
      ['Sekolah Anak', 650_000],
      ['Cicilan Hutang', 500_000],
      ['Jajan & Kopi', 310_000]
    ])
  );

  const SAMPLE_MONTHS = [
    { label: 'Mei', selected: false, income: 8_500_000, expense: 6_420_000 },
    { label: 'Jun', selected: false, income: 9_150_000, expense: 7_030_000 },
    { label: 'Jul', selected: false, income: 8_500_000, expense: 5_240_000 },
    { label: 'Agu', selected: true, income: SAMPLE_INCOME, expense: SAMPLE_SPEND }
  ];

  /**
   * One budget of each state — aman, hampir habis, terlampaui — so the preview
   * shows what all three look like. The `spent` figures are the same ones the
   * donut slices carry; only the limits differ, which is what moves each row
   * into a different state.
   */
  const SAMPLE_BUDGETS = [
    { name: 'Belanja Dapur', spent: 2_450_000, limit: 4_000_000 },
    { name: 'Transportasi', spent: 1_180_000, limit: 1_400_000 },
    { name: 'Jajan & Kopi', spent: 310_000, limit: 250_000 }
  ].map((b) => {
    const pct = Math.round((b.spent / b.limit) * 100);
    return { ...b, pct, over: pct > 100, near: pct >= 80 && pct <= 100 };
  });

  // Lucide outlines, the same source as the bottom navigation's.
  const FEATURES = [
    {
      icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      title: 'Satu buku kas, satu rumah',
      body: 'Setiap anggota punya login sendiri dan melihat catatan yang sama. Gabung cukup dengan kode undangan — tidak ada atasan, semua sama rata.'
    },
    {
      icon: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
      title: 'Dompet dengan saldo yang tidak pernah meleset',
      body: 'Tunai, rekening bank, e-wallet, tabungan. Saldo selalu dihitung ulang dari Saldo Awal ditambah seluruh transaksi, jadi tidak ada angka simpanan yang bisa basi.'
    },
    {
      icon: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
      title: 'Catat dalam hitungan detik',
      body: 'Pemasukan, Pengeluaran, dan Transfer antar dompet. Tanggal hari ini dan dompet terakhir sudah terisi, tinggal ketik jumlahnya — cukup cepat untuk dipakai sambil berdiri di kasir.'
    },
    {
      icon: '<path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"/><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>',
      title: 'Lihat ke mana uang pergi',
      body: 'Grafik pemasukan dan pengeluaran per kategori untuk setiap bulan, ditambah arus kas empat bulan terakhir. Pindah bulan cukup satu ketukan.'
    },
    {
      icon: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
      title: 'Anggaran yang diisi sekali saja',
      body: 'Tentukan batas belanja per kategori dan batas itu berlaku terus sampai kamu mengubahnya. Bulan lama tetap dinilai dengan angka yang berlaku waktu itu.'
    },
    {
      icon: '<path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17"/><path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/><path d="m2 16 6 6"/><circle cx="16" cy="9" r="2.9"/><circle cx="6" cy="5" r="3"/>',
      title: 'Hutang dan piutang yang terhitung sendiri',
      body: 'Sisa hutang berkurang otomatis setiap kali kamu mencatat pembayaran, lengkap dengan riwayat cicilan dan pengingat jatuh tempo.'
    },
    {
      icon: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
      title: 'Tidak ada yang perlu dihitung manual',
      body: 'Saldo, sisa hutang, dan peringatan anggaran semuanya dihitung ulang saat halaman dibuka. Tidak ada tombol "hitung ulang" dan tidak ada angka yang bisa ketinggalan.'
    },
    {
      icon: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
      title: 'Terpasang di layar utama',
      body: 'Bisa dipasang seperti aplikasi biasa di HP Android maupun iPhone. Tidak ada yang perlu diunduh dari toko aplikasi.'
    }
  ];

  const STEPS = [
    {
      title: 'Buat rumah tangga',
      body: 'Daftar dengan Google atau email, lalu beri nama rumah tanggamu. Butuh waktu kurang dari satu menit.'
    },
    {
      title: 'Bagikan kode undangan',
      body: 'Kirim kodenya ke pasangan atau anggota keluarga lewat WhatsApp. Mereka masuk dengan akun sendiri ke buku kas yang sama.'
    },
    {
      title: 'Isi saldo awal, lalu catat',
      body: 'Masukkan saldo dompetmu hari ini sebagai Saldo Awal. Setelah itu cukup catat transaksinya — sisanya dihitung sendiri.'
    }
  ];

  const FAQ = [
    {
      q: 'Apakah gratis?',
      a: 'Ya. Tidak ada langganan, tidak ada batas jumlah transaksi, dan tidak ada iklan.'
    },
    {
      q: 'Berapa orang yang bisa gabung?',
      a: 'Sebanyak anggota keluargamu. Semua punya hak yang sama — tidak ada yang jadi admin dan tidak ada yang dibatasi.'
    },
    {
      q: 'Apakah harus online?',
      a: 'Ya, aplikasi ini perlu koneksi internet. Sebagai gantinya, catatan yang dibuat di satu HP langsung terlihat di HP yang lain.'
    },
    {
      q: 'Bagaimana kalau salah catat?',
      a: 'Transaksi bisa diubah atau dihapus kapan saja, dan saldo ikut menyesuaikan sendiri. Dompet dan kategori lama diarsipkan, bukan dihapus, supaya laporan bulan lalu tidak berubah.'
    },
    {
      q: 'Apakah datanya aman?',
      a: 'Catatanmu hanya bisa dibuka oleh anggota rumah tanggamu, dan pembatasannya berlaku di tingkat basis data. Selengkapnya ada di Kebijakan Privasi.'
    }
  ];
</script>

<svelte:head>
  <title>Maalify · Buku kas bersama untuk satu keluarga</title>
  <meta
    name="description"
    content="Maalify mencatat pemasukan, pengeluaran, anggaran, dan hutang satu rumah tangga di satu tempat. Setiap anggota punya login sendiri dan melihat catatan yang sama."
  />
</svelte:head>

<!--
  Sticks on a phone, which is the case that matters. On a wide screen the frame
  in the root layout is `overflow: hidden`, so this simply scrolls away with the
  page instead — a graceful loss, not a broken header.
-->
<header class="top">
  <a class="wordmark" href="/">
    <span class="mark" aria-hidden="true">Rp</span>
    <span class="sketch name">Maalify</span>
  </a>
  <a class="top-cta" href="/masuk">Masuk</a>
</header>

<div class="page">
  <section class="hero">
    <span class="badge">Gratis · tanpa iklan</span>
    <h1 class="sketch title">Uang rumah,<br />satu catatan</h1>
    <p class="lead">
      Buku kas bersama untuk satu keluarga. Kamu dan pasanganmu mencatat di HP masing-masing,
      dan keduanya melihat angka yang sama — tanpa saling tanya sudah bayar apa belum.
    </p>
    <a class="btn-primary cta" href="/masuk">Mulai sekarang</a>
    <p class="fine">Cukup satu menit untuk membuat rumah tangga pertama.</p>
  </section>

  <!-- ============ Preview: the real components, invented figures ============ -->
  <section class="preview">
    <div class="preview-head">
      <h2 class="sketch section-title">Seperti ini tampilannya</h2>
      <span class="tag">Contoh</span>
    </div>

    <div class="saldo">
      <div class="saldo-label">Total Saldo · semua dompet</div>
      <div class="num saldo-figure">{rp(24_380_000)}</div>
      <div class="saldo-split">
        <div>
          <div class="saldo-sub">Pemasukan · Agustus</div>
          <div class="num saldo-amt">+ {rp(SAMPLE_INCOME)}</div>
        </div>
        <div>
          <div class="saldo-sub">Pengeluaran · Agustus</div>
          <div class="num saldo-amt">− {rp(SAMPLE_SPEND)}</div>
        </div>
      </div>
    </div>

    <div class="gap">
      <CashflowBars months={SAMPLE_MONTHS} title="Arus Kas · 4 bulan" />
    </div>

    <div class="gap">
      <div class="mini-label">Pengeluaran per Kategori</div>
      <div class="panel donut-panel">
        <CategoryDonut slices={SAMPLE_SLICES} total={SAMPLE_SPEND} caption="Pengeluaran" />
      </div>
    </div>

    <div class="gap">
      <div class="mini-label">Anggaran bulan ini</div>
      <div class="panel budgets">
        {#each SAMPLE_BUDGETS as b}
          <div class="budget">
            <div class="budget-top">
              <span class="budget-name">{b.name}</span>
              <span class="budget-pct" class:warn={b.pct >= 80}>{b.pct}%</span>
            </div>
            <div class="track">
              <div
                class="fill"
                class:over={b.over}
                class:near={b.near}
                style="width:{Math.min(b.pct, 100)}%"
              ></div>
            </div>
            <div class="budget-foot">
              <span class="num">Terpakai {rp(b.spent)}</span>
              <span class="num">Batas {rp(b.limit)}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <p class="fine left">
      Angka di atas hanya contoh. Grafiknya sendiri adalah grafik yang sama persis dengan yang
      kamu pakai nanti.
    </p>
  </section>

  <!-- ============ Features ============ -->
  <section class="features">
    <h2 class="sketch section-title">Yang bisa dilakukan</h2>
    {#each FEATURES as f}
      <article class="panel feature">
        <div class="tile" aria-hidden="true">
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round">{@html f.icon}</svg
          >
        </div>
        <div class="copy">
          <h3 class="sketch feature-title">{f.title}</h3>
          <p class="feature-body">{f.body}</p>
        </div>
      </article>
    {/each}
  </section>

  <!-- ============ How it works ============ -->
  <section class="steps">
    <h2 class="sketch section-title">Cara mulainya</h2>
    <ol>
      {#each STEPS as s, i}
        <li>
          <span class="step-no" aria-hidden="true">{i + 1}</span>
          <div class="copy">
            <h3 class="sketch feature-title">{s.title}</h3>
            <p class="feature-body">{s.body}</p>
          </div>
        </li>
      {/each}
    </ol>
  </section>

  <!-- ============ FAQ ============ -->
  <section class="faq">
    <h2 class="sketch section-title">Pertanyaan yang sering muncul</h2>
    {#each FAQ as item}
      <details class="panel qa">
        <summary>{item.q}</summary>
        <p>{item.a}</p>
      </details>
    {/each}
  </section>

  <section class="closing">
    <h2 class="sketch closing-title">Siap mulai?</h2>
    <p class="lead">
      Buat rumah tangga baru, lalu bagikan kode undangannya ke anggota keluarga yang lain.
    </p>
    <a class="btn-primary cta" href="/masuk">Masuk atau daftar</a>
  </section>

  <footer class="foot">
    <a href="/privasi">Kebijakan Privasi</a>
    <span aria-hidden="true">·</span>
    <span>Maalify</span>
  </footer>
</div>

<style>
  /* ---------- header ---------- */
  .top {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 18px;
    background: color-mix(in srgb, var(--surface) 88%, transparent);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--line-soft);
  }
  .wordmark {
    display: flex;
    align-items: center;
    gap: 9px;
    text-decoration: none;
  }
  .mark {
    width: 30px;
    height: 30px;
    border-radius: 9px;
    background: var(--ink);
    color: var(--ink-on-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12.5px;
    font-weight: 800;
  }
  .name {
    font-size: 17px;
    color: var(--ink);
  }
  .top-cta {
    font-size: 13px;
    font-weight: 700;
    color: var(--ink);
    text-decoration: none;
    border: 1.5px solid var(--line);
    border-radius: var(--r-btn);
    padding: 7px 15px;
    background: var(--card);
  }

  /* ---------- shared ---------- */
  .page {
    flex: 1;
    padding: 30px 18px 26px;
  }
  .section-title {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 11px;
  }
  .lead {
    font-size: 14.5px;
    line-height: 1.6;
    color: var(--text-muted);
    margin: 12px 0 0;
  }
  .cta {
    margin-top: 20px;
    text-decoration: none;
  }
  .fine {
    font-size: 12.5px;
    color: var(--text-faint);
    text-align: center;
    margin: 10px 0 0;
    line-height: 1.55;
  }
  .fine.left {
    text-align: left;
    margin-top: 12px;
  }
  .copy {
    min-width: 0;
  }
  .feature-title {
    font-size: 15px;
    margin: 1px 0 0;
    color: var(--ink);
  }
  .feature-body {
    font-size: 13.5px;
    line-height: 1.55;
    color: var(--text-muted);
    margin: 5px 0 0;
  }

  /* ---------- hero ---------- */
  .badge {
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-heading);
    background: var(--tile);
    border: 1px solid var(--tile-line);
    border-radius: 999px;
    padding: 5px 11px;
  }
  .title {
    font-size: 33px;
    line-height: 1.08;
    margin: 15px 0 0;
    color: var(--ink);
  }

  /* ---------- preview ---------- */
  .preview {
    margin-top: 42px;
  }
  .preview-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .tag {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-faint);
    border: 1px dashed var(--line-dashed);
    border-radius: 6px;
    padding: 2px 7px;
    margin-bottom: 11px;
  }
  .gap {
    margin-top: 13px;
  }
  .mini-label {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--text-heading);
    margin-bottom: 8px;
  }
  .donut-panel {
    padding: 16px 14px 8px;
  }

  .saldo {
    background: var(--ink);
    border-radius: var(--r-panel);
    padding: 18px 18px 16px;
    color: var(--ink-on-dark);
  }
  .saldo-label {
    font-size: 12.5px;
    letter-spacing: 0.03em;
    color: var(--text-on-ink);
  }
  .saldo-figure {
    font-size: 30px;
    font-weight: 700;
    letter-spacing: -0.01em;
    margin-top: 5px;
  }
  .saldo-split {
    display: flex;
    gap: 22px;
    margin-top: 15px;
    border-top: 1px solid var(--line-on-ink);
    padding-top: 13px;
  }
  .saldo-sub {
    font-size: 11.5px;
    color: var(--text-on-ink);
  }
  .saldo-amt {
    font-size: 15px;
    font-weight: 700;
    margin-top: 2px;
  }

  /* Same shape as the Anggaran rows, reduced to what a preview needs. */
  .budgets {
    padding: 14px;
  }
  .budget + .budget {
    margin-top: 14px;
    padding-top: 13px;
    border-top: 1px solid var(--line-soft);
  }
  .budget-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .budget-name {
    font-size: 14px;
    font-weight: 700;
  }
  .budget-pct {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-muted);
  }
  .budget-pct.warn {
    color: var(--accent);
  }
  .track {
    height: 9px;
    background: var(--sunken);
    border-radius: 5px;
    margin: 9px 0 8px;
    overflow: hidden;
  }
  .fill {
    height: 100%;
    background: var(--ink);
    border-radius: 5px;
  }
  .fill.near {
    background: var(--accent-warn-bar);
  }
  .fill.over {
    background: var(--accent);
  }
  .budget-foot {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--text-muted);
  }

  /* ---------- features ---------- */
  .features {
    margin-top: 42px;
  }
  .feature {
    display: flex;
    gap: 13px;
    align-items: flex-start;
    padding: 15px;
    margin-bottom: 10px;
  }
  .tile {
    flex: none;
    width: 36px;
    height: 36px;
    border-radius: 11px;
    background: var(--tile);
    border: 1px solid var(--tile-line);
    color: var(--text-heading);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ---------- steps ---------- */
  .steps {
    margin-top: 42px;
  }
  .steps ol {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .steps li {
    display: flex;
    gap: 13px;
    align-items: flex-start;
    padding-bottom: 18px;
    position: relative;
  }
  /* The rail joining the numbers, stopping short of the last one. */
  .steps li:not(:last-child)::before {
    content: '';
    position: absolute;
    left: 15px;
    top: 34px;
    bottom: 4px;
    width: 1.5px;
    background: var(--line);
  }
  .step-no {
    flex: none;
    width: 31px;
    height: 31px;
    border-radius: 50%;
    background: var(--card);
    border: 1.5px solid var(--line);
    color: var(--text-heading);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 800;
    position: relative;
    z-index: 1;
  }

  /* ---------- faq ---------- */
  .faq {
    margin-top: 34px;
  }
  .qa {
    padding: 13px 15px;
    margin-bottom: 9px;
  }
  .qa summary {
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    list-style: none;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }
  .qa summary::-webkit-details-marker {
    display: none;
  }
  .qa summary::after {
    content: '+';
    color: var(--text-ghost);
    font-size: 17px;
    line-height: 1;
    flex: none;
  }
  .qa[open] summary::after {
    content: '−';
  }
  .qa p {
    font-size: 13.5px;
    line-height: 1.6;
    color: var(--text-muted);
    margin: 9px 0 0;
  }

  /* ---------- closing ---------- */
  .closing {
    margin-top: 38px;
    padding: 24px 18px 22px;
    border-radius: var(--r-panel);
    background: var(--card-soft);
    border: 1px solid var(--line-soft);
    text-align: center;
  }
  .closing-title {
    font-size: 21px;
    margin: 0;
    color: var(--ink);
  }

  .foot {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 26px;
    font-size: 12.5px;
    color: var(--text-faint);
  }
  .foot a {
    color: var(--text-muted);
  }
</style>
