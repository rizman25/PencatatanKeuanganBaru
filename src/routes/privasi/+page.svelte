<script lang="ts">
  /**
   * Public, and deliberately reachable without a session — Google's OAuth
   * consent screen requires a privacy policy at a URL it can fetch anonymously,
   * and so does anyone deciding whether to sign up.
   *
   * Every claim here is checked against what the code actually does. Nothing is
   * aspirational: if the app grows a feature that changes one of these
   * paragraphs, the paragraph changes in the same commit.
   */
  const UPDATED = '1 Agustus 2026';

  /**
   * The one thing that cannot be derived from the code. Put a real address here
   * before the page goes live — a policy with nowhere to write to is not a
   * policy, and Google checks this page.
   */
  const CONTACT = 'ganti-dengan-email-kamu@contoh.com';
</script>

<svelte:head>
  <title>Kebijakan Privasi · Maalify</title>
  <meta
    name="description"
    content="Data apa saja yang disimpan Maalify, di mana disimpan, dan siapa yang bisa melihatnya."
  />
</svelte:head>

<div class="page">
  <a class="back" href="/">← Kembali</a>

  <h1 class="sketch title">Kebijakan Privasi</h1>
  <p class="updated">Terakhir diperbarui {UPDATED}</p>

  <div class="panel summary">
    <p>
      Singkatnya: catatan keuanganmu hanya bisa dilihat oleh anggota rumah tanggamu sendiri.
      Kami tidak menjual data, tidak memasang iklan, dan tidak melacak perilakumu di aplikasi.
    </p>
  </div>

  <h2 class="sketch head">Data yang kami simpan</h2>
  <ul>
    <li>
      <b>Identitas akun.</b> Alamat email dan nama tampilan. Kalau kamu masuk lewat Google, nama
      dan email itu berasal dari akun Google-mu. Kata sandi tidak pernah kami simpan dalam bentuk
      yang bisa dibaca.
    </li>
    <li>
      <b>Foto profil.</b> Hanya kalau kamu mengunggahnya sendiri, dan bisa kamu hapus kapan saja
      lewat menu Kelola.
    </li>
    <li>
      <b>Catatan keuangan.</b> Dompet dan saldo awalnya, seluruh transaksi beserta tanggal,
      jumlah, kategori dan catatannya, anggaran, serta hutang dan piutang.
    </li>
    <li>
      <b>Rumah tangga.</b> Nama rumah tangga, kode undangannya, dan siapa saja anggotanya.
    </li>
  </ul>
  <p class="note">
    Kami tidak mengumpulkan lokasi, kontak, atau isi apa pun dari HP-mu di luar yang kamu ketik
    sendiri ke dalam aplikasi.
  </p>

  <h2 class="sketch head">Siapa yang bisa melihatnya</h2>
  <p>
    Hanya anggota rumah tangga yang sama denganmu. Pembatasan ini dijalankan di tingkat basis
    data, bukan sekadar disembunyikan di tampilan — permintaan data dari akun di luar rumah
    tanggamu tidak akan mengembalikan baris apa pun. Foto profil disimpan di penyimpanan tertutup
    dan setiap kali ditampilkan dibuatkan tautan sementara yang kedaluwarsa dengan sendirinya.
  </p>
  <p>
    Kami tidak menjual, menyewakan, atau membagikan datamu ke pihak lain, dan tidak memakainya
    untuk iklan.
  </p>

  <h2 class="sketch head">Layanan pihak ketiga</h2>
  <ul>
    <li>
      <b>Supabase</b> — menyimpan basis data, akun, dan foto profil, serta menangani proses masuk.
    </li>
    <li>
      <b>Vercel</b> — tempat aplikasi ini dijalankan. Seperti layanan web pada umumnya, alamat IP
      tercatat sementara di log server untuk keperluan keamanan dan penanganan gangguan.
    </li>
    <li>
      <b>Google</b> — hanya kalau kamu memilih masuk dengan Google. Yang kami terima darinya
      adalah nama, alamat email, dan foto profil akunmu.
    </li>
    <li>
      <b>Google Fonts</b> — huruf pada aplikasi ini dimuat dari server Google, sehingga alamat IP
      perangkatmu terlihat oleh Google saat halaman dibuka.
    </li>
  </ul>
  <p class="note">
    Tidak ada layanan analitik, piksel pelacak, atau iklan di aplikasi ini.
  </p>

  <h2 class="sketch head">Cookie</h2>
  <p>
    Hanya cookie sesi, yaitu penanda yang membuatmu tetap masuk sampai kamu menekan Keluar. Tidak
    ada cookie iklan maupun pelacakan, jadi tidak ada yang perlu kamu setujui di sini.
  </p>

  <h2 class="sketch head">Menyimpan dan menghapus data</h2>
  <p>
    Data disimpan selama akunmu masih ada. Di dalam aplikasi, dompet dan kategori yang tidak
    dipakai lagi diarsipkan, bukan dihapus, supaya riwayat bulan-bulan sebelumnya tidak berubah.
    Foto profil adalah pengecualian: foto lama benar-benar dihapus begitu kamu menggantinya.
  </p>
  <p>
    Kalau kamu ingin akun beserta seluruh catatanmu dihapus permanen, kirim permintaan ke alamat
    di bawah dan kami hapus dalam waktu wajar. Perlu diingat, transaksi yang kamu catat juga
    menjadi bagian dari buku kas rumah tangga yang dilihat anggota lain.
  </p>

  <h2 class="sketch head">Anak-anak</h2>
  <p>Aplikasi ini ditujukan untuk orang dewasa yang mengurus keuangan rumah tangganya sendiri.</p>

  <h2 class="sketch head">Perubahan kebijakan</h2>
  <p>
    Kalau kebijakan ini berubah, tanggal di atas ikut berubah. Perubahan yang berdampak besar akan
    kami sampaikan di dalam aplikasi.
  </p>

  <h2 class="sketch head">Kontak</h2>
  <p>
    Ada pertanyaan soal data kamu? Kirim email ke <a href="mailto:{CONTACT}">{CONTACT}</a>.
  </p>

  <footer class="foot"><a href="/">Maalify</a></footer>
</div>

<style>
  .page {
    flex: 1;
    padding: 28px 22px 34px;
  }

  .back {
    display: inline-block;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-muted);
    text-decoration: none;
    margin-bottom: 18px;
  }

  .title {
    font-size: 26px;
    line-height: 1.15;
    margin: 0;
    color: var(--ink);
  }
  .updated {
    font-size: 12.5px;
    color: var(--text-faint);
    margin: 6px 0 18px;
  }

  .summary {
    padding: 15px;
    background: var(--card-soft);
    margin-bottom: 8px;
  }
  .summary p {
    margin: 0;
  }

  .head {
    font-size: 16px;
    color: var(--ink);
    margin: 26px 0 0;
  }

  p,
  li {
    font-size: 13.5px;
    line-height: 1.6;
    color: var(--text-muted);
  }
  p {
    margin: 9px 0 0;
  }
  ul {
    margin: 9px 0 0;
    padding-left: 19px;
  }
  li {
    margin-bottom: 7px;
  }
  li b {
    color: var(--text-heading);
  }
  .note {
    font-size: 12.5px;
    color: var(--text-faint);
  }

  .foot {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid var(--line-soft);
    text-align: center;
    font-size: 12.5px;
    color: var(--text-faint);
  }
</style>
