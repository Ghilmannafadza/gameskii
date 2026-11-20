export type Regency = 'Sleman' | 'Bantul' | 'Yogyakarta' | 'Gunungkidul' | 'Kulon Progo' | 'Belum Terverifikasi';

export type RegencyCode = 'SLM' | 'BTL' | 'YOG' | 'GKD' | 'KLP' | 'UNK';

export type GameName = 'Mobile Legends' | 'Free Fire' | 'PUBG Mobile' | 'e-Football Console';

export type GameRole =
  | 'Jungler'
  | 'Roamer'
  | 'Midlaner'
  | 'Goldlaner'
  | 'Explaner'
  | 'Rusher'
  | 'Flanker'
  | 'Support'
  | 'Sniper'
  | 'Fragger'
  | 'Scout'
  | 'In-Game Leader (IGL)'
  | 'Striker'
  | 'Belum Ditentukan';

export type MatchType = 'BePro Series' | 'Tournament by Game Developer' | 'Turnamen Komunitas';

export type AccountRole = 'athlete' | 'referee';

/** Login account (local demo or Supabase Auth). */
export interface Account {
  id: string;
  email: string;
  password_hash?: string; // local demo only (SHA-256). Never use for production auth.
  role: AccountRole;
  created_at: string;
}

/**
 * Public-facing athlete record shown on the leaderboard.
 * `full_name`, `whatsapp` and raw `game_id` are PRIVATE and only shown to the owner.
 */
export interface AthleteProfile {
  id: string;
  user_id: string; // account id for self-registered profiles, fixture id for imported athletes
  full_name: string;
  ign: string;
  game_id: string;
  regency: Regency;
  regency_code: RegencyCode;
  role: GameRole;
  primary_game: GameName;
  whatsapp: string;
  gameskii_id: string; // DIY-[REGENCY_CODE]-[4 digits]
  elo_points: number;
  matches_played: number; // = podium appearances (imported) + verified submissions
  wins: number; // = champion (#1) titles
  avatar_url?: string;
  rank_tier: string;
  team_name?: string;
  created_at: string;
  updated_at?: string;
  uid_fingerprint?: string;
  seed_status?: 'PROVISIONAL_ROSTER_MATCH';
  source_event_ids?: string[];
  /** Set on imported athletes once an organizer approves a UID claim. */
  claimed_by_profile_id?: string;
  /** Self-registered profile whose historic record was approved by an organizer. */
  linked_athlete_id?: string;
  is_imported?: boolean;
}

export type SubmissionStatus = 'Pending Review' | 'Verified' | 'Rejected' | 'Disputed';

export interface Dispute {
  by_account_id: string;
  by_name: string;
  reason: string;
  at: string;
}

export interface MatchSubmission {
  id: string;
  user_id: string; // account id of submitter
  player_ign: string;
  gameskii_id: string;
  regency: Regency;
  match_type: MatchType;
  game_name: GameName;
  competition_id: string | null; // pilot competition id, or null for an unlisted event
  competition_name: string;
  division: string;
  team_name: string;
  event_date: string; // yyyy-mm-dd
  result: '#1' | '#2' | '#3';
  rank_position: 1 | 2 | 3;
  proof_url: string;
  note?: string;
  status: SubmissionStatus;
  dispute?: Dispute;
  review_note?: string;
  reviewed_by?: string;
  verified_at?: string;
  created_at: string;
}

export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export interface UidClaim {
  id: string;
  account_id: string;
  profile_id: string;
  profile_ign: string;
  target_athlete_id: string;
  target_ign: string;
  evidence_note: string;
  proof_url?: string;
  status: ClaimStatus;
  review_note?: string;
  reviewed_by?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface AppNotification {
  id: string;
  account_id: string;
  text: string;
  link?: string;
  read: boolean;
  at: string;
}
