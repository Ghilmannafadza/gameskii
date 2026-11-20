import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Flame, Gamepad2, Search, Trophy } from 'lucide-react';
import { useStore } from '../lib/store';
import { avatarFor as avatarSrc } from '../lib/avatar';
import { href, navigate } from '../lib/router';
import { GAMES, IMG, imageForCompetition } from '../lib/assets';
import { COMPETITIONS, COUNTED_ATTRIBUTIONS, PILOT_STATS, getAthletesForCompetition, getCompetition } from '../data/pilot';
import { getRankEloDelta, getTier } from '../data/constants';
import type { GameName } from '../types';
import { TournamentCard, RankBadge } from '../components/cards';
import { Art, Avatar, AvatarStack, BrandIcon, CoinIcon, Dropdown, EmptyState, GameIcon, HandNote, ProvisionalBadge, SectionHeading, TrophyCount, TrophyIcon } from '../components/ui';

/* ---------------- Filter bar primitives (shared) ---------------- */

export function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="filter-bar rounded-2xl bg-ink-800/70 border border-white/[0.04] p-2.5 flex flex-wrap items-center gap-2">{children}</div>;
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(t.tagName)) { e.preventDefault(); ref.current?.focus(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  return (
    <label className="relative flex-1 min-w-[200px] lg:max-w-[320px] lg:ml-auto">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
      <input ref={ref} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input !h-10 !py-0 !pl-10 !pr-10" aria-label={placeholder} />
      {value ? (
        <button onClick={() => onChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-white text-[11px]" aria-label="Hapus pencarian">✕</button>
      ) : (
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted border border-white/10 rounded px-1.5 py-px">/</kbd>
      )}
    </label>
  );
}

export function GameSelect() {
  const { state, setGameFilter } = useStore();
  return (
    <Dropdown<GameName | 'all'>
      label="Game"
      value={state.gameFilter}
      onChange={setGameFilter}
      options={[
        { value: 'all', label: 'Semua' },
        ...GAMES.map((g) => ({ value: g.name, label: g.name, icon: <GameIcon game={g.name} size={18} rounded="rounded-[5px]" />, hint: g.name === 'Free Fire' ? '10 kompetisi di arsip' : 'Belum ada arsip' })),
      ]}
    />
  );
}

export const ORDER_OPTIONS = [
  { value: 'featured', label: 'Relevansi', hint: 'Paling banyak atlet tertaut' },
  { value: 'new', label: 'Terbaru' },
  { value: 'old', label: 'Terlama' },
  { value: 'name', label: 'Nama A-Z' },
];
export const AUDIT_OPTIONS = [
  { value: 'all', label: 'Semua' },
  { value: 'ok', label: 'Data cocok', icon: <span className="status-dot bg-emerald-300" /> },
  { value: 'review', label: 'Sedang ditinjau', icon: <span className="status-dot bg-amber-300" /> },
];

export function useFilteredCompetitions(order: string, audit: string, q: string) {
  const { state } = useStore();
  return useMemo(() => {
    let list = [...COMPETITIONS];
    if (state.gameFilter !== 'all') list = list.filter((c) => c.game === state.gameFilter);
    if (audit !== 'all') list = list.filter((c) => (audit === 'ok' ? c.audit_status === 'MATCHED' : c.audit_status !== 'MATCHED'));
    if (q.trim()) list = list.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
    if (order === 'featured') list.sort((a, b) => getAthletesForCompetition(b.id).length - getAthletesForCompetition(a.id).length || Number(b.year) - Number(a.year));
    else if (order === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (order === 'old') list.sort((a, b) => Number(a.year) - Number(b.year) || a.id.localeCompare(b.id));
    else list.sort((a, b) => Number(b.year) - Number(a.year) || b.id.localeCompare(a.id));
    return list;
  }, [state.gameFilter, audit, q, order]);
}

/* ---------------- Hero spotlight (replaces the stock portrait) ---------------- */

function Spotlight() {
  const { leaderboard } = useStore();
  const a = leaderboard[0];
  if (!a) return null;
  const tier = getTier(a.elo_points);
  return (
    <a href={href(`/atlet/${a.gameskii_id}`)} className="group hidden md:flex relative w-[172px] lg:w-[188px] shrink-0 aspect-[3/4] rounded-xl overflow-hidden glow-gold flex-col" aria-label={`Atlet teratas: ${a.ign}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#3a6db0_0%,#1b3a66_45%,#0f2140_100%)]" />
      <div className="absolute inset-0 guilloche opacity-80" />
      <div className="absolute inset-0 foil opacity-60" />
      <div className="relative flex items-center justify-between px-3 pt-3">
        <span className="font-mono text-[10px] tracking-[0.14em] text-white/70">ATLET TERATAS</span>
        <RankBadge rank={1} size={24} />
      </div>
      <div className="relative flex-1 grid place-items-center">
        <img src={avatarSrc(a.uid_fingerprint || a.ign)} alt="" className="h-[108px] w-[108px] rounded-full ring-4 ring-gold/80 shadow-[0_14px_30px_-8px_rgba(0,0,0,.7)] transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="relative px-3 pb-3">
        <p className="text-white font-semibold text-[15px] truncate">{a.ign}</p>
        <div className="mt-1.5 flex items-center justify-between text-[12px]">
          <span className="font-mono text-gold num">{a.elo_points} pts</span>
          <span className="flex items-center gap-2 text-white/85"><TrophyCount value={a.titles} tone="gold" /></span>
        </div>
        <p className="text-[10.5px] text-white/55 mt-0.5">{tier.name} · {a.events} event</p>
      </div>
    </a>
  );
}

/* ---------------- Page ---------------- */

export default function Dashboard() {
  const { leaderboard, state, profile, openAuth, account } = useStore();
  const [order, setOrder] = useState('featured');
  const [audit, setAudit] = useState('all');
  const [q, setQ] = useState('');
  const comps = useFilteredCompetitions(order, audit, q);
  const scroller = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const top = leaderboard.slice(0, 8);
  const heroSeeds = leaderboard.slice(0, 5).map((a) => a.uid_fingerprint || a.ign);

  const recent = useMemo(() => {
    const fromData = COUNTED_ATTRIBUTIONS.map((a) => ({
      key: a.result_id + a.uid_fingerprint,
      athlete: leaderboard.find((x) => x.uid_fingerprint === a.uid_fingerprint),
      comp: getCompetition(a.competition_id)?.name || a.competition_id,
      compId: a.competition_id,
      year: getCompetition(a.competition_id)?.year || '',
      division: a.division,
      team: a.team_at_event,
      rank: a.rank,
      verified: false,
    }));
    const fromSubs = state.submissions.filter((s) => s.status === 'Verified').map((s) => ({
      key: s.id,
      athlete: leaderboard.find((x) => x.gameskii_id === s.gameskii_id),
      comp: s.competition_name,
      compId: s.competition_id,
      year: s.event_date.slice(0, 4),
      division: s.division,
      team: s.team_name,
      rank: s.rank_position,
      verified: true,
    }));
    const perComp = new Map<string, number>();
    return [...fromSubs, ...fromData]
      .sort((a, b) => Number(b.year) - Number(a.year) || (b.compId || '').localeCompare(a.compId || '') || a.rank - b.rank)
      .filter((r) => {
        const k = r.compId || r.comp;
        const n = perComp.get(k) || 0;
        perComp.set(k, n + 1);
        return n < 2;
      })
      .slice(0, 7);
  }, [leaderboard, state.submissions]);

  const pages = Math.max(1, Math.ceil(comps.length / 3));
  const scroll = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.98, behavior: 'smooth' });
  };
  const onScroll = () => {
    const el = scroller.current;
    if (el) setPage(Math.round((el.scrollLeft / Math.max(1, el.scrollWidth - el.clientWidth)) * (pages - 1)));
  };

  return (
    <div className="space-y-7">
      <FilterBar>
        <Dropdown label="Urutkan" value={order} onChange={setOrder} options={ORDER_OPTIONS} />
        <GameSelect />
        <Dropdown label="Status data" value={audit} onChange={setAudit} options={AUDIT_OPTIONS} />
        <SearchInput value={q} onChange={setQ} placeholder="Cari kompetisi…" />
      </FilterBar>

      {/* ============ HERO ============ */}
      <section className="grain relative rounded-2xl overflow-hidden border border-white/[0.05]">
        <Art src={IMG.hero} className="absolute inset-0" position="center 35%" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,37,64,.97)_0%,rgba(17,37,64,.9)_34%,rgba(17,37,64,.45)_62%,rgba(17,37,64,.2)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(17,37,64,.9)_0%,transparent_40%)]" />
        <div className="relative z-[2] p-6 sm:p-9 pb-0 sm:pb-0 flex gap-8 items-start">
          <Spotlight />
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2.5">
              <span className="chip-mono chip-light num">{PILOT_STATS.athletes} Atlet</span>
              <BrandIcon name="android" className="h-[15px] w-[15px]" color="#dbe5f3" />
              <BrandIcon name="apple" className="h-[15px] w-[15px]" color="#dbe5f3" />
            </div>
            <h1 className="font-display text-[48px] sm:text-[66px] lg:text-[76px] text-white mt-4 drop-shadow-[0_4px_24px_rgba(0,0,0,.45)]">
              Satu Leaderboard
              <br />
              <span className="text-gold">Esports</span> Jogja
            </h1>
            <p className="text-[14px] text-soft mt-3 max-w-lg leading-relaxed">
              Podium dari {PILOT_STATS.competitions} kompetisi Free Fire di Yogyakarta, dicatat per pemain lewat UID. Pindah tim tidak menghapus prestasi.
            </p>
            <div className="flex flex-wrap gap-2.5 mt-6">
              {!account ? (
                <button onClick={() => openAuth('signup')} className="btn btn-gold !px-4">Buat Paspor Atlet <ArrowRight className="h-4 w-4" /></button>
              ) : !profile ? (
                <button onClick={() => navigate('/paspor')} className="btn btn-gold !px-4">Lengkapi Paspor <ArrowRight className="h-4 w-4" /></button>
              ) : (
                <button onClick={() => navigate('/upload')} className="btn btn-gold !px-4">Upload Hasil Baru <ArrowRight className="h-4 w-4" /></button>
              )}
              <a href={href('/leaderboard')} className="btn bg-white/10 hover:bg-white/15 text-white backdrop-blur">Lihat Leaderboard</a>
            </div>
          </div>
        </div>

        <div className="relative z-[2] mx-4 sm:mx-9 mt-8 mb-5 sm:mb-7">
          <HandNote className="hidden lg:block absolute right-28 -top-[74px]">Atlet yang sudah tercatat di arsip</HandNote>
          <div className="hero-stat-bar rounded-xl px-4 sm:px-5 py-3.5 grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:items-center sm:gap-x-7 sm:gap-y-3 border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <span className="hidden sm:grid h-9 w-9 rounded-lg bg-white/[0.06] place-items-center text-soft"><Gamepad2 className="h-[18px] w-[18px]" /></span>
              <div>
                <p className="text-[22px] font-semibold text-white leading-none num">{PILOT_STATS.standings}</p>
                <p className="text-[12px] text-gold mt-1">Hasil final tercatat</p>
              </div>
            </div>
            <div className="hidden sm:block h-9 w-px bg-white/10" />
            <div className="flex items-center gap-3">
              <span className="hidden sm:grid h-9 w-9 rounded-lg bg-white/[0.06] place-items-center text-soft"><Flame className="h-[18px] w-[18px]" /></span>
              <div>
                <p className="text-[22px] font-semibold text-white leading-none num">{PILOT_STATS.competitions}</p>
                <p className="text-[12px] text-gold mt-1">Kompetisi diarsipkan</p>
              </div>
            </div>
            <div className="hidden xl:block h-9 w-px bg-white/10" />
            <div className="hidden xl:flex items-center gap-3">
              <span className="h-9 w-9 rounded-lg bg-white/[0.06] grid place-items-center"><TrophyIcon className="h-[18px] w-[18px]" /></span>
              <div>
                <p className="text-[22px] font-semibold text-white leading-none num">{PILOT_STATS.podiums}</p>
                <p className="text-[12px] text-gold mt-1">Podium juara 1-3</p>
              </div>
            </div>
            <a href={href('/leaderboard')} className="col-span-2 flex items-center justify-between sm:justify-start gap-3 sm:ml-auto group pt-3 sm:pt-0 border-t border-white/10 sm:border-0">
              <div className="text-right">
                <p className="font-mono text-[10px] tracking-[0.14em] text-muted">ATLET</p>
                <p className="text-[20px] font-semibold text-white leading-none num">{leaderboard.length}</p>
              </div>
              <AvatarStack seeds={heroSeeds} size={34} />
            </a>
          </div>
        </div>
      </section>

      {/* ============ FEATURED ============ */}
      <section>
        <SectionHeading
          title="Kompetisi Unggulan"
          subtitle="Klasemen final dari arsip panitia komunitas"
          right={
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1" aria-hidden="true">
                {Array.from({ length: pages }).map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === page ? 'w-5 bg-gold' : 'w-1.5 bg-white/20'}`} />)}
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => scroll(-1)} className="h-8 w-8 rounded-lg bg-ink-700 text-soft hover:text-white hover:bg-ink-600 grid place-items-center" aria-label="Sebelumnya"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={() => scroll(1)} className="h-8 w-8 rounded-lg bg-ink-700 text-soft hover:text-white hover:bg-ink-600 grid place-items-center" aria-label="Berikutnya"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          }
        />
        {comps.length === 0 ? (
          <EmptyState icon={Trophy} title="Belum ada kompetisi untuk filter ini" text={state.gameFilter !== 'all' && state.gameFilter !== 'Free Fire' ? `Arsip ${state.gameFilter} belum tersedia. Data pilot saat ini hanya Free Fire.` : 'Coba ubah filter atau kata kunci.'} />
        ) : (
          <div ref={scroller} onScroll={onScroll} className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-3 -mb-3 pt-1 -mt-1">
            {comps.map((c) => (
              <div key={c.id} className="snap-start shrink-0 w-[84%] sm:w-[47%] lg:w-[31.6%] 2xl:w-[23.9%]">
                <TournamentCard c={c} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ============ TABLES ============ */}
      <section className="grid grid-cols-1 2xl:grid-cols-12 gap-6 items-start">
        <div className="2xl:col-span-7 rounded-2xl panel p-5 sm:p-6 overflow-hidden">
          <SectionHeading title="Podium Terbaru" subtitle="Prestasi individu yang masuk leaderboard" right={<a href={href('/kompetisi?tab=klasemen')} className="text-[13px] text-soft hover:text-gold inline-flex items-center gap-1 shrink-0">Semua podium <ChevronRight className="h-4 w-4" /></a>} />
          <div className="overflow-x-auto -mx-5 sm:-mx-6">
            <table className="w-full min-w-[620px] text-[13px]">
              <thead>
                <tr className="text-left border-b border-white/[0.06]">
                  <th className="th px-5 sm:px-6 pb-3">Atlet</th>
                  <th className="th pb-3">Kompetisi</th>
                  <th className="th pb-3">Tim</th>
                  <th className="th pb-3 text-center">Rank</th>
                  <th className="th pb-3 pr-5 sm:pr-6 text-right">Poin</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.key} className="table-row row-accent cursor-pointer" onClick={() => r.athlete && navigate(`/atlet/${r.athlete.gameskii_id}`)}>
                    <td className="px-5 sm:px-6 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar seed={r.athlete?.uid_fingerprint || r.athlete?.ign || r.key} size={32} level={r.athlete ? getTier(r.athlete.elo_points).level : undefined} />
                        <div className="min-w-0">
                          <p className="text-white truncate max-w-[150px] font-medium">{r.athlete?.ign || '-'}</p>
                          <p className="text-[11px] text-muted">{r.verified ? 'Diverifikasi panitia' : 'Arsip panitia'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        {r.compId ? <Art src={imageForCompetition(r.compId)} className="relative h-8 w-11 rounded-md shrink-0" /> : <GameIcon game="Free Fire" size={32} rounded="rounded-md" />}
                        <div className="min-w-0">
                          <p className="text-soft line-clamp-1 max-w-[230px]">{r.comp}</p>
                          <p className="text-[11px] text-muted font-mono">{r.year} · {r.division}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-muted truncate max-w-[120px]">{r.team}</td>
                    <td className="py-3 text-center"><RankBadge rank={r.rank} size={26} /></td>
                    <td className="py-3 pr-5 sm:pr-6 text-right">
                      <span className="inline-flex items-center gap-1 font-mono text-gold num">+{getRankEloDelta(r.rank)}<CoinIcon className="h-3 w-3" /></span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="2xl:col-span-5 rounded-2xl overflow-hidden grain relative border border-white/[0.05]" style={{ background: 'linear-gradient(180deg,#1f4a6e 0%,#193e5f 55%,#163756 100%)' }}>
          <div className="relative z-[2] p-5 sm:p-6 pb-3">
            <SectionHeading title="Top Atlet" subtitle="Poin podium · provisional" right={<a href={href('/leaderboard')} className="text-[13px] text-soft hover:text-gold inline-flex items-center gap-1 shrink-0">Ladder <ChevronRight className="h-4 w-4" /></a>} />
            <div className="grid grid-cols-[28px_1fr_64px_44px_44px] gap-3 px-1 th !text-[10px]">
              <span>#</span><span>Atlet</span><span className="text-right">Poin</span><span>J1</span><span>Pod</span>
            </div>
          </div>
          <ol className="relative z-[2] pb-2">
            {top.map((a) => (
              <li key={a.id}>
                <a href={href(`/atlet/${a.gameskii_id}`)} className="grid grid-cols-[28px_1fr_64px_44px_44px] gap-3 items-center px-6 py-[11px] border-t border-white/[0.06] hover:bg-white/[0.04] transition-colors text-[13px]">
                  <span className="font-mono text-white/60 num">{a.rank}</span>
                  <span className="flex items-center gap-3 min-w-0">
                    <Avatar seed={a.uid_fingerprint || a.ign} size={30} level={getTier(a.elo_points).level} />
                    <span className="text-white truncate">{a.ign}</span>
                  </span>
                  <span className="text-right font-mono text-white num">{a.elo_points}</span>
                  <span className="text-white/85"><TrophyCount value={a.titles} tone="gold" /></span>
                  <span className="text-white/85"><TrophyCount value={a.podiums} tone="silver" /></span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
