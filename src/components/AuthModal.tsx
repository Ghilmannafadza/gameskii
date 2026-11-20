import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, Mail } from 'lucide-react';
import wordmark from '../assets/images/gameskii-wordmark-light.svg';
import { useStore } from '../lib/store';
import { navigate } from '../lib/router';
import { getStoredSupabaseConfig } from '../lib/supabase';
import { Modal } from './ui';

export function AuthModal() {
  const { authOpen, closeAuth, openAuth, signIn, signUp, openOnboarding, toast, state } = useStore();
  const mode = authOpen || 'signin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const remote = getStoredSupabaseConfig().isConfigured;

  useEffect(() => {
    setErr('');
    setPassword('');
  }, [authOpen]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const res = mode === 'signup' ? await signUp(email, password) : await signIn(email, password);
    setBusy(false);
    if (!res.ok) return setErr(res.error);
    closeAuth();
    if (mode === 'signup') {
      toast('Akun dibuat. Lengkapi paspor atletmu.');
      openOnboarding();
    } else {
      toast('Selamat datang kembali!');
      if (!window.location.hash || window.location.hash === '#/') navigate('/dashboard');
      const acc = state.accounts.find((a) => a.email === email.trim().toLowerCase());
      if (acc && !state.profiles.some((p) => p.user_id === acc.id)) openOnboarding();
    }
  };

  return (
    <Modal open={Boolean(authOpen)} onClose={closeAuth} width="max-w-md">
      <div className="text-center -mt-2">
        <img src={wordmark} alt="Gameskii" className="h-8 w-auto mx-auto" />
        <h2 className="font-display text-[34px] text-white mt-3">{mode === 'signup' ? 'Daftar Akun' : 'Masuk'}</h2>
        <p className="text-[13px] text-muted">{mode === 'signup' ? 'Satu akun untuk satu paspor atlet.' : 'Masuk untuk mengelola paspor dan hasil turnamenmu.'}</p>
      </div>

      <div className="mt-5 flex rounded-xl bg-ink-750 p-1">
        <button onClick={() => openAuth('signin')} className={`top-tab flex-1 justify-center ${mode === 'signin' ? 'active' : ''}`}>Masuk</button>
        <button onClick={() => openAuth('signup')} className={`top-tab flex-1 justify-center ${mode === 'signup' ? 'active' : ''}`}>Daftar</button>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-3.5">
        {err && <div className="rounded-lg bg-rose/15 text-[#ffb3cb] text-[13px] px-3 py-2.5" role="alert">{err}</div>}
        <label className="block">
          <span className="label">Email</span>
          <span className="relative block">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input !pl-10" placeholder="nama@email.com" />
          </span>
        </label>
        <label className="block">
          <span className="label">Password</span>
          <span className="relative block">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input type={show ? 'text' : 'password'} required minLength={mode === 'signup' ? 8 : undefined} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input !pl-10 !pr-10" placeholder={mode === 'signup' ? 'Minimal 8 karakter' : '••••••••'} />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white" aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </label>
        <button type="submit" disabled={busy} className="btn btn-gold w-full !py-3">{busy ? 'Memproses…' : mode === 'signup' ? 'Buat Akun' : 'Masuk'}</button>
      </form>

      <p className="text-[11.5px] text-muted text-center mt-4 leading-relaxed">
        {remote ? 'Terhubung ke Supabase Auth.' : 'Mode demo lokal: akun tersimpan di browser ini saja. Hubungkan Supabase di Pengaturan untuk akun sungguhan.'}
      </p>
    </Modal>
  );
}
