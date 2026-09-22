import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, X, Sparkles, Copy, Check } from 'lucide-react';

interface NewCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewCompanyModal: React.FC<NewCompanyModalProps> = ({ isOpen, onClose }) => {
  const { createCompany } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('MAD');
  const [logoUrl, setLogoUrl] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!name.trim()) return; setBusy(true);
    try {
      const result = await createCompany(name.trim(), description.trim() || 'Feminine boutique business & cosmetics workspace.', currency, logoUrl.trim() || undefined);
      setInviteCode(result.inviteCode || '');
      setName(''); setDescription('');
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-rose-100 p-6 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-rose-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Create New Company / Workspace</h3>
              <p className="text-[11px] text-stone-400">Independent company data & isolated accounts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-rose-50">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          <div>
            <label className="block text-stone-700 font-semibold mb-1">Company / Brand Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Blossom Cosmetics & Spa"
              className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-stone-800"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">Description / Specialty</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief summary of the business..."
              className="w-full px-3.5 py-2 rounded-xl border border-rose-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-stone-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Currency *</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-stone-800 bg-white"
              >
                <option value="MAD">MAD (Moroccan Dirham)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Logo Image URL</label>
              <input
                type="url"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-stone-800"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-rose-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-rose-200 text-stone-600 hover:bg-rose-50 transition-colors"
            >
              Cancel
            </button>
            <button disabled={busy} type="submit" className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors shadow-sm shadow-rose-200 disabled:opacity-60">{busy ? 'Creating…' : 'Create Company'}</button>
          </div>
        {inviteCode && <div className="mt-4 rounded-2xl bg-[#FFF0F6] border border-rose-100 p-3"><p className="text-xs font-bold text-stone-700 mb-2">Company created! Send this code to your team:</p><div className="flex gap-2"><input readOnly value={inviteCode} className="flex-1 min-w-0 rounded-xl border border-rose-200 bg-white px-3 py-2 text-lg font-black tracking-[0.25em] text-center"/><button type="button" onClick={async()=>{await navigator.clipboard?.writeText(inviteCode);setCopied(true);setTimeout(()=>setCopied(false),1500)}} className="rounded-xl bg-rose-600 text-white px-3">{copied?<Check className="w-4 h-4"/>:<Copy className="w-4 h-4"/>}</button></div><p className="mt-2 text-[11px] text-stone-500">You can create unlimited new codes later from the Company section.</p></div>}

        </form>
      </div>
    </div>
  );
};
