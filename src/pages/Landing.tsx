import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronRight, Flame, Gamepad2, IdCard, LogIn, Menu, Search, ShieldCheck, Trophy, UploadCloud, Users, X } from 'lucide-react';
import crest from '../assets/images/crest-160.jpg';
import esiLogo from '../assets/images/esi-diy.png';
import { useStore } from '../lib/store';
import { href, navigate } from '../lib/router';
import { GAMES, GAME_COVERS, IMG } from '../lib/assets';
import { COMPETITIONS, PILOT_STATS, getAthletesForCompetition } from '../data/pilot';
import { getRankEloDelta, getTier } from '../data/constants';
import type { GameName } from '../types';
import { RankBadge, TournamentCard } from '../components/cards';
import { Art, Avatar, AvatarStack, BrandIcon, CoinIcon, EmptyState, GameIcon, SectionHeading, TrophyCount, TrophyIcon } from '../components/ui';

export const ESI_DIY = {
  name: 'Pengurus Provinsi ESI D.I. Yogyakarta',
  short: 'ESI DIY',
  instagram: 'https://www.instagram.com/esi_diy/',
  logo: esiLogo,
};

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openLadder(game: GameName | 'all', setGameFilter: (g: GameName | 'all') => void) {
  setGameFilter(game);
  navigate('/leaderboard');
}

/* ---------------- Nav ---------------- */

