import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, Plus, Search, Star, Phone, Mail, ShieldAlert, 
  ShieldCheck, AlertCircle, History, Receipt, X, CheckCircle2 
} from 'lucide-react';
import { Customer, Sale } from '../../types';

export const CustomersView: React.FC = () => {
  const { 
    state, currentCompany, can, createCustomer, restrictCustomer, 
    setSelectedReceipt, formatMoney 
  } = useApp();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'vip' | 'restricted'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState<Customer | null>(null);
  
  // Restriction Modal State
  const [restrictingCustomer, setRestrictingCustomer] = useState<Customer | null>(null);
  const [restrictReason, setRestrictReason] = useState('');
  const [restrictDurationDays, setRestrictDurationDays] = useState<number | ''>('');
  const [restrictNotes, setRestrictNotes] = useState('');

  // Unrestriction Modal State
  const [unrestrictingCustomer, setUnrestrictingCustomer] = useState<Customer | null>(null);
  const [unrestrictReason, setUnrestrictReason] = useState('');

  // Add Customer Form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isVip, setIsVip] = useState(false);

  const customers = useMemo(() => {
    return state.customers.filter(c => c.companyId === currentCompany.id);
  }, [state.customers, currentCompany.id]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          (c.phone || '').toLowerCase().includes(search.toLowerCase());
      if (filter === 'vip') return matchSearch && c.isVip;
      if (filter === 'restricted') return matchSearch && c.status === 'Blocked';
      return matchSearch;
    });
  }, [customers, search, filter]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createCustomer({
      name: newName.trim(),
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
      phone: newPhone.trim(),
      email: newEmail.trim() || undefined,
      address: newAddress.trim() || undefined,
      notes: newNotes.trim() || undefined,
      status: 'Active',
      tags: isVip ? ['VIP'] : ['Regular'],
      isVip
    });
    setIsAddModalOpen(false);
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewAddress('');
    setNewNotes('');
    setIsVip(false);
  };

  const handleRestrictSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restrictingCustomer || !restrictReason.trim()) return;

    restrictCustomer(
      restrictingCustomer.id,
      'Blocked',
      restrictReason.trim(),
      restrictNotes.trim() || undefined
    );

    setRestrictingCustomer(null);
    setRestrictReason('');
    setRestrictDurationDays('');
    setRestrictNotes('');
  };

  const handleUnrestrictSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unrestrictingCustomer || !unrestrictReason.trim()) return;

    restrictCustomer(unrestrictingCustomer.id, 'Active', unrestrictReason.trim());
    setUnrestrictingCustomer(null);
    setUnrestrictReason('');
  };

  // Get sales for customer history modal
  const customerSales = useMemo(() => {
    if (!selectedCustomerHistory) return [];
    return state.sales.filter(s => s.customerId === selectedCustomerHistory.id || s.customerName.toLowerCase() === selectedCustomerHistory.name.toLowerCase());
  }, [state.sales, selectedCustomerHistory]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-rose-600" />
            <span>Customer Directory & Relationship Management</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Client profiles, purchase histories, VIP tiers, and formal account restriction protocols.
          </p>
        </div>

        {can('view_customers') && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Customer</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by client name or phone..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-rose-100 bg-rose-50/40 text-xs text-stone-800"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all ${filter === 'all' ? 'bg-rose-500 text-white shadow-xs' : 'bg-rose-50 text-stone-600'}`}
          >
            All Clients ({customers.length})
          </button>
          <button
            onClick={() => setFilter('vip')}
            className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all ${filter === 'vip' ? 'bg-rose-500 text-white shadow-xs' : 'bg-rose-50 text-stone-600'}`}
          >
            VIP Members ({customers.filter(c => c.isVip).length})
          </button>
          <button
            onClick={() => setFilter('restricted')}
            className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all ${filter === 'restricted' ? 'bg-rose-500 text-white shadow-xs' : 'bg-rose-50 text-stone-600'}`}
          >
            Restricted / Blocked ({customers.filter(c => c.status === 'Blocked').length})
          </button>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map(cust => {
          const isBlocked = cust.status === 'Blocked';

          return (
            <div
              key={cust.id}
              className={`bg-white p-5 rounded-3xl border shadow-xs flex flex-col justify-between space-y-4 ${
                isBlocked ? 'border-red-200 bg-red-50/20' : 'border-rose-100'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-stone-900 text-sm">{cust.name}</h3>
                    {cust.isVip && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" /> VIP
                      </span>
                    )}
                  </div>

                  {isBlocked ? (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Blocked
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                      Active
                    </span>
                  )}
                </div>

                <div className="mt-2.5 space-y-1 text-xs text-stone-600">
                  {cust.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      <span>{cust.phone}</span>
                    </p>
                  )}
                  {cust.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-stone-400" />
                      <span>{cust.email}</span>
                    </p>
                  )}
                </div>

                {isBlocked && cust.currentRestrictionReason && (
                  <div className="mt-3 p-2.5 rounded-xl bg-red-50 border border-red-100 text-[11px] text-red-800 space-y-0.5">
                    <span className="font-bold block">Restriction Reason:</span>
                    <p>{cust.currentRestrictionReason}</p>
                  </div>
                )}
              </div>

              {/* Stats & Actions */}
              <div className="pt-3 border-t border-rose-50 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400">Total Spent:</span>
                  <span className="font-extrabold text-rose-700">{formatMoney(cust.totalSpent)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCustomerHistory(cust)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100/70 text-rose-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Purchase History</span>
                  </button>

                  {can('manage_members') && (
                    isBlocked ? (
                      <button
                        onClick={() => setUnrestrictingCustomer(cust)}
                        className="py-1.5 px-3 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold transition-colors"
                        title="Lift restriction"
                      >
                        Unblock
                      </button>
                    ) : (
                      <button
                        onClick={() => setRestrictingCustomer(cust)}
                        className="py-1.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors"
                        title="Block customer"
                      >
                        Block
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Purchase History Modal */}
      {selectedCustomerHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-100 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">{selectedCustomerHistory.name} — Order History</h3>
                <p className="text-xs text-stone-400">{customerSales.length} total completed orders on file</p>
              </div>
              <button onClick={() => setSelectedCustomerHistory(null)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {customerSales.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-8">No recorded purchases for this customer yet.</p>
              ) : (
                customerSales.map(sale => (
                  <div
                    key={sale.id}
                    onClick={() => setSelectedReceipt(sale)}
                    className="p-3 rounded-2xl border border-rose-100 hover:bg-rose-50/50 cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-stone-900 block">{sale.receiptId}</span>
                      <span className="text-[10px] text-stone-400">{sale.date} at {sale.time}</span>
                      <p className="text-[11px] text-stone-600 mt-0.5">{sale.items.length} items purchased</p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-rose-700 block">{formatMoney(sale.finalTotal)}</span>
                      <span className="text-[10px] text-rose-600 font-semibold underline">View Receipt</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Block / Restrict Customer Modal */}
      {restrictingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2 text-red-600">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-bold text-stone-900 text-sm">Restrict / Block Customer</h3>
              </div>
              <button onClick={() => setRestrictingCustomer(null)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Blocking <span className="font-bold text-stone-900">{restrictingCustomer.name}</span> will flag their profile and trigger an explicit warning on the POS terminal during checkout.
            </p>

            <form onSubmit={handleRestrictSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Mandatory Reason for Block *</label>
                <input
                  type="text"
                  required
                  value={restrictReason}
                  onChange={e => setRestrictReason(e.target.value)}
                  placeholder="e.g. Unpaid balance, dispute, aggressive behavior..."
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Duration (in Days, leave blank for permanent)</label>
                <input
                  type="number"
                  min="1"
                  value={restrictDurationDays}
                  onChange={e => setRestrictDurationDays(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="e.g. 30"
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Internal Reference Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={restrictNotes}
                  onChange={e => setRestrictNotes(e.target.value)}
                  placeholder="Details for internal team review..."
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setRestrictingCustomer(null)}
                  className="px-4 py-2 rounded-xl border border-rose-200 text-stone-600 hover:bg-rose-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-xs"
                >
                  Confirm Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unrestrict Modal */}
      {unrestrictingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2 text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-bold text-stone-900 text-sm">Lift Customer Restriction</h3>
              </div>
              <button onClick={() => setUnrestrictingCustomer(null)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUnrestrictSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Mandatory Reason for Unblocking *</label>
                <input
                  type="text"
                  required
                  value={unrestrictReason}
                  onChange={e => setUnrestrictReason(e.target.value)}
                  placeholder="e.g. Account settled in full, issue resolved..."
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setUnrestrictingCustomer(null)}
                  className="px-4 py-2 rounded-xl border border-rose-200 text-stone-600 hover:bg-rose-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Restore Good Standing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <h3 className="font-bold text-stone-900 text-sm">Add New Customer Profile</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Client full name"
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="+212 6..."
                    className="w-full px-3 py-2 rounded-xl border border-rose-200"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="client@gmail.com"
                    className="w-full px-3 py-2 rounded-xl border border-rose-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Delivery Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={e => setNewAddress(e.target.value)}
                  placeholder="City, street address..."
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Client Notes</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Preferences, allergy notes, fragrance likes..."
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isVip}
                  onChange={e => setIsVip(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="font-semibold text-stone-800">Assign as VIP Client</span>
              </label>

              <div className="pt-3 flex justify-end gap-2 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-rose-200 text-stone-600 hover:bg-rose-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
