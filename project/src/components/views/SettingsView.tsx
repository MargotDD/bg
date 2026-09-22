import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Settings, Building2, Users, Shield, Save, 
  Download, RotateCcw, CheckCircle2, AlertCircle, Plus, X,
  Smartphone, Monitor, Sparkles
} from 'lucide-react';
import { UserRole, PermissionKey, UserPermission } from '../../types';
import { DownloadAppModal } from '../common/DownloadAppModal';
import { api, clearApiToken } from '../../utils/api';

const PERMISSION_LABELS: Record<PermissionKey, string> = {
  create_edit_delete_products: 'Manage products',
  make_sales: 'Make sales',
  view_customers: 'View customers',
  create_purchases: 'Create purchases',
  view_finances: 'View finances',
  edit_financial_records: 'Edit financial records',
  delete_financial_records: 'Delete financial records',
  manage_members: 'Manage members',
  manage_announcements: 'Manage announcements',
  manage_goals: 'Manage goals',
  manage_plans: 'Manage business plans',
  create_admin_spending: 'Create admin spending',
  edit_delete_admin_spending: 'Edit/delete admin spending',
  view_sensitive_finance: 'View sensitive finance',
  create_sales: 'Create sales',
  process_returns: 'Process returns',
  create_expenses: 'Create expenses',
  manage_customers: 'Manage customers',
  restrict_customers: 'Restrict customers',
  manage_team: 'Manage team & roles',
  adjust_finances: 'Adjust finances',
  view_activity_logs: 'View activity logs'
};

