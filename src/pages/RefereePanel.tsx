import React, { useState } from 'react';
import { Check, Eye, Gavel, ShieldAlert, X } from 'lucide-react';
import { useStore } from '../lib/store';
import { href } from '../lib/router';
import { IMG, imageForCompetition } from '../lib/assets';
import { getAttributionsForAthlete, PILOT_FREE_FIRE_ATHLETES } from '../data/pilot';
import { getRankEloDelta } from '../data/constants';
import type { MatchSubmission, UidClaim } from '../types';
import { PageHero } from '../components/layout';
import { Art, Avatar, EmptyState, StatusBadge } from '../components/ui';
import { RankBadge } from '../components/cards';
import { ProofModal } from './SubmitResult';

type Tab = 'queue' | 'disputes' | 'claims' | 'history';

function Decision({ onApprove, onReject, approveLabel, rejectLabel, disabledReason }: { onApprove: (note: string) => string | void; onReject: (note: string) => string | void; approveLabel: string; rejectLabel: string; disabledReason?: string }) {
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const run = (fn: (n: string) => string | void) => {
    const e = fn(note);
    setErr(e || '');
    if (!e) setNote('');
  };
  if (disabledReason) return <p className="text-[12px] text-amber-300 mt-3">{disabledReason}</p>;
  return (
    <div className="mt-3 space-y-2">
      <input className="input !py-2 text-[13px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan keputusan (wajib untuk penolakan)" />
      {err && <p className="text-[12px] text-[#ffb3cb]" role="alert">{err}</p>}
      <div className="flex gap-2 justify-end">
        <button onClick={() => run(onReject)} className="btn btn-danger !py-2"><X className="h-4 w-4" />{rejectLabel}</button>
        <button onClick={() => run(onApprove)} className="btn btn-gold !py-2"><Check className="h-4 w-4" />{approveLabel}</button>
      </div>
    </div>
  );
}

