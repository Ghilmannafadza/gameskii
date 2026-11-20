import React, { useMemo, useState } from 'react';
import { AlertTriangle, BadgeCheck, Eye, FileText, ImagePlus, Info, LogIn, SearchCheck, Trophy, UploadCloud } from 'lucide-react';
import { useStore } from '../lib/store';
import { href } from '../lib/router';
import { IMG, imageForCompetition } from '../lib/assets';
import { compressImage } from '../lib/image';
import { COMPETITIONS, getCompetition, getDivisions } from '../data/pilot';
import { GAME_OPTIONS, MATCH_TYPES, getRankEloDelta, getTier } from '../data/constants';
import type { GameName, MatchSubmission, MatchType, SubmissionStatus } from '../types';
import { PageHero } from '../components/layout';
import { Art, Avatar, CoinIcon, Dropdown, EmptyState, GameIcon, Modal, SectionHeading, StatusBadge } from '../components/ui';
import { RankBadge } from '../components/cards';

const OTHER = '__other__';

export function ProofModal({ url, onClose }: { url: string | null; onClose: () => void }) {
  return (
    <Modal open={Boolean(url)} onClose={onClose} title="Bukti Klasemen" width="max-w-3xl">
      {url && <img src={url} alt="Screenshot bukti" className="w-full rounded-xl" />}
    </Modal>
  );
}

