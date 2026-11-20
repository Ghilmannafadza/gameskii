# Changelog

## v7 - Logo Gameskii & link preview (2026-11-20)

- Logo diganti dengan logo resmi Gameskii (dari @gameskii.official), digambar ulang sebagai SVG: wordmark untuk navbar landing, modal masuk, footer; ikon jajar genjang untuk panel kiri, kartu paspor, dan favicon.
- Link preview: meta Open Graph + Twitter Card dengan gambar `public/og-image.png` (1200x630) berisi judul, deskripsi, dan top atlet.
- URL gambar preview dibuat absolut otomatis saat build di Vercel. Kalau memakai domain sendiri, isi env `SITE_URL` (contoh `https://gameskii.id`) di Vercel.

## v6 - Foto per game, logo ESI hanya di footer (2026-11-20)

- Foto landing diganti foto event asli per game dari Wikimedia Commons: Free Fire World Cup, MLBB di Malaysia Digital Content Festival, PUBG Mobile Star Challenge, PES di Gamescom, dan Piala Presiden Esports untuk hero. Kartu kompetisi memakai 10 foto berbeda.
- Baris kredit di footer dihapus. Atribusi lisensi CC BY/BY-SA dipindah ke Pengaturan > Kredit Aset.
- Logo ESI DIY dihapus dari navbar dan hero; hanya tampil di footer.

## v5 - Landing dirapikan, identitas ESI DIY (2026-11-20)

- Landing memakai komponen yang sama dengan dashboard: panel hero, stat bar, kartu top 3 bergaya kartu turnamen, tabel leaderboard, kartu kompetisi.
- Dihapus: indikator "Live", badge "Provisional", catatan tulisan tangan dan elemen dekoratif di landing.
- Portal dikelola Pengurus Provinsi ESI D.I. Yogyakarta: logo ESI DIY (dari profil Instagram resmi @esi_diy) di navigasi landing, hero, footer landing, dan footer dashboard.
- Semua tanda em dash dan en dash di teks website diganti.

## v4 - Landing page publik (2026-11-20)

- `#/` sekarang landing page publik; dashboard pindah ke `#/dashboard`. Logo di panel kiri kembali ke landing.
- Hero: top 3 per kategori game (Free Fire, Mobile Legends, PUBG Mobile, eFootball) dengan podium 2-1-3. Game tanpa data menampilkan slot kosong, bukan data karangan.
- Leaderboard keseluruhan dengan tab per game, pencarian, dan tombol ke dashboard dengan filter game terpasang.
- Poin per game: arsip Free Fire + hasil terverifikasi untuk game itu saja (`boardFor` di store).
- Live: angka dihitung ulang otomatis saat ada perubahan, termasuk dari tab/jendela lain (event `storage`), dengan indikator "Live · x dtk lalu".
- CSS komponen dipindah ke `@layer components` supaya utilitas responsif (`hidden`, `sm:*`) selalu menang.

## v3 - Detail pass per komponen (2026-11-20)

- Dropdown kustom (keyboard, ikon, hint) menggantikan semua `<select>` bawaan browser.
- Foto diberi color grading seragam, skeleton saat memuat, dan satu foto unik per kompetisi. Bug gambar cache yang tetap transparan diperbaiki.
- Hero dashboard: kartu "Atlet Teratas" berisi data asli (bukan foto stok), catatan tulisan tangan, stat bar ber-ikon.
- Leaderboard: podium 2-1-3 di header, header kolom bisa diurutkan, progres tier per baris, aksen emas saat hover.
- Detail kompetisi: baris metadata + kartu podium per divisi.
- Kartu paspor bergaya paspor: guilloche, foil, chip, QR, field dwibahasa, baris MRZ.
- Jalur tier bertitik, kartu statistik ber-ikon, empty state berilustrasi, toast dengan timer, trofi emas/perak & koin buatan sendiri, tooltip di icon rail.
- Font Caveat (OFL) untuk anotasi, dibundel lokal.

## v2 - Redesign UI/UX & perbaikan alur (2026-11-20)

- **UI baru** mengikuti referensi dashboard esports: icon rail game, sidebar ber-avatar, top bar dengan tab, filter bar, hero banner, kartu turnamen, tabel leaderboard. Responsif dengan drawer + bottom nav di ponsel.
- **Data arsip kini terlihat**: halaman Kompetisi (overview/klasemen/arsip), detail kompetisi dengan klasemen per divisi, roster tertaut, link sumber; riwayat podium di profil atlet.
- **Login/logout nyata** (lokal dengan hash password, atau Supabase Auth). Crash tombol demo `INITIAL_DIY_ATHLETES` dihapus.
- **Klaim UID** lewat persetujuan panitia, tidak lagi tautan otomatis.
- **Upload hasil** terhubung ke kompetisi/divisi/tim/tanggal, anti-duplikat, screenshot dikompres.
- **Panel Panitia** terpisah; verifikasi diri sendiri diblokir; sanggahan punya penyelesaian; notifikasi.
- **Statistik jujur**: Juara 1/Podium/Event menggantikan win/loss; progres tier benar; peringkat seri.
- **Privasi**: nama, WhatsApp, UID penuh, bukti hanya untuk pemilik & panitia. Label “resmi ESI” dihapus, diganti status provisional/terverifikasi.
- Paspor: QR asli dan unduh kartu PNG. Profil publik bisa dibagikan via URL.
- Dependensi tak terpakai (`@google/genai`, `express`, `dotenv`, `esbuild`, `tsx`, `autoprefixer`) dihapus; huruf dibundel lokal.

## v1 - Arsip Google AI Studio


- **UI/UX**: layout, warna, font, ikon, gambar, struktur navigasi dan kartu dipertahankan; perubahan visual hanya teks/opsi pada selector peringkat Upload Result (1-3).
- **Poin**: #1 +50, #2 +35, #3 +25; posisi lain 0; 1.200 poin baseline demo.
- **Data**: 10 kompetisi yang sudah diaudit + 132 baris final + 33 podium + fingerprint per atlet.
- **Identitas**: penelusuran prestasi berdasarkan UID hash, bukan nama tim. Roster cadangan, UID hilang dan respons ambigu diberi flag.
- **Privasi**: tidak menyertakan PII mentah dari spreadsheet registrasi di ZIP.
- **Data lama**: akun dummy dan hasil mock dari arsip awal tidak otomatis menjadi seed lokal aktif; data FFYK baru yang dimuat.
- **Simulasi**: tombol verifikasi tetap ada (bagian UI asli), namun bukan otorisasi wasit sungguhan. Skema SQL opsional menyediakan pembatasan akses.
- **Batas resmi**: semua ranking historis impor masih PROVISIONAL.
