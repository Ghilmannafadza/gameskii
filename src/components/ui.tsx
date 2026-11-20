import React, { useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, ChevronDown, Clock, Info, X, XCircle } from 'lucide-react';
import { avatarFor } from '../lib/avatar';
import { gameMeta } from '../lib/assets';
import { BRAND_PATHS } from '../lib/brandPaths';
import { useStore } from '../lib/store';
import type { SubmissionStatus } from '../types';

/* =====================================================================
   Images
   ===================================================================== */

const FALLBACK_HUES = [212, 198, 228, 262, 188, 240];
function fallbackBg(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = FALLBACK_HUES[h % FALLBACK_HUES.length];
  return `radial-gradient(circle at 72% 28%, hsla(${hue + 20},85%,62%,.45) 0%, transparent 40%), radial-gradient(circle at 20% 85%, hsla(${(hue + 140) % 360},80%,58%,.28) 0%, transparent 42%), repeating-linear-gradient(135deg, rgba(255,255,255,.035) 0 2px, transparent 2px 14px), linear-gradient(160deg, hsl(${hue},55%,28%) 0%, hsl(${hue},55%,13%) 100%)`;
}

/** Remote image with skeleton while loading and a branded gradient if it fails. */
export function SmartImage({ src, alt, className = '', position = 'center' }: { src: string; alt: string; className?: string; position?: string }) {
  const [state, setState] = useState<'loading' | 'ok' | 'fail'>('loading');
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    setState('loading');
    const el = imgRef.current;
    // Cached images can finish before React attaches onLoad.
    if (el?.complete) setState(el.naturalWidth > 0 ? 'ok' : 'fail');
  }, [src]);
  if (state === 'fail') return <div role="img" aria-label={alt} className={className} style={{ background: fallbackBg(src) }} />;
  return (
    <>
      {state === 'loading' && <div className={`${className} skeleton`} aria-hidden="true" />}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setState('ok')}
        onError={() => setState('fail')}
        className={`${className} transition-opacity duration-500 ${state === 'ok' ? 'opacity-100' : 'opacity-0'}`}
        style={{ objectPosition: position }}
      />
    </>
  );
}

/** Photo with the app-wide colour grade (cyan haze + bottom shade). */
export function Art({ src, alt = '', className = '', position, children }: { src: string; alt?: string; className?: string; position?: string; children?: React.ReactNode }) {
  return (
    <div className={`art ${className}`}>
      <SmartImage src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" position={position} />
      {children && <div className="relative z-[2] h-full">{children}</div>}
    </div>
  );
}

