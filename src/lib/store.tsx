import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Account,
  AppNotification,
  AthleteProfile,
  GameName,
  MatchSubmission,
  UidClaim,
} from '../types';
import { PILOT_FREE_FIRE_ATHLETES, getAttributionsForAthlete } from '../data/pilot';
import { BASE_POINTS, DEMO_REFEREE_CODE, generateGameskiiId, getRankEloDelta, getTier } from '../data/constants';
import { fingerprintFreeFireUid, hashPassword } from './athleteIdentity';
import { getSupabaseClient } from './supabase';

const STORAGE_KEY = 'gameskii_state_v4';

interface PersistedState {
  accounts: Account[];
  profiles: AthleteProfile[];
  submissions: MatchSubmission[];
  claims: UidClaim[];
  notifications: AppNotification[];
  sessionAccountId: string | null;
  gameFilter: GameName | 'all';
  sidebarCollapsed: boolean;
  promoDismissed: boolean;
}

const EMPTY: PersistedState = {
  accounts: [],
  profiles: [],
  submissions: [],
  claims: [],
  notifications: [],
  sessionAccountId: null,
  gameFilter: 'all',
  sidebarCollapsed: false,
  promoDismissed: false,
};

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
  } catch (e) {
    console.error(e);
  }
  // Old v3 keys from the previous prototype are ignored on purpose: they contained
  // client-side "verified" points that could be forged.
  return EMPTY;
}

export type ToastType = 'success' | 'info' | 'error';
export interface Toast {
  id: number;
  text: string;
  type: ToastType;
}

export interface RankedAthlete extends AthleteProfile {
  rank: number;
  podiums: number;
  titles: number;
  events: number;
  isClaimed: boolean;
  isSelfRegistered: boolean;
}

type Result<T = void> = { ok: true; value: T } | { ok: false; error: string };
const ok = <T,>(value: T): Result<T> => ({ ok: true, value });
const fail = (error: string): Result<never> => ({ ok: false, error });

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const now = () => new Date().toISOString();

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

