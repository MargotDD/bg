import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, Download, Calendar, DollarSign, Package, 
  CreditCard, PieChart as PieIcon, ArrowUpRight 
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { state, currentCompany, finances, formatMoney } = useApp();
  const [timeframe, setTimeframe] = useState<'30days' | 'annual'>('30days');

  // Revenue & Outflows Breakdown Chart Data
  const financialData = useMemo(() => {
    return [
      { name: 'Revenue', amount: finances.revenue, fill: '#f43f5e' },
      { name: 'Stock Purchases', amount: finances.purchasesTotal, fill: '#a855f7' },
      { name: 'Admin Spending', amount: finances.adminSpendingTotal, fill: '#ec4899' },
      { name: 'Expenses', amount: finances.expensesTotal, fill: '#fb7185' },
      { name: 'Net Profit', amount: Math.max(0, finances.netProfit), fill: '#10b981' },
    ];
  }, [finances]);

  // Best Selling Products
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    const compSales = state.sales.filter(s => s.companyId === currentCompany.id && s.status === 'Completed');
    
    compSales.forEach(s => {
      s.items.forEach(it => {
        const cur = map.get(it.productId) || { name: it.productName, qty: 0, revenue: 0 };
        cur.qty += it.quantity;
        cur.revenue += it.total;
        map.set(it.productId, cur);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [state.sales, currentCompany.id]);

  // Recent 7 Days Trend
  const trendData = useMemo(() => {
    const days: { date: string; sales: number; profit: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySales = state.sales.filter(s => s.companyId === currentCompany.id && s.date === dateStr);
      const totalRevenue = daySales.reduce((acc, s) => acc + s.finalTotal, 0);
      const totalProfit = daySales.reduce((acc, s) => acc + s.profit, 0);
      days.push({
        date: d.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' }),
        sales: totalRevenue,
        profit: totalProfit
      });
    }
    return days;
  }, [state.sales, currentCompany.id]);

  const handleExportCSV = () => {
    const sales = state.sales.filter(s => s.companyId === currentCompany.id);
    const headers = 'ReceiptId,Date,Customer,Subtotal,Discount,FinalTotal,Profit,CreatedBy\n';
    const rows = sales.map(s => 
      `"${s.receiptId}","${s.date}","${s.customerName}",${s.originalSubtotal},${s.discountAmount},${s.finalTotal},${s.profit},"${s.createdByName}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentCompany.name.replace(/\s+/g, '_')}_sales_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-rose-600" />
            <span>Financial Analytics & Business Intelligence</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Profit margin trajectories, revenue flows, and bestselling items.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Sales CSV</span>
        </button>
      </div>

      {/* Top 4 Stats Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Gross Sales</span>
          <p className="text-2xl font-extrabold text-stone-900 mt-1">{formatMoney(finances.revenue)}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">{finances.salesCount} total orders</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Net Gross Profit</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{formatMoney(finances.netProfit)}</p>
          <span className="text-[10px] text-stone-400">After goods acquisition cost</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Admin Spending Ratio</span>
          <p className="text-2xl font-extrabold text-pink-600 mt-1">{formatMoney(finances.adminSpendingTotal)}</p>
          <span className="text-[10px] text-stone-400">
            {finances.revenue > 0 ? `${Math.round((finances.adminSpendingTotal / finances.revenue) * 100)}% of sales` : '0%'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Net Available Treasury</span>
          <p className="text-2xl font-extrabold text-rose-700 mt-1">{formatMoney(finances.availableMoney)}</p>
          <span className="text-[10px] text-stone-400">Reconciled in bank/cash</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Area Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-3xl border border-rose-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">7-Day Sales & Profit Trajectory</h3>
              <p className="text-xs text-stone-400">Daily revenue comparison</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffe4e6" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#a8a29e" />
                <YAxis tick={{ fontSize: 11 }} stroke="#a8a29e" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #ffe4e6' }}
                  formatter={(val: any) => formatMoney(Number(val))}
                />
                <Area type="monotone" dataKey="sales" name="Sales" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#profitGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Composition Bar Chart (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-rose-100 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Treasury Inflows vs Outflows</h3>
            <p className="text-xs text-stone-400">Relative allocation</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffe4e6" />
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="#a8a29e" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="#a8a29e" width={80} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #ffe4e6' }}
                  formatter={(val: any) => formatMoney(Number(val))}
                />
                <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
                  {financialData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Best-Selling Products Leaderboard */}
      <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-stone-900">Bestselling Products by Gross Revenue</h3>

        <div className="divide-y divide-rose-50 text-xs">
          {topProducts.length === 0 ? (
            <p className="text-stone-400 py-6 text-center">No sales registered yet.</p>
          ) : (
            topProducts.map((tp, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 font-bold flex items-center justify-center text-[10px]">
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-stone-900">{tp.name}</p>
                    <span className="text-[10px] text-stone-400">{tp.qty} units sold</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-stone-900">{formatMoney(tp.revenue)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
