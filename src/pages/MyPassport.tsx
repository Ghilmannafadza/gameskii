import React, { useState } from 'react';
import { CheckCircle2, Clock, Coins, Crown, Edit3, Hash, IdCard, LogIn, Medal, SearchCheck, UploadCloud, XCircle } from 'lucide-react';
import { useStore } from '../lib/store';
import { href } from '../lib/router';
import { compressImage } from '../lib/image';
import { getAttributionsForAthlete, getCompetition } from '../data/pilot';
import { getRankEloDelta, getTier } from '../data/constants';
import { PassportCard } from '../components/PassportCard';
import { RankBadge } from '../components/cards';
import { EmptyState, SectionHeading, Stat } from '../components/ui';
import { PodiumHistory, TierProgress } from './AthleteProfile';

function ClaimPanel() {
  const { profile, claimCandidate, state, submitClaim, toast } = useStore();
  const [evidence, setEvidence] = useState('');
  const [proof, setProof] = useState<string | undefined>();
  const [err, setErr] = useState('');
  if (!profile) return null;
  const claims = state.claims.filter((c) => c.profile_id === profile.id);
  const pending = claims.find((c) => c.status === 'pending');
  const approved = claims.find((c) => c.status === 'approved' && c.target_athlete_id === profile.linked_athlete_id);
  const lastRejected = claims.find((c) => c.status === 'rejected');

  if (approved) {
    return (
      <div className="rounded-2xl bg-emerald-400/10 border border-emerald-400/20 p-5 flex gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0" />
        <div>
          <p className="text-white font-semibold">Riwayat {approved.target_ign} sudah ditautkan</p>
          <p className="text-[13px] text-soft mt-1">Disetujui panitia{approved.review_note ? `: “${approved.review_note}”` : '.'}</p>
        </div>
      </div>
    );
  }
  if (pending) {
    return (
      <div className="rounded-2xl bg-amber-400/10 border border-amber-400/20 p-5 flex gap-3">
        <Clock className="h-5 w-5 text-amber-300 shrink-0" />
        <div>
          <p className="text-white font-semibold">Klaim riwayat {pending.target_ign} sedang ditinjau</p>
          <p className="text-[13px] text-soft mt-1">Panitia akan mencocokkan bukti kepemilikan akunmu. Poin historis muncul setelah disetujui.</p>
        </div>
      </div>
    );
  }
  if (!claimCandidate) {
    if (profile.primary_game !== 'Free Fire') return null;
    return (
      <div className="rounded-2xl bg-ink-750 p-5 flex gap-3">
        <SearchCheck className="h-5 w-5 text-muted shrink-0" />
        <p className="text-[13px] text-soft">Tidak ada riwayat podium di arsip yang cocok dengan UID-mu. Prestasi baru bisa diajukan lewat <a className="text-gold hover:underline" href={href('/upload')}>Upload Hasil</a>.</p>
      </div>
    );
  }

  const hist = getAttributionsForAthlete(claimCandidate.uid_fingerprint);
  const send = () => {
    const r = submitClaim(evidence, proof);
    if (!r.ok) return setErr(r.error);
    setErr('');
    toast('Klaim dikirim ke panitia.');
  };

  return (
    <section className="rounded-2xl promo-card p-5 sm:p-6">
      <p className="th !text-white/60">Riwayat ditemukan</p>
      <h3 className="font-display text-[30px] text-white mt-1">{claimCandidate.ign} · {hist.length} podium</h3>
      <p className="text-[13px] text-white/75 mt-1 max-w-xl">UID-mu cocok dengan atlet di arsip. Karena UID Free Fire bersifat publik, panitia perlu memastikan akun ini benar milikmu sebelum poin dipindahkan.</p>
      {lastRejected && <p className="mt-3 text-[12.5px] text-[#ffc2d6]">Klaim sebelumnya ditolak: {lastRejected.review_note || 'tanpa catatan'}.</p>}
      <div className="mt-4 grid gap-2">
        {hist.slice(0, 4).map((a) => (
          <div key={a.result_id} className="flex items-center gap-3 rounded-lg bg-ink-950/30 px-3 py-2">
            <RankBadge rank={a.rank} />
            <span className="text-[13px] text-white truncate flex-1">{getCompetition(a.competition_id)?.name}</span>
            <span className="font-mono text-[12px] text-gold">+{getRankEloDelta(a.rank)}</span>
          </div>
        ))}
      </div>
      <label className="block mt-4">
        <span className="label !text-white/80">Bukti kepemilikan</span>
        <textarea className="input !bg-ink-950/40 min-h-[84px]" value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="Contoh: Saya kapten tim HALOMOK di Sumpah Pemuda 2026, bisa dikonfirmasi admin FFYK. Screenshot profil in-game terlampir." />
      </label>
      <label className="mt-3 flex items-center gap-3 text-[12.5px] text-white/80 cursor-pointer">
        <span className="btn btn-dark !py-2"><UploadCloud className="h-4 w-4" />{proof ? 'Ganti screenshot' : 'Lampirkan screenshot profil'}</span>
        <input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) try { setProof(await compressImage(f, 900)); } catch (x) { setErr((x as Error).message); } }} />
        {proof && <span className="text-emerald-300">Terlampir</span>}
      </label>
      {err && <p className="mt-3 text-[13px] text-[#ffc2d6]" role="alert">{err}</p>}
      <button onClick={send} className="btn btn-gold mt-4">Ajukan Klaim ke Panitia</button>
    </section>
  );
}

