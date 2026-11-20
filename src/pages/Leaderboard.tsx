import React, { useMemo, useState } from 'react';
import { ArrowDownUp, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { useStore, RankedAthlete } from '../lib/store';
import { href, navigate } from '../lib/router';
import { IMG } from '../lib/assets';
import { avatarFor } from '../lib/avatar';
import { REGENCY_OPTIONS, getTier } from '../data/constants';
import { PILOT_STATS } from '../data/pilot';
import { Art, Avatar, CoinIcon, Dropdown, EmptyState, ProvisionalBadge, TrophyCount } from '../components/ui';
import { RankBadge } from '../components/cards';
import { FilterBar, GameSelect, SearchInput } from './Dashboard';

const PAGE = 25;
type SortKey = 'points' | 'titles' | 'podiums' | 'events';

function PodiumCard({ a, place }: { a: RankedAthlete; place: 1 | 2 | 3 }) {
  const tier = getTier(a.elo_points);
  const h = place === 1 ? 'h-[118px]' : place === 2 ? 'h-[92px]' : 'h-[74px]';
  const plinth = place === 1 ? 'from-gold/35 to-gold/5 border-gold/40' : place === 2 ? 'from-[#c5d1e0]/25 to-transparent border-[#c5d1e0]/25' : 'from-[#c97c3c]/30 to-transparent border-[#c97c3c]/30';
  return (
    <a href={href(`/atlet/${a.gameskii_id}`)} className="group flex flex-col items-center w-[120px] sm:w-[150px]">
      <div className="relative">
        <img src={avatarFor(a.uid_fingerprint || a.ign)} alt="" className={`rounded-full transition-transform duration-300 group-hover:-translate-y-1 ${place === 1 ? 'h-[84px] w-[84px] ring-4 ring-gold shadow-[0_0_40px_-6px_rgba(255,210,31,.6)]' : 'h-[66px] w-[66px] ring-[3px] ring-white/30'}`} />
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2"><RankBadge rank={place} size={place === 1 ? 26 : 22} /></span>
      </div>
      <p className="mt-4 text-white font-semibold text-[14px] truncate max-w-full">{a.ign}</p>
      <p className="font-mono text-[12px] text-gold num">{a.elo_points} pts</p>
      <div className={`mt-2.5 w-full ${h} rounded-t-xl border border-b-0 bg-gradient-to-b ${plinth} flex flex-col items-center justify-start pt-3 gap-1.5`}>
        <span className="font-display text-[34px] leading-none text-white/90">{place}</span>
        <span className="flex items-center gap-2.5 text-[11.5px] text-white/80"><TrophyCount value={a.titles} tone="gold" /><TrophyCount value={a.podiums} tone="silver" /></span>
        {place === 1 && <span className="text-[10.5px] text-white/60">{tier.name}</span>}
      </div>
    </a>
  );
}

function SortHead({ k, label, sort, setSort, align = 'left' }: { k: SortKey; label: string; sort: SortKey; setSort: (k: SortKey) => void; align?: 'left' | 'right' | 'center' }) {
  const active = sort === k;
  return (
    <th className={`th py-3.5 ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : ''}`} aria-sort={active ? 'descending' : 'none'}>
      <button onClick={() => setSort(k)} className={`inline-flex items-center gap-1.5 uppercase tracking-[0.12em] hover:text-white ${active ? 'text-gold' : ''}`}>
        {label}
        {active ? <ChevronDown className="h-3 w-3" /> : <ArrowDownUp className="h-3 w-3 opacity-60" />}
      </button>
    </th>
  );
}

export default function Leaderboard() {
  const { leaderboard, state, profile } = useStore();
  const [regency, setRegency] = useState('all');
  const [sort, setSort] = useState<SortKey>('points');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(PAGE);

  const rows = useMemo(() => {
    let list = leaderboard;
    if (state.gameFilter !== 'all') list = list.filter((a) => a.primary_game === state.gameFilter);
    if (regency !== 'all') list = list.filter((a) => a.regency === regency);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((a) => a.ign.toLowerCase().includes(s) || a.gameskii_id.toLowerCase().includes(s));
    }
    if (sort !== 'points') list = [...list].sort((a, b) => b[sort] - a[sort] || b.elo_points - a.elo_points);
    return list;
  }, [leaderboard, state.gameFilter, regency, q, sort]);

  const me = profile ? leaderboard.find((a) => a.id === profile.id) : undefined;
  const [first, second, third] = leaderboard;

  return (
    <div className="space-y-6">
      {/* Header + podium */}
      <section className="grain relative rounded-2xl overflow-hidden border border-white/[0.05]">
        <Art src={IMG.stage} className="absolute inset-0" position="center 30%" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,37,64,.97)_0%,rgba(17,37,64,.88)_40%,rgba(17,37,64,.55)_100%)]" />
        <div className="relative z-[2] px-6 sm:px-9 pt-8 flex flex-col lg:flex-row lg:items-end gap-8">
          <div className="max-w-md pb-8">
            <div className="flex items-center gap-2"><span className="chip-mono chip-light num">{leaderboard.length} Atlet</span></div>
            <h1 className="font-display text-[52px] sm:text-[64px] text-white mt-3">Leaderboard</h1>
            <p className="text-[14px] text-soft leading-relaxed mt-1">Poin prestasi podium dari basis 1.200. Bukan Elo berbasis kekuatan lawan. Hanya juara 1-3 yang menambah poin.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[['Juara 1', 50, 1], ['Juara 2', 35, 2], ['Juara 3', 25, 3]].map(([l, p, r]) => (
                <span key={l} className="inline-flex items-center gap-2 rounded-lg bg-white/[0.07] pl-1 pr-2.5 py-1 text-[12px] text-white">
                  <RankBadge rank={r as number} size={20} />
                  {l}
                  <span className="inline-flex items-center gap-1 font-mono text-gold">+{p}<CoinIcon className="h-3 w-3" /></span>
                </span>
              ))}
            </div>
            {me && (
              <a href={href(`/atlet/${me.gameskii_id}`)} className="mt-5 inline-flex items-center gap-3 rounded-xl bg-gold/10 border border-gold/30 px-3 py-2 hover:bg-gold/15">
                <Avatar seed={me.uid_fingerprint || me.ign} size={30} level={getTier(me.elo_points).level} />
                <span className="text-[13px] text-white">Posisi kamu <b className="text-gold num">#{me.rank}</b> · {me.elo_points} pts</span>
              </a>
            )}
          </div>
          {first && second && third && (
            <div className="lg:ml-auto flex items-end justify-center gap-2 sm:gap-4">
              <PodiumCard a={second} place={2} />
              <PodiumCard a={first} place={1} />
              <PodiumCard a={third} place={3} />
            </div>
          )}
        </div>
      </section>

      <FilterBar>
        <GameSelect />
        <Dropdown
          label="Wilayah"
          value={regency}
          onChange={setRegency}
          options={[{ value: 'all', label: 'Semua' }, ...REGENCY_OPTIONS.map((r) => ({ value: r.name, label: r.name, hint: r.code })), { value: 'Belum Terverifikasi', label: 'Belum terverifikasi', hint: 'Atlet hasil impor arsip' }]}
        />
        <Dropdown<SortKey>
          label="Urutkan"
          value={sort}
          onChange={setSort}
          options={[{ value: 'points', label: 'Poin' }, { value: 'titles', label: 'Gelar juara 1' }, { value: 'podiums', label: 'Total podium' }, { value: 'events', label: 'Jumlah event' }]}
        />
        <SearchInput value={q} onChange={(v) => { setQ(v); setLimit(PAGE); }} placeholder="Cari IGN atau Gameskii ID…" />
      </FilterBar>

      <section className="grain relative rounded-2xl overflow-hidden border border-white/[0.05]" style={{ background: 'linear-gradient(180deg,#1f4a6e 0%,#1a4062 55%,#173a5a 100%)' }}>
        <div className="relative z-[2]">
          {rows.length === 0 ? (
            <div className="p-6"><EmptyState icon={Users} title="Tidak ada atlet untuk filter ini" text={regency !== 'all' && regency !== 'Belum Terverifikasi' ? 'Atlet hasil impor belum punya domisili terverifikasi. Coba “Belum terverifikasi”.' : 'Ubah filter atau kata kunci.'} /></div>
          ) : (
            <>
              <ul className="md:hidden divide-y divide-white/[0.06]">
                {rows.slice(0, limit).map((a) => {
                  const tier = getTier(a.elo_points);
                  const mine = me?.id === a.id;
                  return (
                    <li key={a.id}>
                      <a href={href(`/atlet/${a.gameskii_id}`)} className={`flex items-center gap-3 px-4 py-3 ${mine ? 'bg-gold/[0.07]' : ''}`}>
                        <span className="w-8 shrink-0">{a.rank <= 3 ? <RankBadge rank={a.rank} /> : <span className="font-mono text-white/60 text-[13px] pl-1.5 num">{a.rank}</span>}</span>
                        <Avatar seed={a.uid_fingerprint || a.ign} size={36} level={tier.level} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-white text-[14px] font-medium truncate">{a.ign}</span>
                          <span className="flex items-center gap-3 text-[12px] text-white/80 mt-0.5"><TrophyCount value={a.titles} tone="gold" /><TrophyCount value={a.podiums} tone="silver" /><span className="text-white/50">{tier.name}</span></span>
                        </span>
                        <span className="font-mono text-white text-[15px] num">{a.elo_points}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[820px] text-[13px]">
                  <thead className="bg-ink-950/25">
                    <tr className="text-left">
                      <th className="th pl-6 py-3.5 w-20">Rank</th>
                      <th className="th py-3.5">Atlet</th>
                      <th className="th py-3.5">Gameskii ID</th>
                      <SortHead k="points" label="Poin" sort={sort} setSort={setSort} align="right" />
                      <th className="th py-3.5 pl-8 w-44">Tier</th>
                      <SortHead k="titles" label="Juara 1" sort={sort} setSort={setSort} />
                      <SortHead k="podiums" label="Podium" sort={sort} setSort={setSort} />
                      <SortHead k="events" label="Event" sort={sort} setSort={setSort} align="center" />
                      <th className="th py-3.5 pr-6 w-10"><span className="sr-only">Buka</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, limit).map((a) => {
                      const tier = getTier(a.elo_points);
                      const mine = me?.id === a.id;
                      return (
                        <tr key={a.id} className={`table-row row-accent cursor-pointer !border-white/[0.07] ${mine ? 'is-me bg-gold/[0.07]' : ''}`} onClick={() => navigate(`/atlet/${a.gameskii_id}`)}>
                          <td className="pl-6 py-3.5">{a.rank <= 3 ? <RankBadge rank={a.rank} /> : <span className="font-mono text-white/60 pl-2 num">{a.rank}</span>}</td>
                          <td className="py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar seed={a.uid_fingerprint || a.ign} size={36} level={tier.level} />
                              <div className="min-w-0">
                                <p className="text-white font-medium truncate max-w-[220px]">
                                  {a.ign}
                                  {mine && <span className="ml-2 rounded bg-gold text-ink-950 px-1.5 py-px text-[10px] font-bold align-middle">KAMU</span>}
                                </p>
                                <p className="text-[11px] text-white/50">{a.isClaimed ? 'Riwayat dikonfirmasi' : a.isSelfRegistered ? 'Profil mandiri' : 'Arsip'} · {a.regency}</p>
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
            <span className="num">Menampilkan {Math.min(limit, rows.length)} dari {rows.length} atlet · peringkat seri berbagi nomor</span>
            {rows.length > limit && <button onClick={() => setLimit(limit + PAGE)} className="btn btn-dark !py-1.5">Tampilkan {Math.min(PAGE, rows.length - limit)} lagi</button>}
          </div>
        </div>
      </section>
      <p className="text-[12px] text-muted">{PILOT_STATS.attributions} atribusi individu dari {PILOT_STATS.podiums} podium. Hasil ambigu atau tanpa UID tidak diberi poin individu.</p>
    </div>
  );
}
