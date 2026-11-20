# Gameskii - Esports Athlete Passport & Leaderboard DIY (FFYK Pilot 10 Kompetisi)

Prototipe paspor atlet esports dan leaderboard prestasi podium untuk komunitas D.I. Yogyakarta. Versi 2 merombak alur (peran pengunjung/atlet/panitia, klaim UID, sanggahan) dan seluruh UI.

## Data pilot (snapshot 5 November 2026)

Data ini berasal dari **Google Drive Yogyakarta Free Fire Community** dan workbook audit `Gameskii FFYK | Pilot 10 Kompetisi - Klasemen & Audit Sumber (2026-11-05)`.

| Entitas | Jumlah | Letak |
|---|---:|---|
| Kompetisi | **10** | `src/data/pilot-free-fire.json` → `competitions` |
| Divisi final | **11** | Dua divisi dari IFL S3 adalah satu kompetisi |
| Baris klasemen final | **132** | `standings` - semua 12 finalis tiap divisi |
| Juara 1-3 | **33** | `podiums` |
| Tag roster pada podium | **137** | `team_memberships` (termasuk cadangan/nama tanpa UID) |
| Atribusi prestasi individu sementara | **98** | `achievement_attributions` |
| Identitas pemain dengan UID terhash | **78** | `athletes` |
| Pemain terlihat di lebih dari satu tim | **11** | Tetap satu identitas individu |

Seluruh kompetisi dan klasemen tersedia sebagai **data pendukung lokal yang langsung dimuat aplikasi**, bukan sekadar contoh pada README. Prototipe berjalan tanpa menghubungkan Supabase. Detail sumber setiap kompetisi, baris hasil final, dan status pencocokan tercatat di JSON tersebut. Untuk tampilan leaderboard, sistem menghitung ulang nilai dari `achievement_attributions`, bukan dari nama tim.

### Skema poin - hanya podium

| Rank final | Poin yang dikreditkan ke pemain yang lolos flagging |
|---|---:|
| 1 | **+50** |
| 2 | **+35** |
| 3 | **+25** |
| 4-16 / lainnya | **0 dan tidak dimasukkan ke leaderboard prestasi** |

Setiap pemain memulai dari **1.200 poin** untuk simulasi. Istilah `elo_points` dipertahankan agar kompatibel dengan UI arsip lama. **Perhitungannya adalah poin prestasi berbasis podium, bukan Elo matematis berdasarkan kekuatan lawan**.

### Flagging prestasi ke individu, tidak terikat satu tim

- Identitas antar-event menggunakan **fingerprint SHA-256 dari UID Free Fire** dengan format input terstandardisasi. UID asli **tidak dimasukkan ke project ZIP**.
- Setiap hasil podium memiliki `competition_id`, `division`, `team_at_event`, `rank`, dan `achievement_delta`. Pemain yang masuk tim berbeda pada turnamen berikutnya tetap menerima agregasi prestasi pada UID yang sama.
- `team_name` pada paspor hanya keterangan terakhir/"Lintas Tim", bukan kunci relasi prestasi. Catatan sejarah ada di `team_memberships` dan `achievement_attributions`.
- Hanya **empat slot utama yang terdaftar** yang dapat mendapat poin **sementara**. Cadangan tidak otomatis diberi poin. Empat slot pendaftaran **bukan** bukti lineup bermain di final.
- Nama pemain saja tanpa UID **tidak** disatukan dengan orang lain yang kebetulan memakai nickname sama. Hasil tim tetap masuk `standings` dan `podiums` untuk ditinjau, tetapi tidak diberi poin individu.
- Identitas hasil impor yang belum memiliki domisili/role terkonfirmasi ditampilkan sebagai **Belum Terverifikasi / Belum Ditentukan**, bukan dikarang sebagai atlet wilayah/role tertentu.
- Bila pengguna memasukkan UID yang sama di onboarding Free Fire, prototipe bisa menautkan data historis dengan fingerprint UID dalam **mode lokal**. Ini **bukan verifikasi kepemilikan akun**, dan tidak boleh digunakan untuk klaim resmi tanpa autentikasi dan konfirmasi organizer.

### Batas validasi dan catatan penting

**SELURUH POIN ATLET DARI ARSIP ADALAH `PROVISIONAL_ROSTER_MATCH`, BUKAN RANKING RESMI/TERSERTIFIKASI.** Kecocokan nama tim di formulir dan klasemen tidak membuktikan susunan empat pemain yang betul-betul bertanding.

- Audit sebelumnya menemukan **9 respons tim duplikat dan 2 nama tim mirip** dari 132 baris final.
- Untuk podium, hasil **TRUST PROCESS (C01, rank 3)** memerlukan konfirmasi kesamaan nama; **PSSJ TEAM CERIA (C08, rank 1)** memiliki beberapa respons pendaftaran. Keduanya disimpan sebagai podium, **tanpa poin individu otomatis**.
- AXIS Cup Kota (C09) dan Bantul (C10) menyimpan roster dengan format nama bebas, sering **tanpa UID Free Fire yang dapat dipastikan**. Kedua kompetisi tetap masuk database dengan tiga juara masing-masing, tetapi pemain tanpa UID **tidak diberi poin individu**.
- Sumber tim juara C10 rank 3 tidak menghasilkan roster yang layak ditautkan otomatis. Diberi flag `INCOMPLETE_PRIMARY_ROSTER`.
- Sebagian formulir utama memiliki UID kosong atau duplikasi slot kapten; hanya atribusi yang memenuhi filter dimasukkan ke leaderboard. Untuk validasi resmi perlu lineup final, kontrol peran wasit, dan proses banding.
- **Do not interpret** `wins/matches_played` pada data impor sebagai *win rate pertandingan*: `matches_played` adalah jumlah tampil di podium pada arsip, `wins` adalah jumlah gelar juara 1; total partisipasi dan kekalahan pemain belum dikumpulkan.
- Tampilan aplikasi asli menggunakan label seperti *resmi/ESI*. Label UI **dipertahankan atas permintaan**, bukan merupakan bukti afiliasi atau otorisasi lembaga.