export default function MyPassport() {
  const { account, profile, leaderboard, state, openAuth, openOnboarding } = useStore();

  if (!account) {
    return (
      <EmptyState
        icon={LogIn}
        title="Masuk untuk melihat paspormu"
        text="Buat akun gratis, lalu terbitkan paspor atlet digital dengan Gameskii ID."
        action={<div className="flex justify-center gap-2"><button className="btn btn-gold" onClick={() => openAuth('signup')}>Daftar</button><button className="btn btn-dark" onClick={() => openAuth('signin')}>Masuk</button></div>}
      />
    );
  }
  if (!profile) {
    return (
      <EmptyState
        icon={IdCard}
        title="Paspor atlet belum dibuat"
        text="Isi game, UID, domisili, dan role. Hanya butuh 1 menit."
        action={<button className="btn btn-gold" onClick={openOnboarding}>Buat Paspor Sekarang</button>}
      />
    );
  }
  const me = leaderboard.find((a) => a.id === profile.id)!;
  const mySubs = state.submissions.filter((s) => s.user_id === account.id);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <div className="xl:col-span-5 space-y-4">
        <PassportCard athlete={me} showPrivate />
        <button onClick={openOnboarding} className="btn btn-dark w-full"><Edit3 className="h-4 w-4" />Edit Paspor</button>
        <div className="rounded-xl bg-ink-800/70 p-4 text-[12.5px] text-muted space-y-1">
          <p><span className="text-soft">Nama lengkap (privat):</span> {profile.full_name}</p>
          <p><span className="text-soft">WhatsApp (privat):</span> {profile.whatsapp}</p>
          <p><a className="text-cyan hover:underline" href={href(`/atlet/${profile.gameskii_id}`)}>Lihat tampilan publik →</a></p>
        </div>
      </div>
      <div className="xl:col-span-7 space-y-6">
        <ClaimPanel />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Peringkat" value={`#${me.rank}`} hint={`dari ${leaderboard.length} atlet`} icon={Hash} accent="#6aa0dd" />
          <Stat label="Poin" value={me.elo_points} tone="text-gold" icon={Coins} accent="#ffd21f" progress={getTier(me.elo_points).progress} hint={getTier(me.elo_points).name} />
          <Stat label="Juara 1" value={me.titles} icon={Crown} accent="#ffd21f" />
          <Stat label="Podium" value={me.podiums} icon={Medal} accent="#2cc6ef" hint={`${mySubs.filter((s) => s.status === 'Pending Review').length} menunggu verifikasi`} />
        </div>
        <TierProgress points={me.elo_points} />

        <section className="rounded-2xl panel p-5 sm:p-6">
          <SectionHeading title="Pengajuan Saya" subtitle="Status hasil turnamen yang kamu upload" right={<a href={href('/upload')} className="btn btn-gold !py-2"><UploadCloud className="h-4 w-4" />Upload</a>} />
          {mySubs.length === 0 ? (
            <EmptyState icon={UploadCloud} title="Belum ada pengajuan" text="Juara 1-3 di turnamen? Upload screenshot klasemen akhir untuk diverifikasi panitia." />
          ) : (
            <div className="space-y-2">
              {mySubs.map((s) => (
                <div key={s.id} className="rounded-xl bg-ink-750 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <RankBadge rank={s.rank_position} />
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-[14px] truncate">{s.competition_name}</p>
                      <p className="text-[12px] text-muted">{s.division} · {s.team_name} · diajukan {new Date(s.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</p>
                    </div>
                    <span className="text-[12px]">
                      {s.status === 'Verified' ? <span className="text-emerald-300 inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />+{getRankEloDelta(s.rank_position)}</span>
                        : s.status === 'Rejected' ? <span className="text-[#ff8db3] inline-flex items-center gap-1"><XCircle className="h-3.5 w-3.5" />Ditolak</span>
                        : s.status === 'Disputed' ? <span className="text-orange-300">Disanggah</span>
                        : <span className="text-amber-300 inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Menunggu</span>}
                    </span>
                  </div>
                  {(s.review_note || s.dispute) && (
                    <div className="mt-2 pl-10 text-[12px] text-muted space-y-0.5">
                      {s.dispute && <p>Sanggahan {s.dispute.by_name}: “{s.dispute.reason}”</p>}
                      {s.review_note && <p>Catatan panitia: “{s.review_note}”</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl panel p-5 sm:p-6">
          <SectionHeading title="Riwayat Podium" subtitle="Prestasi yang sudah dihitung ke poin" />
          <PodiumHistory athlete={me} submissions={state.submissions} />
        </section>
      </div>
    </div>
  );
}
