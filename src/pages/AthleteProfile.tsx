import React from 'react';
import { CalendarDays, Coins, Crown, ExternalLink, Hash, Medal, UserX } from 'lucide-react';
import { useStore, RankedAthlete } from '../lib/store';
import { href } from '../lib/router';
import { getAttributionsForAthlete, getCompetition } from '../data/pilot';
import { TIERS, getRankEloDelta, getTier } from '../data/constants';
import { PassportCard } from '../components/PassportCard';
import { RankBadge } from '../components/cards';
import { Art, CoinIcon, EmptyState, SectionHeading, Stat, StatusBadge } from '../components/ui';
import { imageForCompetition } from '../lib/assets';
import type { MatchSubmission } from '../types';

export function TierProgress({ points }: { points: number }) {
  const t = getTier(points);
  const max = 1800;
  const pct = (v: number) => `${Math.min(100, Math.max(0, ((v - 800) / (max - 800)) * 100))}%`;
  return (
    <div className="rounded-xl bg-ink-750 border border-white/[0.04] px-5 pt-4 pb-5">
      <div className="flex items-center justify-between text-[12px]">
        <span className="th">Jalur Tier</span>
        <span className="text-soft">{t.next ? <>Butuh <b className="text-white num">{t.toNext}</b> poin lagi menuju <b className="text-gold">{t.next.name}</b> · ≈ {Math.ceil(t.toNext / 50)}× juara 1</> : 'Tier tertinggi tercapai'}</span>
      </div>
      <div className="relative mt-7 mb-6">
        <div className="h-2 rounded-full bg-ink-950/60" />
        <div className="absolute left-0 top-0 h-2 rounded-full bg-gradient-to-r from-cyan to-gold" style={{ width: pct(points) }} />
        {TIERS.filter((x) => x.min >= 1000).map((x) => (
          <div key={x.name} className="absolute top-1/2 -translate-y-1/2" style={{ left: pct(x.min) }}>
            <span className={`block h-3.5 w-3.5 -ml-[7px] rounded-full border-2 ${points >= x.min ? 'bg-gold border-gold' : 'bg-ink-800 border-white/25'}`} />
            <span className={`absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10.5px] ${t.name === x.name ? 'text-white font-medium' : 'text-muted'}`}>{x.name}</span>
            {Math.abs(points - x.min) > 70 && <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[9.5px] text-muted num">{x.min}</span>}
          </div>
        ))}
        <div className="absolute -top-[30px] -translate-x-1/2 rounded-md bg-gold text-ink-950 font-mono text-[10.5px] font-bold px-1.5 py-0.5 num" style={{ left: pct(points) }}>{points}</div>
      </div>
    </div>
  );
}

export function PodiumHistory({ athlete, submissions, showPending = false }: { athlete: RankedAthlete; submissions: MatchSubmission[]; showPending?: boolean }) {
  const hist = getAttributionsForAthlete(athlete.uid_fingerprint && (athlete.isClaimed || !athlete.isSelfRegistered) ? athlete.uid_fingerprint : undefined);
  const subs = submissions.filter((s) => s.gameskii_id === athlete.gameskii_id && (showPending || s.status === 'Verified'));
  if (hist.length === 0 && subs.length === 0) {
    return <EmptyState icon={Medal} title="Belum ada riwayat podium" text="Prestasi muncul setelah klaim UID disetujui atau hasil diverifikasi panitia." />;
  }
  return (
    <div className="space-y-2">
      {subs.map((s) => (
        <div key={s.id} className="flex items-center gap-3.5 rounded-xl bg-ink-750 border border-white/[0.04] pl-2 pr-4 py-2">
          {s.competition_id ? <Art src={imageForCompetition(s.competition_id)} className="relative h-12 w-16 rounded-lg shrink-0"><span className="absolute left-1 top-1"><RankBadge rank={s.rank_position} size={20} /></span></Art> : <span className="h-12 w-16 rounded-lg bg-ink-600 grid place-items-center shrink-0"><RankBadge rank={s.rank_position} size={24} /></span>}
          <div className="min-w-0 flex-1">
            <p className="text-white text-[14px] truncate">
              {s.competition_id ? <a className="hover:text-gold" href={href(`/kompetisi/${s.competition_id}`)}>{s.competition_name}</a> : s.competition_name}
            </p>
            <p className="text-[12px] text-muted truncate">{s.division} · Tim {s.team_name} · {new Date(s.event_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</p>
          </div>
          <StatusBadge status={s.status} />
          <span className={`font-mono text-[13px] w-12 text-right ${s.status === 'Verified' ? 'text-gold' : 'text-muted line-through'}`}>+{getRankEloDelta(s.rank_position)}</span>
        </div>
      ))}
      {hist.map((a) => {
        const c = getCompetition(a.competition_id);
        return (
          <div key={a.result_id} className="group flex items-center gap-3.5 rounded-xl bg-ink-750 hover:bg-ink-700 border border-white/[0.04] pl-2 pr-4 py-2 transition-colors">
            <Art src={imageForCompetition(a.competition_id)} className="relative h-12 w-16 rounded-lg shrink-0"><span className="absolute left-1 top-1"><RankBadge rank={a.rank} size={20} /></span></Art>
            <div className="min-w-0 flex-1">
              <a className="text-white text-[14px] hover:text-gold line-clamp-1" href={href(`/kompetisi/${a.competition_id}`)}>{c?.name || a.competition_id}</a>
              <p className="text-[12px] text-muted truncate">{c?.year} · {a.division} · Tim {a.team_at_event}</p>
            </div>
            <a href={a.source_url} target="_blank" rel="noreferrer" className="hidden sm:inline-flex items-center gap-1 text-[11px] text-cyan hover:underline">Sumber <ExternalLink className="h-3 w-3" /></a>
            <span className="inline-flex items-center justify-end gap-1 font-mono text-[13px] text-gold w-14">+{getRankEloDelta(a.rank)}<CoinIcon className="h-3 w-3" /></span>
          </div>
        );
      })}
    </div>
  );
}

export default function AthleteProfile({ id }: { id: string }) {
  const { athleteById, state, profile, leaderboard } = useStore();
  const a = athleteById(id);
  if (!a) {
    return <EmptyState icon={UserX} title="Atlet tidak ditemukan" text="Periksa kembali Gameskii ID atau cari di leaderboard." action={<a href={href('/leaderboard')} className="btn btn-dark">Buka leaderboard</a>} />;
  }
  const isMe = profile?.id === a.id;
  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <div className="xl:col-span-5 space-y-4">
        <PassportCard athlete={a} showPrivate={isMe} />
        {isMe && <a href={href('/paspor')} className="btn btn-gold w-full">Kelola paspor saya</a>}
      </div>
      <div className="xl:col-span-7 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Peringkat" value={`#${a.rank}`} icon={Hash} hint={`dari ${leaderboard.length} atlet`} accent="#6aa0dd" />
          <Stat label="Poin" value={a.elo_points} tone="text-gold" icon={Coins} accent="#ffd21f" progress={getTier(a.elo_points).progress} hint={getTier(a.elo_points).name} />
          <Stat label="Juara 1" value={a.titles} icon={Crown} accent="#ffd21f" hint={`${a.podiums} podium total`} />
          <Stat label="Event" value={a.events} icon={CalendarDays} accent="#2cc6ef" hint="kompetisi berbeda" />
        </div>
        <TierProgress points={a.elo_points} />
        <section className="rounded-2xl panel p-5 sm:p-6">
          <SectionHeading title="Riwayat Podium" subtitle="Setiap prestasi menyebut tim saat event. Tim boleh berganti, prestasi tetap milik atlet." />
          <PodiumHistory athlete={a} submissions={state.submissions} showPending={isMe} />
        </section>
      </div>
    </div>
  );
}
