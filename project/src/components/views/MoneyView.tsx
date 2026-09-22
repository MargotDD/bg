import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  DollarSign, ArrowUpRight, ArrowDownRight, Plus, Minus, 
  Calendar, Clock, Filter, Search, TrendingUp, TrendingDown, 
  ShieldCheck, AlertCircle, X, CheckCircle2, FileSpreadsheet
} from 'lucide-react';
import { FinancialTransactionType } from '../../types';

export const MoneyView: React.FC = () => {
  const { 
    state, currentCompany, currentUser, finances, can, 
    adjustMoney, formatMoney 
  } = useApp();

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // Manual Adjustment Form
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<'inject' | 'deduct'>('inject');
  const [adjustReason, setAdjustReason] = useState('');

  const transactions = useMemo(() => {
    return state.financialTransactions.filter(t => t.companyId === currentCompany.id);
  }, [state.financialTransactions, currentCompany.id]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) || 
                            t.referenceId.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [transactions, typeFilter, search]);

  const handleAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustAmount <= 0 || !adjustReason.trim()) return;

    const amount = adjustType === 'inject' ? adjustAmount : -adjustAmount;
    adjustMoney(adjustType === 'inject' ? 'Deposit' : 'Withdrawal', amount, adjustReason.trim());
    setIsAdjustModalOpen(false);
    setAdjustAmount(0);
    setAdjustReason('');
  };

  const getTransactionBadge = (type: FinancialTransactionType) => {
    switch (type) {
      case 'SALE_REVENUE': return 'bg-emerald-100 text-emerald-800';
      case 'REFUND': return 'bg-amber-100 text-amber-800';
      case 'PRODUCT_PURCHASE': return 'bg-purple-100 text-purple-800';
      case 'ADMIN_SPENDING': return 'bg-pink-100 text-pink-800';
      case 'BUSINESS_EXPENSE': return 'bg-rose-100 text-rose-800';
      case 'ADJUSTMENT': return 'bg-blue-100 text-blue-800';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-rose-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">Financial Treasury & Ledger</h2>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            Real-time calculation of available company money, operating revenue, inventory outflow, admin spending, and transaction audits.
          </p>
        </div>

        {can('edit_financial_records') && (
          <button
            onClick={() => setIsAdjustModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Manual Money Adjustment</span>
          </button>
        )}
      </div>

      {/* Main Financial Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available Money Card */}
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-6 rounded-3xl shadow-sm shadow-rose-200">
          <span className="text-xs font-bold text-rose-100 uppercase tracking-wider">Available Company Money</span>
          <h3 className="text-3xl font-extrabold mt-2 tracking-tight">
            {formatMoney(finances.availableMoney)}
          </h3>
          <p className="text-xs text-rose-100/90 mt-1">
            Current spendable liquidity after all outflows & inflows
          </p>
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs">
            <span className="text-rose-100">Live Ledger Status</span>
            <span className="font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Reconciled
            </span>
          </div>
        </div>

        {/* Revenue & Profit */}
        <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Sales Inflow</span>
            <h3 className="text-2xl font-extrabold text-stone-900 mt-1">
              {formatMoney(finances.revenue)}
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">{finances.salesCount} completed customer sales</p>
          </div>
          <div className="pt-3 border-t border-rose-50 flex items-center justify-between text-xs">
            <span className="text-stone-500">Gross Margin Profit:</span>
            <span className="font-extrabold text-emerald-600">{formatMoney(finances.netProfit)}</span>
          </div>
        </div>

        {/* Total Outflow Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-xs space-y-2 text-xs">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Outflow Breakdown</span>
          <div className="flex justify-between py-1 border-b border-rose-50">
            <span className="text-stone-600">Product Purchases (Stock)</span>
            <span className="font-bold text-purple-700">{formatMoney(finances.purchasesTotal)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-rose-50">
            <span className="text-stone-600">Admin Spending (Money Taken)</span>
            <span className="font-bold text-pink-700">{formatMoney(finances.adminSpendingTotal)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-stone-600">General Expenses</span>
            <span className="font-bold text-rose-700">{formatMoney(finances.expensesTotal)}</span>
          </div>
        </div>
      </div>

      {/* Transaction Filter and Search */}
      <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search description or reference..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-rose-100 bg-rose-50/40 text-xs text-stone-800"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Transactions' },
            { id: 'Sale', label: 'Sales' },
            { id: 'Admin_Spending', label: 'Admin Spending' },
            { id: 'Product_Purchase', label: 'Purchases' },
            { id: 'Expense', label: 'Expenses' },
            { id: 'Manual_Adjustment', label: 'Adjustments' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setTypeFilter(f.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                typeFilter === f.id
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-rose-50/60 text-stone-600 hover:bg-rose-100/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl border border-rose-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-rose-100 bg-rose-50/40 text-stone-400 uppercase text-[10px] font-bold">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3 font-mono">Reference</th>
                <th className="py-3 px-3 text-right">Inflow / Outflow</th>
                <th className="py-3 px-3 text-right">Available Balance After</th>
                <th className="py-3 px-4">Created By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-rose-200" />
                    <p>No financial transactions match your filter.</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const isPositive = tx.amount >= 0;
                  const timeDisplay = tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                  return (
                    <tr key={tx.id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-stone-800">
                        <span className="font-semibold block">{tx.date}</span>
                        {timeDisplay && <span className="text-[10px] text-stone-400">{timeDisplay}</span>}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getTransactionBadge(tx.type)}`}>
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-medium text-stone-900 max-w-sm">
                        {tx.description}
                      </td>

                      <td className="py-3 px-3 font-mono text-[10px] text-stone-500 whitespace-nowrap">
                        {tx.referenceId}
                      </td>

                      <td className={`py-3 px-3 text-right font-extrabold whitespace-nowrap ${
                        isPositive ? 'text-emerald-600' : 'text-rose-700'
                      }`}>
                        {isPositive ? `+${formatMoney(tx.amount)}` : formatMoney(tx.amount)}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-stone-800 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {isPositive ? 'Credit Inflow' : 'Debit Outflow'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-stone-500 text-[11px] whitespace-nowrap">
                        {tx.createdByName}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Money Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <h3 className="font-bold text-stone-900 text-sm">Manual Company Money Adjustment</h3>
              <button onClick={() => setIsAdjustModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustmentSubmit} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2 p-1 bg-rose-50 rounded-xl border border-rose-100">
                <button
                  type="button"
                  onClick={() => setAdjustType('inject')}
                  className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 ${
                    adjustType === 'inject' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-600'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+ Capital Injection</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('deduct')}
                  className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 ${
                    adjustType === 'deduct' ? 'bg-rose-600 text-white shadow-xs' : 'text-stone-600'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>- Manual Deduction</span>
                </button>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Amount ({currentCompany.currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={adjustAmount || ''}
                  onChange={e => setAdjustAmount(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 500"
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 font-extrabold text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Reason for Adjustment *
                </label>
                <textarea
                  rows={2}
                  required
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="e.g. Owner capital contribution or cash reserve deposit..."
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-rose-200 text-stone-600 hover:bg-rose-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white font-semibold shadow-xs"
                >
                  Post to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
