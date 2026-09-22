import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CreditCard, Plus, Calendar, Clock, User, AlertCircle, 
  Trash2, Edit3, ShieldAlert, Check, X, FileText, ArrowUpDown
} from 'lucide-react';
import { AdminSpending } from '../../types';

export const AdminSpendingView: React.FC = () => {
  const { 
    state, currentCompany, currentUser, can, createAdminSpending, 
    updateAdminSpending, deleteAdminSpending, formatMoney, finances 
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AdminSpending | null>(null);
  const [viewDetailsRecord, setViewDetailsRecord] = useState<AdminSpending | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [personId, setPersonId] = useState<string>(currentUser.id);
  const [why, setWhy] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [category, setCategory] = useState<string>('Supplies');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');

  const spendingRecords = useMemo(() => {
    return state.adminSpending.filter(s => s.companyId === currentCompany.id && !s.isDeleted);
  }, [state.adminSpending, currentCompany.id]);

  const openNewModal = () => {
    setErrorMsg('');
    setEditingRecord(null);
    setAmount(0);
    setDate(new Date().toISOString().split('T')[0]);
    setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setPersonId(currentUser.id);
    setWhy('');
    setNotes('');
    setCategory('Supplies');
    setAttachmentUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (rec: AdminSpending) => {
    setErrorMsg('');
    setEditingRecord(rec);
    setAmount(rec.amount);
    setDate(rec.date);
    setTime(rec.time || '');
    setPersonId(rec.personId);
    setWhy(rec.why);
    setNotes(rec.notes || '');
    setCategory(rec.category);
    setAttachmentUrl(rec.attachmentUrl || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (amount <= 0) {
      setErrorMsg('Amount must be greater than zero.');
      return;
    }
    if (!why.trim()) {
      setErrorMsg('Please specify why the money was taken/spent.');
      return;
    }

    if (editingRecord) {
      const res = updateAdminSpending(editingRecord.id, {
        amount,
        date,
        time,
        personId,
        personName: state.users.find(u => u.id === personId)?.name || currentUser.name,
        why: why.trim(),
        notes: notes.trim() || undefined,
        category,
        attachmentUrl: attachmentUrl.trim() || undefined
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to update record.');
        return;
      }
    } else {
      const res = createAdminSpending({
        amount,
        date,
        time,
        personId,
        why: why.trim(),
        notes: notes.trim() || undefined,
        category,
        attachmentUrl: attachmentUrl.trim() || undefined
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to record spending.');
        return;
      }
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, whyText: string) => {
    if (confirm(`Reverse and delete admin spending record "${whyText}"? The financial deduction will be reversed in the company ledger.`)) {
      const res = deleteAdminSpending(id);
      if (!res.success) alert(res.error);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Prominent + New Spending Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-rose-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-pink-500 text-white flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">Admin Spending (Money Taken)</h2>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            Dedicated financial registry for company money taken or spent directly by authorized administrators. Kept strictly distinct from product purchases and normal business expenses.
          </p>
        </div>

        {can('create_admin_spending') ? (
          <button
            id="new-admin-spending-btn"
            onClick={openNewModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs font-bold shadow-md shadow-rose-200 transition-all active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Spending</span>
          </button>
        ) : (
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-stone-100 text-stone-500 border border-stone-200">
            View-Only Access
          </span>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Total Admin Spending</span>
          <p className="text-2xl font-extrabold text-stone-900 mt-1">{formatMoney(finances.adminSpendingTotal)}</p>
          <span className="text-[10px] text-stone-400">{spendingRecords.length} entries on record</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Available Company Money</span>
          <p className="text-2xl font-extrabold text-rose-700 mt-1">{formatMoney(finances.availableMoney)}</p>
          <span className="text-[10px] text-stone-400">Decreases dynamically when spending is logged</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Authorization</span>
          <p className="text-xs font-bold text-stone-800 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Strict Audit & Ledger Recalculation
          </p>
          <span className="text-[10px] text-stone-400">All edits and removals trigger financial rollback</span>
        </div>
      </div>

      {/* Table of Spending Records */}
      <div className="bg-white rounded-3xl border border-rose-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-rose-100 flex items-center justify-between">
          <h3 className="font-bold text-stone-900 text-sm">Spending Audit Ledger</h3>
          <span className="text-xs text-stone-400 font-mono">{spendingRecords.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-rose-100 bg-rose-50/40 text-stone-400 uppercase text-[10px] font-bold">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-3">Who (Authorized)</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Reason / Why</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3">Created By</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {spendingRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-rose-200" />
                    <p>No Admin Spending entries registered yet.</p>
                  </td>
                </tr>
              ) : (
                spendingRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3 px-4 text-stone-700 whitespace-nowrap">
                      <span className="font-bold block">{rec.date}</span>
                      <span className="text-[10px] text-stone-400">{rec.time || '—'}</span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-stone-900 whitespace-nowrap">
                      {rec.personName}
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 font-bold text-[10px]">
                        {rec.category}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-stone-800 max-w-xs truncate">
                      <span className="font-medium">{rec.why}</span>
                      {rec.notes && <span className="block text-[10px] text-stone-400 truncate">{rec.notes}</span>}
                    </td>

                    <td className="py-3 px-3 text-right font-extrabold text-rose-700 whitespace-nowrap">
                      {formatMoney(rec.amount)}
                    </td>

                    <td className="py-3 px-3 text-stone-500 text-[11px] whitespace-nowrap">
                      {rec.createdByName}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewDetailsRecord(rec)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="View Details"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        {can('edit_delete_admin_spending') && (
                          <>
                            <button
                              onClick={() => openEditModal(rec)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="Edit Spending"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(rec.id, rec.why)}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete Record & Reverse Funds"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details View Modal */}
      {viewDetailsRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <h3 className="font-bold text-stone-900 text-sm">Admin Spending Record Details</h3>
              <button onClick={() => setViewDetailsRecord(null)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 text-center">
              <span className="text-[11px] font-bold text-stone-400 uppercase">Amount Taken</span>
              <p className="text-2xl font-extrabold text-rose-700 mt-1">{formatMoney(viewDetailsRecord.amount)}</p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 text-[10px] font-bold">
                {viewDetailsRecord.category}
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-stone-700">
              <div>
                <span className="font-bold text-stone-900 block">Who (Recipient):</span>
                <span>{viewDetailsRecord.personName}</span>
              </div>
              <div>
                <span className="font-bold text-stone-900 block">Why (Reason):</span>
                <span>{viewDetailsRecord.why}</span>
              </div>
              {viewDetailsRecord.notes && (
                <div>
                  <span className="font-bold text-stone-900 block">Additional Notes:</span>
                  <span className="text-stone-600 italic">{viewDetailsRecord.notes}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-rose-100 text-[11px] text-stone-500">
                <div>Date: <span className="font-semibold text-stone-800">{viewDetailsRecord.date} {viewDetailsRecord.time}</span></div>
                <div>Logged by: <span className="font-semibold text-stone-800">{viewDetailsRecord.createdByName}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New / Edit Spending Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-100 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <h3 className="font-bold text-stone-900 text-sm">
                {editingRecord ? 'Edit Admin Spending Record' : '+ Record New Admin Spending'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Amount Taken ({currentCompany.currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount || ''}
                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 150"
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 font-extrabold text-rose-800"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white text-stone-800"
                  >
                    <option value="Transportation">Transportation</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Advertising">Advertising</option>
                    <option value="Food">Food</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Business">Business</option>
                    <option value="Reimbursement">Reimbursement</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Who (Person Assigned/Taking Money) *</label>
                <select
                  value={personId}
                  onChange={e => setPersonId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white text-stone-800"
                >
                  {state.users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Why (Purpose / Explanation) *</label>
                <input
                  type="text"
                  required
                  value={why}
                  onChange={e => setWhy(e.target.value)}
                  placeholder="Explain why money was taken/spent..."
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Additional Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any supporting context or receipt references..."
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Attachment / Receipt URL (Optional)</label>
                <input
                  type="url"
                  value={attachmentUrl}
                  onChange={e => setAttachmentUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-rose-200 text-stone-600 hover:bg-rose-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold shadow-xs"
                >
                  {editingRecord ? 'Save Changes' : 'Confirm Spending'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