function SubmissionForm({ presetComp }: { presetComp?: string }) {
  const { profile, submitResult, toast } = useStore();
  const [compId, setCompId] = useState(presetComp && getCompetition(presetComp) ? presetComp : COMPETITIONS[0].id);
  const [customName, setCustomName] = useState('');
  const [matchType, setMatchType] = useState<MatchType>('Turnamen Komunitas');
  const [game, setGame] = useState<GameName>(profile?.primary_game || 'Free Fire');
  const divisions = compId === OTHER ? [] : getDivisions(compId);
  const [division, setDivision] = useState(divisions[0] || 'Battle Royale');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [team, setTeam] = useState(profile?.team_name || '');
  const [rank, setRank] = useState<1 | 2 | 3>(1);
  const [proof, setProof] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const comp = getCompetition(compId);

  const onComp = (id: string) => {
    setCompId(id);
    const d = id === OTHER ? [] : getDivisions(id);
    setDivision(d[0] || '');
    if (id !== OTHER) setGame('Free Fire');
  };

  const onFile = async (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) return setErr('Bukti harus berupa gambar (JPG, PNG, WebP).');
    setBusy(true);
    try {
      setProof(await compressImage(f));
      setErr('');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = submitResult({
      competition_id: compId === OTHER ? null : compId,
      competition_name: compId === OTHER ? customName.trim() : comp!.name,
      match_type: compId === OTHER ? matchType : 'Turnamen Komunitas',
      game_name: compId === OTHER ? game : (comp!.game as GameName),
      division: division.trim() || 'Utama',
      event_date: date,
      team_name: team.trim(),
      rank_position: rank,
      proof_url: proof,
      note: note.trim() || undefined,
    });
    if (!r.ok) return setErr(r.error);
    setErr('');
    setProof('');
    setNote('');
    toast(`Hasil Juara ${rank} terkirim. Menunggu verifikasi panitia.`);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {err && <div className="rounded-lg bg-rose/15 text-[#ffb3cb] text-[13px] px-3 py-2.5" role="alert">{err}</div>}
      <div className="block">
        <span className="label">Kompetisi</span>
        <Dropdown block value={compId} onChange={onComp} options={[...COMPETITIONS.map((c) => ({ value: c.id, label: c.name, hint: `${c.year} · ${c.divisions}`, icon: <Art src={imageForCompetition(c.id)} className="relative h-7 w-9 rounded shrink-0" /> })), { value: OTHER, label: 'Lainnya, belum ada di daftar', hint: 'Tulis nama kompetisi sendiri' }]} />
      </div>
      {compId === OTHER && (
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="sm:col-span-2">
            <span className="label">Nama kompetisi</span>
            <input className="input" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="contoh: Jogja Esports Cup 2026" />
          </label>
          <div>
            <span className="label">Kategori</span>
            <Dropdown<MatchType> block value={matchType} onChange={setMatchType} options={MATCH_TYPES} />
          </div>
          <div>
            <span className="label">Game</span>
            <Dropdown<GameName> block value={game} onChange={setGame} options={GAME_OPTIONS.map((g) => ({ value: g, label: g, icon: <GameIcon game={g} size={18} rounded="rounded-[5px]" /> }))} />
          </div>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <span className="label">Divisi</span>
          {divisions.length > 0 ? (
            <Dropdown block value={division} onChange={setDivision} options={divisions.map((d) => ({ value: d, label: d }))} />
          ) : (
            <input className="input" value={division} onChange={(e) => setDivision(e.target.value)} placeholder="Battle Royale" />
          )}
        </div>
        <label>
          <span className="label">Tanggal final</span>
          <input type="date" className="input" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="sm:col-span-2">
          <span className="label">Tim saat event</span>
          <input className="input" value={team} onChange={(e) => setTeam(e.target.value)} placeholder="Nama tim" />
        </label>
      </div>

      <div>
        <span className="label">Peringkat akhir</span>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Peringkat akhir">
          {([1, 2, 3] as const).map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={rank === r}
              onClick={() => setRank(r)}
              className={`relative rounded-xl px-3 py-3 text-left border transition ${rank === r ? 'border-gold bg-gold/10 shadow-[0_0_0_3px_rgba(255,210,31,.12)]' : 'border-white/[0.04] bg-ink-700 hover:bg-ink-600'}`}
            >
              <span className="absolute right-2.5 top-2.5"><RankBadge rank={r} size={22} /></span>
              <p className={`font-display text-[26px] leading-none ${rank === r ? 'text-gold' : 'text-white'}`}>Juara {r}</p>
              <p className="font-mono text-[12px] text-soft mt-1.5 inline-flex items-center gap-1">+{getRankEloDelta(r)} <CoinIcon className="h-3 w-3" /></p>
            </button>
          ))}
        </div>
        <p className="text-[12px] text-muted mt-2">Hanya podium 1-3 yang diberi poin. Peringkat 4 ke bawah tidak perlu diajukan.</p>
      </div>

      <div>
        <span className="label">Screenshot klasemen akhir</span>
        <label className="relative block rounded-xl border-2 border-dashed border-line hover:border-azure-light bg-ink-750/60 p-4 text-center cursor-pointer transition">
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
          {proof ? (
            <img src={proof} alt="Pratinjau bukti" className="mx-auto max-h-40 rounded-lg" />
          ) : (
            <div className="py-3">
              <ImagePlus className="h-7 w-7 text-gold mx-auto" />
              <p className="text-[13px] text-white mt-2">{busy ? 'Memproses gambar…' : 'Pilih atau seret screenshot'}</p>
              <p className="text-[11.5px] text-muted mt-0.5">Klasemen akhir yang memperlihatkan nama timmu. Gambar dikompres otomatis.</p>
            </div>
          )}
        </label>
      </div>
      <label className="block">
        <span className="label">Catatan untuk panitia <span className="text-muted">(opsional)</span></span>
        <textarea className="input min-h-[70px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Link bracket, nama admin yang bisa dihubungi, dsb." />
      </label>
      <button type="submit" disabled={busy} className="btn btn-gold w-full !py-3"><Trophy className="h-4 w-4" />Ajukan untuk Verifikasi</button>
    </form>
  );
}

const FILTERS: ('all' | SubmissionStatus)[] = ['all', 'Pending Review', 'Verified', 'Disputed', 'Rejected'];
const FILTER_LABEL: Record<string, string> = { all: 'Semua', 'Pending Review': 'Menunggu', Verified: 'Terverifikasi', Disputed: 'Disanggah', Rejected: 'Ditolak' };

