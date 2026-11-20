import React, { useState } from 'react';
import { Check, Copy, Database, Download } from 'lucide-react';
import { useStore } from '../lib/store';
import { navigate } from '../lib/router';
import { PHOTO_CREDITS } from '../lib/assets';
import { SUPABASE_SQL_SCHEMA, getStoredSupabaseConfig, saveStoredSupabaseConfig } from '../lib/supabase';
import { DEMO_REFEREE_CODE } from '../data/constants';

type Section = 'akun' | 'panitia' | 'database' | 'data' | 'kredit';
const MENU: { id: Section; label: string }[] = [
  { id: 'akun', label: 'Akun' },
  { id: 'panitia', label: 'Mode Panitia' },
  { id: 'database', label: 'Database (Supabase)' },
  { id: 'data', label: 'Data & Privasi' },
  { id: 'kredit', label: 'Kredit Aset' },
];

export default function Settings() {
  const { account, profile, leaderboard, isReferee, becomeReferee, leaveReferee, signOut, openAuth, openOnboarding, resetDemoData, state, toast } = useStore();
  const [section, setSection] = useState<Section>('akun');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const cfg = getStoredSupabaseConfig();
  const [url, setUrl] = useState(cfg.url);
  const [key, setKey] = useState(cfg.anonKey);
  const [copied, setCopied] = useState(false);
  const me = profile ? leaderboard.find((a) => a.id === profile.id) : undefined;

  const exportMine = () => {
    if (!account) return;
    const data = {
      account: { email: account.email, role: account.role, created_at: account.created_at },
      profile,
      submissions: state.submissions.filter((s) => s.user_id === account.id),
      claims: state.claims.filter((c) => c.account_id === account.id),
    };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = 'gameskii-data-saya.json';
    a.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-4 xl:col-span-3 rounded-2xl panel p-5">
        <p className="th">Poin Saya</p>
        <p className="text-[30px] font-semibold text-white tabular-nums mt-1">{me ? me.elo_points.toLocaleString('id-ID') : '-'}</p>
        <div className="flex gap-2 mt-3">
          <button className="btn btn-gold !py-1.5 !px-3" onClick={() => navigate('/upload')}>Upload Hasil</button>
          <button className="btn btn-dark !py-1.5 !px-3" onClick={() => navigate('/paspor')}>Paspor</button>
        </div>
        <div className="h-px bg-line my-5" />
        <nav className="flex flex-col gap-1">
          {MENU.map((m) => (
            <button key={m.id} onClick={() => setSection(m.id)} className={`text-left rounded-lg px-4 py-2.5 text-[14px] transition ${section === m.id ? 'bg-ink-600 text-white' : 'text-soft hover:text-white hover:bg-white/[0.03]'}`}>
              {m.label}
            </button>
          ))}
          {account && <button onClick={signOut} className="text-left rounded-lg px-4 py-2.5 text-[14px] text-rose hover:bg-rose/10">Keluar</button>}
        </nav>
      </div>

      <section className="lg:col-span-8 xl:col-span-9 rounded-2xl panel p-5 sm:p-7 min-h-[420px]">
        {section === 'akun' && (
          <div className="space-y-5 max-w-xl">
            <h2 className="h-section">Akun</h2>
            {!account ? (
              <button className="btn btn-gold" onClick={() => openAuth('signin')}>Masuk / Daftar</button>
            ) : (
              <>
                <dl className="grid grid-cols-3 gap-y-3 text-[14px]">
                  <dt className="text-muted">Email</dt><dd className="col-span-2 text-white">{account.email}</dd>
                  <dt className="text-muted">Peran</dt><dd className="col-span-2 text-white">{account.role === 'referee' ? 'Panitia (demo)' : 'Atlet'}</dd>
                  <dt className="text-muted">Gameskii ID</dt><dd className="col-span-2 text-white font-mono">{profile?.gameskii_id || '-'}</dd>
                  <dt className="text-muted">Bergabung</dt><dd className="col-span-2 text-white">{new Date(account.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}</dd>
                </dl>
                <button className="btn btn-dark" onClick={openOnboarding}>{profile ? 'Edit Paspor' : 'Buat Paspor'}</button>
              </>
            )}
          </div>
        )}

        {section === 'panitia' && (
          <div className="space-y-4 max-w-xl">
            <h2 className="h-section">Mode Panitia</h2>
            <p className="text-[13px] text-soft">Panitia memverifikasi hasil, menyelesaikan sanggahan, dan menyetujui klaim UID. Di mode demo lokal, peran ini dibuka dengan kode. Di produksi, peran diberikan lewat tabel <code className="font-mono text-cyan">account_roles</code> di Supabase.</p>
            {!account ? (
              <button className="btn btn-gold" onClick={() => openAuth('signin')}>Masuk dulu</button>
            ) : isReferee ? (
              <div className="flex gap-2">
                <button className="btn btn-gold" onClick={() => navigate('/panitia')}>Buka Panel Panitia</button>
                <button className="btn btn-dark" onClick={() => { leaveReferee(); toast('Kembali ke mode atlet.', 'info'); }}>Keluar dari mode panitia</button>
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                <input className="input max-w-[260px] font-mono" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Kode panitia" />
                <button className="btn btn-gold" onClick={() => { const r = becomeReferee(code); if (!r.ok) setErr(r.error); else { setErr(''); toast('Mode panitia aktif.'); navigate('/panitia'); } }}>Aktifkan</button>
                {err && <p className="w-full text-[13px] text-[#ffb3cb]">{err}</p>}
                <p className="w-full text-[12px] text-muted">Kode demo: <span className="font-mono text-soft">{DEMO_REFEREE_CODE}</span> (ganti sebelum dipakai publik).</p>
              </div>
            )}
          </div>
        )}

        {section === 'database' && (
          <div className="space-y-4">
            <h2 className="h-section">Database (Supabase)</h2>
            <p className="text-[13px] text-soft max-w-2xl">Opsional. Tanpa ini, aplikasi berjalan dengan penyimpanan browser. Dengan Supabase, login memakai Supabase Auth dan profil/pengajuan ikut disinkronkan.</p>
            <div className="grid md:grid-cols-2 gap-3 max-w-3xl">
              <label><span className="label">Project URL</span><input className="input font-mono" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://xxxx.supabase.co" /></label>
              <label><span className="label">Anon public key</span><input className="input font-mono" value={key} onChange={(e) => setKey(e.target.value)} placeholder="eyJhbGciOi..." /></label>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-gold" onClick={() => { saveStoredSupabaseConfig(url, key); toast(url && key ? 'Konfigurasi Supabase disimpan.' : 'Kembali ke penyimpanan lokal.'); }}><Database className="h-4 w-4" />Simpan</button>
              {cfg.isConfigured && <button className="btn btn-dark" onClick={() => { saveStoredSupabaseConfig('', ''); setUrl(''); setKey(''); toast('Supabase diputus.', 'info'); }}>Putuskan</button>}
            </div>
            <div className="rounded-xl bg-ink-950/50 border border-line">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
                <span className="text-[12px] text-muted font-mono">schema.sql: tabel aplikasi + RLS</span>
                <button className="btn btn-ghost !py-1 !px-2 !text-[12px]" onClick={async () => { await navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? 'Disalin' : 'Salin'}</button>
              </div>
              <pre className="p-4 text-[11.5px] text-soft font-mono overflow-auto max-h-[360px]">{SUPABASE_SQL_SCHEMA}</pre>
            </div>
            <p className="text-[12px] text-muted">Data arsip 10 kompetisi ada di <span className="font-mono">supabase/pilot_schema.sql</span> + <span className="font-mono">pilot_seed.sql</span>.</p>
          </div>
        )}

        {section === 'data' && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="h-section">Data & Privasi</h2>
            <ul className="text-[13px] text-soft list-disc pl-5 space-y-1.5">
              <li>Publik hanya melihat IGN, Gameskii ID, wilayah, role, tim, dan 4 digit terakhir UID.</li>
              <li>Nama lengkap, WhatsApp, UID penuh, dan screenshot bukti hanya terlihat oleh pemilik dan panitia.</li>
              <li>Arsip kompetisi tidak memuat nama legal, nomor telepon, atau UID mentah, hanya fingerprint SHA-256.</li>
            </ul>
            <div className="flex flex-wrap gap-2">
              {account && <button className="btn btn-dark" onClick={exportMine}><Download className="h-4 w-4" />Unduh data saya (JSON)</button>}
              <button className="btn btn-danger" onClick={() => { if (window.confirm('Hapus semua akun, paspor, dan pengajuan demo di browser ini?')) resetDemoData(); }}>Reset data demo lokal</button>
            </div>
          </div>
        )}

        {section === 'kredit' && (
          <div className="space-y-3 max-w-2xl text-[13px] text-soft">
            <h2 className="h-section">Kredit Aset</h2>
            <p>Foto dari Wikimedia Commons:</p>
            <ul className="space-y-1.5">
              {PHOTO_CREDITS.map((p) => (
                <li key={p.page}>
                  <a className="text-cyan hover:underline" href={p.page} target="_blank" rel="noreferrer">{p.title}</a>
                  <span className="text-muted"> oleh {p.author}, {p.license}</span>
                </li>
              ))}
            </ul>
            <p>Foto lain: <a className="text-cyan hover:underline" href="https://unsplash.com/license" target="_blank" rel="noreferrer">Unsplash</a> (Unsplash License).</p>
            <p>Avatar: DiceBear “Adventurer” oleh Lisa Wischofsky (CC BY 4.0), dibuat lokal di browser.</p>
            <p>Ikon brand: Simple Icons (CC0). Logo game adalah merek dagang pemiliknya (Garena, Moonton, Krafton/Tencent, Konami) dan hanya dipakai untuk menandai game.</p>
            <p>Ikon antarmuka: Lucide (ISC). Huruf: Bebas Neue, Space Grotesk, JetBrains Mono, Caveat (SIL OFL). Logo ESI DIY milik Pengurus Provinsi ESI D.I. Yogyakarta.</p>
          </div>
        )}
      </section>
    </div>
  );
}
