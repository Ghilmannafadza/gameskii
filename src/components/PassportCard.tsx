import React, { useMemo, useRef, useState } from 'react';
import qrcode from 'qrcode-generator';
import { toPng } from 'html-to-image';
import { Check, Copy, Download, MapPin, ShieldAlert, ShieldCheck } from 'lucide-react';
import crest from '../assets/images/crest-160.jpg';
import type { RankedAthlete } from '../lib/store';
import { avatarFor } from '../lib/avatar';
import { useStore } from '../lib/store';
import { getTier } from '../data/constants';
import { Avatar, GameIcon, TrophyCount } from './ui';

export function QRCode({ value, size = 120, dark = '#0e1d33', light = '#ffffff' }: { value: string; size?: number; dark?: string; light?: string }) {
  const cells = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    const out: { x: number; y: number }[] = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.isDark(y, x)) out.push({ x, y });
    return { n, out };
  }, [value]);
  const pad = 2;
  const total = cells.n + pad * 2;
  return (
    <svg viewBox={`0 0 ${total} ${total}`} width={size} height={size} shapeRendering="crispEdges" role="img" aria-label="QR profil atlet">
      <rect width={total} height={total} fill={light} />
      {cells.out.map((c) => <rect key={`${c.x}-${c.y}`} x={c.x + pad} y={c.y + pad} width={1} height={1} fill={dark} />)}
    </svg>
  );
}

export function profileUrl(gameskiiId: string) {
  return `${window.location.origin}${window.location.pathname}#/atlet/${gameskiiId}`;
}

export function verificationLabel(a: RankedAthlete) {
  if (a.isClaimed) return { text: 'Riwayat dikonfirmasi panitia', ok: true };
  if (a.isSelfRegistered) return { text: 'Profil mandiri · belum diverifikasi', ok: false };
  return { text: 'Provisional · dari roster pendaftaran', ok: false };
}