export default function RefereePanel() {
  const { isReferee, account, state, reviewResult, resolveDispute, reviewClaim, toast } = useStore();
  const [tab, setTab] = useState<Tab>('queue');
  const [proof, setProof] = useState<string | null>(null);

  if (!isReferee || !account) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Khusus panitia"
        text="Halaman ini hanya untuk panitia/wasit. Aktifkan mode panitia (demo) di Pengaturan dengan kode dari penyelenggara."
        action={<a href={href('/pengaturan')} className="btn btn-dark">Buka Pengaturan</a>}
      />
    );
  }

  const queue = state.submissions.filter((s) => s.status === 'Pending Review');
  const disputes = state.submissions.filter((s) => s.status === 'Disputed');
  const claims = state.claims.filter((c) => c.status === 'pending');
  const history = [...state.submissions.filter((s) => s.status === 'Verified' || s.status === 'Rejected')];

  const tabs: { id: Tab; label: string; n: number }[] = [
    { id: 'queue', label: 'Antrian Hasil', n: queue.length },
    { id: 'disputes', label: 'Sanggahan', n: disputes.length },
    { id: 'claims', label: 'Klaim UID', n: claims.length },
    { id: 'history', label: 'Riwayat', n: history.length },
  ];

  const SubCard = ({ s, children }: { s: MatchSubmission; children: React.ReactNode }) => (
    <article className="rounded-xl bg-ink-750 border border-white/[0.05] p-4 hover:border-white/10 transition-colors">
      <div className="flex items-start gap-3">
        {s.competition_id ? <Art src={imageForCompetition(s.competition_id)} className="relative h-12 w-16 rounded-lg shrink-0" /> : <Avatar seed={s.player_ign} size={40} />}
        <div className="min-w-0 flex-1">
          <p className="text-white text-[14px]"><a className="font-semibold hover:text-gold" href={href(`/atlet/${s.gameskii_id}`)}>{s.player_ign}</a> <span className="font-mono text-[11px] text-muted">{s.gameskii_id}</span></p>
          <p className="text-[12.5px] text-soft">{s.competition_name} · {s.division} · Tim {s.team_name}</p>
          <p className="text-[11.5px] text-muted font-mono">Final {new Date(s.event_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })} · diajukan {new Date(s.created_at).toLocaleDateString('id-ID')}{s.competition_id ? ' · ada di arsip' : ' · kompetisi baru'}</p>
          {s.note && <p className="text-[12px] text-soft mt-1.5">Catatan atlet: “{s.note}”</p>}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <RankBadge rank={s.rank_position} />
          <StatusBadge status={s.status} />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 text-[12px]">
        <button onClick={() => setProof(s.proof_url)} className="inline-flex items-center gap-1 text-cyan hover:underline"><Eye className="h-3.5 w-3.5" />Periksa screenshot</button>
        {s.competition_id && <a href={href(`/kompetisi/${s.competition_id}`)} className="text-soft hover:text-gold">Bandingkan klasemen arsip →</a>}
        <span className="ml-auto font-mono text-gold">+{getRankEloDelta(s.rank_position)}</span>
      </div>
      {children}
    </article>
  );

  const ClaimCard = ({ c }: { c: UidClaim }) => {
    const target = PILOT_FREE_FIRE_ATHLETES.find((a) => a.id === c.target_athlete_id);
    const hist = getAttributionsForAthlete(target?.uid_fingerprint);
    return (
      <article className="rounded-xl bg-ink-750 p-4">
        <p className="text-white text-[14px]"><b>{c.profile_ign}</b> mengklaim riwayat <b className="text-gold">{c.target_ign}</b></p>
        <p className="text-[12px] text-muted mt-0.5">{hist.length} podium · UID cocok via fingerprint (UID publik, butuh bukti tambahan)</p>
        <p className="text-[13px] text-soft mt-2 rounded-lg bg-ink-800 px-3 py-2">“{c.evidence_note}”</p>
        {c.proof_url && <button onClick={() => setProof(c.proof_url!)} className="mt-2 inline-flex items-center gap-1 text-[12px] text-cyan hover:underline"><Eye className="h-3.5 w-3.5" />Lihat screenshot profil</button>}
        <Decision
          approveLabel="Setujui Klaim"
          rejectLabel="Tolak"
          disabledReason={c.account_id === account.id ? 'Klaim milikmu sendiri harus ditinjau panitia lain.' : undefined}
          onApprove={(n) => { const r = reviewClaim(c.id, true, n); if (!r.ok) return r.error; toast('Klaim disetujui. Riwayat dipindahkan ke paspor atlet.'); }}
          onReject={(n) => { if (n.trim().length < 5) return 'Tulis alasan penolakan.'; const r = reviewClaim(c.id, false, n); if (!r.ok) return r.error; toast('Klaim ditolak.', 'info'); }}
        />
      </article>
    );
  };

  return (
    <div className="space-y-6">
      <PageHero image={IMG.referee} compact eyebrow={<span className="inline-flex items-center gap-1.5 rounded-md bg-cyan/15 text-cyan px-2 py-[3px] text-[11px]"><span className="status-dot bg-cyan" />Mode panitia · demo</span>} title="Panel Panitia" subtitle="Panitia tidak bisa memproses pengajuan atau sanggahan yang melibatkan dirinya sendiri.">
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl">
          {[
            ['Antrian', queue.length, '#ffd21f'],
            ['Sanggahan', disputes.length, '#fb923c'],
            ['Klaim UID', claims.length, '#2cc6ef'],
            ['Diputus', history.length, '#34d399'],
          ].map(([l, n, c]) => (
            <div key={l as string} className="rounded-xl bg-ink-950/35 border border-white/[0.08] px-3.5 py-2.5">
              <p className="flex items-center gap-1.5 text-[11px] text-white/60"><span className="status-dot" style={{ background: c as string }} />{l as string}</p>
              <p className="text-[24px] font-semibold text-white num leading-tight">{n as number}</p>
            </div>
          ))}
        </div>
      </PageHero>
      <div className="flex gap-1 overflow-x-auto no-scrollbar rounded-xl bg-ink-800/70 p-1.5">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`top-tab shrink-0 ${tab === t.id ? 'active' : ''}`}>
            {t.label}
            <span className={`font-mono text-[11px] rounded-md min-w-[20px] px-1.5 py-px ${t.n && t.id !== 'history' ? 'bg-gold text-ink-950 font-bold' : 'bg-white/5 text-muted'}`}>{t.n}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {tab === 'queue' && (queue.length === 0 ? <EmptyState icon={Gavel} title="Antrian kosong" text="Tidak ada hasil yang menunggu verifikasi." /> : queue.map((s) => (
          <SubCard key={s.id} s={s}>
            <Decision
              approveLabel="Verifikasi"
              rejectLabel="Tolak"
              disabledReason={s.user_id === account.id ? 'Ini pengajuanmu sendiri. Harus diverifikasi panitia lain.' : undefined}
              onApprove={(n) => { const r = reviewResult(s.id, true, n); if (!r.ok) return r.error; toast(`Hasil ${s.player_ign} diverifikasi.`); }}
              onReject={(n) => { const r = reviewResult(s.id, false, n); if (!r.ok) return r.error; toast('Pengajuan ditolak.', 'info'); }}
            />
          </SubCard>
        )))}
        {tab === 'disputes' && (disputes.length === 0 ? <EmptyState icon={Gavel} title="Tidak ada sanggahan" /> : disputes.map((s) => (
          <SubCard key={s.id} s={s}>
            {s.dispute && <p className="mt-3 rounded-lg bg-orange-400/10 text-orange-200 text-[12.5px] px-3 py-2">Sanggahan {s.dispute.by_name}: “{s.dispute.reason}”</p>}
            <Decision
              approveLabel="Hasil Tetap Berlaku"
              rejectLabel="Batalkan Hasil"
              disabledReason={s.user_id === account.id || s.dispute?.by_account_id === account.id ? 'Kamu terlibat dalam sanggahan ini.' : undefined}
              onApprove={(n) => { const r = resolveDispute(s.id, true, n); if (!r.ok) return r.error; toast('Sanggahan ditolak, hasil diverifikasi.'); }}
              onReject={(n) => { const r = resolveDispute(s.id, false, n); if (!r.ok) return r.error; toast('Sanggahan diterima, hasil dibatalkan.', 'info'); }}
            />
          </SubCard>
        )))}
        {tab === 'claims' && (claims.length === 0 ? <EmptyState icon={Gavel} title="Tidak ada klaim UID" /> : claims.map((c) => <ClaimCard key={c.id} c={c} />))}
        {tab === 'history' && (history.length === 0 ? <EmptyState icon={Gavel} title="Belum ada keputusan" /> : history.map((s) => (
          <SubCard key={s.id} s={s}>{s.review_note && <p className="mt-2 text-[12px] text-muted">Catatan: “{s.review_note}”</p>}</SubCard>
        )))}
      </div>
      <ProofModal url={proof} onClose={() => setProof(null)} />
    </div>
  );
}