export const SettingsView: React.FC = () => {
  const { 
    state, currentCompany, currentUser, updateCompanySettings, 
    createUser, can, resetAllData, updateUserPermissions, updateUserRole 
  } = useApp();

  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [name, setName] = useState(currentCompany.name);
  const [description, setDescription] = useState(currentCompany.description);
  const [currency, setCurrency] = useState(currentCompany.currency);
  const [logoUrl, setLogoUrl] = useState(currentCompany.logoUrl);
  const [footerMsg, setFooterMsg] = useState(currentCompany.settings.receiptFooterMessage);
  const [allowNegativeStock, setAllowNegativeStock] = useState(currentCompany.settings.allowNegativeStockSales);
  const [lowStockDefault, setLowStockDefault] = useState(currentCompany.settings.lowStockDefault);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);

  // New User Form Modal
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Member');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<UserRole>('Member');
  const [editingPermissions, setEditingPermissions] = useState<UserPermission>({});

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings({
      name: name.trim(),
      description: description.trim(),
      currency,
      logoUrl: logoUrl.trim(),
      settings: {
        ...currentCompany.settings,
        receiptFooterMessage: footerMsg.trim(),
        allowNegativeStockSales: allowNegativeStock,
        lowStockDefault: Number(lowStockDefault)
      }
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    // Default permissions based on role
    const defaultPerms: UserPermission = {
      view_finances: newUserRole !== 'Member',
      adjust_finances: newUserRole === 'Owner' || newUserRole === 'Admin',
      create_admin_spending: newUserRole === 'Owner' || newUserRole === 'Admin',
      edit_delete_admin_spending: newUserRole === 'Owner' || newUserRole === 'Admin',
      create_sales: true,
      process_returns: newUserRole !== 'Member',
      create_edit_delete_products: newUserRole !== 'Member',
      create_purchases: newUserRole !== 'Member',
      create_expenses: true,
      manage_customers: true,
      restrict_customers: newUserRole !== 'Member',
      manage_team: newUserRole === 'Owner' || newUserRole === 'Admin',
      manage_announcements: newUserRole === 'Owner' || newUserRole === 'Admin',
      view_activity_logs: newUserRole !== 'Member'
    };

    createUser(newUserName.trim(), newUserEmail.trim(), newUserRole, defaultPerms);
    setIsAddUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
  };

  const openPermissionEditor = (u: any) => {
    setEditingUserId(u.id);
    setEditingRole(u.role === 'Owner' ? 'Admin' : u.role);
    setEditingPermissions({ ...u.permissions });
  };

  const savePermissionEditor = () => {
    if (!editingUserId) return;
    updateUserRole(editingUserId, editingRole);
    updateUserPermissions(editingUserId, editingPermissions);
    setEditingUserId(null);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `business_girls_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-rose-600" />
            <span>Workspace Settings & Permissions</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Configure boutique branding, currency conventions, and fine-grained RBAC permissions.
          </p>
        </div>

        {saveSuccess && (
          <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings Saved!</span>
          </span>
        )}
      </div>

      {/* Grid: Company Profile & System Config */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Company Profile (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-rose-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-rose-100">
            <Building2 className="w-4 h-4 text-rose-600" />
            <h3 className="font-bold text-stone-900 text-sm">Company & Branding Information</h3>
          </div>

          <form onSubmit={handleSaveCompany} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Company / Brand Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-rose-200 font-bold text-stone-900"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Business Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-rose-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Currency Code</label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white"
                >
                  <option value="MAD">MAD (Moroccan Dirham)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Default Low-Stock Alert</label>
                <input
                  type="number"
                  min="0"
                  value={lowStockDefault}
                  onChange={e => setLowStockDefault(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Logo URL</label>
              <input
                type="url"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-rose-200"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Receipt Footer Note</label>
              <input
                type="text"
                value={footerMsg}
                onChange={e => setFooterMsg(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-rose-200"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowNegativeStock}
                  onChange={e => setAllowNegativeStock(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="font-semibold text-stone-800">
                  Allow POS sales when physical inventory is zero or negative
                </span>
              </label>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Workspace Changes</span>
              </button>
            </div>
          </form>
        </div>

        {/* Data Management & Backup (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-xs space-y-4">
            <h3 className="font-bold text-stone-900 text-sm">Backup & Restore</h3>
            <p className="text-xs text-stone-500">
              Download complete isolated workspace state including transactions, inventory, customers, and receipts.
            </p>

            <button
              onClick={handleExportJSON}
              className="w-full py-2.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100/70 border border-rose-200 text-rose-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON Backup</span>
            </button>

            <div className="pt-4 border-t border-rose-100 space-y-2">
              <span className="text-xs font-bold text-stone-700 block">Reset Demonstration Data</span>
              <p className="text-[11px] text-stone-400">
                Wipe all modified records and re-seed the standard Atelier Rose & Glow baseline.
              </p>
              <button
                onClick={() => {
                  if (confirm('Reset all demo data back to clean defaults?')) {
                    resetAllData();
                  }
                }}
                className="py-2 px-4 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Clean Demo State</span>
              </button>
            </div>
          </div>

          {/* Download & Install Application Card */}
          <div className="bg-linear-to-br from-rose-500 via-pink-500 to-rose-600 p-6 rounded-3xl text-white shadow-md space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Download className="w-4 h-4 text-white" />
              <span>Install for Android & Windows</span>
            </div>
            <p className="text-xs text-rose-100 leading-relaxed">
              Install Business Girls as a standalone desktop app on Windows or a mobile app on Android. Fully offline-capable with instant home screen access.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => setIsDownloadModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white text-rose-700 hover:bg-rose-50 font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Open Download & Install Guide</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Company invitation codes are managed from Profile → Company. */}
      <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-rose-600" />
          <div>
            <h3 className="font-bold text-stone-900 text-sm">Company invitations</h3>
            <p className="text-xs text-stone-500">Invitation codes are managed in Profile → Company. Real Owner/Admin accounts can create unlimited 6-character codes.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={async () => { try { await api('/api/auth/logout', {method:'POST'}); } catch {} clearApiToken(); window.location.reload(); }} className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50">
          Log out of this account
        </button>
      </div>

      {/* Team Members & Roles */}
      <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-rose-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-rose-600" />
            <h3 className="font-bold text-stone-900 text-sm">Team Staff & Permissions Matrix</h3>
          </div>

          {can('manage_team') && (
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Staff Member</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {state.users.filter(u => u.companyIds.includes(currentCompany.id)).map(u => (
            <div key={u.id} className="p-4 rounded-2xl border border-rose-100 bg-rose-50/30 flex items-center gap-3">
              <img
                src={u.avatarUrl}
                alt=""
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-rose-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-stone-900 text-xs truncate">{u.name}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    u.role === 'Owner' ? 'bg-purple-100 text-purple-800' :
                    u.role === 'Admin' ? 'bg-rose-100 text-rose-800' :
                    u.role === 'Manager' ? 'bg-blue-100 text-blue-800' :
                    'bg-stone-100 text-stone-700'
                  }`}>
                    {u.role}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 truncate">{u.email}</p>
                <span className="text-[10px] text-stone-500 mt-1 block">
                  {u.role === 'Owner' ? 'Full access' : `${Object.values(u.permissions).filter(Boolean).length} permissions`}
                </span>
              </div>
              {can('manage_team') && u.role !== 'Owner' && (
                <button onClick={() => openPermissionEditor(u)} className="shrink-0 px-2.5 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-700 text-[10px] font-bold hover:bg-rose-50">Edit</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Admin Tools: Role & Permission Editor */}
      {editingUserId && (() => {
        const target = state.users.find(u => u.id === editingUserId);
        if (!target) return null;
        const keys = Object.keys(PERMISSION_LABELS) as PermissionKey[];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6 shadow-2xl border border-rose-100">
              <div className="flex items-center justify-between pb-4 border-b border-rose-100">
                <div><h3 className="font-bold text-stone-900">Admin Tools — {target.name}</h3><p className="text-xs text-stone-500 mt-1">Change this member's role and individual permissions.</p></div>
                <button onClick={() => setEditingUserId(null)} className="p-1 text-stone-400 hover:text-stone-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="py-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Role</label>
                  <select value={editingRole} onChange={e => setEditingRole(e.target.value as UserRole)} className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white text-sm">
                    <option value="Admin">Admin</option><option value="Manager">Manager</option><option value="Member">Member</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2"><label className="text-xs font-bold text-stone-700">Member permissions</label><button type="button" onClick={() => setEditingPermissions(Object.fromEntries(keys.map(k => [k, true])))} className="text-[10px] font-bold text-rose-600">Allow all</button></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {keys.map(key => (
                      <label key={key} className="flex items-center gap-2 p-2 rounded-xl border border-rose-100 bg-rose-50/30 text-xs cursor-pointer">
                        <input type="checkbox" checked={!!editingPermissions[key]} onChange={e => setEditingPermissions(prev => ({...prev, [key]: e.target.checked}))} className="rounded text-rose-600" />
                        <span>{PERMISSION_LABELS[key]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-rose-100 flex justify-end gap-2">
                <button onClick={() => setEditingUserId(null)} className="px-4 py-2 rounded-xl border border-rose-200 text-stone-600">Cancel</button>
                <button onClick={savePermissionEditor} className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold">Save permissions</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add Staff Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <h3 className="font-bold text-stone-900 text-sm">Add Team Member</h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="e.g. Maya Lin"
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="maya@businessgirls.app"
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Assigned Role</label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white"
                >
                  <option value="Admin">Admin (Full administrative & spending oversight)</option>
                  <option value="Manager">Manager (Operations, products & stock intake)</option>
                  <option value="Member">Member (POS, basic customer sales)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-rose-200 text-stone-600 hover:bg-rose-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
                >
                  Create Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Download & Install Modal */}
      <DownloadAppModal 
        isOpen={isDownloadModalOpen} 
        onClose={() => setIsDownloadModalOpen(false)} 
      />
    </div>
  );
};
