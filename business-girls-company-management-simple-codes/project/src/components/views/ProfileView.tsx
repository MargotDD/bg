import React, { useEffect, useMemo, useState } from 'react';
import {
  Camera, LogOut, Building2, Link2, Copy, Check, UserRound, Users, Settings2,
  Shield, Crown, BriefcaseBusiness, User, UserCog, Trash2, AlertTriangle,
  Pencil, X, CheckCircle2, Clock3, UserPlus, Save, Ban
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api, clearApiToken } from '../../utils/api';
import { CompanyMember, UserPermission, UserRole } from '../../types';

const ALL_ADMIN_PERMISSIONS: UserPermission = {
  create_edit_delete_products:true, make_sales:true, view_customers:true, create_purchases:true,
  view_finances:true, edit_financial_records:true, delete_financial_records:true,
  manage_members:true, manage_announcements:true, manage_goals:true, manage_plans:true,
  create_admin_spending:true, edit_delete_admin_spending:true, view_sensitive_finance:true,
  create_sales:true, process_returns:true, create_expenses:true, manage_customers:true,
  restrict_customers:true, manage_team:true, adjust_finances:true, view_activity_logs:true
};

const MANAGER_PERMISSIONS: UserPermission = {
  create_edit_delete_products:true, make_sales:true, view_customers:true, create_purchases:true,
  view_finances:true, create_sales:true, process_returns:true, create_expenses:true,
  manage_customers:true, manage_goals:true, manage_plans:true, view_activity_logs:true
};

function permissionsForRole(role: UserRole): UserPermission {
  if (role === 'Owner' || role === 'Admin') return {...ALL_ADMIN_PERMISSIONS};
  if (role === 'Manager') return {...MANAGER_PERMISSIONS};
  return {make_sales:true, create_sales:true, view_customers:true};
}

function displayRole(member: CompanyMember, viewer: CompanyMember | null) {
  if (member.fakeAdmin) return viewer && ['Owner','Admin','Manager'].includes(viewer.role) && !viewer.fakeAdmin ? 'Admin (fake)' : 'Admin';
  return member.customRole || member.role;
}

