import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { ReceiptModal } from './components/common/ReceiptModal';
import { NotificationsModal } from './components/common/NotificationsModal';
import { NewCompanyModal } from './components/common/NewCompanyModal';
import { ReturnSaleModal } from './components/common/ReturnSaleModal';
import { DownloadAppModal } from './components/common/DownloadAppModal';
import { KawaiiWallpaperDoodles } from './components/common/KawaiiMascot';

// Views
import { DashboardView } from './components/views/DashboardView';
import { SellView } from './components/views/SellView';
import { ProductsView } from './components/views/ProductsView';
import { ComingSoonView } from './components/views/ComingSoonView';
import { PurchasesView } from './components/views/PurchasesView';
import { AdminSpendingView } from './components/views/AdminSpendingView';
import { ExpensesView } from './components/views/ExpensesView';
import { MoneyView } from './components/views/MoneyView';
import { CustomersView } from './components/views/CustomersView';
import { ReportsView } from './components/views/ReportsView';
import { GoalsPlansView } from './components/views/GoalsPlansView';
import { TeamChatView } from './components/views/TeamChatView';
import { AnnouncementsView } from './components/views/AnnouncementsView';
import { ActivityLogView } from './components/views/ActivityLogView';
import { SettingsView } from './components/views/SettingsView';
import { ProfileView } from './components/views/ProfileView';
import { NoCompanyView } from './components/views/NoCompanyView';
import { Sale } from './types';
import { api, getApiToken, setApiToken, clearApiToken } from './utils/api';



