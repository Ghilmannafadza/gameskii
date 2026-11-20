import React from 'react';
import { ChevronDown } from 'lucide-react';
import { PageHero } from '../components/layout';
import { IMG } from '../lib/assets';
import { href } from '../lib/router';

const FAQ: { q: string; a: React.ReactNode }[] = [
  { q: 'Bagaimana poin dihitung?', a: <>Setiap atlet mulai dari 1.200 poin. Juara 1 +50, Juara 2 +35, Juara 3 +25. Peringkat 4 ke bawah tidak menambah poin. Ini poin prestasi, bukan Elo berbasis kekuatan lawan.</> },
  { q: 'Kenapa ada label PROVISIONAL?', a: <>Poin dari arsip diturunkan dari 4 slot utama roster pendaftaran, bukan dari lineup yang terbukti bermain di final. Panitia perlu mengonfirmasi lineup sebelum peringkat bisa disebut resmi.</> },
  { q: 'UID saya cocok dengan riwayat, kenapa poinnya belum masuk?', a: <>UID Free Fire bisa dilihat siapa saja, jadi kecocokan UID belum membuktikan kepemilikan. Ajukan klaim di <a className="text-cyan hover:underline" href={href('/paspor')}>Paspor Saya</a>; panitia akan meminta bukti (misalnya konfirmasi kapten atau screenshot profil) sebelum memindahkan riwayat.</> },
  { q: 'Saya pindah tim. Apakah prestasi lama hilang?', a: <>Tidak. Prestasi tercatat ke atlet (UID), sementara nama tim disimpan sebagai keterangan saat event.</> },
  { q: 'Bagaimana cara menyanggah hasil orang lain?', a: <>Buka <a className="text-cyan hover:underline" href={href('/upload')}>Upload Hasil</a>, cari pengajuan di daftar “Hasil Terbaru”, lalu tekan Sanggah. Panitia memutuskan apakah hasil tetap berlaku atau dibatalkan, dan kedua pihak mendapat notifikasi.</> },
  { q: 'Siapa yang bisa melihat data pribadi saya?', a: <>Nama lengkap, WhatsApp, UID penuh, dan screenshot bukti hanya untuk kamu dan panitia. Publik hanya melihat IGN, Gameskii ID, wilayah, role, dan 4 digit terakhir UID.</> },
];

export default function Help() {
  return (
    <div className="space-y-6">
      <PageHero image={IMG.help} title="Bantuan" subtitle="Cara kerja poin, klaim riwayat, sanggahan, dan privasi." />
      <div className="grid gap-3 max-w-3xl">
        {FAQ.map((f) => (
          <details key={f.q} className="group rounded-xl panel px-5 py-4 open:bg-ink-750">
            <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-white text-[15px] font-medium">
              {f.q}
              <ChevronDown className="h-4 w-4 text-muted transition group-open:rotate-180" />
            </summary>
            <p className="text-[13.5px] text-soft mt-3 leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
      <div className="rounded-xl bg-ink-800/70 px-5 py-4 text-[13px] text-soft max-w-3xl">
        Butuh bantuan lain? Hubungi admin komunitas Free Fire Yogyakarta yang menyelenggarakan kompetisimu dan sebutkan Gameskii ID-mu.
      </div>
    </div>
  );
}