export const ProfileView: React.FC<{ onCreateCompany?: () => void }> = ({ onCreateCompany }) => {
  const {
    currentUser, currentCompany, updateCurrentUserProfile, createCompanyInviteCode, joinCompanyByCode, state,
    updateCompanySettings, companyAlerts
  } = useApp();
  const [name, setName] = useState(currentUser.name || '');
  const [avatar, setAvatar] = useState(currentUser.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'company'|'members'>('company');
  const [inviteCode, setInviteCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinBusy, setJoinBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [selected, setSelected] = useState<CompanyMember | null>(null);
  const [role, setRole] = useState<UserRole>('Member');
  const [customRole, setCustomRole] = useState('');
  const [rank, setRank] = useState(0);
  const [fakeAdmin, setFakeAdmin] = useState(false);
  const [memberSaving, setMemberSaving] = useState(false);
  const [warningTitle, setWarningTitle] = useState('Warning');
  const [warningText, setWarningText] = useState('');
  const [warningSaving, setWarningSaving] = useState(false);
  const [companyName, setCompanyName] = useState(currentCompany.name || '');
  const [companyDescription, setCompanyDescription] = useState(currentCompany.description || '');
  const [companyLogo, setCompanyLogo] = useState(currentCompany.logoUrl || '');
  const [companySaving, setCompanySaving] = useState(false);

  const hasCompany = !!currentCompany.id && state.companies.some(c => c.id === currentCompany.id);

  const loadMembers = async () => {
    if (!hasCompany) return;
    try {
      const data = await api(`/api/company/members?companyId=${encodeURIComponent(currentCompany.id)}`);
      setMembers(data.members || []);
      const req = await api(`/api/company/remove-requests?companyId=${encodeURIComponent(currentCompany.id)}`);
      setRequests(req.requests || []);
    } catch (e:any) {
      setError(e?.message || 'Could not load company members.');
    }
  };

  useEffect(() => { setName(currentUser.name || ''); setAvatar(currentUser.avatarUrl || ''); }, [currentUser.id, currentUser.name, currentUser.avatarUrl]);
  useEffect(() => {
    setCompanyName(currentCompany.name || '');
    setCompanyDescription(currentCompany.description || '');
    setCompanyLogo(currentCompany.logoUrl || '');
  }, [currentCompany.id, currentCompany.name, currentCompany.description, currentCompany.logoUrl]);
  useEffect(() => { if (hasCompany) loadMembers(); else { setMembers([]); setRequests([]); } }, [currentCompany.id]);

  const currentMember = useMemo(() => members.find(m => m.id === currentUser.id) || null, [members, currentUser.id]);
  const isOwner = currentMember?.role === 'Owner';
  const isRealAdmin = !!currentMember && !currentMember.fakeAdmin && (currentMember.role === 'Owner' || currentMember.role === 'Admin');
  const isRealManager = !!currentMember && !currentMember.fakeAdmin && currentMember.role === 'Manager';

  const choosePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; if(!file) return;
    if(file.size > 3*1024*1024){ setError('Photo must be smaller than 3 MB.'); return; }
    const reader=new FileReader(); reader.onload=()=>setAvatar(String(reader.result||'')); reader.readAsDataURL(file);
  };
  const chooseCompanyLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; if(!file) return;
    if(file.size > 3*1024*1024){ setError('Company photo must be smaller than 3 MB.'); return; }
    const reader=new FileReader(); reader.onload=()=>setCompanyLogo(String(reader.result||'')); reader.readAsDataURL(file);
  };
  const save = async () => {
    if(!name.trim()) { setError('Username is required.'); return; }
    setSaving(true); setError('');
    try { await updateCurrentUserProfile(name,avatar); } catch(e:any){ setError(e?.message||'Could not save profile.'); } finally { setSaving(false); }
  };
  const logout = async () => { try { await api('/api/auth/logout',{method:'POST'}); } finally { clearApiToken(); window.location.reload(); } };
  const makeInvite = async () => {
    if (!isRealAdmin) return;
    try { const code=await createCompanyInviteCode(); setInviteCode(code); await navigator.clipboard?.writeText(code); setCopied(true); setTimeout(()=>setCopied(false),1500); }
    catch(e:any){ setError(e?.message||'Could not create company code.'); }
  };

  const joinByCode = async () => {
    const code=joinCode.trim().toUpperCase();
    if (!code) { setError('Enter a company code.'); return; }
    setJoinBusy(true); setError('');
    try { await joinCompanyByCode(code); setJoinCode(''); window.location.reload(); }
    catch(e:any){ setError(e?.message||'Could not join the company.'); }
    finally { setJoinBusy(false); }
  };

  const saveCompany = async () => {
    if (!isRealAdmin) return;
    setCompanySaving(true); setError('');
    try {
      await api('/api/company/profile', {method:'PUT', body:JSON.stringify({companyId:currentCompany.id,name:companyName.trim(),description:companyDescription,logoUrl:companyLogo})});
      updateCompanySettings({name:companyName.trim(),description:companyDescription,logoUrl:companyLogo});
    } catch (e:any) { setError(e?.message || 'Could not update company.'); }
    finally { setCompanySaving(false); }
  };

  const openMember = (m: CompanyMember) => {
    setSelected(m); setRole(m.fakeAdmin ? 'Member' : m.role); setCustomRole(m.customRole || ''); setRank(m.rank || 0); setFakeAdmin(!!m.fakeAdmin); setWarningText('');
  };

  const saveMember = async () => {
    if (!selected || !isRealAdmin || selected.role === 'Owner') return;
    setMemberSaving(true); setError('');
    try {
      const nextRole: UserRole = fakeAdmin ? 'Member' : role;
      await api('/api/company/member/update', {method:'POST', body:JSON.stringify({
        companyId:currentCompany.id,userId:selected.id,role:nextRole,customRole,rank,fakeAdmin,
        permissions: permissionsForRole(nextRole)
      })});
      await loadMembers(); setSelected(null);
    } catch(e:any) { setError(e?.message || 'Could not update member.'); }
    finally { setMemberSaving(false); }
  };

  const sendWarning = async () => {
    if (!selected || !isRealAdmin || !warningText.trim()) return;
    setWarningSaving(true); setError('');
    try {
      await api('/api/company/alert',{method:'POST',body:JSON.stringify({companyId:currentCompany.id,userId:selected.id,title:warningTitle.trim() || 'Warning',message:warningText.trim()})});
      setWarningText('');
    } catch(e:any) { setError(e?.message || 'Could not send warning.'); }
    finally { setWarningSaving(false); }
  };

  const requestKick = async () => {
    if (!selected || !isRealAdmin || selected.role === 'Owner') return;
    const reason = window.prompt('Reason for removing this member:', '') ?? '';
    try {
      const result = await api('/api/company/member/remove-request',{method:'POST',body:JSON.stringify({companyId:currentCompany.id,userId:selected.id,reason})});
      if (result.removed) { await loadMembers(); setSelected(null); }
      else { await loadMembers(); alert('Removal request sent to the owner.'); }
    } catch(e:any) { setError(e?.message || 'Could not request removal.'); }
  };

  const resolveRequest = async (id:string, approve:boolean) => {
    try { await api('/api/company/remove-request/resolve',{method:'POST',body:JSON.stringify({requestId:id,approve})}); await loadMembers(); }
    catch(e:any) { setError(e?.message || 'Could not resolve request.'); }
  };

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
          {currentMember && <div className="rounded-2xl bg-[#FFF4F7] border border-[#F9CAD4] px-4 py-3"><div className="text-[11px] font-bold text-[#9E6775]">Your company status</div><div className="text-sm font-extrabold text-[#A7445C]">{displayRole(currentMember,currentMember)}{currentMember.rank ? ` · Rank ${currentMember.rank}` : ''}</div></div>}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button onClick={save} disabled={saving} className="rounded-2xl bg-[#fb429c] text-white px-5 py-3 text-sm font-extrabold disabled:opacity-60">{saving?'Saving…':'Save profile'}</button>
        </div>
      </div>
    </div>

    {!hasCompany ? <div className="rounded-3xl bg-white/90 border border-[#F9CAD4] p-6 shadow-sm"><div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl bg-[#FFE8F0] flex items-center justify-center text-[#D85D78]"><Building2 className="w-5 h-5"/></div><div className="flex-1"><h3 className="font-extrabold text-[#3E2027]">Company</h3><p className="text-xs text-[#9E6775] mt-1">Create your own company or join an existing one with a simple code.</p></div><button onClick={onCreateCompany} className="rounded-2xl bg-[#fb429c] text-white px-4 py-2.5 text-xs font-extrabold">Create company</button></div><div className="mt-5 pt-5 border-t border-[#F9CAD4]"><div className="font-extrabold text-sm text-[#3E2027]">Join a company</div><p className="text-xs text-[#9E6775] mt-1">Enter the 6-character code your admin sent you.</p><div className="mt-3 flex gap-2"><input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6))} maxLength={6} placeholder="ABC123" className="flex-1 rounded-2xl border border-[#efc9df] px-4 py-3 text-center text-lg font-black tracking-[0.25em] uppercase outline-none focus:border-[#fb429c]"/><button disabled={joinBusy||joinCode.length<6} onClick={joinByCode} className="rounded-2xl bg-[#fb429c] text-white px-5 text-xs font-extrabold disabled:opacity-50">{joinBusy?'Joining…':'Join'}</button></div></div></div> :
    <div className="rounded-3xl bg-white/90 border border-[#F9CAD4] shadow-sm overflow-hidden">
      <div className="p-5 border-b border-[#F9CAD4] flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl overflow-hidden bg-[#FFE8F0] flex items-center justify-center text-[#D85D78]">{currentCompany.logoUrl?<img src={currentCompany.logoUrl} className="w-full h-full object-cover"/>:<Building2 className="w-5 h-5"/>}</div><div><h3 className="font-extrabold text-[#3E2027]">Company</h3><p className="text-xs text-[#9E6775]">{currentCompany.name}</p></div></div>
        <div className="flex rounded-2xl bg-[#FFF4F7] p-1"><button onClick={()=>setTab('company')} className={`px-4 py-2 rounded-xl text-xs font-extrabold ${tab==='company'?'bg-white text-[#A7445C] shadow-sm':'text-[#9E6775]'}`}><Building2 className="inline w-3.5 h-3.5 mr-1"/> Company</button><button onClick={()=>setTab('members')} className={`px-4 py-2 rounded-xl text-xs font-extrabold ${tab==='members'?'bg-white text-[#A7445C] shadow-sm':'text-[#9E6775]'}`}><Users className="inline w-3.5 h-3.5 mr-1"/> Members ({members.length})</button></div>
      </div>

      {tab==='company' ? <div className="p-5 space-y-4">
        <div className="grid sm:grid-cols-[120px_1fr] gap-5 items-start">
          <div className="text-center"><div className="w-24 h-24 mx-auto rounded-3xl overflow-hidden bg-[#FFF0F6] border border-[#F9CAD4] flex items-center justify-center">{companyLogo?<img src={companyLogo} className="w-full h-full object-cover"/>:<Building2 className="w-8 h-8 text-[#D47C90]"/>}</div>{isRealAdmin&&<label className="inline-flex mt-2 items-center gap-1 text-[11px] font-bold text-[#A7445C] cursor-pointer"><Camera className="w-3.5 h-3.5"/> Change<input type="file" accept="image/*" className="hidden" onChange={chooseCompanyLogo}/></label>}</div>
          <div className="space-y-3"><div><label className="text-xs font-bold text-[#725368]">Company name</label><input disabled={!isRealAdmin} value={companyName} onChange={e=>setCompanyName(e.target.value)} className="mt-1 w-full rounded-2xl border border-[#efc9df] px-4 py-3 text-sm disabled:bg-[#fffafd]"/></div><div><label className="text-xs font-bold text-[#725368]">Description</label><textarea disabled={!isRealAdmin} value={companyDescription} onChange={e=>setCompanyDescription(e.target.value)} rows={3} className="mt-1 w-full rounded-2xl border border-[#efc9df] px-4 py-3 text-sm resize-none disabled:bg-[#fffafd]"/></div>{isRealAdmin&&<button onClick={saveCompany} disabled={companySaving} className="rounded-2xl bg-[#fb429c] text-white px-4 py-2.5 text-xs font-extrabold"><Save className="inline w-3.5 h-3.5 mr-1"/>{companySaving?'Saving…':'Save company'}</button>}</div>
        </div>
        <div className="rounded-2xl border border-[#F9CAD4] bg-[#FFF9FC] p-4"><div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between"><div><div className="font-extrabold text-sm text-[#3E2027]">Invitation codes</div><div className="text-xs text-[#9E6775]">Create as many 6-character codes as you need. They do not expire.</div></div>{isRealAdmin&&<button onClick={makeInvite} className="rounded-2xl bg-[#fb429c] text-white px-4 py-2.5 text-xs font-extrabold"><Link2 className="inline w-3.5 h-3.5 mr-1"/> New code</button>}</div>{inviteCode&&<div className="mt-3 flex gap-2"><input readOnly value={inviteCode} className="flex-1 rounded-xl border border-[#F9CAD4] bg-white px-3 py-2.5 text-center text-xl font-black tracking-[0.3em]"/><button onClick={async()=>{await navigator.clipboard?.writeText(inviteCode);setCopied(true);setTimeout(()=>setCopied(false),1500)}} className="rounded-xl bg-[#fb429c] text-white px-4">{copied?<Check className="w-4 h-4"/>:<Copy className="w-4 h-4"/>}</button></div>}</div>
        {companyAlerts.length>0&&<div className="rounded-2xl border border-red-200 bg-red-50 p-4"><div className="font-extrabold text-red-700 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Your warnings</div><div className="mt-2 space-y-2">{companyAlerts.map(a=><div key={a.id} className="text-xs text-red-700">{a.title}: {a.message}</div>)}</div></div>}
      </div> : <div className="p-5 space-y-4">
        <div className="flex items-center justify-between"><div><h4 className="font-extrabold text-[#3E2027]">Company members</h4><p className="text-xs text-[#9E6775]">Click a member to view or manage them.</p></div>{isRealAdmin&&<div className="text-[11px] font-bold text-[#A7445C] flex items-center gap-1"><Shield className="w-3.5 h-3.5"/> Real admin controls</div>}</div>
        <div className="grid gap-2">{members.map(m=><button key={m.id} onClick={()=>openMember(m)} className="w-full text-left rounded-2xl border border-[#F9CAD4] bg-white p-3 hover:bg-[#FFF8FB] flex items-center gap-3"><div className="w-11 h-11 rounded-2xl overflow-hidden bg-[#FFF0F6] flex items-center justify-center shrink-0">{m.avatarUrl?<img src={m.avatarUrl} className="w-full h-full object-cover"/>:<UserRound className="w-5 h-5 text-[#D47C90]"/>}</div><div className="min-w-0 flex-1"><div className="font-extrabold text-sm text-[#3E2027] truncate">{m.name}</div><div className="text-[11px] text-[#9E6775] truncate">{displayRole(m,currentMember)}{m.customRole&&m.customRole!==displayRole(m,currentMember)?` · ${m.customRole}`:''}{m.rank ? ` · Rank ${m.rank}` : ''}</div></div>{m.role==='Owner'?<Crown className="w-4 h-4 text-amber-500"/>:m.fakeAdmin?<Shield className="w-4 h-4 text-red-400"/>:<UserCog className="w-4 h-4 text-[#D47C90]"/>}</button>)}</div>
        {isOwner && requests.filter(r=>r.status==='pending').length>0&&<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="font-extrabold text-amber-800 text-sm flex items-center gap-2"><Clock3 className="w-4 h-4"/> Removal requests</div>{requests.filter(r=>r.status==='pending').map(r=><div key={r.id} className="mt-3 rounded-xl bg-white p-3 border border-amber-100"><div className="text-xs font-bold text-stone-800">{r.requestedByName} wants to remove {r.targetName}</div>{r.reason&&<div className="text-[11px] text-stone-500 mt-1">{r.reason}</div>}<div className="flex gap-2 mt-2"><button onClick={()=>resolveRequest(r.id,true)} className="rounded-xl bg-red-500 text-white px-3 py-2 text-[11px] font-bold">Approve removal</button><button onClick={()=>resolveRequest(r.id,false)} className="rounded-xl border border-stone-200 px-3 py-2 text-[11px] font-bold">Reject</button></div></div>)}</div>}
      </div>}
    </div>}

    {selected && <div className="fixed inset-0 z-[100] bg-black/25 backdrop-blur-sm flex items-end sm:items-center justify-center p-3" onClick={()=>setSelected(null)}><div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-[30px] bg-white shadow-2xl border border-pink-100 p-5" onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl overflow-hidden bg-[#FFF0F6] flex items-center justify-center">{selected.avatarUrl?<img src={selected.avatarUrl} className="w-full h-full object-cover"/>:<UserRound className="w-5 h-5 text-[#D47C90]"/>}</div><div><div className="font-extrabold text-[#3E2027]">{selected.name}</div><div className="text-xs text-[#9E6775]">{displayRole(selected,currentMember)}</div></div></div><button onClick={()=>setSelected(null)} className="p-2 rounded-xl hover:bg-stone-50"><X className="w-4 h-4"/></button></div>
      <div className="mt-5 grid sm:grid-cols-2 gap-3"><div><label className="text-xs font-bold text-[#725368]">Custom role</label><input disabled={!isRealAdmin||selected.role==='Owner'} value={customRole} onChange={e=>setCustomRole(e.target.value)} placeholder="Designer, Accountant…" className="mt-1 w-full rounded-xl border border-[#efc9df] px-3 py-2.5 text-sm disabled:bg-stone-50"/></div><div><label className="text-xs font-bold text-[#725368]">Rank</label><input disabled={!isRealAdmin||selected.role==='Owner'} type="number" value={rank} onChange={e=>setRank(Math.max(0,Number(e.target.value)||0))} className="mt-1 w-full rounded-xl border border-[#efc9df] px-3 py-2.5 text-sm disabled:bg-stone-50"/></div></div>
      <div className="mt-3"><label className="text-xs font-bold text-[#725368]">Base rank</label><select disabled={!isRealAdmin||selected.role==='Owner'} value={role} onChange={e=>setRole(e.target.value as UserRole)} className="mt-1 w-full rounded-xl border border-[#efc9df] px-3 py-2.5 text-sm"><option value="Admin">Admin</option><option value="Manager">Manager</option><option value="Member">Member</option></select></div>
      {isRealAdmin && selected.role!=='Owner' && <label className="mt-3 flex items-center gap-3 rounded-2xl bg-[#FFF7FA] border border-[#F9CAD4] p-3 cursor-pointer"><input type="checkbox" checked={fakeAdmin} onChange={e=>setFakeAdmin(e.target.checked)}/><div><div className="text-sm font-extrabold text-[#3E2027]">Fake Admin</div><div className="text-[11px] text-[#9E6775]">The member is displayed as Admin, but keeps normal Member permissions. Real admins/managers see “Admin (fake)”.</div></div></label>}
      {isRealAdmin && selected.role!=='Owner' && <div className="mt-4 flex gap-2"><button disabled={memberSaving} onClick={saveMember} className="rounded-2xl bg-[#fb429c] text-white px-4 py-2.5 text-xs font-extrabold"><Save className="inline w-3.5 h-3.5 mr-1"/>{memberSaving?'Saving…':'Save member'}</button><button onClick={requestKick} className="rounded-2xl bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 text-xs font-extrabold"><Trash2 className="inline w-3.5 h-3.5 mr-1"/>{isOwner?'Remove member':'Request removal'}</button></div>}
      {isRealAdmin && selected.role!=='Owner' && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50/70 p-4"><div className="font-extrabold text-red-700 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Give warning / advertisement</div><div className="grid sm:grid-cols-[150px_1fr] gap-2 mt-2"><input value={warningTitle} onChange={e=>setWarningTitle(e.target.value)} placeholder="Warning title" className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs"/><textarea value={warningText} onChange={e=>setWarningText(e.target.value)} placeholder="Write the warning shown only to this user…" rows={3} className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs resize-none"/></div><button disabled={warningSaving||!warningText.trim()} onClick={sendWarning} className="mt-2 rounded-xl bg-red-500 text-white px-3 py-2 text-xs font-extrabold disabled:opacity-50">{warningSaving?'Sending…':'Send warning'}</button></div>}
      {!isRealAdmin && <div className="mt-5 rounded-2xl bg-[#FFF8FB] border border-[#F9CAD4] p-4 text-xs text-[#9E6775]">Only a real Owner/Admin can change this member. Managers and fake admins do not get company-management controls.</div>}
    </div></div>}

    <button onClick={logout} className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-xs font-extrabold text-red-600 flex items-center gap-2"><LogOut className="w-4 h-4"/> Log out of account</button>
  </div>;
};