const AuthGate: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loggedIn, setLoggedIn] = useState(() => !!getApiToken());
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [inviteError, setInviteError] = useState('');
  const [joining, setJoining] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const inviteCode = new URLSearchParams(window.location.search).get('invite');

  useEffect(() => {
    if (!inviteCode) return;
    let alive = true;
    setInviteLoading(true);
    setInviteError('');
    api(`/api/invites/${encodeURIComponent(inviteCode)}`)
      .then(info => { if (alive) setInviteInfo(info); })
      .catch((err:any) => { if (alive) setInviteError(err?.message || 'This invitation is invalid or expired.'); })
      .finally(() => { if (alive) setInviteLoading(false); });
    return () => { alive = false; };
  }, [inviteCode]);

  const joinInvite = async () => {
    if (!inviteCode) return;
    if (!getApiToken()) {
      setMode('register');
      setError('');
      return;
    }
    setJoining(true);
    setInviteError('');
    try {
      await api(`/api/invites/${encodeURIComponent(inviteCode)}/accept`, {method:'POST'});
      window.history.replaceState({}, '', window.location.pathname);
      window.location.reload();
    } catch (err:any) {
      setInviteError(err?.message || 'Could not join this company.');
    } finally {
      setJoining(false);
    }
  };

  if (loggedIn && inviteLoading) return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="rounded-2xl border border-pink-200 bg-white px-6 py-4 text-sm font-bold text-[#fb429c] shadow-xl">Loading invitation…</div>
    </div>
  );
  if (loggedIn && (inviteInfo || inviteError)) {
    return (
      <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-black/20 p-5 backdrop-blur-sm">
        <div className="w-full max-w-[430px] rounded-[30px] border border-pink-200/70 bg-white p-7 text-center shadow-2xl">
          <div className="text-[29px] font-extrabold tracking-tight text-[#fb429c]">Business Girls ♡</div>
          {inviteInfo ? (
            <>
              <div className="mt-5 text-2xl font-bold text-[#4d3345]">You’re invited!</div>
              <p className="mt-2 text-sm text-[#947486]">Join <b>{inviteInfo.company?.name || 'this company'}</b> and start working with the team.</p>
              <button disabled={joining} onClick={joinInvite} className="mt-6 w-full rounded-2xl bg-[#fb429c] px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-pink-200 disabled:opacity-60">
                {joining ? 'Joining…' : 'Join Company'}
              </button>
              {inviteError && <p className="mt-3 text-xs font-semibold text-[#d34d79]">{inviteError}</p>}
            </>
          ) : (
            <>
              <div className="mt-5 text-xl font-bold text-[#4d3345]">Invitation unavailable</div>
              <p className="mt-2 text-sm text-[#947486]">{inviteError}</p>
              <button onClick={() => { window.history.replaceState({}, '', window.location.pathname); window.location.reload(); }} className="mt-6 w-full rounded-2xl border border-pink-200 px-4 py-3 text-sm font-bold text-[#fb429c]">Continue</button>
            </>
          )}
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      if (!normalizedEmail || !password) throw new Error('Enter your email and password.');
      if (mode === 'register' && !username.trim()) throw new Error('Choose a username for your profile.');
      if (mode === 'register') {
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');
        if (password !== confirm) throw new Error('Passwords do not match.');
        const data = await api('/api/auth/register', {method:'POST', body:JSON.stringify({email:normalizedEmail,password,name:username.trim()})});
        setApiToken(data.token); setLoggedIn(true);
      } else {
        const data = await api('/api/auth/login', {method:'POST', body:JSON.stringify({email:normalizedEmail,password})});
        setApiToken(data.token); setLoggedIn(true);
      }
      window.location.reload();
    } catch (err:any) { setError(err?.message || 'Something went wrong.'); }
    finally { setBusy(false); }
  };

  // Do not mount the main application until authentication is complete.
  // Several workspace views assume an authenticated account; mounting them
  // beside the login screen could crash React and leave a completely blank page.
  if (loggedIn) return <MainLayout />;

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-auto bg-[linear-gradient(135deg,#fff8fc_0%,#ffe6f4_52%,#ffc4f5_100%)] p-5">
      <div className="relative w-full max-w-[430px] overflow-hidden rounded-[30px] border border-pink-200/60 bg-white/95 p-7 shadow-[0_25px_70px_rgba(196,76,145,0.20)] sm:p-9">
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-pink-100/80" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-fuchsia-100/70" />
        <div className="relative">
          <div className="mb-1 text-center text-[29px] font-extrabold tracking-tight text-[#fb429c]">Business Girls ♡</div>
          <h1 className="text-center text-[25px] font-bold text-[#4d3345]">Welcome!</h1>
          <p className="mb-6 mt-1 text-center text-sm text-[#947486]">Your account works across web, Android and Windows</p>
          {inviteInfo && (
            <div className="mb-5 rounded-2xl border border-pink-200 bg-[#fff7fb] p-4 text-center">
              <div className="text-sm font-extrabold text-[#4d3345]">You’ve been invited to join</div>
              <div className="mt-1 text-base font-bold text-[#fb429c]">{inviteInfo.company?.name || 'a company'}</div>
              <button type="button" onClick={joinInvite} className="mt-3 w-full rounded-xl bg-[#fb429c] px-4 py-3 text-sm font-extrabold text-white shadow-sm">
                Join Company
              </button>
              <div className="mt-2 text-[11px] text-[#a08796]">Log in or create your account below, then press Join Company.</div>
            </div>
          )}
          {inviteError && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-xs font-semibold text-[#c94b6b]">{inviteError}</div>
          )}
          <div className="mb-5 grid grid-cols-2 rounded-2xl bg-[#fff0f8] p-1">
            <button type="button" onClick={() => {setMode('login');setError('')}} className={`rounded-xl px-3 py-2.5 text-sm font-bold transition ${mode === 'login' ? 'bg-white text-[#fb429c] shadow-sm' : 'text-[#aa7b96]'}`}>Log in</button>
            <button type="button" onClick={() => {setMode('register');setError('')}} className={`rounded-xl px-3 py-2.5 text-sm font-bold transition ${mode === 'register' ? 'bg-white text-[#fb429c] shadow-sm' : 'text-[#aa7b96]'}`}>Create account</button>
          </div>
          <form onSubmit={submit}>
            {mode === 'register' && <>
              <label className="mb-1.5 block text-xs font-bold text-[#725368]">Username</label>
              <input value={username} onChange={e => {setUsername(e.target.value);setError('')}} type="text" required placeholder="Your name" autoComplete="nickname" className="w-full rounded-2xl border border-[#efc9df] bg-[#fffafd] px-4 py-3 text-sm text-[#4d3345] outline-none transition focus:border-[#fb429c] focus:ring-4 focus:ring-pink-100" />
            </>}
            <label className="mb-1.5 mt-4 block text-xs font-bold text-[#725368]">Email</label>
            <input value={email} onChange={e => {setEmail(e.target.value);setError('')}} type="email" required placeholder="you@example.com" autoComplete="email" className="w-full rounded-2xl border border-[#efc9df] bg-[#fffafd] px-4 py-3 text-sm text-[#4d3345] outline-none transition focus:border-[#fb429c] focus:ring-4 focus:ring-pink-100" />
            <label className="mb-1.5 mt-4 block text-xs font-bold text-[#725368]">Password</label>
            <input value={password} onChange={e => {setPassword(e.target.value);setError('')}} type="password" required minLength={6} placeholder="••••••••" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} className="w-full rounded-2xl border border-[#efc9df] bg-[#fffafd] px-4 py-3 text-sm text-[#4d3345] outline-none transition focus:border-[#fb429c] focus:ring-4 focus:ring-pink-100" />
            {mode === 'register' && <>
              <label className="mb-1.5 mt-4 block text-xs font-bold text-[#725368]">Confirm password</label>
              <input value={confirm} onChange={e => {setConfirm(e.target.value);setError('')}} type="password" required minLength={6} placeholder="••••••••" autoComplete="new-password" className="w-full rounded-2xl border border-[#efc9df] bg-[#fffafd] px-4 py-3 text-sm text-[#4d3345] outline-none transition focus:border-[#fb429c] focus:ring-4 focus:ring-pink-100" />
            </>}
            <button disabled={busy} type="submit" className="mt-5 w-full rounded-2xl bg-[#fb429c] px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-pink-200 transition hover:brightness-105 disabled:opacity-60">{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button>
            <div className="min-h-5 pt-2 text-center text-xs text-[#d34d79]">{error}</div>
          </form>
          <p className="mt-2 text-center text-[11px] text-[#a08796]">One account • all your devices</p>
        </div>
      </div>
    </div>
  );
};

