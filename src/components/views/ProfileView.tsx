import React, { useState } from 'react';
import { Camera, LogOut, Building2, Link2, Copy, Check, UserRound } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api, clearApiToken } from '../../utils/api';

export const ProfileView: React.FC<{ onCreateCompany?: () => void }> = ({ onCreateCompany }) => {
  const { currentUser, currentCompany, updateCurrentUserProfile, createInviteLink, state } = useApp();
  const [name, setName] = useState(currentUser.name || '');
  const [avatar, setAvatar] = useState(currentUser.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [invite, setInvite] = useState('');
  const [copied, setCopied] = useState(false);

  const choosePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; if(!file) return;
    if(file.size > 3*1024*1024){ setError('Photo must be smaller than 3 MB.'); return; }
    const reader=new FileReader(); reader.onload=()=>setAvatar(String(reader.result||'')); reader.readAsDataURL(file);
  };
  const save = async () => {
    if(!name.trim()) { setError('Username is required.'); return; }
    setSaving(true); setError('');
    try { await updateCurrentUserProfile(name,avatar); } catch(e:any){ setError(e?.message||'Could not save profile.'); } finally { setSaving(false); }
  };
  const logout = async () => { try { await api('/api/auth/logout',{method:'POST'}); } finally { clearApiToken(); window.location.reload(); } };
  const makeInvite = async () => {
    try { const link=await createInviteLink(); setInvite(link); await navigator.clipboard?.writeText(link); setCopied(true); setTimeout(()=>setCopied(false),1500); }
    catch(e:any){ setError(e?.message||'Could not create invite link.'); }
  };

  const hasCompany=!!currentCompany.id && state.companies.some(c=>c.id===currentCompany.id);
  return <div className="space-y-5">
    <div className="rounded-3xl bg-white/90 border border-[#F9CAD4] p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6"><div className="w-11 h-11 rounded-2xl bg-[#FFE8F0] flex items-center justify-center text-[#D85D78]"><UserRound className="w-5 h-5"/></div><div><h2 className="text-xl font-extrabold text-[#3E2027]">Profile</h2><p className="text-xs text-[#9E6775]">Your personal Business Girls account</p></div></div>
      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <div className="shrink-0 text-center">
          <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-[#FFE5EC] bg-[#FFF0F6] flex items-center justify-center">{avatar?<img src={avatar} className="w-full h-full object-cover"/>:<UserRound className="w-10 h-10 text-[#D47C90]"/>}</div>
          <label className="inline-flex items-center gap-2 mt-3 px-3 py-2 rounded-xl bg-[#FFF0F6] border border-[#F9CAD4] text-xs font-bold text-[#A7445C] cursor-pointer"><Camera className="w-3.5 h-3.5"/> Change photo<input type="file" accept="image/*" className="hidden" onChange={choosePhoto}/></label>
        </div>
        <div className="flex-1 w-full space-y-4">
          <div><label className="text-xs font-bold text-[#725368]">Username</label><input value={name} onChange={e=>setName(e.target.value)} maxLength={40} className="mt-1 w-full rounded-2xl border border-[#efc9df] px-4 py-3 text-sm outline-none focus:border-[#fb429c]"/></div>
          <div><label className="text-xs font-bold text-[#725368]">Email</label><input value={currentUser.email} disabled className="mt-1 w-full rounded-2xl border border-[#f2dce7] bg-[#fffafd] px-4 py-3 text-sm text-[#9E6775]"/></div>
          {hasCompany && <div><label className="text-xs font-bold text-[#725368]">Company status</label><div className="mt-1 rounded-2xl bg-[#FFF4F7] border border-[#F9CAD4] px-4 py-3 text-sm font-bold text-[#A7445C]">{currentUser.role} · {currentCompany.name}</div></div>}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button onClick={save} disabled={saving} className="rounded-2xl bg-[#fb429c] text-white px-5 py-3 text-sm font-extrabold disabled:opacity-60">{saving?'Saving…':'Save profile'}</button>
        </div>
      </div>
    </div>

    {!hasCompany ? <div className="rounded-3xl bg-white/90 border border-[#F9CAD4] p-6 shadow-sm"><div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl bg-[#FFE8F0] flex items-center justify-center text-[#D85D78]"><Building2 className="w-5 h-5"/></div><div className="flex-1"><h3 className="font-extrabold text-[#3E2027]">No company yet</h3><p className="text-xs text-[#9E6775] mt-1">Your account starts without a company or company status.</p></div><button onClick={onCreateCompany} className="rounded-2xl bg-[#fb429c] text-white px-4 py-2.5 text-xs font-extrabold">Create company</button></div></div> :
    <div className="rounded-3xl bg-white/90 border border-[#F9CAD4] p-6 shadow-sm"><div className="flex items-center gap-3 mb-4"><Link2 className="w-5 h-5 text-[#D85D78]"/><div><h3 className="font-extrabold text-[#3E2027]">Invite people to {currentCompany.name}</h3><p className="text-xs text-[#9E6775]">Create a shareable invitation link.</p></div></div><button onClick={makeInvite} className="rounded-2xl bg-[#FFF0F6] border border-[#F9CAD4] text-[#A7445C] px-4 py-2.5 text-xs font-extrabold">Create invitation link</button>{invite&&<div className="mt-3 flex gap-2"><input readOnly value={invite} className="flex-1 rounded-xl border border-[#F9CAD4] px-3 py-2 text-xs"/><button onClick={async()=>{await navigator.clipboard?.writeText(invite);setCopied(true);setTimeout(()=>setCopied(false),1500)}} className="rounded-xl bg-[#fb429c] text-white px-3">{copied?<Check className="w-4 h-4"/>:<Copy className="w-4 h-4"/>}</button></div>}</div>}

    <button onClick={logout} className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-xs font-extrabold text-red-600 flex items-center gap-2"><LogOut className="w-4 h-4"/> Log out of account</button>
  </div>;
};
