import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Lock } from 'lucide-react';
import { useStore } from '../lib/store';
import { navigate } from '../lib/router';
import { GAME_OPTIONS, REGENCY_OPTIONS, getRegencyCode, getRolesByGame } from '../data/constants';
import type { GameName, GameRole, Regency } from '../types';
import { Dropdown, GameIcon, Modal } from './ui';

const STEPS = ['Game & UID', 'Domisili & Role', 'Data Pribadi'];

export function OnboardingModal() {
  const { onboardingOpen, closeOnboarding, profile, saveProfile, toast } = useStore();
  const [step, setStep] = useState(0);
  const [game, setGame] = useState<GameName>('Free Fire');
  const [gameId, setGameId] = useState('');
  const [ign, setIgn] = useState('');
  const [regency, setRegency] = useState<Regency>('Sleman');
  const [role, setRole] = useState<GameRole>('Rusher');
  const [team, setTeam] = useState('');
  const [fullName, setFullName] = useState('');
  const [wa, setWa] = useState('');
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!onboardingOpen) return;
    setStep(0);
    setErr('');
    setGame(profile?.primary_game || 'Free Fire');
    setGameId(profile?.game_id || '');
    setIgn(profile?.ign || '');
    setRegency(profile && profile.regency !== 'Belum Terverifikasi' ? profile.regency : 'Sleman');
    setRole(profile?.role || getRolesByGame(profile?.primary_game || 'Free Fire')[0]);
    setTeam(profile?.team_name || '');
    setFullName(profile?.full_name || '');
    setWa(profile?.whatsapp || '');
    setConsent(Boolean(profile));
  }, [onboardingOpen, profile]);

  const validate = (s: number) => {
    if (s === 0) {
      if (!ign.trim()) return 'In-game name wajib diisi.';
      if (game === 'Free Fire' && !/^\s*0*\d{7,14}/.test(gameId.replace(/[\s-]/g, ''))) return 'UID Free Fire harus 7-14 digit angka (lihat di profil in-game).';
      if (!gameId.trim()) return 'ID game wajib diisi.';
    }
    if (s === 2) {
      if (fullName.trim().length < 3) return 'Nama lengkap wajib diisi.';
      if (!/^(\+62|62|0)8\d{7,12}$/.test(wa.replace(/[\s-]/g, ''))) return 'Nomor WhatsApp tidak valid (contoh: 081234567890).';
      if (!consent) return 'Setujui penggunaan data untuk verifikasi.';
    }
    return '';
  };

  const next = () => {
    const e = validate(step);
    setErr(e);
    if (!e) setStep(step + 1);
  };

  const submit = async () => {
    const e = validate(0) || validate(2);
    if (e) return setErr(e);
    setBusy(true);
    const res = await saveProfile({
      full_name: fullName.trim(),
      ign: ign.trim(),
      game_id: gameId.trim(),
      regency,
      regency_code: getRegencyCode(regency),
      role,
      primary_game: game,
      whatsapp: wa.replace(/[\s-]/g, ''),
      team_name: team.trim(),
    });
    setBusy(false);
    if (!res.ok) return setErr(res.error);
    closeOnboarding();
    navigate('/paspor');
    toast(res.value.claimCandidate
      ? `Paspor tersimpan. Kami menemukan ${res.value.claimCandidate.matches_played} podium yang cocok dengan UID-mu. Ajukan klaim ke panitia.`
      : profile ? 'Paspor diperbarui.' : 'Paspor atlet berhasil dibuat!');
  };

  return (
    <Modal open={onboardingOpen} onClose={closeOnboarding} title={profile ? 'Perbarui Paspor' : 'Buat Paspor Atlet'} width="max-w-xl">
      <ol className="flex items-center gap-2 mb-6" aria-label="Langkah">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <div className={`h-1 rounded-full ${i <= step ? 'bg-gold' : 'bg-ink-600'}`} />
            <p className={`mt-2 text-[11px] ${i === step ? 'text-white' : 'text-muted'}`}>{i + 1}. {s}</p>
          </li>
        ))}
      </ol>

      {err && <div className="mb-4 rounded-lg bg-rose/15 text-[#ffb3cb] text-[13px] px-3 py-2.5" role="alert">{err}</div>}

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <span className="label">Game utama</span>
            <div className="grid grid-cols-2 gap-2">
              {GAME_OPTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => { setGame(g); setRole(getRolesByGame(g)[0]); }}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] border transition ${game === g ? 'border-gold bg-gold/10 text-white' : 'border-transparent bg-ink-700 text-soft hover:text-white'}`}
                  aria-pressed={game === g}
                >
                  <GameIcon game={g} size={28} />
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label>
              <span className="label">In-game name (IGN)</span>
              <input className="input" value={ign} onChange={(e) => setIgn(e.target.value)} placeholder="contoh: RRQ_AHNAFF" />
            </label>
            <label>
              <span className="label">{game === 'Free Fire' ? 'UID Free Fire' : 'ID & Server'}</span>
              <input className="input font-mono" value={gameId} onChange={(e) => setGameId(e.target.value)} placeholder={game === 'Free Fire' ? '123456789' : '12345678 (2094)'} inputMode={game === 'Free Fire' ? 'numeric' : 'text'} />
            </label>
          </div>
          {game === 'Free Fire' && (
            <p className="text-[12px] text-muted flex gap-2"><Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />UID disimpan privat. Publik hanya melihat 4 digit terakhir. UID dipakai untuk mencocokkan riwayat podium, tapi riwayat baru ditautkan setelah panitia menyetujui klaimmu.</p>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <span className="label">Kabupaten / Kota</span>
              <Dropdown<Regency> block value={regency} onChange={setRegency} options={REGENCY_OPTIONS.map((r) => ({ value: r.name, label: r.name, hint: r.code }))} />
            </div>
            <div>
              <span className="label">Role utama</span>
              <Dropdown<GameRole> block value={role} onChange={setRole} options={getRolesByGame(game).map((r) => ({ value: r, label: r }))} />
            </div>
          </div>
          <label className="block">
            <span className="label">Tim saat ini <span className="text-muted">(opsional)</span></span>
            <input className="input" value={team} onChange={(e) => setTeam(e.target.value)} placeholder="contoh: HALOMOK" />
          </label>
          <p className="text-[12px] text-muted">Tim hanya keterangan. Prestasi selalu tercatat ke atlet, bukan ke tim, jadi pindah tim tidak menghapus riwayat.</p>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <label>
              <span className="label">Nama lengkap</span>
              <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Sesuai kartu identitas" autoComplete="name" />
            </label>
            <label>
              <span className="label">WhatsApp</span>
              <input className="input" value={wa} onChange={(e) => setWa(e.target.value)} placeholder="081234567890" inputMode="tel" autoComplete="tel" />
            </label>
          </div>
          <label className="flex items-start gap-3 rounded-xl bg-ink-750 p-3.5 text-[12.5px] text-soft cursor-pointer">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[#ffd21f] h-4 w-4" />
            <span>Nama lengkap dan WhatsApp hanya dipakai panitia untuk verifikasi dan <b className="text-white">tidak ditampilkan publik</b>. Saya menyatakan data ini benar.</span>
          </label>
        </div>
      )}

      <div className="mt-6 flex items-center gap-2">
        {step > 0 && <button onClick={() => { setErr(''); setStep(step - 1); }} className="btn btn-ghost"><ArrowLeft className="h-4 w-4" />Kembali</button>}
        <button onClick={closeOnboarding} className="btn btn-ghost ml-auto">Batal</button>
        {step < 2 ? (
          <button onClick={next} className="btn btn-gold">Lanjut <ArrowRight className="h-4 w-4" /></button>
        ) : (
          <button onClick={submit} disabled={busy} className="btn btn-gold"><Check className="h-4 w-4" />{busy ? 'Menyimpan…' : profile ? 'Simpan Perubahan' : 'Terbitkan Paspor'}</button>
        )}
      </div>
    </Modal>
  );
}