function LandingNav() {
  const { account, profile, openAuth } = useStore();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const links: [string, string][] = [
    ['Top 3', 'top3'],
    ['Leaderboard', 'leaderboard'],
    ['Kompetisi', 'kompetisi'],
    ['Cara Kerja', 'cara-kerja'],
  ];
  return (
    <header className={`sticky top-0 z-50 transition-colors ${scrolled ? 'bg-ink-950/90 backdrop-blur-xl border-b border-white/[0.06]' : 'bg-transparent'}`}>
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 h-[68px] flex items-center gap-3 sm:gap-6">
        <a href={href('/')} className="flex items-center gap-3 shrink-0" aria-label="Gameskii">
          <img src={crest} alt="" className="h-9 w-9 rounded-[10px] ring-1 ring-white/15" />
          <span className="font-display text-[26px] text-white leading-none tracking-wide">Gameskii</span>
        </a>
        <nav className="hidden lg:flex items-center gap-1 text-[13.5px]" aria-label="Navigasi halaman">
          {links.map(([l, id]) => (
            <button key={id} onClick={() => scrollToId(id)} className="px-3 py-2 rounded-lg text-soft hover:text-white hover:bg-white/5">{l}</button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {!account && (
            <button onClick={() => openAuth('signin')} className="hidden sm:inline-flex btn btn-ghost">
              <LogIn className="h-4 w-4" /> Masuk
            </button>
          )}
          <a href={href('/dashboard')} className="btn btn-gold">
            {profile && <Avatar seed={profile.uid_fingerprint || profile.ign} size={20} />}
            <span className="hidden sm:inline">Buka Dashboard</span>
            <span className="sm:hidden">Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </a>
          <button onClick={() => setOpen(!open)} className="lg:hidden h-10 w-10 grid place-items-center rounded-lg text-soft hover:text-white hover:bg-white/5" aria-label="Menu" aria-expanded={open}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-white/[0.06] bg-ink-950/95 backdrop-blur-xl px-4 py-3 fade-in">
          {links.map(([l, id]) => (
            <button key={id} onClick={() => { setOpen(false); scrollToId(id); }} className="block w-full text-left px-3 py-2.5 rounded-lg text-white hover:bg-white/5">{l}</button>
          ))}
          {!account && <button onClick={() => { setOpen(false); openAuth('signin'); }} className="block w-full text-left px-3 py-2.5 rounded-lg text-gold hover:bg-white/5">Masuk / Daftar</button>}
        </div>
      )}
    </header>
  );
}

/* ---------------- Top 3 card (same anatomy as the dashboard tournament card) ---------------- */

function GameTop3Card({ game }: { game: GameName }) {
  const { boardFor, setGameFilter, account, openAuth } = useStore();
  const board = boardFor(game);
  const ranked = board.filter((a) => a.podiums > 0);
  const top = ranked.slice(0, 3);
  const comps = COMPETITIONS.filter((c) => c.game === game).length;

  return (
    <article className="t-card lift group flex flex-col min-w-0 border border-white/[0.05] h-full">
      <button onClick={() => openLadder(game, setGameFilter)} className="relative block rounded-[0.65rem] overflow-hidden aspect-[16/8] text-left" aria-label={`Ladder ${game}`}>
        <Art src={GAME_COVERS[game]} className="absolute inset-0 [&>img]:transition-transform [&>img]:duration-700 group-hover:[&>img]:scale-[1.06]" />
        <span className="absolute z-[3] top-2.5 left-2.5 chip-mono chip-dark inline-flex items-center gap-1.5 !text-[10.5px] !py-[3px]">
          <Trophy className="h-3 w-3 text-gold" />
          TOP 3
        </span>
        <span className="absolute z-[3] top-2.5 right-2.5 rounded-md bg-ink-950/70 backdrop-blur px-2 py-[3px] text-[10.5px] text-white/90 num">{comps} kompetisi</span>
        <span className="absolute z-[3] bottom-0 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-t-[9px] bg-[#243c5f] pl-2.5 pr-2 pt-1 pb-[5px] text-[11px] text-white shadow-[0_-6px_14px_-6px_rgba(0,0,0,.6)] whitespace-nowrap">
          <BrandIcon name="android" className="h-3 w-3" color="#9fb3cf" />
          {game}
          <GameIcon game={game} size={15} rounded="rounded-[4px]" className="ml-0.5" />
        </span>
      </button>

      <ol className="px-1.5 pt-3.5 pb-2 flex-1">
        {[0, 1, 2].map((i) => {
          const a = top[i];
          if (!a) {
            return (
              <li key={i} className="flex items-center gap-3 px-1.5 py-2 border-t border-white/[0.05] first:border-0">
                <RankBadge rank={i + 1} size={24} />
                <span className="h-[30px] w-[30px] rounded-full border border-dashed border-white/15" />
                <span className="text-[12.5px] text-white/35">Belum ada</span>
              </li>
            );
          }
          return (
            <li key={a.id} className="border-t border-white/[0.05] first:border-0">
              <a href={href(`/atlet/${a.gameskii_id}`)} className="flex items-center gap-3 px-1.5 py-2 rounded-lg hover:bg-white/[0.04]">
                <RankBadge rank={i + 1} size={24} />
                <Avatar seed={a.uid_fingerprint || a.ign} size={30} level={getTier(a.elo_points).level} />
                <span className="min-w-0 flex-1">
                  <span className="block text-white text-[13px] font-medium truncate">{a.ign}</span>
                  <span className="flex items-center gap-2.5 text-[11px] text-white/70"><TrophyCount value={a.titles} tone="gold" /><TrophyCount value={a.podiums} tone="silver" /></span>
                </span>
                <span className="font-mono text-[13px] text-gold num">{a.elo_points}</span>
              </a>
            </li>
          );
        })}
      </ol>

      <div className="t-card-foot -mx-[0.45rem] -mb-[0.45rem] px-3.5 min-h-[48px] flex items-center gap-3 border-t border-white/[0.04]">
        {ranked.length > 0 ? (
          <>
            <AvatarStack seeds={ranked.slice(0, 4).map((a) => a.uid_fingerprint || a.ign)} extra={Math.max(0, ranked.length - 4)} size={22} />
            <span className="text-[12px] text-muted num">{ranked.length} atlet</span>
            <button onClick={() => openLadder(game, setGameFilter)} className="ml-auto text-[12px] text-soft hover:text-gold inline-flex items-center gap-0.5">Ladder <ChevronRight className="h-3.5 w-3.5" /></button>
          </>
        ) : (
          <>
            <span className="text-[12px] text-muted">Belum ada hasil terverifikasi</span>
            <button onClick={() => (account ? navigate('/upload') : openAuth('signup'))} className="ml-auto text-[12px] text-gold hover:underline inline-flex items-center gap-0.5 shrink-0">Ajukan hasil <ChevronRight className="h-3.5 w-3.5" /></button>
          </>
        )}
      </div>
    </article>
  );
}

/* ---------------- Leaderboard (same table as dashboard) ---------------- */

function LandingLeaderboard() {
  const { leaderboard, boardFor, setGameFilter, profile } = useStore();
  const [tab, setTab] = useState<GameName | 'all'>('all');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(10);
  const rows = useMemo(() => {
    let list = tab === 'all' ? leaderboard : boardFor(tab);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((a) => a.ign.toLowerCase().includes(s) || a.gameskii_id.toLowerCase().includes(s));
    }
    return list;
  }, [tab, q, leaderboard, boardFor]);

  return (
    <>
      <div className="filter-bar rounded-2xl bg-ink-800/70 border border-white/[0.04] p-2.5 flex flex-wrap items-center gap-2 mb-4">
        <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-full" role="tablist" aria-label="Kategori game">
          {([['all', 'Semua'], ...GAMES.map((g) => [g.name, g.name])] as [GameName | 'all', string][]).map(([v, l]) => (
            <button key={v} role="tab" aria-selected={tab === v} onClick={() => { setTab(v); setLimit(10); }} className={`top-tab shrink-0 ${tab === v ? 'active' : ''}`}>
              {v !== 'all' && <GameIcon game={v} size={18} rounded="rounded-[5px]" />}
              {l}
            </button>
          ))}
        </div>
        <label className="relative flex-1 min-w-[200px] lg:max-w-[300px] lg:ml-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari IGN atau Gameskii ID..." className="input !h-10 !py-0 !pl-10" aria-label="Cari atlet" />
        </label>
      </div>

      <section className="grain relative rounded-2xl overflow-hidden border border-white/[0.05]" style={{ background: 'linear-gradient(180deg,#1f4a6e 0%,#1a4062 55%,#173a5a 100%)' }}>
        <div className="relative z-[2]">
          {rows.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Users} title={tab === 'all' ? 'Tidak ada atlet yang cocok' : `Belum ada atlet ${tab}`} text={tab !== 'all' && tab !== 'Free Fire' ? 'Ladder ini terisi setelah ada hasil yang diverifikasi panitia.' : 'Ubah kata kunci pencarian.'} compact />
            </div>
          ) : (
            <>
              <ul className="md:hidden divide-y divide-white/[0.06]">
                {rows.slice(0, limit).map((a) => (
                  <li key={a.id}>
                    <a href={href(`/atlet/${a.gameskii_id}`)} className={`flex items-center gap-3 px-4 py-3 ${profile?.id === a.id ? 'bg-gold/[0.07]' : ''}`}>
                      <span className="w-8 shrink-0">{a.rank <= 3 ? <RankBadge rank={a.rank} /> : <span className="font-mono text-white/60 text-[13px] pl-1.5 num">{a.rank}</span>}</span>
                      <Avatar seed={a.uid_fingerprint || a.ign} size={34} level={getTier(a.elo_points).level} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-white text-[14px] font-medium truncate">{a.ign}</span>
                        <span className="flex items-center gap-3 text-[12px] text-white/80 mt-0.5"><TrophyCount value={a.titles} tone="gold" /><TrophyCount value={a.podiums} tone="silver" /></span>
                      </span>
                      <span className="font-mono text-white text-[15px] num">{a.elo_points}</span>
                    </a>
                  </li>
                ))}
              </ul>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[760px] text-[13px]">
                  <thead className="bg-ink-950/25">
                    <tr className="text-left">
                      <th className="th pl-6 py-3.5 w-20">Rank</th>
                      <th className="th py-3.5">Atlet</th>
                      <th className="th py-3.5">Gameskii ID</th>
                      <th className="th py-3.5 text-right">Poin</th>
                      <th className="th py-3.5 pl-8 w-44">Tier</th>
                      <th className="th py-3.5">Juara 1</th>
                      <th className="th py-3.5">Podium</th>
                      <th className="th py-3.5 text-center">Event</th>
                      <th className="th py-3.5 pr-6 w-10"><span className="sr-only">Buka</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, limit).map((a) => {
                      const tier = getTier(a.elo_points);
                      return (
                        <tr key={a.id} className={`table-row row-accent cursor-pointer !border-white/[0.07] ${profile?.id === a.id ? 'is-me bg-gold/[0.07]' : ''}`} onClick={() => navigate(`/atlet/${a.gameskii_id}`)}>
                          <td className="pl-6 py-3.5">{a.rank <= 3 ? <RankBadge rank={a.rank} /> : <span className="font-mono text-white/60 pl-2 num">{a.rank}</span>}</td>
                          <td className="py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar seed={a.uid_fingerprint || a.ign} size={36} level={tier.level} />
                              <div className="min-w-0">
                                <p className="text-white font-medium truncate max-w-[220px]">{a.ign}</p>
                                <p className="text-[11px] text-white/50 inline-flex items-center gap-1.5"><GameIcon game={a.primary_game} size={12} rounded="rounded-[3px]" />{a.primary_game}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 font-mono text-white/60 text-[12px]">{a.gameskii_id}</td>
                          <td className="py-3.5 text-right font-mono text-white text-[14px] num">{a.elo_points}</td>
                          <td className="py-3.5 pl-8">
                            <p className="text-white/85 text-[12.5px]">{tier.name}</p>
                            <div className="mt-1 h-1 w-28 rounded-full bg-ink-950/40 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-cyan to-gold" style={{ width: `${Math.max(4, tier.progress)}%` }} /></div>
                          </td>
                          <td className="py-3.5 text-white/85"><TrophyCount value={a.titles} tone="gold" /></td>
                          <td className="py-3.5 text-white/85"><TrophyCount value={a.podiums} tone="silver" /></td>
                          <td className="py-3.5 text-center font-mono text-white/70 num">{a.events}</td>
                          <td className="py-3.5 pr-6 text-white/40"><ChevronRight className="h-4 w-4" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-white/[0.07] text-[12px] text-white/60">
            <span className="num">{Math.min(limit, rows.length)} dari {rows.length} atlet</span>
            <div className="flex gap-2">
              {rows.length > limit && <button onClick={() => setLimit(limit + 10)} className="btn btn-dark !py-1.5">Tampilkan 10 lagi</button>}
              <button onClick={() => openLadder(tab, setGameFilter)} className="btn btn-gold !py-1.5">Buka di Dashboard <ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------------- Page ---------------- */

export default function Landing() {
  const { leaderboard, account, profile, openAuth } = useStore();
  const featured = useMemo(() => [...COMPETITIONS].sort((a, b) => getAthletesForCompetition(b.id).length - getAthletesForCompetition(a.id).length).slice(0, 4), []);
  const heroSeeds = leaderboard.slice(0, 5).map((a) => a.uid_fingerprint || a.ign);

  useEffect(() => {
    document.title = 'Gameskii DIY | Leaderboard Esports Yogyakarta';
    return () => { document.title = 'Gameskii DIY | Paspor Atlet & Leaderboard Esports'; };
  }, []);

  return (
    <div className="app-bg min-h-screen overflow-x-clip">
      <LandingNav />

      <main className="max-w-[1320px] mx-auto px-4 sm:px-6 space-y-16 pb-16">
        {/* ============ HERO (same panel as the dashboard hero) ============ */}
        <section className="grain relative rounded-2xl overflow-hidden border border-white/[0.05] mt-2">
          <Art src={IMG.hero} className="absolute inset-0" position="center 40%" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,37,64,.97)_0%,rgba(17,37,64,.88)_38%,rgba(17,37,64,.45)_70%,rgba(17,37,64,.25)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(17,37,64,.95)_0%,transparent_45%)]" />
          <div className="relative z-[2] p-6 sm:p-10">
            <div className="max-w-2xl">
              <h1 className="font-display text-[52px] sm:text-[72px] lg:text-[84px] text-white leading-[0.9]">
                Leaderboard Esports
                <br />
                <span className="text-gold">D.I. Yogyakarta</span>
              </h1>
              <p className="text-[15px] text-soft mt-4 max-w-lg leading-relaxed">
                Peringkat atlet dari kompetisi yang tercatat di ESI DIY. Setiap poin berasal dari podium dan bisa ditelusuri ke klasemen aslinya.
              </p>
              <div className="flex flex-wrap gap-2.5 mt-7">
                <a href={href('/dashboard')} className="btn btn-gold !px-5">Buka Dashboard <ArrowRight className="h-4 w-4" /></a>
                <button onClick={() => scrollToId('leaderboard')} className="btn bg-white/10 hover:bg-white/15 text-white backdrop-blur !px-5">Lihat Leaderboard</button>
              </div>
            </div>

            <div className="mt-9 hero-stat-bar rounded-xl px-4 sm:px-5 py-3.5 grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:items-center sm:gap-x-7 sm:gap-y-3 border border-white/[0.06]">
              {[
                [Gamepad2, PILOT_STATS.standings, 'Hasil final tercatat'],
                [Flame, PILOT_STATS.competitions, 'Kompetisi'],
                [null, PILOT_STATS.podiums, 'Podium juara 1-3'],
              ].map(([Icon, n, l], i) => {
                const I = Icon as typeof Gamepad2 | null;
                return (
                  <React.Fragment key={l as string}>
                    {i > 0 && <div className="hidden sm:block h-9 w-px bg-white/10" />}
                    <div className={`flex items-center gap-3 ${i === 2 ? 'hidden sm:flex' : ''}`}>
                      <span className="hidden sm:grid h-9 w-9 rounded-lg bg-white/[0.06] place-items-center text-soft">{I ? <I className="h-[18px] w-[18px]" /> : <TrophyIcon className="h-[18px] w-[18px]" />}</span>
                      <div>
                        <p className="text-[22px] font-semibold text-white leading-none num">{n as number}</p>
                        <p className="text-[12px] text-gold mt-1">{l as string}</p>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <button onClick={() => scrollToId('leaderboard')} className="col-span-2 flex items-center justify-between sm:justify-start gap-3 sm:ml-auto pt-3 sm:pt-0 border-t border-white/10 sm:border-0">
                <div className="text-right">
                  <p className="font-mono text-[10px] tracking-[0.14em] text-muted">ATLET</p>
                  <p className="text-[20px] font-semibold text-white leading-none num">{leaderboard.length}</p>
                </div>
                <AvatarStack seeds={heroSeeds} size={34} />
              </button>
            </div>
          </div>
        </section>

        {/* ============ TOP 3 PER GAME ============ */}
        <section id="top3" className="scroll-mt-24">
          <SectionHeading title="Top 3 per Game" subtitle="Juara teratas di setiap kategori game" />
          <div className="flex xl:grid xl:grid-cols-4 gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-3 -mb-3 pt-1 -mt-1">
            {GAMES.map((g) => (
              <div key={g.name} className="snap-start shrink-0 w-[84%] sm:w-[47%] lg:w-[31.6%] xl:w-auto">
                <GameTop3Card game={g.name} />
              </div>
            ))}
          </div>
        </section>

        {/* ============ LEADERBOARD ============ */}
        <section id="leaderboard" className="scroll-mt-24">
          <SectionHeading
            title="Leaderboard"
            subtitle="Juara 1 +50, juara 2 +35, juara 3 +25 dari basis 1.200 poin"
            right={
              <div className="hidden sm:flex gap-2">
                {[1, 2, 3].map((r) => (
                  <span key={r} className="inline-flex items-center gap-2 rounded-lg bg-white/[0.05] pl-1 pr-2.5 py-1 text-[12px]">
                    <RankBadge rank={r} size={20} />
                    <span className="inline-flex items-center gap-1 font-mono text-gold">+{getRankEloDelta(r)}<CoinIcon className="h-3 w-3" /></span>
                  </span>
                ))}
              </div>
            }
          />
          <LandingLeaderboard />
        </section>

        {/* ============ COMPETITIONS ============ */}
        <section id="kompetisi" className="scroll-mt-24">
          <SectionHeading title="Kompetisi" subtitle="Klasemen final yang menjadi sumber poin" right={<a href={href('/kompetisi')} className="text-[13px] text-soft hover:text-gold inline-flex items-center gap-1 shrink-0">Semua kompetisi <ChevronRight className="h-4 w-4" /></a>} />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {featured.map((c) => <TournamentCard key={c.id} c={c} />)}
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section id="cara-kerja" className="scroll-mt-24 rounded-2xl panel p-5 sm:p-7">
          <SectionHeading title="Cara Kerja" subtitle="Dari podium ke paspor atlet" />
          <ol className="grid md:grid-cols-3 gap-3">
            {[
              [IdCard, 'Buat paspor', 'Daftar dengan email, lalu isi game, UID, wilayah, dan role. Kamu mendapat Gameskii ID.'],
              [UploadCloud, 'Klaim atau ajukan hasil', 'UID cocok dengan arsip? Ajukan klaim. Juara di turnamen baru? Upload screenshot klasemen.'],
              [ShieldCheck, 'Diverifikasi panitia', 'Panitia ESI DIY memeriksa bukti. Setelah terverifikasi, poin masuk leaderboard.'],
            ].map(([Icon, t, d], i) => {
              const I = Icon as typeof IdCard;
              return (
                <li key={t as string} className="rounded-xl bg-ink-750 border border-white/[0.05] px-4 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="h-6 w-6 rounded-md bg-gold text-ink-950 grid place-items-center font-mono text-[11px] font-bold">{i + 1}</span>
                    <span className="text-white text-[14px] font-semibold">{t as string}</span>
                    <I className="h-4 w-4 text-cyan ml-auto" />
                  </div>
                  <p className="text-[12.5px] text-muted mt-2 leading-relaxed">{d as string}</p>
                </li>
              );
            })}
          </ol>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {account ? (
              <a href={href(profile ? '/paspor' : '/dashboard')} className="btn btn-gold">{profile ? 'Lihat Paspor Saya' : 'Lengkapi Paspor'} <ArrowRight className="h-4 w-4" /></a>
            ) : (
              <button onClick={() => openAuth('signup')} className="btn btn-gold">Buat Paspor <ArrowRight className="h-4 w-4" /></button>
            )}
            <a href={href('/bantuan')} className="btn btn-dark">Pertanyaan umum</a>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-ink-950">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-10 grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <img src={ESI_DIY.logo} alt="Logo ESI DIY" className="h-14 w-14" />
            <div>
              <p className="text-[11px] text-muted">Dikelola oleh</p>
              <p className="text-white font-semibold leading-tight">{ESI_DIY.name}</p>
            </div>
          </div>
          <p className="text-[12.5px] text-muted mt-4 max-w-sm leading-relaxed">Portal paspor atlet dan leaderboard esports D.I. Yogyakarta.</p>
          <a href={ESI_DIY.instagram} target="_blank" rel="noreferrer" className="inline-block mt-3 text-[12.5px] text-cyan hover:underline">@esi_diy di Instagram</a>
        </div>
        <div>
          <p className="th mb-3">Jelajahi</p>
          <ul className="space-y-2 text-[13px]">
            <li><a href={href('/dashboard')} className="text-soft hover:text-white">Dashboard</a></li>
            <li><a href={href('/leaderboard')} className="text-soft hover:text-white">Leaderboard</a></li>
            <li><a href={href('/kompetisi')} className="text-soft hover:text-white">Kompetisi</a></li>
            <li><a href={href('/bantuan')} className="text-soft hover:text-white">Bantuan</a></li>
          </ul>
        </div>
        <div>
          <p className="th mb-3">Game</p>
          <ul className="space-y-2 text-[13px]">
            {GAMES.map((g) => (
              <li key={g.name} className="flex items-center gap-2 text-soft"><GameIcon game={g.name} size={18} rounded="rounded-[5px]" />{g.name}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/[0.05]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-muted">
          <span className="inline-flex items-center gap-2"><img src={crest} alt="" className="h-5 w-5 rounded" />Gameskii × ESI DIY</span>
          <span>© {new Date().getFullYear()} {ESI_DIY.name}</span>
        </div>
      </div>
    </footer>
  );
}
