import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ChevronDown, Plus, Search, Bell, Sparkles, Check
} from 'lucide-react';
import { MascotGirlPortrait, SearchKittyIcon } from '../common/KawaiiMascot';
import { api, clearApiToken } from '../../utils/api';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenNewCompany: () => void;
  onOpenSearch?: () => void;
  onOpenDownload?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenNotifications, 
  onOpenNewCompany, 
  onOpenSearch,
  onOpenDownload
}) => {
  const { 
    state, currentCompany, currentUser, switchCompany, updateCurrentUserProfile,
    setActiveView 
  } = useApp();

  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileAvatar, setProfileAvatar] = useState(currentUser.avatarUrl || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  const unreadNotifs = state.notifications.filter(n => n.companyId === currentCompany.id && !n.isRead).length;

  return (
    <header className="sticky top-0 z-30 px-3 lg:px-6 pt-3 pb-1 select-none">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        
        {/* Left: Pill Workspace Switcher */}
        <div className="relative">
          <button
            id="company-switcher-btn"
            onClick={() => {
              setIsCompanyDropdownOpen(!isCompanyDropdownOpen);
              setIsUserDropdownOpen(false);
            }}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/85 hover:bg-white border border-[#F9CAD4] shadow-[0_4px_20px_rgba(226,115,135,0.06)] transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-2 ring-[#F9CAD4]/80">
              <MascotGirlPortrait className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-xs text-[#3E2027] tracking-tight">{currentCompany.id ? currentCompany.name : 'No company'}</span>
                <span className="text-xs text-[#E27387]">💖</span>
                <ChevronDown className="w-3 h-3 text-[#D47C90] group-hover:text-[#B85269] transition-transform duration-200" />
              </div>
              <p className="text-[10px] text-[#9E6775] font-medium">{currentCompany.id ? `${currentCompany.currency} • Active Workspace` : 'Personal account • No company'}</p>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isCompanyDropdownOpen && (
            <div className="absolute left-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-3xl shadow-xl shadow-pink-950/10 border border-[#F9CAD4] p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1.5 text-[10px] font-extrabold text-[#B85269] uppercase tracking-wider">
                Switch Workspace
              </div>
              {state.companies.map(comp => (
                <button
                  key={comp.id}
                  onClick={() => {
                    switchCompany(comp.id);
                    setIsCompanyDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold transition-colors ${
                    comp.id === currentCompany.id
                      ? 'bg-[#FFEBF0] text-[#A7445C] font-bold'
                      : 'text-[#5C3A42] hover:bg-[#FFF5F7]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-5 h-5 rounded-full bg-[#FFE4EC] flex items-center justify-center text-xs">🌸</span>
                    <span className="truncate">{comp.name}</span>
                  </div>
                  {comp.id === currentCompany.id && <Check className="w-4 h-4 text-[#E27387]" />}
                </button>
              ))}

              <div className="pt-2 mt-1 border-t border-[#FCE5EB]">
                <button
                  onClick={() => {
                    setIsCompanyDropdownOpen(false);
                    onOpenNewCompany();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#E27387] hover:bg-[#FFF5F7] rounded-2xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Center: Global Search Bar with Cute Kitty Face */}
        <div className="flex-1 max-w-xl hidden md:block">
          <button
            id="global-search-btn"
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-4 py-2 rounded-full bg-white/85 hover:bg-white border border-[#F9CAD4] text-[#9E6775] hover:text-[#3E2027] text-xs transition-all shadow-[0_4px_20px_rgba(226,115,135,0.04)] group"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-3.5 h-3.5 text-[#C46E82] group-hover:text-[#B85269] transition-colors" />
              <span>Search products, sales, customers, spending...</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#C46E82]">
              <SearchKittyIcon className="w-4 h-4 opacity-85 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        </div>

        {/* Right: + New Sale, Notifications & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="p-2 text-[#E27387] hover:bg-white/80 rounded-full md:hidden transition-colors border border-[#F9CAD4] bg-white/70"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* + New Sale Button with Fluttering Butterfly Sticker */}
          <div className="relative">
            {/* Subtle butterfly doodle fluttering near New Sale */}
            <span className="absolute -top-2.5 -left-2 text-xs pointer-events-none opacity-80 animate-bounce">
              🦋
            </span>
            <button
              id="header-sell-btn"
              onClick={() => setActiveView('sell')}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#DF7489] to-[#D5647B] hover:from-[#E27C90] hover:to-[#CD5971] text-white font-bold text-xs shadow-[0_4px_16px_rgba(226,115,135,0.28)] active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-100" />
              <span>New Sale</span>
            </button>
          </div>

          {/* Notifications Bell */}
          <button
            id="notifications-bell-btn"
            onClick={onOpenNotifications}
            className="relative p-2 text-[#9E6775] hover:text-[#3E2027] hover:bg-white rounded-full transition-colors border border-[#F9CAD4] bg-white/85 shadow-[0_2px_8px_rgba(226,115,135,0.04)]"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E27387] ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* User Profile Switcher */}
          <div className="relative">
            <button
              id="user-profile-menu-btn"
              onClick={() => {
                setIsUserDropdownOpen(!isUserDropdownOpen);
                setIsCompanyDropdownOpen(false);
              }}
              className="flex items-center gap-2 pl-2.5 pr-1 py-1 rounded-full bg-white/85 hover:bg-white border border-[#F9CAD4] transition-all text-left shadow-[0_2px_8px_rgba(226,115,135,0.04)]"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-[#3E2027] leading-tight flex items-center gap-1 justify-end">
                  <span>{currentUser.name}</span>
                  <span className="text-xs text-[#E27387]">💖</span>
                </p>
                <span className="inline-block px-2 py-0.2 text-[9px] font-extrabold uppercase rounded-full bg-[#FFE5EC] text-[#A73D54] border border-[#F9CAD4]/80">
                  {currentCompany.id ? currentUser.role : 'No company'}
                </span>
              </div>
              <div className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-[#F9CAD4]">
                {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" /> : <MascotGirlPortrait className="w-full h-full object-cover" />}
              </div>
            </button>

            {/* Profile Dropdown */}
            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-md rounded-3xl shadow-xl shadow-pink-950/10 border border-[#F9CAD4] p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-3 border-b border-[#FCE5EB] mb-1 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#F9CAD4] bg-[#FFF0F6] shrink-0">
                    {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" /> : <MascotGirlPortrait className="w-full h-full object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#3E2027] truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-[#9E6775] truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-[#FFE5EC] text-[#A73D54] border border-[#F9CAD4]/80">{currentCompany.id ? currentUser.role : 'No company'}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setProfileName(currentUser.name);
                    setProfileAvatar(currentUser.avatarUrl || '');
                    setProfileError('');
                    setIsProfileEditorOpen(true);
                    setIsUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-[#A7445C] hover:bg-[#FFF5F7] rounded-2xl"
                >
                  Edit profile
                </button>

                <button
                  onClick={async () => {
                    try { await api('/api/auth/logout', {method:'POST'}); } finally { clearApiToken(); window.location.reload(); }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-2xl"
                >
                  Log out
                </button>
              </div>
            )}

            {isProfileEditorOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#4d3345]/30 backdrop-blur-sm p-4">
                <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-pink-100">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-lg font-extrabold text-[#3E2027]">Your profile</h3>
                      <p className="text-xs text-[#9E6775] mt-1">Choose the name and profile photo shown in Business Girls.</p>
                    </div>
                    <button onClick={() => setIsProfileEditorOpen(false)} className="w-8 h-8 rounded-full hover:bg-pink-50 text-[#9E6775]">×</button>
                  </div>

                  <div className="flex flex-col items-center gap-3 mb-5">
                    <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-[#FFE5EC] bg-[#FFF0F6]">
                      {profileAvatar ? <img src={profileAvatar} alt="" className="w-full h-full object-cover" /> : <MascotGirlPortrait className="w-full h-full object-cover" />}
                    </div>
                    <label className="cursor-pointer px-4 py-2 rounded-xl bg-[#FFF0F6] border border-[#F9CAD4] text-xs font-bold text-[#A7445C]">
                      Choose profile photo
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => setProfileAvatar(String(reader.result || ''));
                        reader.readAsDataURL(file);
                      }} />
                    </label>
                  </div>

                  <label className="text-xs font-bold text-[#725368]">Username</label>
                  <input value={profileName} onChange={e => setProfileName(e.target.value)} maxLength={40} className="mt-1 w-full rounded-2xl border border-[#efc9df] bg-[#fffafd] px-4 py-3 text-sm text-[#4d3345] outline-none focus:border-[#fb429c] focus:ring-4 focus:ring-pink-100" />
                  {profileError && <p className="mt-2 text-xs text-red-600">{profileError}</p>}
                  <div className="mt-5 flex gap-2 justify-end">
                    <button onClick={() => setIsProfileEditorOpen(false)} className="px-4 py-2.5 rounded-xl border border-pink-200 text-xs font-bold text-[#725368]">Cancel</button>
                    <button disabled={profileSaving} onClick={async () => {
                      if (!profileName.trim()) { setProfileError('Username is required.'); return; }
                      setProfileSaving(true); setProfileError('');
                      try {
                        await updateCurrentUserProfile(profileName, profileAvatar);
                        setIsProfileEditorOpen(false);
                      } catch (e:any) {
                        setProfileError(e?.message || 'Could not save profile.');
                      } finally { setProfileSaving(false); }
                    }} className="px-5 py-2.5 rounded-xl bg-[#fb429c] text-white text-xs font-extrabold disabled:opacity-60">
                      {profileSaving ? 'Saving…' : 'Save profile'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