### Privasi data

Data yang **dikecualikan dari ZIP**: nama legal, nomor WhatsApp, email, rekening, bukti pembayaran, foto KTP, dan UID Free Fire mentah. JSON berisi IGN, UID fingerprint, UID tersamar (`••••1234`), klasemen, serta link dokumen sumber. **Jangan menjadikan fingerprint sebagai autentikasi**.

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # produksi
npm run verify   # validasi data pilot
```

Data lokal memakai kunci `gameskii_state_v4`. Data prototipe lama (`*_ff_pilot_v3`) sengaja tidak dibaca karena berisi poin "terverifikasi" yang bisa dipalsukan dari sisi klien.

## Alur aplikasi (v2)

| Peran | Alur |
|---|---|
| **Pengunjung** | Dashboard → Kompetisi (klasemen final 10 event, roster tertaut, link sumber) → Leaderboard → profil publik atlet `#/atlet/DIY-XXX-0000` |
| **Atlet** | Daftar/Masuk (email + password) → Buat paspor 3 langkah (game & UID → domisili & role → data pribadi) → jika UID cocok dengan arsip: **Ajukan klaim** (bukan tautan otomatis) → Upload hasil (wajib pilih kompetisi, divisi, tim, juara 1-3, screenshot) |
| **Panitia** | Pengaturan → Mode Panitia (kode demo `WASIT-DIY-2026`) → Panel Panitia: antrian hasil, sanggahan, klaim UID, riwayat |

Aturan yang ditegakkan di kode (`src/lib/store.tsx`):

- Poin leaderboard **dihitung ulang** dari arsip + hasil berstatus `Verified`, tidak disimpan/dimutasi oleh klien.
- Panitia tidak bisa memverifikasi/menyelesaikan pengajuan atau sanggahan yang melibatkan dirinya.
- Atlet tidak bisa menyanggah hasilnya sendiri; penyanggah otomatis memakai identitas akunnya.
- Status: `Pending Review → Verified / Rejected`, `Disputed → Verified (hasil tetap) / Rejected (dibatalkan)`. Kedua pihak mendapat notifikasi.
- Pengajuan ganda (atlet + kompetisi + divisi yang sama) ditolak, termasuk prestasi yang sudah ada di arsip.
- UID yang sama tidak bisa dipakai dua paspor. Mengganti UID membatalkan tautan riwayat.
- Peringkat seri berbagi nomor yang sama (1, 2, 2, 4).
- Data privat (nama lengkap, WhatsApp, UID penuh, screenshot bukti) hanya terlihat oleh pemilik dan panitia.

## Desain

UI mengikuti referensi dashboard esports gelap: icon rail game di kiri, sidebar dengan avatar + level, top bar dengan breadcrumb dan tab (Overview/Ladder/Arsip), filter bar, hero banner dengan judul condensed, kartu turnamen dengan pill poin kuning, dan tabel bergaya leaderboard.

- Huruf: Bebas Neue (judul), Space Grotesk (teks), JetBrains Mono (chip/angka) - dibundel via `@fontsource`, tidak bergantung Google Fonts.
- Foto: Unsplash (Unsplash License), dimuat dari CDN; jika gagal, otomatis diganti gradien.
- Ikon game: ikon resmi Play Store untuk Free Fire, MLBB, PUBG Mobile (merek dagang pemiliknya); eFootball memakai glyph Konami lokal.
- Avatar: DiceBear Adventurer (CC BY 4.0), dibuat lokal dari fingerprint UID.

### Supabase (opsional)

Pengaturan → Database. Jika diisi, login memakai Supabase Auth dan profil disinkronkan. Skema aplikasi (dengan RLS: atlet tidak bisa mengubah status, bucket bukti privat, poin sebagai VIEW) bisa disalin dari halaman yang sama. Arsip pilot tetap di `supabase/pilot_schema.sql` + `pilot_seed.sql`.

## Struktur

```
src/
  App.tsx                 shell + hash router (#/kompetisi, #/atlet/:id, ...)
  lib/store.tsx           state, auth, aturan verifikasi/sanggahan/klaim, leaderboard turunan
  lib/router.ts, assets.ts, avatar.ts, image.ts (kompres screenshot), supabase.ts
  components/layout.tsx   IconRail, Sidebar, Topbar, MobileNav, PageHero
  components/ui.tsx       Avatar, GameIcon, SmartImage, Modal, Toasts, badge, dll.
  components/cards.tsx    TournamentCard, RankBadge
  components/PassportCard.tsx  kartu paspor + QR asli + unduh PNG
  pages/                  Dashboard, Competitions (+detail), Leaderboard, AthleteProfile,
                          MyPassport, SubmitResult, RefereePanel, Settings, Help
  data/pilot.ts           agregasi arsip per UID
```

**Tindakan sebelum publikasi:** verifikasi peserta terdaftar vs lineup yang benar-benar bertanding, periksa duplikasi/identitas, bangun akses wasit dan pencatatan audit server-side, pisahkan identitas/PII privat dari daftar publik, serta ubah label *resmi* jika belum ada mandat penyelenggara.