export function BrandIcon({ name, className = 'h-4 w-4', color = 'currentColor' }: { name: keyof typeof BRAND_PATHS | string; className?: string; color?: string }) {
  const d = BRAND_PATHS[name];
  if (!d) return null;
  return (
    <svg viewBox="0 0 24 24" className={className} fill={color} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function GameIcon({ game, size = 36, rounded = 'rounded-lg', className = '' }: { game: string; size?: number; rounded?: string; className?: string }) {
  const meta = gameMeta(game);
  const [failed, setFailed] = useState(!meta.icon);
  const style = { width: size, height: size };
  if (failed) {
    return (
      <div className={`${rounded} grid place-items-center font-display text-white shrink-0 ${className}`} style={{ ...style, background: `linear-gradient(145deg, ${meta.color}, #0e1d33)`, fontSize: size * 0.48 }} title={meta.name}>
        {meta.glyph ? <BrandIcon name={meta.glyph} className="h-[62%] w-[62%]" color="#fff" /> : meta.short}
      </div>
    );
  }
  return <img src={meta.icon} alt={meta.name} title={meta.name} style={style} referrerPolicy="no-referrer" onError={() => setFailed(true)} className={`${rounded} object-cover shrink-0 ${className}`} />;
}

/* =====================================================================
   Avatars
   ===================================================================== */

export function Avatar({ seed, size = 36, level, ring = false, className = '' }: { seed: string; size?: number; level?: number | string; ring?: boolean; className?: string }) {
  const img = <img src={avatarFor(seed)} alt="" className="rounded-full block" style={{ width: size, height: size }} />;
  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      {ring ? <div className="avatar-ring"><div className="rounded-full bg-ink-900 p-[2px]">{img}</div></div> : img}
      {level !== undefined && <span className="level-badge" style={size >= 56 ? { minWidth: 20, height: 20, fontSize: 11 } : undefined}>{level}</span>}
    </div>
  );
}

const STACK_RINGS = ['#ffd21f', '#2cc6ef', '#e8457c', '#7ee08a', '#b18cff'];
export function AvatarStack({ seeds, extra = 0, size = 24 }: { seeds: string[]; extra?: number; size?: number }) {
  return (
    <div className="flex items-center">
      {seeds.map((s, i) => (
        <span key={s + i} className="rounded-full p-[1.5px]" style={{ background: STACK_RINGS[i % STACK_RINGS.length], marginLeft: i ? -size * 0.3 : 0, zIndex: 10 - i }}>
          <img src={avatarFor(s)} alt="" className="rounded-full block ring-2 ring-ink-850" style={{ width: size, height: size }} />
        </span>
      ))}
      {extra > 0 && (
        <span className="rounded-full bg-cyan text-ink-950 font-semibold grid place-items-center ring-2 ring-ink-850 num" style={{ width: size + 3, height: size + 3, marginLeft: -size * 0.3, fontSize: Math.max(10, size * 0.42) }}>
          +{extra}
        </span>
      )}
    </div>
  );
}

/* =====================================================================
   Icons that the reference draws by hand
   ===================================================================== */

export function TrophyIcon({ tone = 'gold', className = 'h-4 w-4' }: { tone?: 'gold' | 'silver'; className?: string }) {
  const id = useId();
  const [a, b] = tone === 'gold' ? ['#ffe27a', '#c9961e'] : ['#e5edf7', '#8ea2c0'];
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
      </defs>
      <path fill={`url(#${id})`} d="M7 2.5h10v1.8h3.2v2.6a4.2 4.2 0 0 1-4 4.2 5.2 5.2 0 0 1-3.1 3.2v2.2h3v3H7.9v-3h3v-2.2a5.2 5.2 0 0 1-3.1-3.2 4.2 4.2 0 0 1-4-4.2V4.3H7V2.5Zm-1.3 3.6v.8c0 .9.5 1.6 1.3 2V6.1H5.7Zm11.3 0v2.8c.8-.4 1.3-1.1 1.3-2v-.8H17Z" />
      {tone === 'silver' && <path fill="#5b7192" d="M3 21.5c2-.6 3.4-1.9 4.3-3.6l.9.5C7.2 20.3 5.6 21.8 3.4 22.5L3 21.5Zm18 0-.4 1c-2.2-.7-3.8-2.2-4.8-4.1l.9-.5c.9 1.7 2.3 3 4.3 3.6Z" />}
    </svg>
  );
}

export function TrophyCount({ value, tone }: { value: number; tone: 'gold' | 'silver' }) {
  return (
    <span className={`inline-flex items-center gap-2 num ${value === 0 ? 'opacity-45' : ''}`} title={tone === 'gold' ? 'Gelar juara 1' : 'Total podium'}>
      <TrophyIcon tone={tone} />
      {value}
    </span>
  );
}

/** Small coin used on point pills. */
export function CoinIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="#10213a" />
      <circle cx="8" cy="8" r="4.6" fill="none" stroke="#ffd21f" strokeWidth="1.6" />
      <path d="M8 5.6v4.8M6.4 7.1h3.2" stroke="#ffd21f" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/* =====================================================================
   Status & badges
   ===================================================================== */

const STATUS: Record<SubmissionStatus, { label: string; dot: string; text: string; Icon: typeof Clock }> = {
  'Pending Review': { label: 'Menunggu', dot: 'bg-amber-300', text: 'text-amber-200', Icon: Clock },
  Verified: { label: 'Terverifikasi', dot: 'bg-emerald-300', text: 'text-emerald-200', Icon: CheckCircle2 },
  Rejected: { label: 'Ditolak', dot: 'bg-rose', text: 'text-[#ffb3cb]', Icon: XCircle },
  Disputed: { label: 'Disanggah', dot: 'bg-orange-300', text: 'text-orange-200', Icon: AlertTriangle },
};

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] border border-white/[0.06] pl-2 pr-2.5 py-0.5 text-[11px] font-medium ${s.text}`}>
      <span className={`status-dot ${s.dot} ${status === 'Pending Review' ? 'animate-pulse' : ''}`} />
      {s.label}
    </span>
  );
}

export function ProvisionalBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md bg-amber-300/10 text-amber-200 px-2 py-[3px] text-[11px] font-medium ${className}`} title="Diturunkan dari roster pendaftaran; belum disertifikasi panitia resmi.">
      <span className="status-dot bg-amber-300" />
      Provisional
    </span>
  );
}

