import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Gavel,
  Home,
  IdCard,
  LifeBuoy,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  PanelLeft,
  Plus,
  Settings,
  Sun,
  Swords,
  Trophy,
  UploadCloud,
  X,
} from 'lucide-react';
import crest from '../assets/images/crest-160.jpg';
import { useStore } from '../lib/store';
import { href, navigate } from '../lib/router';
import { GAMES } from '../lib/assets';
import { COMPETITIONS } from '../data/pilot';
import { Avatar, BrandIcon, GameIcon, SmartImage } from './ui';
import { getTier } from '../data/constants';

export interface Crumb { label: string; to?: string }
export interface TopTab { label: string; to: string; icon: React.ComponentType<{ className?: string }>; active: boolean }

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi,';
  if (h < 15) return 'Selamat siang,';
  if (h < 19) return 'Selamat sore,';
  return 'Selamat malam,';
}

/* ---------------- Icon rail (far left) ---------------- */

export function IconRail({ path }: { path: string }) {
  const { state, setGameFilter, profile, leaderboard } = useStore();
  const me = profile ? leaderboard.find((a) => a.id === profile.id) : undefined;
  return (
    <aside className="hidden md:flex w-[60px] shrink-0 flex-col items-center py-4 gap-3 sticky top-0 h-screen">
      <a href={href('/')} className="block rounded-xl overflow-hidden ring-1 ring-white/10 h-10 w-10" aria-label="Halaman utama Gameskii" title="Halaman utama">
        <img src={crest} alt="Gameskii" className="h-full w-full object-cover" />
      </a>
      <div className="w-7 h-px bg-line my-1" />
      <a href={href(profile ? '/paspor' : '/dashboard')} title={profile ? profile.ign : 'Tamu'} className="block">
        <Avatar seed={profile?.uid_fingerprint || profile?.ign || 'guest-gameskii'} size={34} ring level={me ? getTier(me.elo_points).level : undefined} />
      </a>
      <div className="w-7 h-px bg-line my-1" />
      <nav className="flex flex-col items-center gap-2.5" aria-label="Filter game">
        {GAMES.map((g) => {
          const active = state.gameFilter === g.name;
          return (
            <div key={g.name} className="relative">
              <span className={`absolute -left-[13px] top-1/2 -translate-y-1/2 w-[4px] rounded-r-full bg-gold transition-all ${active ? 'h-6 opacity-100' : 'h-2 opacity-0'}`} />
              <button
                onClick={() => setGameFilter(active ? 'all' : g.name)}
                data-tip={active ? `${g.name} · klik untuk semua game` : g.name}
                aria-label={`Filter game ${g.name}`}
                aria-pressed={active}
                className={`tip block rounded-[11px] p-[2px] transition ${active ? 'bg-gold shadow-[0_0_18px_-4px_rgba(255,210,31,.7)]' : 'bg-white/[0.04] hover:bg-white/15'}`}
              >
                <GameIcon game={g.name} size={34} rounded="rounded-[9px]" className={active || state.gameFilter === 'all' ? '' : 'opacity-55 grayscale-[.4]'} />
              </button>
            </div>
          );
        })}
        <button
          onClick={() => navigate('/upload')}
          className={`tip mt-1 h-[38px] w-[38px] rounded-[11px] border border-dashed grid place-items-center transition ${path === '/upload' ? 'text-gold border-gold' : 'border-white/20 text-soft hover:text-white hover:border-white/50'}`}
          data-tip="Upload hasil turnamen"
          aria-label="Upload hasil turnamen"
        >
          <Plus className="h-4 w-4" />
        </button>
      </nav>
      <div className="mt-auto flex flex-col items-center gap-3">
        <a href={href('/bantuan')} className="tip h-9 w-9 grid place-items-center rounded-lg text-muted hover:text-white hover:bg-white/5" data-tip="Komunitas FFYK">
          <BrandIcon name="discord" className="h-[18px] w-[18px]" />
        </a>
        <a href={href('/bantuan')} className="tip h-9 w-9 grid place-items-center rounded-lg text-muted hover:text-white hover:bg-white/5" data-tip="Bantuan">
          <CircleHelp className="h-[18px] w-[18px]" />
        </a>
        <div className="rounded-[12px] bg-ink-850 border border-white/[0.05] p-1 flex flex-col gap-1" role="group" aria-label="Tema">
          <span className="h-8 w-8 grid place-items-center text-muted/60" title="Tema terang belum tersedia">
            <Sun className="h-4 w-4" />
          </span>
          <span className="h-8 w-8 grid place-items-center rounded-lg bg-ink-700 text-cyan shadow-[inset_0_1px_0_rgba(255,255,255,.06)]" title="Tema gelap aktif">
            <Moon className="h-4 w-4" />
          </span>
        </div>
      </div>
    </aside>
  );
}