const MainLayout: React.FC = () => {
  const { state, activeView, selectedReceipt, setSelectedReceipt } = useApp();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNewCompanyOpen, setIsNewCompanyOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [returnTargetSale, setReturnTargetSale] = useState<Sale | null>(null);

  // Keep the full app navigation visible even before the user joins/creates a company.
  // Profile is a normal section, not an automatic onboarding screen.

  // Render view based on activeView
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'sell':
        return <SellView />;
      case 'products':
        return <ProductsView />;
      case 'coming_soon':
        return <ComingSoonView />;
      case 'purchases':
        return <PurchasesView />;
      case 'admin_spending':
        return <AdminSpendingView />;
      case 'expenses':
        return <ExpensesView />;
      case 'money':
        return <MoneyView />;
      case 'customers':
        return <CustomersView />;
      case 'reports':
        return <ReportsView />;
      case 'goals':
        return <GoalsPlansView />;
      case 'chat':
        return <TeamChatView />;
      case 'announcements':
        return <AnnouncementsView />;
      case 'activity':
        return <ActivityLogView />;
      case 'settings':
        return <SettingsView />;
      case 'profile':
        return <ProfileView onCreateCompany={() => setIsNewCompanyOpen(true)} />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-[#3E2027] font-sans flex flex-col relative overflow-x-hidden">
      {/* Background cute ambient floating wallpaper doodles & clouds */}
      <KawaiiWallpaperDoodles />

      {/* Desktop & Mobile Header */}
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenNewCompany={() => setIsNewCompanyOpen(true)}
        onOpenDownload={() => setIsDownloadModalOpen(true)}
      />

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-3 sm:px-6 py-2 sm:py-4 gap-6 relative z-10">
        {/* Desktop Sidebar (Left) */}
        <Sidebar 
          onOpenNewCompany={() => setIsNewCompanyOpen(true)} 
          onOpenDownload={() => setIsDownloadModalOpen(true)}
        />

        {/* Content Area (Right) */}
        <main className="flex-1 min-w-0">
          {renderView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Modals */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
      <NewCompanyModal isOpen={isNewCompanyOpen} onClose={() => setIsNewCompanyOpen(false)} />
      <DownloadAppModal isOpen={isDownloadModalOpen} onClose={() => setIsDownloadModalOpen(false)} />
      
      {/* Digital Receipt Modal */}
      <ReceiptModal
        sale={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        onOpenReturn={sale => setReturnTargetSale(sale)}
      />

      {/* Sale Return / Refund Modal */}
      <ReturnSaleModal
        sale={returnTargetSale}
        onClose={() => setReturnTargetSale(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
      <AuthGate />
    </AppProvider>
  );
}
