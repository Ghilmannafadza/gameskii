import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, ExternalLink, FileSpreadsheet, Trophy, UploadCloud, Users } from 'lucide-react';
import { useStore } from '../lib/store';
import { href, navigate } from '../lib/router';
import { imageForCompetition } from '../lib/assets';
import {
  AUDIT_LABEL,
  COMPETITIONS,
  PILOT_FREE_FIRE_DATABASE,
  ROSTER_FLAG_LABEL,
  getCompetition,
  getDivisions,
  getPodiums,
  getRosterForResult,
  getStandings,
} from '../data/pilot';
import { getRankEloDelta, getTier } from '../data/constants';
import { RankBadge, TournamentCard, competitionSummary } from '../components/cards';
import { Art, Avatar, AvatarStack, CoinIcon, Dropdown, EmptyState, GameIcon, ProvisionalBadge, SectionHeading } from '../components/ui';
import { PageHero } from '../components/layout';
import { AUDIT_OPTIONS, FilterBar, GameSelect, ORDER_OPTIONS, SearchInput, useFilteredCompetitions } from './Dashboard';

function AuditChip({ status }: { status: string }) {
  const a = AUDIT_LABEL[status] || { label: status, tone: 'warn' as const };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] ${a.tone === 'ok' ? 'bg-emerald-400/12 text-emerald-300' : 'bg-amber-400/12 text-amber-300'}`}>
      {a.tone === 'ok' ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
      {a.label}
    </span>
  );
}

export default function Competitions({ tab }: { tab: string }) {
  const [order, setOrder] = useState('new');
  const [audit, setAudit] = useState('all');
  const [q, setQ] = useState('');
  const comps = useFilteredCompetitions(order, audit, q);
  const ids = new Set(comps.map((c) => c.id));

  return (
    <div className="space-y-6">
      <FilterBar>
        <Dropdown label="Urutkan" value={order} onChange={setOrder} options={ORDER_OPTIONS} />
        <GameSelect />
        <Dropdown label="Status data" value={audit} onChange={setAudit} options={AUDIT_OPTIONS} />
        <SearchInput value={q} onChange={setQ} placeholder="Cari di kompetisi…" />
      </FilterBar>

      {tab === 'klasemen' ? (
        <section className="rounded-2xl panel p-5 sm:p-6">
          <SectionHeading title="Semua Podium" subtitle="Juara 1-3 dari setiap divisi final. Klik baris untuk melihat klasemen lengkap." />
          <div className="overflow-x-auto -mx-5 sm:-mx-6">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead>
                <tr className="text-left">
                  <th className="th px-6 py-2">Peringkat</th>
                  <th className="th py-2">Tim</th>
                  <th className="th py-2">Kompetisi</th>
                  <th className="th py-2">Divisi</th>
                  <th className="th py-2 text-right">Poin Final</th>
                  <th className="th py-2 pr-6 text-right">Atribusi Individu</th>
                </tr>
              </thead>
              <tbody>
                {PILOT_FREE_FIRE_DATABASE.podiums.filter((p) => ids.has(p.competition_id)).map((p) => (
                  <tr key={p.id} className="table-row row-accent cursor-pointer" onClick={() => navigate(`/kompetisi/${p.competition_id}`)}>
                    <td className="px-6 py-3"><RankBadge rank={p.rank} /></td>
                    <td className="py-3 text-white">{p.team_name}</td>
                    <td className="py-3"><span className="flex items-center gap-2.5"><Art src={imageForCompetition(p.competition_id)} className="relative h-8 w-11 rounded-md shrink-0" /><span className="text-soft line-clamp-1 max-w-[240px]">{getCompetition(p.competition_id)?.name}</span></span></td>
                    <td className="py-3 text-muted">{p.division}</td>
                    <td className="py-3 text-right font-mono text-white">{p.final_points}</td>
                    <td className="py-3 pr-6 text-right">
                      {p.roster_status === 'REQUIRES_REVIEW' ? (
                        <span className="text-amber-300 text-[12px]">Perlu ditinjau</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-gold">+{getRankEloDelta(p.rank)}<CoinIcon className="h-3 w-3" /><span className="text-muted ml-1">/ pemain</span></span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : tab === 'arsip' ? (
        <section className="rounded-2xl panel p-5 sm:p-6">
          <SectionHeading title="Arsip Sumber" subtitle="Setiap angka di aplikasi ini dapat ditelusuri ke spreadsheet panitia." />
          <div className="overflow-x-auto -mx-5 sm:-mx-6">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead>
                <tr className="text-left">
                  <th className="th px-6 py-2">ID</th>
                  <th className="th py-2">Kompetisi</th>
                  <th className="th py-2">Tahun</th>
                  <th className="th py-2">Tab Final</th>
                  <th className="th py-2">Status Audit</th>
                  <th className="th py-2 pr-6 text-right">Sumber</th>
                </tr>
              </thead>
              <tbody>
                {comps.map((c) => (
                  <tr key={c.id} className="table-row">
                    <td className="px-6 py-3 font-mono text-muted">{c.id}</td>
                    <td className="py-3"><a href={href(`/kompetisi/${c.id}`)} className="text-white hover:text-gold">{c.name}</a></td>
                    <td className="py-3 text-soft font-mono">{c.year}</td>
                    <td className="py-3 text-muted font-mono text-[12px]">{c.source_final_tab} · baris {c.source_rows}</td>
                    <td className="py-3"><AuditChip status={c.audit_status} /></td>
                    <td className="py-3 pr-6 text-right">
                      <a href={c.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan hover:underline">
                        Spreadsheet <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[12px] text-muted mt-4">Snapshot audit {PILOT_FREE_FIRE_DATABASE.provenance.audit_date}. Sumber: {PILOT_FREE_FIRE_DATABASE.provenance.source}.</p>
        </section>
      ) : (
        <section>
          <SectionHeading title="Semua Kompetisi" subtitle={`${comps.length} kompetisi · klasemen final, podium, dan roster tertaut`} />
          {comps.length === 0 ? (
            <EmptyState icon={Trophy} title="Tidak ada kompetisi yang cocok" text="Data pilot saat ini hanya berisi Free Fire. Ubah filter game atau kata kunci." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {comps.map((c) => <TournamentCard key={c.id} c={c} />)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export function CompetitionDetail({ id }: { id: string }) {
  const c = getCompetition(id);
  const { leaderboard } = useStore();
  const divisions = c ? getDivisions(c.id) : [];
  const [division, setDivision] = useState(divisions[0] || '');
  const [open, setOpen] = useState<string | null>(null);
  const standings = useMemo(() => (c ? getStandings(c.id).filter((s) => s.division === division).sort((a, b) => a.rank - b.rank) : []), [c, division]);

  if (!c) {
    return <EmptyState icon={Trophy} title="Kompetisi tidak ditemukan" action={<a className="btn btn-dark" href={href('/kompetisi')}>Kembali ke daftar</a>} />;
  }
  const sum = competitionSummary(c);
  const linked = leaderboard.filter((a) => a.source_event_ids?.includes(c.id));
  const podiumById = new Map(getPodiums(c.id).map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <PageHero
        image={imageForCompetition(c.id)}
        eyebrow={
          <>
            <a href={href('/kompetisi')} className="text-[12px] text-soft hover:text-white">← Semua kompetisi</a>
            <span className="h-3 w-px bg-white/20" />
            <span className="inline-flex items-center gap-1.5 text-[12px] text-soft"><GameIcon game={c.game} size={16} rounded="rounded" /> {c.game}</span>
            <AuditChip status={c.audit_status} />
          </>
        }
        title={c.name}
        right={
          <div className="flex flex-wrap gap-2">
            <a href={c.source_url} target="_blank" rel="noreferrer" className="btn bg-white/10 hover:bg-white/15 text-white backdrop-blur"><FileSpreadsheet className="h-4 w-4" /> Sumber Data</a>
            <a href={href(`/upload?c=${c.id}`)} className="btn btn-gold"><UploadCloud className="h-4 w-4" /> Ajukan Hasil</a>
          </div>
        }
      >
        <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3 max-w-xl">
          {[
            ['Tahun', c.year],
            ['Divisi', String(divisions.length)],
            ['Tim finalis', String(sum.finalists)],
            ['Atlet tertaut', String(linked.length)],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="th !text-[10px]">{k}</dt>
              <dd className="text-white text-[18px] font-semibold num mt-0.5">{v}</dd>
            </div>
          ))}
        </dl>
      </PageHero>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[2, 1, 3].map((r) => {
          const p = getPodiums(c.id).find((x) => x.rank === r && x.division === division);
          if (!p) return <div key={r} className="hidden md:block" />;
          const roster = getRosterForResult(p.id).filter((m) => m.awarded);
          const tone = r === 1 ? 'from-gold/25 border-gold/40' : r === 2 ? 'from-[#c5d1e0]/15 border-[#c5d1e0]/25' : 'from-[#c97c3c]/20 border-[#c97c3c]/30';
          return (
            <button key={r} onClick={() => setOpen(p.id)} className={`lift text-left rounded-2xl border bg-gradient-to-b ${tone} to-ink-800 p-5 ${r === 1 ? 'md:-mt-2 md:pb-7' : 'md:mt-3'} ${r === 1 ? 'order-first md:order-none' : ''}`}>
              <div className="flex items-center justify-between">
                <RankBadge rank={r} size={r === 1 ? 34 : 28} />
                <span className="inline-flex items-center gap-1 font-mono text-[12px] text-gold">+{getRankEloDelta(r)} <CoinIcon className="h-3 w-3" /></span>
              </div>
              <p className={`mt-3 font-display text-white ${r === 1 ? 'text-[34px]' : 'text-[28px]'} leading-none truncate`}>{p.team_name}</p>
              <p className="text-[12px] text-muted mt-1 num">{p.final_points} poin final{getStandings(c.id).find((s) => s.id === p.id)?.booyah ? ` · ${getStandings(c.id).find((s) => s.id === p.id)?.booyah} booyah` : ''}</p>
              <div className="mt-4 flex items-center gap-3">
                {roster.length ? <AvatarStack seeds={roster.map((m) => m.uid_fingerprint || m.nickname)} size={26} /> : <span className="text-[11px] text-amber-200/80 rounded bg-amber-300/10 px-1.5 py-0.5">{p.roster_status === 'REQUIRES_REVIEW' ? 'Perlu ditinjau' : 'Roster belum tertaut'}</span>}
                {roster.length > 0 && <span className="text-[12px] text-soft">{roster.length} atlet dapat poin</span>}
              </div>
            </button>
          );
        })}
      </section>

      <section className="rounded-2xl panel p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="h-section">Klasemen Final</h2>
            <p className="text-[13px] text-muted mt-1">Tab sumber: {c.source_final_tab} · baris {c.source_rows}. Klik tim podium untuk melihat roster tertaut.</p>
          </div>
          {divisions.length > 1 && (
            <div className="flex gap-1 rounded-xl bg-ink-750 p-1">
              {divisions.map((d) => (
                <button key={d} onClick={() => setDivision(d)} className={`top-tab !py-1.5 ${division === d ? 'active' : ''}`}>{d}</button>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-x-auto -mx-5 sm:-mx-6">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="text-left">
                <th className="th px-6 py-2 w-20">Rank</th>
                <th className="th py-2">Tim</th>
                <th className="th py-2 text-right">Booyah</th>
                <th className="th py-2 text-right">Poin Final</th>
                <th className="th py-2 text-center">Pendaftaran</th>
                <th className="th py-2 pr-6 text-right">Poin Atlet</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s) => {
                const podium = podiumById.get(s.id);
                const roster = podium ? getRosterForResult(s.id) : [];
                const expanded = open === s.id;
                return (
                  <React.Fragment key={s.id}>
                    <tr
                      className={`table-row row-accent ${podium ? 'cursor-pointer' : ''} ${s.rank <= 3 ? 'bg-gold/[0.03]' : ''} ${expanded ? 'is-me' : ''}`}
                      onClick={() => podium && setOpen(expanded ? null : s.id)}
                      aria-expanded={podium ? expanded : undefined}
                    >
                      <td className="px-6 py-3"><RankBadge rank={s.rank} /></td>
                      <td className="py-3">
                        <span className="text-white">{s.team_name}</span>
                        {podium && <ChevronDown className={`inline h-4 w-4 ml-1.5 text-muted transition ${expanded ? 'rotate-180' : ''}`} />}
                      </td>
                      <td className="py-3 text-right font-mono text-soft">{s.booyah ?? '-'}</td>
                      <td className="py-3 text-right font-mono text-white">{s.final_points}</td>
                      <td className="py-3 text-center text-[11px] font-mono text-muted">{s.registration_match}</td>
                      <td className="py-3 pr-6 text-right font-mono">
                        {podium ? (podium.roster_status === 'REQUIRES_REVIEW' ? <span className="text-amber-300">ditinjau</span> : <span className="text-gold">+{getRankEloDelta(s.rank)}</span>) : <span className="text-muted">0</span>}
                      </td>
                    </tr>
                    {expanded && podium && (
                      <tr>
                        <td colSpan={6} className="px-6 pb-4">
                          <div className="rounded-xl bg-ink-750 p-4">
                            {podium.roster_flags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {podium.roster_flags.map((f) => (
                                  <span key={f} className="chip-mono bg-amber-300/10 text-amber-200">{ROSTER_FLAG_LABEL[f] || f}</span>
                                ))}
                              </div>
                            )}
                            {roster.length === 0 ? (
                              <p className="text-[13px] text-muted">Roster tidak dapat ditautkan otomatis untuk tim ini.</p>
                            ) : (
                              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {roster.map((m, i) => {
                                  const ath = m.uid_fingerprint ? leaderboard.find((a) => a.uid_fingerprint === m.uid_fingerprint) : undefined;
                                  const inner = (
                                    <>
                                      <Avatar seed={m.uid_fingerprint || m.nickname} size={30} level={ath ? getTier(ath.elo_points).level : undefined} />
                                      <div className="min-w-0">
                                        <p className="text-white truncate">{m.nickname || 'Tanpa nama'}</p>
                                        <p className="text-[11px] text-muted font-mono">Slot {m.slot} · UID {m.uid_masked || '-'}</p>
                                      </div>
                                      <span className={`ml-auto chip-mono ${m.awarded ? 'bg-gold/15 text-gold' : 'bg-white/5 text-muted'}`}>{m.awarded ? `+${getRankEloDelta(s.rank)}` : 'tidak dihitung'}</span>
                                    </>
                                  );
                                  return ath ? (
                                    <a key={i} href={href(`/atlet/${ath.gameskii_id}`)} className="flex items-center gap-3 rounded-lg bg-ink-800 px-3 py-2.5 hover:ring-1 hover:ring-gold/50">{inner}</a>
                                  ) : (
                                    <div key={i} className="flex items-center gap-3 rounded-lg bg-ink-800 px-3 py-2.5">{inner}</div>
                                  );
                                })}
                              </div>
                            )}
                            <p className="text-[11px] text-muted mt-3">Poin hanya untuk 4 slot utama terdaftar dengan UID valid. Cadangan dan nama tanpa UID tidak dihitung.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="rounded-xl bg-ink-800/70 px-5 py-4 flex flex-wrap items-center gap-3 text-[13px] text-soft">
        <Users className="h-4 w-4 text-muted" />
        Poin individu berasal dari roster pendaftaran, belum bukti lineup yang benar-benar bermain di final.
      </div>
    </div>
  );
}

export const COMPETITION_COUNT = COMPETITIONS.length;