/* ---------------- Sidebar ---------------- */

function NavLink({ to, icon: Icon, label, count, active, onClick }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string; count?: number; active: boolean; onClick?: () => void }) {
  return (
    <a href={href(to)} onClick={onClick} className={`nav-item ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}>
      <Icon />
      <span>{label}</span>
      {count !== undefined && count > 0 && <span className="nav-count">{count}</span>}
    </a>
  );
}

export function SidebarContent({ path, onNavigate }: { path: string; onNavigate?: () => void }) {
  const { account, profile, isReferee, state, openAuth, signOut, dismissPromo, claimCandidate, leaderboard } = useStore();
  const me = profile ? leaderboard.find((a) => a.id === profile.id) : undefined;
  const pending = state.submissions.filter((s) => s.status === 'Pending Review' || s.status === 'Disputed').length + state.claims.filter((c) => c.status === 'pending').length;
  const is = (p: string) => (p === '/' ? path === '/' : path === p || path.startsWith(p + '/'));
  const name = profile?.ign || (account ? account.email.split('@')[0] : 'Tamu');

  const promo = !state.promoDismissed && (!profile || claimCandidate);

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-7">
        <a href={href(profile ? `/atlet/${profile.gameskii_id}` : '/paspor')} className="inline-block" aria-label="Profil saya">
          <Avatar seed={profile?.uid_fingerprint || profile?.ign || 'guest-gameskii'} size={62} ring level={me ? getTier(me.elo_points).level : undefined} />
        </a>
        <p className="mt-4 text-[13px] text-soft">{greeting()}</p>
        <p className="text-[21px] font-semibold text-white leading-tight truncate">{name}</p>
        {me ? (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-soft">{getTier(me.elo_points).name}</span>
              <span className="font-mono text-muted num">{me.elo_points}{getTier(me.elo_points).next ? ` / ${getTier(me.elo_points).next!.min}` : ''}</span>
            </div>
            <div className="mt-1.5 h-[5px] rounded-full bg-ink-950/60 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan to-gold" style={{ width: `${Math.max(4, getTier(me.elo_points).progress)}%` }} />
            </div>
          </div>
        ) : (
          <p className="mt-1 text-[12px] text-muted">{account ? 'Paspor belum dibuat' : 'Belum masuk'}</p>
        )}
        {isReferee && <span className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-cyan/12 text-cyan px-2 py-[3px] text-[11px]"><span className="status-dot bg-cyan" />Mode panitia</span>}
      </div>
      <div className="mx-5 my-5 h-px bg-line" />
      <nav className="px-3 flex flex-col gap-1" aria-label="Navigasi utama">
                <NavLink to="/dashboard" icon={Home} label="Dashboard" active={is('/dashboard')} onClick={onNavigate} />
        <p className="section-label px-2 mt-4 mb-2">Navigasi</p>
        <NavLink to="/kompetisi" icon={Swords} label="Kompetisi" count={COMPETITIONS.length} active={is('/kompetisi')} onClick={onNavigate} />
        <NavLink to="/leaderboard" icon={Trophy} label="Leaderboard" active={is('/leaderboard') || is('/atlet')} onClick={onNavigate} />
        <NavLink to="/paspor" icon={IdCard} label="Paspor Saya" active={is('/paspor')} onClick={onNavigate} />
        <NavLink to="/upload" icon={UploadCloud} label="Upload Hasil" active={is('/upload')} onClick={onNavigate} />
        {isReferee && <NavLink to="/panitia" icon={Gavel} label="Panel Panitia" count={pending} active={is('/panitia')} onClick={onNavigate} />}
        <p className="section-label px-2 mt-4 mb-2">Konfigurasi</p>
        <NavLink to="/bantuan" icon={LifeBuoy} label="Bantuan" active={is('/bantuan')} onClick={onNavigate} />
        <NavLink to="/pengaturan" icon={Settings} label="Pengaturan" active={is('/pengaturan')} onClick={onNavigate} />
        {account ? (
          <button onClick={() => { signOut(); onNavigate?.(); }} className="nav-item text-left">
            <LogOut />
            <span>Keluar</span>
          </button>
        ) : (
          <button onClick={() => { openAuth('signin'); onNavigate?.(); }} className="nav-item text-left">
            <LogIn />
            <span>Masuk / Daftar</span>
          </button>
        )}
      </nav>

      {promo && (
        <div className="mt-auto p-4">
          <div className="promo-card relative rounded-2xl p-4 pt-5 overflow-hidden border border-white/10">
            <svg viewBox="0 0 200 200" className="absolute -right-16 -top-16 h-48 w-48 text-white/[0.07]" fill="none" stroke="currentColor" aria-hidden="true">
              <circle cx="100" cy="100" r="40" /><circle cx="100" cy="100" r="62" /><circle cx="100" cy="100" r="84" />
            </svg>
            <button onClick={dismissPromo} className="absolute top-3 right-3 text-white/60 hover:text-white" aria-label="Tutup">
              <X className="h-4 w-4" />
            </button>
            <div className="relative h-10 w-10 rounded-[10px] bg-cyan grid place-items-center text-ink-950 shadow-[0_8px_20px_-6px_rgba(44,198,239,.7)]">
              <IdCard className="h-5 w-5" />
            </div>
            <p className="relative mt-3 text-[15px] font-semibold text-white leading-snug">
              {profile ? 'Riwayat podium-mu ditemukan' : 'Buat paspor atlet digitalmu'}
            </p>
            <p className="text-[12px] text-white/65 mt-1.5 leading-relaxed">
              {profile ? `${claimCandidate?.matches_played || 0} podium cocok dengan UID-mu. Ajukan klaim ke panitia.` : 'Tautkan UID Free Fire untuk menarik prestasi dari 10 kompetisi.'}
            </p>
            <button
              onClick={() => { profile ? navigate('/paspor') : account ? navigate('/paspor') : openAuth('signup'); onNavigate?.(); }}
              className="relative btn w-full mt-4 bg-[#5d92d6] hover:bg-[#6ea1e2] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.25)]"
            >
              {profile ? 'Ajukan Klaim' : 'Mulai Sekarang'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ path }: { path: string }) {
  const { state } = useStore();
  if (state.sidebarCollapsed) return null;
  return (
    <aside className="hidden lg:block w-[238px] shrink-0 sticky top-0 h-screen py-3">
      <div className="h-full rounded-2xl bg-ink-850/80 border border-white/[0.03] overflow-y-auto no-scrollbar">
        <SidebarContent path={path} />
      </div>
    </aside>
  );
}

export function MobileDrawer({ path }: { path: string }) {
  const { mobileNavOpen, setMobileNavOpen } = useStore();
  if (!mobileNavOpen) return null;
  return (
    <div className="lg:hidden fixed inset-0 z-[55] fade-in" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-950/70" onClick={() => setMobileNavOpen(false)} />
      <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-ink-850 border-r border-line overflow-y-auto">
        <button onClick={() => setMobileNavOpen(false)} className="absolute right-3 top-3 p-2 text-muted hover:text-white" aria-label="Tutup menu">
          <X className="h-5 w-5" />
        </button>
        <SidebarContent path={path} onNavigate={() => setMobileNavOpen(false)} />
      </div>
    </div>
  );
}

/* ---------------- Top bar ---------------- */

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onOut: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onOut();
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, onOut]);
}

export function Topbar({ crumbs, tabs, crumbIcon }: { crumbs: Crumb[]; tabs?: TopTab[]; crumbIcon?: React.ReactNode }) {
  const { account, profile, state, openAuth, signOut, markNotificationsRead, toggleSidebar, setMobileNavOpen } = useStore();
  const [menu, setMenu] = useState<false | 'user' | 'bell'>(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setMenu(false));
  const notes = account ? state.notifications.filter((n) => n.account_id === account.id) : [];
  const unread = notes.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 pt-3">
      <div className="glass rounded-2xl border border-white/[0.04] h-[54px] px-3 sm:px-4 flex items-center gap-3">
        <button onClick={() => setMobileNavOpen(true)} className="lg:hidden p-1.5 -ml-1 text-soft hover:text-white" aria-label="Buka menu">
          <Menu className="h-5 w-5" />
        </button>
        <nav className="flex items-center gap-2 min-w-0 text-[13px]" aria-label="Breadcrumb">
          <span className="hidden sm:grid h-7 w-7 rounded-lg bg-ink-700 place-items-center shrink-0">{crumbIcon}</span>
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className="hidden sm:block h-3.5 w-3.5 text-muted shrink-0" />}
              {c.to ? (
                <a href={href(c.to)} className={`truncate ${i === crumbs.length - 1 ? 'text-white sm:text-muted' : 'hidden sm:inline shrink-0 text-white hover:text-gold'}`}>{c.label}</a>
              ) : (
                <span className={`truncate ${i === crumbs.length - 1 ? (crumbs.length > 1 ? 'text-white sm:text-muted' : 'text-white') : 'hidden sm:inline shrink-0 text-white'}`}>{c.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {tabs && (
          <div className="hidden xl:flex items-center gap-1 mx-auto">
            {tabs.map((t) => (
              <a key={t.label} href={href(t.to)} className={`top-tab ${t.active ? 'active' : ''}`}>
                <t.icon />
                {t.label}
              </a>
            ))}
          </div>
        )}

        <div ref={ref} className={`flex items-center gap-1.5 ${tabs ? 'ml-auto xl:ml-0' : 'ml-auto'}`}>
          <a href={href('/bantuan')} className="hidden sm:grid h-9 w-9 place-items-center rounded-lg text-soft hover:text-white hover:bg-white/5" title="Hubungi panitia">
            <MessageSquare className="h-[18px] w-[18px]" />
          </a>
          <div className="relative">
            <button
              onClick={() => { setMenu(menu === 'bell' ? false : 'bell'); if (menu !== 'bell') markNotificationsRead(); }}
              className="relative h-9 w-9 grid place-items-center rounded-lg text-soft hover:text-white hover:bg-white/5"
              aria-label={`Notifikasi${unread ? `, ${unread} belum dibaca` : ''}`}
            >
              <Bell className="h-[18px] w-[18px]" />
              {unread > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose ring-2 ring-ink-800" />}
            </button>
            {menu === 'bell' && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-ink-800 border border-line shadow-2xl p-2 fade-in">
                <p className="th px-2 py-1.5">Notifikasi</p>
                {notes.length === 0 ? (
                  <p className="text-[13px] text-muted px-2 py-4">{account ? 'Belum ada notifikasi.' : 'Masuk untuk melihat notifikasi.'}</p>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {notes.slice(0, 12).map((n) => (
                      <a key={n.id} href={href(n.link || '/dashboard')} onClick={() => setMenu(false)} className="block rounded-lg px-2 py-2 hover:bg-white/5">
                        <p className="text-[13px] text-white leading-snug">{n.text}</p>
                        <p className="text-[11px] text-muted mt-0.5 font-mono">{new Date(n.at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {account ? (
            <div className="relative">
              <button onClick={() => setMenu(menu === 'user' ? false : 'user')} className="flex items-center gap-2 rounded-lg pl-1.5 pr-2 py-1 hover:bg-white/5" aria-haspopup="menu" aria-expanded={menu === 'user'}>
                <Avatar seed={profile?.uid_fingerprint || profile?.ign || 'guest-gameskii'} size={26} />
                <span className="hidden sm:block text-[13px] text-white max-w-[120px] truncate">{profile?.ign || account.email.split('@')[0]}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted" />
              </button>
              {menu === 'user' && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-ink-800 border border-line shadow-2xl p-1.5 fade-in" role="menu">
                  <p className="px-3 py-2 text-[11px] text-muted truncate">{account.email}</p>
                  <a href={href('/paspor')} onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2 text-[13px] text-white hover:bg-white/5" role="menuitem">Paspor Saya</a>
                  <a href={href('/pengaturan')} onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2 text-[13px] text-white hover:bg-white/5" role="menuitem">Pengaturan</a>
                  <button onClick={() => { setMenu(false); signOut(); }} className="w-full text-left rounded-lg px-3 py-2 text-[13px] text-[#ff8db3] hover:bg-white/5" role="menuitem">Keluar</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => openAuth('signin')} className="btn btn-gold !py-2 !px-3.5">
              <LogIn className="h-4 w-4" />
              <span>Masuk</span>
            </button>
          )}
          <button onClick={toggleSidebar} className="hidden lg:grid h-9 w-9 place-items-center rounded-lg text-soft hover:text-white hover:bg-white/5" title="Tampilkan/sembunyikan sidebar" aria-label="Tampilkan atau sembunyikan sidebar">
            <PanelLeft className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
      {tabs && (
        <div className="xl:hidden flex gap-1 mt-2 overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <a key={t.label} href={href(t.to)} className={`top-tab shrink-0 ${t.active ? 'active' : ''}`}>
              <t.icon />
              {t.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

/* ---------------- Mobile bottom nav ---------------- */

export function MobileNav({ path }: { path: string }) {
  const items = [
    { to: '/dashboard', label: 'Beranda', icon: Home },
    { to: '/kompetisi', label: 'Kompetisi', icon: Swords },
    { to: '/upload', label: 'Upload', icon: Plus, primary: true },
    { to: '/leaderboard', label: 'Ranking', icon: Trophy },
    { to: '/paspor', label: 'Paspor', icon: IdCard },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-white/5 safe-bottom" aria-label="Navigasi bawah">
      <div className="grid grid-cols-5 h-16">
        {items.map((it) => {
          const active = path.startsWith(it.to);
          return (
            <a key={it.to} href={href(it.to)} className={`flex flex-col items-center justify-center gap-1 text-[11px] ${active ? 'text-gold' : 'text-muted'}`} aria-current={active ? 'page' : undefined}>
              {it.primary ? (
                <span className="h-10 w-10 -mt-5 rounded-xl bg-gold text-ink-950 grid place-items-center shadow-lg shadow-black/40">
                  <it.icon className="h-5 w-5" />
                </span>
              ) : (
                <it.icon className="h-5 w-5" />
              )}
              <span>{it.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

/* ---------------- Shared page hero (image banner) ---------------- */

export function PageHero({ image, eyebrow, title, subtitle, children, right, position = 'center', compact = false }: { image: string; eyebrow?: React.ReactNode; title: React.ReactNode; subtitle?: React.ReactNode; children?: React.ReactNode; right?: React.ReactNode; position?: string; compact?: boolean }) {
  return (
    <section className="grain relative rounded-2xl overflow-hidden bg-ink-800 border border-white/[0.04]">
      <div className="absolute inset-y-0 right-0 w-full md:w-[62%]">
        <SmartImage src={image} alt="" className="absolute inset-0 h-full w-full object-cover" position={position} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#162a46_0%,rgba(22,42,70,.86)_22%,rgba(22,42,70,.35)_60%,rgba(22,42,70,.15)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(22,42,70,.85)_0%,transparent_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(200deg,rgba(44,198,239,.16),transparent_45%)]" />
      </div>
      <div className={`relative z-[2] px-6 sm:px-9 ${compact ? 'py-7' : 'py-8 sm:py-10'} flex flex-col lg:flex-row lg:items-end gap-6`}>
        <div className="max-w-2xl">
          {eyebrow && <div className="mb-3 flex flex-wrap items-center gap-2">{eyebrow}</div>}
          <h1 className={`font-display text-white ${compact ? 'text-[42px] sm:text-[52px]' : 'text-[44px] sm:text-[60px]'}`}>{title}</h1>
          {subtitle && <p className="text-[14px] text-soft mt-3 max-w-xl leading-relaxed">{subtitle}</p>}
          {children}
        </div>
        {right && <div className="lg:ml-auto">{right}</div>}
      </div>
    </section>
  );
}
