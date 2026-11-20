/**
 * Read-only, privacy-minimized FFYK fixture from the audited 10 competitions.
 * This is a provisional demo ranking, not an official ESI or publisher certification.
 */
import pilot from './pilot-free-fire.json';
import type { AthleteProfile } from '../types';
import { BASE_POINTS, getRankEloDelta, getTier } from './constants';

export const PILOT_FREE_FIRE_DATABASE = pilot;

export type PilotCompetition = (typeof pilot.competitions)[number];
export type PilotStanding = (typeof pilot.standings)[number];
export type PilotPodium = (typeof pilot.podiums)[number];
export type PilotMembership = (typeof pilot.team_memberships)[number];
export type PilotAttribution = (typeof pilot.achievement_attributions)[number];

// Aggregation keyed by stable UID fingerprint, never by team name.
const totals = new Map<string, { points: number; podiums: number; titles: number; events: Set<string> }>();
const seen = new Set<string>();
export const COUNTED_ATTRIBUTIONS: PilotAttribution[] = [];
for (const award of pilot.achievement_attributions) {
  const dedup = `${award.uid_fingerprint}:${award.competition_id}:${award.division}`;
  if (seen.has(dedup) || award.status !== 'PROVISIONAL_ROSTER_MATCH') continue;
  seen.add(dedup);
  COUNTED_ATTRIBUTIONS.push(award);
  const prior = totals.get(award.uid_fingerprint) || { points: 0, podiums: 0, titles: 0, events: new Set<string>() };
  prior.points += getRankEloDelta(award.rank);
  prior.podiums += 1;
  prior.titles += award.rank === 1 ? 1 : 0;
  prior.events.add(award.competition_id);
  totals.set(award.uid_fingerprint, prior);
}

export const PILOT_FREE_FIRE_ATHLETES: AthleteProfile[] = pilot.athletes
  .map((p): AthleteProfile => {
    const t = totals.get(p.uid_fingerprint);
    const points = BASE_POINTS + (t?.points || 0);
    return {
      ...p,
      full_name: '',
      whatsapp: '',
      regency: 'Belum Terverifikasi',
      regency_code: 'UNK',
      role: 'Belum Ditentukan',
      primary_game: 'Free Fire',
      elo_points: points,
      matches_played: t?.podiums || 0,
      wins: t?.titles || 0,
      rank_tier: getTier(points).name,
      source_event_ids: [...(t?.events || [])],
      seed_status: 'PROVISIONAL_ROSTER_MATCH',
      is_imported: true,
    };
  })
  .sort((a, b) => b.elo_points - a.elo_points);

export const COMPETITIONS = pilot.competitions;

export function getCompetition(id: string | null | undefined) {
  return pilot.competitions.find((c) => c.id === id);
}

export function getStandings(competitionId: string) {
  return pilot.standings.filter((s) => s.competition_id === competitionId);
}

export function getDivisions(competitionId: string): string[] {
  return [...new Set(getStandings(competitionId).map((s) => s.division))];
}

export function getPodiums(competitionId: string) {
  return pilot.podiums.filter((p) => p.competition_id === competitionId).sort((a, b) => a.rank - b.rank);
}

export function getRosterForResult(resultId: string) {
  return pilot.team_memberships.filter((m) => m.result_id === resultId);
}

export function getAttributionsForAthlete(fingerprint: string | undefined) {
  if (!fingerprint) return [];
  return COUNTED_ATTRIBUTIONS.filter((a) => a.uid_fingerprint === fingerprint).sort((a, b) => {
    const ca = getCompetition(a.competition_id);
    const cb = getCompetition(b.competition_id);
    return Number(cb?.year || 0) - Number(ca?.year || 0) || a.competition_id.localeCompare(b.competition_id);
  });
}

export function getAthletesForCompetition(competitionId: string) {
  const fps = new Set(COUNTED_ATTRIBUTIONS.filter((a) => a.competition_id === competitionId).map((a) => a.uid_fingerprint));
  return PILOT_FREE_FIRE_ATHLETES.filter((a) => a.uid_fingerprint && fps.has(a.uid_fingerprint));
}

export const PILOT_STATS = {
  competitions: pilot.competitions.length,
  standings: pilot.standings.length,
  podiums: pilot.podiums.length,
  athletes: pilot.athletes.length,
  attributions: COUNTED_ATTRIBUTIONS.length,
};

export const AUDIT_LABEL: Record<string, { label: string; tone: 'ok' | 'warn' }> = {
  MATCHED: { label: 'Data cocok', tone: 'ok' },
  'REVIEW PARTIAL': { label: 'Sebagian ditinjau', tone: 'warn' },
  'REVIEW NAMA': { label: 'Nama ditinjau', tone: 'warn' },
};

export const ROSTER_FLAG_LABEL: Record<string, string> = {
  PLAYER_UID_MISSING: 'Sebagian UID pemain kosong',
  INCOMPLETE_PRIMARY_ROSTER: 'Roster utama tidak lengkap',
  UNCONFIRMED_TEAM_MATCH: 'Nama tim belum terkonfirmasi',
  DUPLICATE_REGISTRATION: 'Pendaftaran ganda',
};