interface StoreValue {
  state: PersistedState;
  account: Account | null;
  profile: AthleteProfile | null;
  isReferee: boolean;
  leaderboard: RankedAthlete[];
  athleteById: (idOrGameskiiId: string) => RankedAthlete | undefined;
  /** Per-game ladder: archive points (Free Fire) + verified submissions of that game only. */
  boardFor: (game: GameName) => RankedAthlete[];
  /** When the shared state last changed (this tab or another tab). */
  lastSync: number;
  toasts: Toast[];
  toast: (text: string, type?: ToastType) => void;
  dismissToast: (id: number) => void;
  // auth
  authOpen: false | 'signin' | 'signup';
  openAuth: (mode?: 'signin' | 'signup') => void;
  closeAuth: () => void;
  onboardingOpen: boolean;
  openOnboarding: () => void;
  closeOnboarding: () => void;
  signUp: (email: string, password: string) => Promise<Result>;
  signIn: (email: string, password: string) => Promise<Result>;
  signOut: () => void;
  // profile & claims
  saveProfile: (p: Omit<AthleteProfile, 'id' | 'user_id' | 'elo_points' | 'matches_played' | 'wins' | 'rank_tier' | 'created_at' | 'gameskii_id'> & { gameskii_id?: string }) => Promise<Result<{ claimCandidate?: AthleteProfile }>>;
  claimCandidate: AthleteProfile | null;
  submitClaim: (evidence: string, proofUrl?: string) => Result;
  reviewClaim: (id: string, approve: boolean, note: string) => Result;
  // results
  submitResult: (s: Omit<MatchSubmission, 'id' | 'created_at' | 'status' | 'user_id' | 'player_ign' | 'gameskii_id' | 'regency' | 'result'>) => Result<MatchSubmission>;
  disputeResult: (id: string, reason: string) => Result;
  reviewResult: (id: string, approve: boolean, note: string) => Result;
  resolveDispute: (id: string, keepResult: boolean, note: string) => Result;
  // misc
  becomeReferee: (code: string) => Result;
  leaveReferee: () => void;
  markNotificationsRead: () => void;
  setGameFilter: (g: GameName | 'all') => void;
  toggleSidebar: () => void;
  dismissPromo: () => void;
  resetDemoData: () => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (v: boolean) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(load);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [authOpen, setAuthOpen] = useState<false | 'signin' | 'signup'>(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const toastId = useRef(0);

  const toast = useCallback((text: string, type: ToastType = 'success') => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  // Persist (with quota protection).
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error(e);
      toast('Penyimpanan browser penuh. Hapus beberapa bukti lama atau hubungkan Supabase.', 'error');
    }
  }, [state, toast]);

  const update = useCallback((fn: (s: PersistedState) => PersistedState) => {
    setState(fn);
    setLastSync(Date.now());
  }, []);

  // Live sync: another tab/window that writes the same storage key updates this one instantly.
  const [lastSync, setLastSync] = useState(() => Date.now());
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        const next = e.newValue ? { ...EMPTY, ...JSON.parse(e.newValue) } : EMPTY;
        firstRun.current = true; // don't echo the write back
        setState((cur) => ({ ...next, sessionAccountId: cur.sessionAccountId }));
        setLastSync(Date.now());
      } catch (err) {
        console.warn(err);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const account = useMemo(
    () => state.accounts.find((a) => a.id === state.sessionAccountId) || null,
    [state.accounts, state.sessionAccountId],
  );
  const profile = useMemo(
    () => (account ? state.profiles.find((p) => p.user_id === account.id) || null : null),
    [account, state.profiles],
  );
  const isReferee = account?.role === 'referee';

  // ---------- Derived leaderboard ----------
  const leaderboard = useMemo<RankedAthlete[]>(() => {
    const verified = state.submissions.filter((s) => s.status === 'Verified');
    const claimedIds = new Map(state.profiles.filter((p) => p.linked_athlete_id).map((p) => [p.linked_athlete_id!, p.id]));

    const fromSubs = (gid: string) => {
      const mine = verified.filter((s) => s.gameskii_id === gid);
      return {
        points: mine.reduce((sum, s) => sum + getRankEloDelta(s.rank_position), 0),
        podiums: mine.length,
        titles: mine.filter((s) => s.rank_position === 1).length,
        events: new Set(mine.map((s) => s.competition_id || normalize(s.competition_name))),
      };
    };

    const entries: Omit<RankedAthlete, 'rank'>[] = [];

    for (const a of PILOT_FREE_FIRE_ATHLETES) {
      if (claimedIds.has(a.id)) continue; // shown through the claimant's profile instead
      const sub = fromSubs(a.gameskii_id);
      const points = a.elo_points + sub.points;
      entries.push({
        ...a,
        elo_points: points,
        rank_tier: getTier(points).name,
        podiums: a.matches_played + sub.podiums,
        titles: a.wins + sub.titles,
        matches_played: a.matches_played + sub.podiums,
        wins: a.wins + sub.titles,
        events: (a.source_event_ids?.length || 0) + sub.events.size,
        isClaimed: false,
        isSelfRegistered: false,
      });
    }

    for (const p of state.profiles) {
      const linked = p.linked_athlete_id ? PILOT_FREE_FIRE_ATHLETES.find((a) => a.id === p.linked_athlete_id) : undefined;
      const sub = fromSubs(p.gameskii_id);
      const histPoints = linked ? linked.elo_points - BASE_POINTS : 0;
      const points = BASE_POINTS + histPoints + sub.points;
      const podiums = (linked?.matches_played || 0) + sub.podiums;
      const titles = (linked?.wins || 0) + sub.titles;
      entries.push({
        ...p,
        uid_fingerprint: linked?.uid_fingerprint || p.uid_fingerprint,
        source_event_ids: linked?.source_event_ids || [],
        elo_points: points,
        rank_tier: getTier(points).name,
        podiums,
        titles,
        matches_played: podiums,
        wins: titles,
        events: (linked?.source_event_ids?.length || 0) + sub.events.size,
        isClaimed: Boolean(linked),
        isSelfRegistered: true,
      });
    }

    entries.sort((a, b) => b.elo_points - a.elo_points || b.titles - a.titles || a.ign.localeCompare(b.ign));
    // Competition ranking: ties share a rank (1, 2, 2, 4 ...)
    let lastPts = -1;
    let lastRank = 0;
    return entries.map((e, i) => {
      const key = e.elo_points * 100 + e.titles;
      const rank = key === lastPts ? lastRank : i + 1;
      lastPts = key;
      lastRank = rank;
      return { ...e, rank };
    });
  }, [state.profiles, state.submissions]);

  const athleteById = useCallback(
    (key: string) => {
      const direct = leaderboard.find((a) => a.gameskii_id === key || a.id === key);
      if (direct) return direct;
      // A claimed fixture athlete redirects to its claimant.
      const claimant = state.profiles.find((p) => p.linked_athlete_id === key || PILOT_FREE_FIRE_ATHLETES.find((f) => f.id === p.linked_athlete_id)?.gameskii_id === key);
      return claimant ? leaderboard.find((a) => a.id === claimant.id) : undefined;
    },
    [leaderboard, state.profiles],
  );

  const boardFor = useCallback(
    (game: GameName): RankedAthlete[] => {
      const verified = state.submissions.filter((x) => x.status === 'Verified' && x.game_name === game);
      const rows = leaderboard
        .map((a) => {
          const mine = verified.filter((x) => x.gameskii_id === a.gameskii_id);
          const archived = game === 'Free Fire' && (!a.isSelfRegistered || a.isClaimed);
          const linked = archived ? (a.isClaimed ? PILOT_FREE_FIRE_ATHLETES.find((f) => f.uid_fingerprint === a.uid_fingerprint) : PILOT_FREE_FIRE_ATHLETES.find((f) => f.id === a.id)) : undefined;
          const histPts = linked ? linked.elo_points - BASE_POINTS : 0;
          const subPts = mine.reduce((n, x) => n + getRankEloDelta(x.rank_position), 0);
          const podiums = (linked?.matches_played || 0) + mine.length;
          const titles = (linked?.wins || 0) + mine.filter((x) => x.rank_position === 1).length;
          const include = podiums > 0 || a.primary_game === game;
          if (!include) return null;
          const pts = BASE_POINTS + histPts + subPts;
          return { ...a, elo_points: pts, rank_tier: getTier(pts).name, podiums, titles, matches_played: podiums, wins: titles, events: (linked?.source_event_ids?.length || 0) + new Set(mine.map((x) => x.competition_id || normalize(x.competition_name))).size } as RankedAthlete;
        })
        .filter((x): x is RankedAthlete => Boolean(x))
        .sort((a, b) => b.elo_points - a.elo_points || b.titles - a.titles || a.ign.localeCompare(b.ign));
      let last = -1;
      let lastRank = 0;
      return rows.map((r, i) => {
        const key = r.elo_points * 100 + r.titles;
        const rank = key === last ? lastRank : i + 1;
        last = key;
        lastRank = rank;
        return { ...r, rank };
      });
    },
    [leaderboard, state.submissions],
  );

  const notify = (s: PersistedState, accountId: string, text: string, link?: string): AppNotification[] => [
    { id: uid('ntf'), account_id: accountId, text, link, read: false, at: now() },
    ...s.notifications,
  ];

  // ---------- Auth ----------
  const signUp = useCallback(async (emailRaw: string, password: string): Promise<Result> => {
    const email = emailRaw.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail('Format email tidak valid.');
    if (password.length < 8) return fail('Password minimal 8 karakter.');
    const supabase = getSupabaseClient();
    let id = uid('acc');
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return fail(error.message);
      if (data.user) id = data.user.id;
    } else if (state.accounts.some((a) => a.email === email)) {
      return fail('Email sudah terdaftar. Silakan masuk.');
    }
    const password_hash = supabase ? undefined : await hashPassword(email, password);
    const acc: Account = { id, email, password_hash, role: 'athlete', created_at: now() };
    update((s) => ({ ...s, accounts: [...s.accounts.filter((a) => a.id !== id), acc], sessionAccountId: id }));
    return ok(undefined);
  }, [state.accounts, update]);

  const signIn = useCallback(async (emailRaw: string, password: string): Promise<Result> => {
    const email = emailRaw.trim().toLowerCase();
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) return fail(error?.message || 'Gagal masuk.');
      const id = data.user.id;
      update((s) => ({
        ...s,
        accounts: s.accounts.some((a) => a.id === id) ? s.accounts : [...s.accounts, { id, email, role: 'athlete', created_at: now() }],
        sessionAccountId: id,
      }));
      return ok(undefined);
    }
    const acc = state.accounts.find((a) => a.email === email);
    if (!acc) return fail('Akun dengan email ini belum terdaftar.');
    if (acc.password_hash !== (await hashPassword(email, password))) return fail('Password salah.');
    update((s) => ({ ...s, sessionAccountId: acc.id }));
    return ok(undefined);
  }, [state.accounts, update]);

  const signOut = useCallback(() => {
    getSupabaseClient()?.auth.signOut().catch(() => undefined);
    update((s) => ({ ...s, sessionAccountId: null }));
    toast('Kamu sudah keluar.', 'info');
  }, [toast, update]);

  // ---------- Profile & claims ----------
  const claimCandidate = useMemo(() => {
    if (!profile || profile.linked_athlete_id || !profile.uid_fingerprint) return null;
    const claimedBy = new Set(state.profiles.map((p) => p.linked_athlete_id).filter(Boolean));
    return PILOT_FREE_FIRE_ATHLETES.find((a) => a.uid_fingerprint === profile.uid_fingerprint && !claimedBy.has(a.id)) || null;
  }, [profile, state.profiles]);

  const saveProfile: StoreValue['saveProfile'] = useCallback(async (input) => {
    if (!account) return fail('Silakan masuk terlebih dahulu.');
    const fingerprint = input.primary_game === 'Free Fire' ? await fingerprintFreeFireUid(input.game_id) : null;
    if (input.primary_game === 'Free Fire' && !fingerprint) return fail('UID Free Fire harus 7-14 digit angka.');
    if (fingerprint) {
      const dup = state.profiles.find((p) => p.uid_fingerprint === fingerprint && p.user_id !== account.id);
      if (dup) return fail('UID ini sudah dipakai paspor lain. Hubungi panitia jika ini akunmu.');
    }
    const existing = state.profiles.find((p) => p.user_id === account.id);
    const taken = new Set([...PILOT_FREE_FIRE_ATHLETES.map((a) => a.gameskii_id), ...state.profiles.map((p) => p.gameskii_id)]);
    const gameskii_id = existing?.gameskii_id || (input.gameskii_id && !taken.has(input.gameskii_id) ? input.gameskii_id : undefined);
    const finalId = gameskii_id || generateGameskiiId(input.regency, taken);
    const uidChanged = existing && existing.uid_fingerprint !== (fingerprint || undefined);
    const p: AthleteProfile = {
      ...existing,
      ...input,
      id: existing?.id || uid('ath'),
      user_id: account.id,
      gameskii_id: finalId,
      uid_fingerprint: fingerprint || undefined,
      // Changing UID drops any approved link; a new claim is required.
      linked_athlete_id: uidChanged ? undefined : existing?.linked_athlete_id,
      elo_points: BASE_POINTS,
      matches_played: 0,
      wins: 0,
      rank_tier: getTier(BASE_POINTS).name,
      created_at: existing?.created_at || now(),
      updated_at: now(),
    };
    update((s) => ({
      ...s,
      profiles: existing ? s.profiles.map((x) => (x.id === p.id ? p : x)) : [p, ...s.profiles],
      claims: uidChanged ? s.claims.map((c) => (c.profile_id === p.id && c.status === 'pending' ? { ...c, status: 'rejected', review_note: 'UID diubah oleh pemilik.' } : c)) : s.claims,
    }));
    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('profiles').upsert([{
        user_id: account.id, full_name: p.full_name, whatsapp: p.whatsapp, game_id: p.game_id, uid_fingerprint: p.uid_fingerprint,
        ign: p.ign, regency: p.regency, regency_code: p.regency_code, role: p.role, primary_game: p.primary_game,
        gameskii_id: p.gameskii_id, team_name: p.team_name,
      }], { onConflict: 'user_id' }).then(({ error }) => error && console.warn('Supabase profile sync:', error.message));
    }
    const claimedBy = new Set(state.profiles.map((x) => x.linked_athlete_id).filter(Boolean));
    const candidate = fingerprint && !p.linked_athlete_id
      ? PILOT_FREE_FIRE_ATHLETES.find((a) => a.uid_fingerprint === fingerprint && !claimedBy.has(a.id))
      : undefined;
    return ok({ claimCandidate: candidate });
  }, [account, state.profiles, update]);

  const submitClaim = useCallback((evidence: string, proofUrl?: string): Result => {
    if (!account || !profile) return fail('Lengkapi paspor terlebih dahulu.');
    if (!claimCandidate) return fail('Tidak ada riwayat yang cocok dengan UID-mu.');
    if (evidence.trim().length < 15) return fail('Jelaskan bukti kepemilikan minimal 15 karakter.');
    if (state.claims.some((c) => c.profile_id === profile.id && c.status === 'pending')) return fail('Klaim kamu masih menunggu peninjauan.');
    const claim: UidClaim = {
      id: uid('clm'),
      account_id: account.id,
      profile_id: profile.id,
      profile_ign: profile.ign,
      target_athlete_id: claimCandidate.id,
      target_ign: claimCandidate.ign,
      evidence_note: evidence.trim(),
      proof_url: proofUrl,
      status: 'pending',
      created_at: now(),
    };
    update((s) => ({ ...s, claims: [claim, ...s.claims] }));
    return ok(undefined);
  }, [account, profile, claimCandidate, state.claims, update]);

  const reviewClaim = useCallback((id: string, approve: boolean, note: string): Result => {
    if (!account || !isReferee) return fail('Hanya panitia yang dapat meninjau klaim.');
    const c = state.claims.find((x) => x.id === id);
    if (!c || c.status !== 'pending') return fail('Klaim tidak ditemukan atau sudah diproses.');
    if (c.account_id === account.id) return fail('Kamu tidak boleh meninjau klaim milikmu sendiri.');
    if (approve && state.profiles.some((p) => p.linked_athlete_id === c.target_athlete_id)) return fail('Riwayat ini sudah ditautkan ke paspor lain.');
    update((s) => ({
      ...s,
      claims: s.claims.map((x) => (x.id === id ? { ...x, status: approve ? 'approved' : 'rejected', review_note: note, reviewed_by: account.id, reviewed_at: now() } : x)),
      profiles: approve ? s.profiles.map((p) => (p.id === c.profile_id ? { ...p, linked_athlete_id: c.target_athlete_id } : p)) : s.profiles,
      notifications: notify(s, c.account_id, approve ? `Klaim riwayat ${c.target_ign} disetujui panitia.` : `Klaim riwayat ${c.target_ign} ditolak${note ? `: ${note}` : '.'}`, '/paspor'),
    }));
    return ok(undefined);
  }, [account, isReferee, state.claims, state.profiles, update]);

  // ---------- Results ----------
  const submitResult: StoreValue['submitResult'] = useCallback((input) => {
    if (!account || !profile) return fail('Lengkapi paspor terlebih dahulu.');
    if (![1, 2, 3].includes(input.rank_position)) return fail('Hanya juara 1-3 yang dapat diajukan.');
    if (!input.proof_url) return fail('Screenshot klasemen akhir wajib diunggah.');
    if (!input.competition_name.trim()) return fail('Pilih atau tulis nama kompetisi.');
    if (!input.team_name.trim()) return fail('Nama tim saat event wajib diisi.');
    const key = (s: { competition_id: string | null; competition_name: string; division: string }) =>
      (s.competition_id || normalize(s.competition_name)) + ':' + normalize(s.division);
    const myKey = key(input);
    const dup = state.submissions.find((s) => s.gameskii_id === profile.gameskii_id && s.status !== 'Rejected' && key(s) === myKey);
    if (dup) return fail('Hasil untuk kompetisi & divisi ini sudah pernah kamu ajukan.');
    if (input.competition_id) {
      const linked = profile.linked_athlete_id ? PILOT_FREE_FIRE_ATHLETES.find((a) => a.id === profile.linked_athlete_id) : null;
      const already = getAttributionsForAthlete(linked?.uid_fingerprint).some((a) => a.competition_id === input.competition_id && normalize(a.division) === normalize(input.division));
      if (already) return fail('Prestasi ini sudah tercatat dari data panitia. Tidak perlu diajukan lagi.');
    }
    const sub: MatchSubmission = {
      ...input,
      id: uid('sub'),
      user_id: account.id,
      player_ign: profile.ign,
      gameskii_id: profile.gameskii_id,
      regency: profile.regency,
      result: `#${input.rank_position}` as MatchSubmission['result'],
      status: 'Pending Review',
      created_at: now(),
    };
    update((s) => ({ ...s, submissions: [sub, ...s.submissions] }));
    return ok(sub);
  }, [account, profile, state.submissions, update]);

  const disputeResult = useCallback((id: string, reason: string): Result => {
    if (!account) return fail('Masuk untuk mengajukan sanggahan.');
    const sub = state.submissions.find((s) => s.id === id);
    if (!sub) return fail('Hasil tidak ditemukan.');
    if (sub.user_id === account.id) return fail('Kamu tidak bisa menyanggah hasilmu sendiri.');
    if (sub.status !== 'Pending Review' && sub.status !== 'Verified') return fail('Hasil ini tidak dapat disanggah.');
    if (reason.trim().length < 15) return fail('Alasan sanggahan minimal 15 karakter.');
    const byName = profile?.ign || account.email.split('@')[0];
    update((s) => ({
      ...s,
      submissions: s.submissions.map((x) => (x.id === id ? { ...x, status: 'Disputed', dispute: { by_account_id: account.id, by_name: byName, reason: reason.trim(), at: now() } } : x)),
      notifications: notify(s, sub.user_id, `Hasil ${sub.competition_name} kamu disanggah oleh ${byName}. Panitia akan meninjau.`, '/paspor'),
    }));
    return ok(undefined);
  }, [account, profile, state.submissions, update]);

  const reviewResult = useCallback((id: string, approve: boolean, note: string): Result => {
    if (!account || !isReferee) return fail('Hanya panitia yang dapat memverifikasi.');
    const sub = state.submissions.find((s) => s.id === id);
    if (!sub || sub.status !== 'Pending Review') return fail('Hasil tidak dalam antrian verifikasi.');
    if (sub.user_id === account.id) return fail('Panitia tidak boleh memverifikasi hasilnya sendiri.');
    if (!approve && note.trim().length < 5) return fail('Tulis alasan penolakan.');
    update((s) => ({
      ...s,
      submissions: s.submissions.map((x) => (x.id === id ? { ...x, status: approve ? 'Verified' : 'Rejected', review_note: note.trim(), reviewed_by: account.id, verified_at: approve ? now() : undefined } : x)),
      notifications: notify(s, sub.user_id, approve
        ? `Hasil ${sub.competition_name} (${sub.result}) diverifikasi: +${getRankEloDelta(sub.rank_position)} poin.`
        : `Hasil ${sub.competition_name} ditolak: ${note.trim()}`, '/paspor'),
    }));
    return ok(undefined);
  }, [account, isReferee, state.submissions, update]);

  const resolveDispute = useCallback((id: string, keepResult: boolean, note: string): Result => {
    if (!account || !isReferee) return fail('Hanya panitia yang dapat menyelesaikan sanggahan.');
    const sub = state.submissions.find((s) => s.id === id);
    if (!sub || sub.status !== 'Disputed') return fail('Sanggahan tidak ditemukan.');
    if (sub.user_id === account.id || sub.dispute?.by_account_id === account.id) return fail('Kamu terlibat dalam sanggahan ini.');
    if (note.trim().length < 5) return fail('Tulis catatan keputusan.');
    update((s) => {
      let n = notify(s, sub.user_id, keepResult ? `Sanggahan atas hasil ${sub.competition_name} ditolak. Hasil tetap berlaku.` : `Sanggahan diterima. Hasil ${sub.competition_name} dibatalkan.`, '/paspor');
      if (sub.dispute) n = notify({ ...s, notifications: n }, sub.dispute.by_account_id, `Sanggahanmu atas ${sub.player_ign} ${keepResult ? 'ditolak' : 'diterima'}.`, '/upload');
      return {
        ...s,
        notifications: n,
        submissions: s.submissions.map((x) => (x.id === id ? { ...x, status: keepResult ? 'Verified' : 'Rejected', review_note: note.trim(), reviewed_by: account.id, verified_at: keepResult ? now() : undefined } : x)),
      };
    });
    return ok(undefined);
  }, [account, isReferee, state.submissions, update]);

  // ---------- Misc ----------
  const becomeReferee = useCallback((code: string): Result => {
    if (!account) return fail('Masuk terlebih dahulu.');
    if (code.trim() !== DEMO_REFEREE_CODE) return fail('Kode panitia salah.');
    update((s) => ({ ...s, accounts: s.accounts.map((a) => (a.id === account.id ? { ...a, role: 'referee' } : a)) }));
    return ok(undefined);
  }, [account, update]);

  const leaveReferee = useCallback(() => {
    if (!account) return;
    update((s) => ({ ...s, accounts: s.accounts.map((a) => (a.id === account.id ? { ...a, role: 'athlete' } : a)) }));
  }, [account, update]);

  const markNotificationsRead = useCallback(() => {
    if (!account) return;
    update((s) => ({ ...s, notifications: s.notifications.map((n) => (n.account_id === account.id ? { ...n, read: true } : n)) }));
  }, [account, update]);

  const value: StoreValue = {
    state,
    account,
    profile,
    isReferee,
    leaderboard,
    athleteById,
    boardFor,
    lastSync,
    toasts,
    toast,
    dismissToast,
    authOpen,
    openAuth: (mode = 'signin') => setAuthOpen(mode),
    closeAuth: () => setAuthOpen(false),
    onboardingOpen,
    openOnboarding: () => setOnboardingOpen(true),
    closeOnboarding: () => setOnboardingOpen(false),
    signUp,
    signIn,
    signOut,
    saveProfile,
    claimCandidate,
    submitClaim,
    reviewClaim,
    submitResult,
    disputeResult,
    reviewResult,
    resolveDispute,
    becomeReferee,
    leaveReferee,
    markNotificationsRead,
    setGameFilter: (g) => update((s) => ({ ...s, gameFilter: g })),
    toggleSidebar: () => update((s) => ({ ...s, sidebarCollapsed: !s.sidebarCollapsed })),
    dismissPromo: () => update((s) => ({ ...s, promoDismissed: true })),
    resetDemoData: () => {
      localStorage.removeItem(STORAGE_KEY);
      setState(EMPTY);
      toast('Data demo lokal direset.', 'info');
    },
    mobileNavOpen,
    setMobileNavOpen,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