export function PassportCard({ athlete, showPrivate = false }: { athlete: RankedAthlete; showPrivate?: boolean }) {
  const { toast } = useStore();
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const tier = getTier(athlete.elo_points);
  const v = verificationLabel(athlete);
  const url = profileUrl(athlete.gameskii_id);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast('Tidak bisa menyalin. Salin manual: ' + url, 'error');
    }
  };

  const download = async () => {
    if (!ref.current) return;
    setBusy(true);
    try {
      const data = await toPng(ref.current, { pixelRatio: 2, cacheBust: true, backgroundColor: '#0e1d33' });
      const a = document.createElement('a');
      a.download = `paspor-${athlete.gameskii_id}.png`;
      a.href = data;
      a.click();
      toast('Kartu paspor diunduh sebagai PNG.');
    } catch (e) {
      console.error(e);
      toast('Gagal membuat gambar kartu.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const issued = new Date(athlete.created_at || Date.now());
  const mrzName = athlete.ign.toUpperCase().replace(/[^A-Z0-9]+/g, '<').replace(/^<|<$/g, '');
  const pad = (t: string, n = 36) => (t + '<'.repeat(n)).slice(0, n);
  const mrz1 = pad(`P<DIYGAMESKII<<${mrzName}`);
  const mrz2 = pad(`${athlete.gameskii_id.replace(/-/g, '')}<${tier.level}<${athlete.elo_points}<<${athlete.titles}<${athlete.podiums}<${athlete.events}`);
  const uid = showPrivate ? athlete.game_id : athlete.game_id?.startsWith('••') ? athlete.game_id : '••••' + (athlete.game_id || '').replace(/\D/g, '').slice(-4);

  const Field = ({ id, en, value, mono = false, className = '' }: { id: string; en: string; value: React.ReactNode; mono?: boolean; className?: string }) => (
    <div className={`min-w-0 ${className}`}>
      <p className="text-[9px] tracking-[0.12em] uppercase text-white/45 leading-tight truncate" title={en}>{id}</p>
      <p className={`text-[13px] text-white truncate mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );

  return (
    <div>
      <div ref={ref} className="relative overflow-hidden rounded-[18px] border border-white/15 shadow-[0_30px_60px_-28px_rgba(0,0,0,.9)]" style={{ background: 'linear-gradient(150deg,#2a5389 0%,#1d3d68 42%,#132b4b 100%)' }}>
        <div className="absolute inset-0 guilloche" />
        <div className="absolute inset-0 foil" />
        <svg viewBox="0 0 200 200" className="absolute -right-10 top-10 h-64 w-64 text-white/[0.05]" fill="none" stroke="currentColor" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, i) => <circle key={i} cx="100" cy="100" r={20 + i * 10} />)}
        </svg>

        {/* header strip */}
        <div className="relative flex items-center gap-3 px-5 sm:px-6 py-3.5 border-b border-white/10 bg-ink-950/20">
          <img src={crest} alt="" className="h-9 w-9 rounded-lg object-cover ring-1 ring-white/25" />
          <div className="min-w-0">
            <p className="font-display text-[22px] text-white leading-none tracking-wide">Paspor Atlet</p>
            <p className="text-[9.5px] text-white/55 font-mono tracking-[0.16em] mt-1 truncate">ATHLETE PASSPORT · DIY</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:block font-mono text-[10px] text-white/50 text-right leading-tight">TIPE / TYPE<br /><span className="text-white text-[12px]">P</span></span>
            <GameIcon game={athlete.primary_game} size={30} className="ring-1 ring-white/25" />
          </div>
        </div>

        <div className="relative px-5 sm:px-6 pt-5 pb-4 grid grid-cols-[auto_1fr] gap-5">
          {/* photo column */}
          <div className="flex flex-col items-center">
            <div className="relative rounded-xl p-1.5 bg-white/[0.06] border border-white/15">
              <span className="absolute -left-px -top-px h-3 w-3 border-l-2 border-t-2 border-gold rounded-tl-md" />
              <span className="absolute -right-px -bottom-px h-3 w-3 border-r-2 border-b-2 border-gold rounded-br-md" />
              <Avatar seed={athlete.uid_fingerprint || athlete.ign} size={92} />
              <span className="absolute -bottom-2 -right-2"><span className="level-badge !static !min-w-[22px] !h-[22px] !text-[11px]">{tier.level}</span></span>
            </div>
            <svg viewBox="0 0 40 30" className="mt-4 h-7 w-9" aria-label="Chip" role="img">
              <rect x="1" y="1" width="38" height="28" rx="5" fill="#e9c64a" stroke="#a37d16" />
              <path d="M1 10h12M1 20h12M27 10h12M27 20h12M13 1v28M27 1v28M13 15h14" stroke="#a37d16" strokeWidth="1.2" fill="none" />
            </svg>
            <div className="mt-3 rounded-lg bg-white p-1 shadow-lg">
              <QRCode value={url} size={76} />
            </div>
            <p className="mt-1 text-[9px] font-mono tracking-[0.12em] text-white/45">PINDAI PROFIL</p>
          </div>

          {/* data column */}
          <div className="min-w-0">
            <div className="min-w-0">
              <p className="text-[9px] tracking-[0.12em] uppercase text-white/45">Nama in-game <span className="text-white/30">/ IGN</span></p>
              <p className="text-[24px] font-semibold text-white leading-tight truncate" title={athlete.ign}>{athlete.ign}</p>
              <p className="font-mono text-[13px] text-gold mt-0.5 tracking-wider">{athlete.gameskii_id}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
              <Field id="Wilayah" en="Region" value={<span className="inline-flex items-center gap-1 min-w-0"><MapPin className="h-3 w-3 text-gold shrink-0" /><span className="truncate">{athlete.regency === 'Belum Terverifikasi' ? 'Belum diisi' : athlete.regency}</span></span>} />
              <Field id="Role" en="Role" value={athlete.role === 'Belum Ditentukan' ? '-' : athlete.role} />
              <Field id="Tim" en="Team" value={athlete.team_name || '-'} />
              <Field id="UID Game" en="Game UID" value={uid} mono />
              <Field id="Tier" en="Tier" value={tier.name} />
              <Field id="Terbit" en="Issued" value={issued.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} mono />
            </div>
          </div>
        </div>

        {/* stats */}
        <div className="relative mx-5 sm:mx-6 grid grid-cols-4 rounded-xl bg-ink-950/35 border border-white/[0.07] divide-x divide-white/10 text-center">
          <div className="py-2.5">
            <p className="text-[9px] tracking-[0.12em] uppercase text-white/45">Poin</p>
            <p className="font-mono text-[18px] text-gold num">{athlete.elo_points}</p>
          </div>
          <div className="py-2.5">
            <p className="text-[9px] tracking-[0.12em] uppercase text-white/45">Rank</p>
            <p className="font-mono text-[18px] text-white num">#{athlete.rank}</p>
          </div>
          <div className="py-2.5 text-white text-[15px]">
            <p className="text-[9px] tracking-[0.12em] uppercase text-white/45 mb-0.5">Juara 1</p>
            <TrophyCount value={athlete.titles} tone="gold" />
          </div>
          <div className="py-2.5 text-white text-[15px]">
            <p className="text-[9px] tracking-[0.12em] uppercase text-white/45 mb-0.5">Podium</p>
            <TrophyCount value={athlete.podiums} tone="silver" />
          </div>
        </div>

        {/* MRZ */}
        <div className="relative mt-4 pl-5 sm:pl-6 pr-36 py-3 bg-ink-950/30 border-t border-white/10">
          <p className="mrz">{mrz1}</p>
          <p className="mrz">{mrz2}</p>
          <div className={`absolute right-4 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] border ${v.ok ? 'bg-emerald-400/15 text-emerald-200 border-emerald-300/30' : 'bg-amber-300/12 text-amber-100 border-amber-300/30'}`}>
            {v.ok ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
            {v.ok ? 'Terverifikasi' : athlete.isSelfRegistered ? 'Belum diverifikasi' : 'Provisional'}
          </div>
        </div>
      </div>
      <p className="mt-2 text-[12px] text-muted">{v.text}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={copy} className="btn btn-dark">{copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}{copied ? 'Link disalin' : 'Salin link profil'}</button>
        <button onClick={download} disabled={busy} className="btn btn-dark"><Download className="h-4 w-4" />{busy ? 'Membuat…' : 'Unduh kartu (PNG)'}</button>
      </div>
    </div>
  );
}
