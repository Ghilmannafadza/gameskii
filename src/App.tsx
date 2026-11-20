/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Archive, Flame, Swords, Gauge, Gavel, Home, IdCard, LayoutGrid, LifeBuoy, Settings as SettingsIcon, Trophy, UploadCloud, User } from 'lucide-react';
import { StoreProvider } from './lib/store';
import { useRoute } from './lib/router';
import { Crumb, IconRail, MobileDrawer, MobileNav, Sidebar, TopTab, Topbar } from './components/layout';
import { Toasts } from './components/ui';
import { AuthModal } from './components/AuthModal';
import { OnboardingModal } from './components/Onboarding';
import Dashboard from './pages/Dashboard';
import Competitions, { CompetitionDetail } from './pages/Competitions';
import Leaderboard from './pages/Leaderboard';
import AthleteProfile from './pages/AthleteProfile';
import MyPassport from './pages/MyPassport';
import SubmitResult from './pages/SubmitResult';
import RefereePanel from './pages/RefereePanel';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Landing, { ESI_DIY } from './pages/Landing';
import { getCompetition } from './data/pilot';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[60vh] grid place-items-center text-center p-6">
          <div>
            <p className="font-display text-4xl text-white">Ada yang tidak beres</p>
            <p className="text-sm text-muted mt-2 max-w-md">{this.state.error.message}</p>
            <button className="btn btn-gold mt-5" onClick={() => { this.setState({ error: null }); window.location.hash = '#/dashboard'; }}>Kembali ke Dashboard</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function useScreen() {
  const route = useRoute();
  const [first, second] = route.segments;
  const path = '/' + (first || '');
  const tab = route.query.get('tab') || '';

  const compTabs: TopTab[] = [
    { label: 'Overview', to: '/kompetisi', icon: LayoutGrid, active: !tab },
    { label: 'Klasemen', to: '/kompetisi?tab=klasemen', icon: Flame, active: tab === 'klasemen' },
    { label: 'Arsip', to: '/kompetisi?tab=arsip', icon: Archive, active: tab === 'arsip' },
  ];
  const homeTabs: TopTab[] = [
    { label: 'Overview', to: '/dashboard', icon: LayoutGrid, active: path === '/dashboard' },
    { label: 'Ladder', to: '/leaderboard', icon: Flame, active: path === '/leaderboard' },
    { label: 'Arsip', to: '/kompetisi?tab=arsip', icon: Archive, active: false },
  ];

  let crumbs: Crumb[] = [{ label: 'Semua Game', to: '/dashboard' }];
  let tabs: TopTab[] | undefined;
  let icon: React.ReactNode = <Home className="h-4 w-4 text-gold" />;
  let page: React.ReactNode;

  switch (first) {
    case 'dashboard':
      crumbs = [{ label: 'Semua Game' }, { label: 'Dashboard' }];
      tabs = homeTabs;
      page = <Dashboard />;
      break;
    case 'kompetisi':
      icon = <Swords className="h-4 w-4 text-gold" />;
      if (second) {
        crumbs.push({ label: 'Kompetisi', to: '/kompetisi' }, { label: getCompetition(second)?.name || second });
        page = <CompetitionDetail key={second} id={second} />;
      } else {
        crumbs.push({ label: 'Kompetisi' });
        tabs = compTabs;
        page = <Competitions tab={tab} />;
      }
      break;
    case 'leaderboard':
      icon = <Trophy className="h-4 w-4 text-gold" />;
      crumbs.push({ label: 'Leaderboard' });
      tabs = homeTabs;
      page = <Leaderboard />;
      break;
    case 'atlet':
      icon = <User className="h-4 w-4 text-gold" />;
      crumbs.push({ label: 'Leaderboard', to: '/leaderboard' }, { label: second || 'Atlet' });
      page = <AthleteProfile key={second} id={second || ''} />;
      break;
    case 'paspor':
      icon = <IdCard className="h-4 w-4 text-gold" />;
      crumbs = [{ label: 'Navigasi', to: '/dashboard' }, { label: 'Paspor Saya' }];
      page = <MyPassport />;
      break;
    case 'upload':
      icon = <UploadCloud className="h-4 w-4 text-gold" />;
      crumbs = [{ label: 'Navigasi', to: '/dashboard' }, { label: 'Upload Hasil' }];
      page = <SubmitResult presetComp={route.query.get('c') || undefined} />;
      break;
    case 'panitia':
      icon = <Gavel className="h-4 w-4 text-gold" />;
      crumbs = [{ label: 'Navigasi', to: '/dashboard' }, { label: 'Panel Panitia' }];
      page = <RefereePanel />;
      break;
    case 'pengaturan':
      icon = <SettingsIcon className="h-4 w-4 text-gold" />;
      crumbs = [{ label: 'Navigasi', to: '/dashboard' }, { label: 'Pengaturan' }];
      page = <Settings />;
      break;
    case 'bantuan':
      icon = <LifeBuoy className="h-4 w-4 text-gold" />;
      crumbs = [{ label: 'Navigasi', to: '/dashboard' }, { label: 'Bantuan' }];
      page = <Help />;
      break;
    default:
      icon = <Gauge className="h-4 w-4 text-gold" />;
      crumbs = [{ label: 'Halaman tidak ditemukan' }];
      page = (
        <div className="py-24 text-center">
          <p className="font-display text-6xl text-white">404</p>
          <a className="btn btn-gold mt-5" href="#/dashboard">Ke Dashboard</a>
        </div>
      );
  }
  return { path, crumbs, tabs, icon, page };
}

function Root() {
  const route = useRoute();
  if (route.segments.length === 0) {
    return (
      <>
        <ErrorBoundary><Landing /></ErrorBoundary>
        <AuthModal />
        <OnboardingModal />
        <Toasts />
      </>
    );
  }
  return <Shell />;
}

function Shell() {
  const { path, crumbs, tabs, icon, page } = useScreen();
  return (
    <div className="app-bg min-h-screen flex">
      <IconRail path={path} />
      <Sidebar path={path} />
      <div className="flex-1 min-w-0 px-3 sm:px-5 lg:pl-4 lg:pr-5 pb-24 md:pb-10">
        <Topbar crumbs={crumbs} tabs={tabs} crumbIcon={icon} />
        <main className="pt-5 max-w-[1500px] mx-auto">
          <ErrorBoundary>{page}</ErrorBoundary>
        </main>
        <footer className="max-w-[1500px] mx-auto mt-10 mb-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink-800/60 border border-white/[0.05] px-4 py-3">
          <a href={ESI_DIY.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-3">
            <img src={ESI_DIY.logo} alt="Logo ESI DIY" className="h-9 w-9" />
            <span className="leading-tight">
              <span className="block text-[11px] text-muted">Dikelola oleh</span>
              <span className="block text-[13px] text-white font-medium">{ESI_DIY.name}</span>
            </span>
          </a>
          <a href="#/" className="text-[12px] text-soft hover:text-gold">Halaman utama</a>
        </footer>
      </div>
      <MobileNav path={path} />
      <MobileDrawer path={path} />
      <AuthModal />
      <OnboardingModal />
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Root />
    </StoreProvider>
  );
}
