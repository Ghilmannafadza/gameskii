import React from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { href } from '../lib/router';
import { imageForCompetition } from '../lib/assets';
import { AUDIT_LABEL, PilotCompetition, getAthletesForCompetition, getPodiums, getStandings } from '../data/pilot';
import { Art, AvatarStack, BrandIcon, CoinIcon, GameIcon } from './ui';

export function competitionSummary(c: PilotCompetition) {
  const standings = getStandings(c.id);
  const podiums = getPodiums(c.id);
  const champion = podiums.find((p) => p.rank === 1);
  const divisions = new Set(standings.map((s) => s.division)).size;
  return {
    finalists: standings.length,
    divisions,
    podiums,
    champion: champion?.team_name,
    topScore: champion?.final_points,
    description: `Final ${c.divisions} dengan ${standings.length} tim finalis${champion ? `. Juara: ${champion.team_name}` : ''}.`,
  };
}

export function AuditDot({ status, className = '' }: { status: string; className?: string }) {
  const a = AUDIT_LABEL[status] || { label: status, tone: 'warn' as const };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md bg-ink-950/70 backdrop-blur px-2 py-[3px] text-[10.5px] text-white/90 ${className}`} title={`Status audit: ${a.label}`}>
      <span className={`status-dot ${a.tone === 'ok' ? 'bg-emerald-300' : 'bg-amber-300'}`} />
      {a.label}
    </span>
  );
}

/** Tournament card, mirrors the reference "Featured tournaments" card, detail for detail. */
export function TournamentCard({ c }: { c: PilotCompetition }) {
  const sum = competitionSummary(c);
  const athletes = getAthletesForCompetition(c.id);
  const seeds = athletes.slice(0, 4).map((a) => a.uid_fingerprint || a.ign);
  const to = href(`/kompetisi/${c.id}`);

  return (
    <article className="t-card lift group flex flex-col min-w-0 border border-white/[0.05]">
      <a href={to} className="relative block rounded-[0.65rem] overflow-hidden aspect-[16/9]" aria-label={c.name}>
        <Art src={imageForCompetition(c.id)} className="absolute inset-0 [&>img]:transition-transform [&>img]:duration-700 group-hover:[&>img]:scale-[1.06]" />
        <span className="absolute z-[3] top-2.5 left-2.5 chip-mono chip-dark inline-flex items-center gap-1.5 !text-[10.5px] !py-[3px]">
          <Clock className="h-3 w-3 text-white/70" />
          FINAL {c.year}
        </span>
        <AuditDot status={c.audit_status} className="absolute z-[3] top-2.5 right-2.5" />
        <span className="absolute z-[3] bottom-0 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-t-[9px] bg-[#243c5f] pl-2.5 pr-2 pt-1 pb-[5px] text-[11px] text-white shadow-[0_-6px_14px_-6px_rgba(0,0,0,.6)]">
          <BrandIcon name="android" className="h-3 w-3" color="#9fb3cf" />
          {c.game}
          <GameIcon game={c.game} size={15} rounded="rounded-[4px]" className="ml-0.5" />
        </span>
      </a>
      <div className="px-2.5 pt-4 pb-3.5 flex-1 flex flex-col">
        <p className="font-mono text-[10.5px] text-muted uppercase tracking-[0.06em] flex items-center gap-1.5 whitespace-nowrap min-w-0">
          <span>{c.year}</span>
          <span className="h-[3px] w-[3px] rounded-full bg-muted/70" />
          <span className="truncate">{c.divisions}</span>
          {sum.divisions > 1 && <span className="ml-auto shrink-0 text-cyan">{sum.divisions} divisi</span>}
        </p>
        <h3 className="mt-1.5 text-[15.5px] font-semibold text-white leading-snug line-clamp-1" title={c.name}>
          <a href={to} className="hover:text-gold transition-colors">{c.name}</a>
        </h3>
        <p className="mt-1 text-[12.5px] text-muted leading-relaxed line-clamp-2 min-h-[2.6em]">
          {sum.finalists} tim finalis{sum.champion ? <> · juara <span className="text-soft font-medium">{sum.champion}</span>{sum.topScore ? <> dengan <span className="text-soft num">{sum.topScore}</span> poin</> : null}</> : null}.
        </p>
        <a href={to} className="cta-split mt-4">
          <span className="pts">
            +50 pts
            <CoinIcon />
          </span>
          <span className="join gap-1.5">
            Lihat Klasemen
            <ArrowRight className="h-3.5 w-3.5 -ml-1 opacity-0 -translate-x-1 transition group-hover:opacity-100 group-hover:translate-x-0" />
          </span>
        </a>
      </div>
      <div className="t-card-foot -mx-[0.45rem] -mb-[0.45rem] px-3.5 min-h-[48px] flex items-center gap-3 border-t border-white/[0.04]">
        {seeds.length > 0 ? (
          <AvatarStack seeds={seeds} extra={Math.max(0, athletes.length - seeds.length)} size={22} />
        ) : (
          <span className="text-[11px] text-amber-200/80 rounded bg-amber-300/10 px-1.5 py-0.5">Roster belum tertaut</span>
        )}
        <span className="text-[12px] text-muted num">
          {athletes.length > 0 && <>{athletes.length} atlet · </>}
          <span className="text-soft">{sum.finalists}</span>/{sum.finalists} finalis
        </span>
      </div>
    </article>
  );
}

const MEDAL: Record<number, { bg: string; fg: string; ring: string }> = {
  1: { bg: 'linear-gradient(160deg,#ffe680,#f4c20d 55%,#c99300)', fg: '#3a2a00', ring: 'rgba(255,210,31,.45)' },
  2: { bg: 'linear-gradient(160deg,#f3f7fc,#c5d1e0 55%,#93a4ba)', fg: '#1d2b40', ring: 'rgba(197,209,224,.4)' },
  3: { bg: 'linear-gradient(160deg,#f2b37a,#c97c3c 55%,#93541f)', fg: '#2b1606', ring: 'rgba(201,124,60,.45)' },
};

export function RankBadge({ rank, size = 28 }: { rank: number; size?: number }) {
  const m = MEDAL[rank];
  if (!m) {
    return <span className="inline-grid place-items-center rounded-lg bg-ink-700 text-soft font-mono text-[12px] num" style={{ height: size, minWidth: size, padding: '0 6px' }}>{rank}</span>;
  }
  return (
    <span
      className="inline-grid place-items-center rounded-lg font-mono font-bold num"
      style={{ height: size, minWidth: size, background: m.bg, color: m.fg, fontSize: size * 0.44, boxShadow: `0 0 0 1px ${m.ring}, inset 0 1px 0 rgba(255,255,255,.5)` }}
    >
      {rank}
    </span>
  );
}
