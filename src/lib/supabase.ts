import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Optional Supabase connection. The app works fully offline with localStorage.
const ENV_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ENV_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const STORAGE_KEY_URL = 'gameskii_supabase_url';
const STORAGE_KEY_ANON = 'gameskii_supabase_anon_key';

export function getStoredSupabaseConfig() {
  const url = localStorage.getItem(STORAGE_KEY_URL) || ENV_URL;
  const anonKey = localStorage.getItem(STORAGE_KEY_ANON) || ENV_ANON_KEY;
  return { url, anonKey, isConfigured: Boolean(url && anonKey) };
}

export function saveStoredSupabaseConfig(url: string, anonKey: string) {
  if (url && anonKey) {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON);
  }
  supabaseInstance = null;
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getStoredSupabaseConfig();
  if (!isConfigured) return null;
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
}

// Copyable SQL schema for the application tables (separate from supabase/pilot_schema.sql).
export const SUPABASE_SQL_SCHEMA = `-- ==========================================================
-- GAMESKII: ATHLETE PASSPORT, RESULT SUBMISSIONS, UID CLAIMS
-- Run in Supabase SQL Editor. Podium-only points: #1 +50, #2 +35, #3 +25.
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.account_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'athlete' CHECK (role IN ('athlete','referee'))
);

CREATE OR REPLACE FUNCTION public.is_referee() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.account_roles WHERE user_id = auth.uid() AND role = 'referee');
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,          -- private
    whatsapp TEXT NOT NULL,           -- private
    game_id TEXT NOT NULL,            -- private (raw UID)
    uid_fingerprint TEXT,
    ign TEXT NOT NULL,
    regency TEXT NOT NULL,
    regency_code TEXT NOT NULL,
    role TEXT NOT NULL,
    primary_game TEXT NOT NULL DEFAULT 'Free Fire',
    gameskii_id TEXT UNIQUE NOT NULL,
    team_name TEXT DEFAULT '',
    linked_athlete_id TEXT,           -- set only by a referee after an approved claim
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Public view without personal data.
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, ign, regency, regency_code, role, primary_game, gameskii_id, team_name, linked_athlete_id, created_at
  FROM public.profiles;

CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gameskii_id TEXT NOT NULL,
    player_ign TEXT NOT NULL,
    competition_id TEXT,
    competition_name TEXT NOT NULL,
    division TEXT NOT NULL,
    team_name TEXT NOT NULL,
    event_date DATE NOT NULL,
    match_type TEXT NOT NULL,
    game_name TEXT NOT NULL,
    rank_position INTEGER NOT NULL CHECK (rank_position IN (1,2,3)),
    proof_path TEXT NOT NULL,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'Pending Review'
      CHECK (status IN ('Pending Review','Verified','Rejected','Disputed')),
    dispute_by UUID, dispute_reason TEXT, disputed_at TIMESTAMPTZ,
    review_note TEXT, reviewed_by UUID, verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (gameskii_id, competition_name, division)
);

CREATE TABLE IF NOT EXISTS public.uid_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_athlete_id TEXT NOT NULL,
    evidence_note TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    review_note TEXT, reviewed_by UUID, reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uid_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own role" ON public.account_roles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own profile read" ON public.profiles FOR SELECT USING (auth.uid() = user_id OR public.is_referee());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id AND linked_athlete_id IS NULL);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Submissions are public to read (status feed), but personal proof files stay private.
CREATE POLICY "read submissions" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "insert own pending" ON public.submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'Pending Review');
-- Athletes cannot change status. Disputes and verification go through referee/RPC.
CREATE POLICY "referee review" ON public.submissions FOR UPDATE
  USING (public.is_referee() AND auth.uid() <> user_id);

CREATE POLICY "own claims" ON public.uid_claims FOR SELECT USING (auth.uid() = user_id OR public.is_referee());
CREATE POLICY "insert claim" ON public.uid_claims FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "referee decides claim" ON public.uid_claims FOR UPDATE USING (public.is_referee());

-- Private storage bucket for proofs (served with signed URLs to owner/referee only).
INSERT INTO storage.buckets (id, name, public) VALUES ('match-proofs', 'match-proofs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

CREATE POLICY "upload own proof" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'match-proofs' AND auth.role() = 'authenticated'
              AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "read own or referee" ON storage.objects FOR SELECT
  USING (bucket_id = 'match-proofs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_referee()));

-- Leaderboard points are derived (base 1200 + verified podium points), never stored by clients.
CREATE OR REPLACE VIEW public.submission_points AS
  SELECT gameskii_id,
         SUM(CASE rank_position WHEN 1 THEN 50 WHEN 2 THEN 35 WHEN 3 THEN 25 ELSE 0 END) AS points,
         COUNT(*) AS podiums,
         COUNT(*) FILTER (WHERE rank_position = 1) AS titles
  FROM public.submissions WHERE status = 'Verified'
  GROUP BY gameskii_id;
`;