/* =====================================================================
   Dropdown (replaces native <select>)
   ===================================================================== */

export interface DropdownOption<T extends string> { value: T; label: string; hint?: string; icon?: React.ReactNode }

export function Dropdown<T extends string>({ label, value, options, onChange, className = '', block = false, align = 'left' }: { label?: string; value: T; options: DropdownOption<T>[]; onChange: (v: T) => void; className?: string; block?: boolean; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, options, value]);

  const onKey = (e: React.KeyboardEvent) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOpen(true); return; }
    if (!open) return;
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % options.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + options.length) % options.length); }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(options[active].value); setOpen(false); }
  };

  return (
    <div ref={ref} className={`relative ${block ? 'w-full' : ''} ${className}`}>
      <button
        type="button"
        className={`dd-trigger ${block ? 'w-full justify-between !bg-ink-700' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(!open)}
        onKeyDown={onKey}
      >
        <span className="truncate flex items-center gap-2">
          {current.icon}
          {label && <span>{label}:</span>}
          <b className="truncate">{current.label}</b>
        </span>
        <ChevronDown className={`h-3.5 w-3.5 ml-1.5 shrink-0 text-soft transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul id={listId} role="listbox" className={`popover absolute z-50 mt-1.5 p-1.5 min-w-full w-max max-w-[320px] max-h-72 overflow-auto fade-in ${align === 'right' ? 'right-0' : 'left-0'}`}>
          {options.map((o, i) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                data-active={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className="dd-option"
              >
                {o.icon}
                <span className="flex-1">
                  {o.label}
                  {o.hint && <span className="block text-[11px] text-muted">{o.hint}</span>}
                </span>
                {o.value === value && <Check className="h-3.5 w-3.5" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* =====================================================================
   Layout bits
   ===================================================================== */

export function SectionHeading({ title, subtitle, right, eyebrow }: { title: string; subtitle?: string; right?: React.ReactNode; eyebrow?: string }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div className="min-w-0">
        {eyebrow && <p className="th mb-1.5 text-cyan/80">{eyebrow}</p>}
        <h2 className="h-section">{title}</h2>
        {subtitle && <p className="text-[13px] text-muted mt-1.5">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

/** Empty state with a small drawn illustration instead of a dashed box. */
export function EmptyState({ icon: Icon, title, text, action, compact = false }: { icon: React.ComponentType<{ className?: string }>; title: string; text?: string; action?: React.ReactNode; compact?: boolean }) {
  return (
    <div className={`rounded-xl bg-ink-750/50 text-center ${compact ? 'px-5 py-7' : 'px-6 py-12'}`}>
      <div className="relative mx-auto h-16 w-16 mb-4">
        <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <circle cx="32" cy="32" r="30" fill="none" stroke="#2a4366" strokeDasharray="2 5" />
          <circle cx="32" cy="32" r="21" fill="#1a3152" />
          <circle cx="56" cy="17" r="2.2" fill="#ffd21f" />
          <circle cx="9" cy="44" r="1.6" fill="#2cc6ef" />
        </svg>
        <Icon className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-soft" />
      </div>
      <p className="text-[15px] font-semibold text-white">{title}</p>
      {text && <p className="text-[13px] text-muted mt-1.5 max-w-sm mx-auto leading-relaxed">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, width = 'max-w-lg', dismissible = true }: { open: boolean; onClose: () => void; title?: React.ReactNode; children: React.ReactNode; width?: string; dismissible?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dismissible && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose, dismissible]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-3 sm:p-6 bg-ink-950/80 backdrop-blur-sm overflow-y-auto fade-in" onMouseDown={(e) => e.target === e.currentTarget && dismissible && onClose()} role="dialog" aria-modal="true">
      <div className={`relative w-full ${width} my-6 rounded-2xl bg-ink-800 border border-white/[0.06] shadow-[0_40px_80px_-20px_rgba(0,0,0,.8)] overflow-hidden`}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        {(title || dismissible) && (
          <div className="flex items-center justify-between gap-4 px-6 pt-5">
            <div className="font-display text-[28px] text-white">{title}</div>
            {dismissible && (
              <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-lg text-muted hover:text-white hover:bg-white/5" aria-label="Tutup">
                <X className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>
        )}
        <div className="p-6 pt-4">{children}</div>
      </div>
    </div>
  );
}

export function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="fixed z-[70] bottom-20 md:bottom-6 right-3 left-3 sm:left-auto sm:right-6 flex flex-col gap-2 items-end" aria-live="polite">
      {toasts.slice(-3).map((t) => {
        const Icon = t.type === 'error' ? XCircle : t.type === 'info' ? Info : CheckCircle2;
        const tone = t.type === 'error' ? 'text-[#ff8db3]' : t.type === 'info' ? 'text-cyan' : 'text-gold';
        const bar = t.type === 'error' ? 'bg-rose' : t.type === 'info' ? 'bg-cyan' : 'bg-gold';
        return (
          <div key={t.id} className="toast-in relative overflow-hidden rounded-xl bg-[#13284a]/95 backdrop-blur border border-white/10 pl-3.5 pr-3 py-3 shadow-2xl flex items-start gap-3 max-w-sm w-full sm:w-auto">
            <span className={`mt-0.5 h-7 w-7 shrink-0 grid place-items-center rounded-lg bg-white/[0.06] ${tone}`}><Icon className="h-4 w-4" /></span>
            <p className="text-[13px] text-white leading-snug pt-1">{t.text}</p>
            <button onClick={() => dismissToast(t.id)} className="ml-auto text-muted hover:text-white mt-1" aria-label="Tutup notifikasi">
              <X className="h-4 w-4" />
            </button>
            <span className={`toast-timer absolute left-0 bottom-0 h-[2px] w-full ${bar} opacity-70`} />
          </div>
        );
      })}
    </div>
  );
}

/** KPI tile: icon chip, label, big number, optional hint and progress. */
export function Stat({ label, value, hint, tone = 'text-white', icon: Icon, progress, accent = '#2cc6ef' }: { label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: string; icon?: React.ComponentType<{ className?: string }>; progress?: number; accent?: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-ink-750 px-4 py-3.5 border border-white/[0.04]">
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-[0.12] blur-xl" style={{ background: accent }} />
      <div className="flex items-center justify-between">
        <p className="th">{label}</p>
        {Icon && <span className="h-7 w-7 rounded-lg grid place-items-center bg-white/[0.05]" style={{ color: accent }}><Icon className="h-3.5 w-3.5" /></span>}
      </div>
      <p className={`mt-1.5 text-[26px] leading-none font-semibold num ${tone}`}>{value}</p>
      {hint && <p className="text-[11.5px] text-muted mt-1.5">{hint}</p>}
      {progress !== undefined && (
        <div className="mt-2.5 h-1 rounded-full bg-ink-950/50 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${Math.max(3, Math.min(100, progress))}%`, background: accent }} />
        </div>
      )}
    </div>
  );
}

/** Hand-written annotation with an arrow, like the reference hero note. */
export function HandNote({ children, className = '', arrow = 'down-right' }: { children: React.ReactNode; className?: string; arrow?: 'down-right' | 'down-left' }) {
  return (
    <div className={`pointer-events-none select-none text-white/85 ${className}`} aria-hidden="true">
      <p className="font-hand text-[19px] leading-[1.05] -rotate-[7deg] max-w-[170px]">{children}</p>
      <svg viewBox="0 0 90 50" className={`w-[78px] h-[44px] mt-0.5 ${arrow === 'down-left' ? '-scale-x-100' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M6 6c18 4 40 10 56 30" />
        <path d="M52 36l11 1-2-11" />
      </svg>
    </div>
  );
}
