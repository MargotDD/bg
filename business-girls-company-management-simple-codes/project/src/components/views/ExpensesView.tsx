import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Receipt, Plus, Calendar, DollarSign, X, Trash2, Tag } from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { state, currentCompany, can, createExpense, formatMoney } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('Packaging');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const expenses = useMemo(() => {
    return state.expenses.filter(e => e.companyId === currentCompany.id);
  }, [state.expenses, currentCompany.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) return;
    createExpense({
      description: title.trim(),
      amount,
      category,
      date,
      notes: notes.trim() || undefined
    });
    setIsModalOpen(false);
    setTitle('');
    setAmount(0);
    setNotes('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-pink-600" />
            <span>Operating Business Expenses</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Track operational bills, packaging materials, salon rent, and recurring utilities.
          </p>
        </div>

        {can('view_finances') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Expense</span>
          </button>
        )}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-3xl border border-rose-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-rose-100 bg-rose-50/40 text-stone-400 uppercase text-[10px] font-bold">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3">Expense Description</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Notes</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-4">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-rose-200" />
                    <p>No operational expenses recorded yet.</p>
                  </td>
                </tr>
              ) : (
                expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-stone-800">{exp.date}</td>
                    <td className="py-3 px-3 font-bold text-stone-900">{exp.description}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 font-semibold text-[10px]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-stone-500 italic max-w-xs truncate">{exp.notes || '—'}</td>
                    <td className="py-3 px-3 text-right font-extrabold text-stone-900">{formatMoney(exp.amount)}</td>
                    <td className="py-3 px-4 text-stone-500 text-[11px]">{exp.createdByName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <h3 className="font-bold text-stone-900 text-sm">Add Operating Expense</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Expense Title / Description *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Satin Ribbon & Kraft Shopping Bags"
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Amount ({currentCompany.currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount || ''}
                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white"
                  >
                    <option value="Packaging">Packaging</option>
                    <option value="Rent">Rent</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Salon & Studio Supplies">Salon & Studio Supplies</option>
                    <option value="Software & Subscriptions">Software & Subscriptions</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Receipt number or details..."
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
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