export function SubmissionFeed() {
  const { state, account, isReferee, disputeResult, toast, leaderboard } = useStore();
  const [filter, setFilter] = useState<'all' | SubmissionStatus>('all');
  const [proof, setProof] = useState<string | null>(null);
  const [disputing, setDisputing] = useState<MatchSubmission | null>(null);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const list = useMemo(() => state.submissions.filter((s) => filter === 'all' || s.status === filter), [state.submissions, filter]);

  const send = () => {
    if (!disputing) return;
    const r = disputeResult(disputing.id, reason);
    if (!r.ok) return setErr(r.error);
    setDisputing(null);
    setReason('');
    toast('Sanggahan dikirim ke panitia.', 'info');
  };

  return (
    <section className="rounded-2xl panel p-5 sm:p-6">
      <SectionHeading title="Hasil Terbaru" subtitle="Transparan: siapa pun bisa menyanggah hasil yang keliru" />
      <div className="flex gap-1 overflow-x-auto no-scrollbar mb-4 -mx-1 px-1">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`top-tab shrink-0 !py-1.5 ${filter === f ? 'active' : ''}`}>
            {FILTER_LABEL[f]} <span className="font-mono text-[11px] text-muted">{f === 'all' ? state.submissions.length : state.submissions.filter((s) => s.status === f).length}</span>
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState icon={FileText} title="Belum ada pengajuan" text="Pengajuan hasil turnamen dari atlet akan muncul di sini." />
      ) : (
        <div className="space-y-2.5">
          {list.map((s) => {
            const ath = leaderboard.find((a) => a.gameskii_id === s.gameskii_id);
            const mine = account?.id === s.user_id;
            const canSee = mine || isReferee;
            const canDispute = account && !mine && (s.status === 'Pending Review' || s.status === 'Verified');
            return (
              <article key={s.id} className="rounded-xl bg-ink-750 border border-white/[0.05] p-4 hover:border-white/10 transition-colors">
                <div className="flex items-start gap-3">
                  <a href={href(`/atlet/${s.gameskii_id}`)}><Avatar seed={ath?.uid_fingerprint || s.player_ign} size={36} level={ath ? getTier(ath.elo_points).level : undefined} /></a>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-[14px]"><a href={href(`/atlet/${s.gameskii_id}`)} className="font-semibold hover:text-gold">{s.player_ign}</a> <span className="text-muted">· {s.team_name}</span></p>
                    <p className="text-[12.5px] text-soft truncate">{s.competition_name} · {s.division}</p>
                    <p className="text-[11px] text-muted font-mono mt-0.5">{new Date(s.event_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <RankBadge rank={s.rank_position} />
                    <StatusBadge status={s.status} />
                  </div>
                </div>
                {s.dispute && (
                  <p className="mt-3 rounded-lg bg-orange-400/10 text-orange-200 text-[12px] px-3 py-2"><AlertTriangle className="inline h-3.5 w-3.5 mr-1" />Sanggahan {s.dispute.by_name}: “{s.dispute.reason}”</p>
                )}
                {s.review_note && <p className="mt-2 text-[12px] text-muted">Catatan panitia: “{s.review_note}”</p>}
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-[12px]">
                  {canSee ? (
                    <button onClick={() => setProof(s.proof_url)} className="inline-flex items-center gap-1 text-soft hover:text-gold"><Eye className="h-3.5 w-3.5" />Lihat bukti</button>
                  ) : (
                    <span className="text-muted inline-flex items-center gap-1"><Info className="h-3.5 w-3.5" />Bukti hanya untuk pemilik & panitia</span>
                  )}
                  <span className={`ml-auto inline-flex items-center gap-1 font-mono ${s.status === 'Verified' ? 'text-gold' : 'text-muted'}`}>+{getRankEloDelta(s.rank_position)}<CoinIcon className="h-3 w-3" /></span>
                  {canDispute && (
                    <button onClick={() => { setDisputing(s); setErr(''); setReason(''); }} className="btn btn-danger !py-1.5 !px-2.5 !text-[12px]"><AlertTriangle className="h-3.5 w-3.5" />Sanggah</button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ProofModal url={proof} onClose={() => setProof(null)} />
      <Modal open={Boolean(disputing)} onClose={() => setDisputing(null)} title="Ajukan Sanggahan">
        {disputing && (
          <div className="space-y-4">
            <p className="text-[13px] text-soft">Kamu menyanggah klaim <b className="text-white">{disputing.player_ign}</b> sebagai Juara {disputing.rank_position} di {disputing.competition_name}. Panitia akan meninjau kedua pihak.</p>
            {err && <div className="rounded-lg bg-rose/15 text-[#ffb3cb] text-[13px] px-3 py-2.5" role="alert">{err}</div>}
            <label className="block">
              <span className="label">Alasan</span>
              <textarea className="input min-h-[100px]" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Contoh: Klasemen resmi menunjukkan tim ini finis #5, bukan #2." />
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDisputing(null)} className="btn btn-ghost">Batal</button>
              <button onClick={send} className="btn btn-danger">Kirim Sanggahan</button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}

export default function SubmitResult({ presetComp }: { presetComp?: string }) {
  const { account, profile, openAuth, openOnboarding } = useStore();
  return (
    <div className="space-y-6">
      <PageHero image={IMG.upload} compact title="Upload Hasil Turnamen" subtitle="Juara 1-3 di turnamen yang belum ada di arsip? Ajukan di sini. Poin baru masuk setelah panitia memeriksa screenshot klasemen.">
        <ol className="mt-6 grid sm:grid-cols-3 gap-2.5 max-w-2xl">
          {[
            ['Ajukan', 'Pilih kompetisi, divisi, peringkat, dan lampirkan screenshot.', UploadCloud],
            ['Ditinjau', 'Panitia mencocokkan dengan klasemen resmi. Atlet lain bisa menyanggah.', SearchCheck],
            ['Poin masuk', 'Setelah terverifikasi, poin langsung dihitung ke leaderboard.', BadgeCheck],
          ].map(([t, d, Icon], i) => {
            const I = Icon as typeof UploadCloud;
            return (
              <li key={t as string} className="relative rounded-xl bg-ink-950/35 border border-white/[0.08] backdrop-blur px-3.5 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-md bg-gold text-ink-950 grid place-items-center font-mono text-[11px] font-bold">{i + 1}</span>
                  <span className="text-white text-[13px] font-semibold">{t as string}</span>
                  <I className="h-4 w-4 text-cyan ml-auto" />
                </div>
                <p className="text-[11.5px] text-white/60 mt-1.5 leading-snug">{d as string}</p>
              </li>
            );
          })}
        </ol>
      </PageHero>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <section className="xl:col-span-5 rounded-2xl panel p-5 sm:p-6">
          <SectionHeading title="Form Pengajuan" subtitle={profile ? `Sebagai ${profile.ign} · ${profile.gameskii_id}` : undefined} />
          {!account ? (
            <EmptyState icon={LogIn} title="Masuk dulu" text="Hasil turnamen harus terhubung ke paspor atlet." action={<button className="btn btn-gold" onClick={() => openAuth('signin')}>Masuk / Daftar</button>} />
          ) : !profile ? (
            <EmptyState icon={Trophy} title="Paspor belum dibuat" text="Buat paspor atlet sebelum mengajukan hasil." action={<button className="btn btn-gold" onClick={openOnboarding}>Buat Paspor</button>} />
          ) : (
            <SubmissionForm key={presetComp} presetComp={presetComp} />
          )}
        </section>
        <div className="xl:col-span-7">
          <SubmissionFeed />
        </div>
      </div>
    </div>
  );
}
