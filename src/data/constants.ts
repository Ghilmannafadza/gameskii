import { GameName, GameRole, MatchType, Regency, RegencyCode } from '../types';

export const REGENCY_OPTIONS: { name: Regency; code: RegencyCode }[] = [
  { name: 'Sleman', code: 'SLM' },
  { name: 'Bantul', code: 'BTL' },
  { name: 'Yogyakarta', code: 'YOG' },
  { name: 'Gunungkidul', code: 'GKD' },
  { name: 'Kulon Progo', code: 'KLP' },
];

export const GAME_OPTIONS: GameName[] = ['Free Fire', 'Mobile Legends', 'PUBG Mobile', 'e-Football Console'];

export const MATCH_TYPES: { value: MatchType; label: string }[] = [
  { value: 'Turnamen Komunitas', label: 'Turnamen Komunitas' },
  { value: 'BePro Series', label: 'BePro Series' },
  { value: 'Tournament by Game Developer', label: 'Turnamen Publisher' },
];

export const MLBB_ROLES: GameRole[] = ['Jungler', 'Roamer', 'Midlaner', 'Goldlaner', 'Explaner'];
export const FREE_FIRE_ROLES: GameRole[] = ['Rusher', 'Flanker', 'Support', 'Sniper', 'In-Game Leader (IGL)'];
export const PUBGM_ROLES: GameRole[] = ['Fragger', 'Scout', 'In-Game Leader (IGL)', 'Support', 'Sniper'];
export const EFOOTBALL_ROLES: GameRole[] = ['Striker', 'Midlaner', 'Support'];

export function getRolesByGame(game: GameName): GameRole[] {
  switch (game) {
    case 'Mobile Legends': return MLBB_ROLES;
    case 'Free Fire': return FREE_FIRE_ROLES;
    case 'PUBG Mobile': return PUBGM_ROLES;
    case 'e-Football Console': return EFOOTBALL_ROLES;
    default: return FREE_FIRE_ROLES;
  }
}

export function getRegencyCode(regency: Regency): RegencyCode {
  switch (regency) {
    case 'Sleman': return 'SLM';
    case 'Bantul': return 'BTL';
    case 'Yogyakarta': return 'YOG';
    case 'Gunungkidul': return 'GKD';
    case 'Kulon Progo': return 'KLP';
    default: return 'UNK';
  }
}

/** DIY-[REGENCY_CODE]-[4 digits]; regenerates until it does not collide with `taken`. */
export function generateGameskiiId(regency: Regency, taken: Set<string> = new Set()): string {
  const code = getRegencyCode(regency);
  for (let i = 0; i < 200; i++) {
    const id = `DIY-${code}-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!taken.has(id)) return id;
  }
  return `DIY-${code}-${Date.now().toString().slice(-6)}`;
}

export const BASE_POINTS = 1200;

export const TIERS = [
  { name: 'Rookie', min: 0, level: 1 },
  { name: 'Prospect', min: 1000, level: 2 },
  { name: 'Challenger', min: 1200, level: 3 },
  { name: 'Master', min: 1400, level: 4 },
  { name: 'Grand Master', min: 1600, level: 5 },
] as const;

export function getTier(points: number) {
  let idx = 0;
  TIERS.forEach((t, i) => { if (points >= t.min) idx = i; });
  const tier = TIERS[idx];
  const next = TIERS[idx + 1];
  const progress = next ? Math.round(((points - tier.min) / (next.min - tier.min)) * 100) : 100;
  return { ...tier, next, progress: Math.max(0, Math.min(100, progress)), toNext: next ? next.min - points : 0 };
}

/** Kept for compatibility with the old UI naming. */
export function getEloTier(points: number) {
  return { name: getTier(points).name };
}

// Achievement points only (podium), NOT opponent-adjusted Elo.
export function getRankEloDelta(rank: number): number {
  if (rank === 1) return 50;
  if (rank === 2) return 35;
  if (rank === 3) return 25;
  return 0;
}

export const RANK_LABEL: Record<number, string> = { 1: 'Juara 1', 2: 'Juara 2', 3: 'Juara 3' };

export const DEMO_REFEREE_CODE = 'WASIT-DIY-2026';
