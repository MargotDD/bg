import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp, Package, AlertTriangle, Sparkles, CreditCard,
  Receipt, Clock, ArrowRight, Flag
} from 'lucide-react';
import { PeekingBunny, PeekingKitty, SakuraFlowerIcon } from '../common/KawaiiMascot';

export const DashboardView: React.FC = () => {
  const { 
    state, currentCompany, currentUser, finances, formatMoney, 
    setActiveView, acknowledgeAnnouncement, setSelectedReceipt 
  } = useApp();

  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'year'>('month');

  if (!currentCompany.id) {
    return (
      <div className="space-y-4 pb-12">
        <div className="rounded-3xl bg-white/90 border border-[#F9CAD4] p-7 shadow-sm">
          <h2 className="text-2xl font-black text-[#3E2027]">Welcome back, {currentUser.name.split(' ')[0]} ♡</h2>
          <p className="mt-2 text-sm text-[#8C5E6A]">You are not in a company yet. Your account is ready, but no company or company status has been assigned.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={() => setActiveView('profile')} className="rounded-2xl bg-[#fb429c] px-5 py-3 text-sm font-extrabold text-white">Open Profile</button>
            <button onClick={() => setActiveView('profile')} className="rounded-2xl border border-[#F9CAD4] bg-[#FFF4F7] px-5 py-3 text-sm font-extrabold text-[#A7445C]">Create or join a company</button>
          </div>
        </div>
      </div>
    );
  }

  // Low stock products
  const lowStockProducts = state.products.filter(
    p => p.companyId === currentCompany.id && (p.stockStatus === 'Low Stock' || p.stockStatus === 'Out of Stock')
  );

  // Coming soon count
  const comingSoonItems = state.comingSoon.filter(
    cs => cs.companyId === currentCompany.id && cs.status !== 'Added to Stock' && cs.status !== 'Cancelled'
  );

  // Active Goals
  const activeGoals = state.goals.filter(g => g.companyId === currentCompany.id && g.status === 'Active');

  // Upcoming Tasks
  const upcomingTasks = state.tasks.filter(t => t.companyId === currentCompany.id && t.status !== 'Completed');

  // Announcements
  const announcements = state.announcements.filter(a => a.companyId === currentCompany.id);

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* Top Welcome Card with Peeking Bunny */}
      <div className="relative bg-white/85 backdrop-blur-md p-5 rounded-3xl border border-[#F9CAD4] shadow-[0_8px_30px_rgba(226,115,135,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Peeking Bunny Mascot Sticker on Top Right Border */}
        <div className="absolute -top-9 sm:-top-10 right-4 sm:right-10 z-20 pointer-events-none">
          <PeekingBunny className="w-16 h-16 sm:w-18 sm:h-18" />
        </div>

        <div>
          <h2 className="text-xl font-black text-[#3E2027] tracking-tight flex items-center gap-1.5">
            <span>Welcome back, {currentUser.name.split(' ')[0]}</span>
            <span className="inline-block"><SakuraFlowerIcon className="w-5 h-5" /></span>
            <span className="text-sm text-[#E27387]">💖</span>
          </h2>
          <p className="text-xs text-[#8C5E6A] mt-1">
            Real-time business performance & company operations overview for <span className="font-bold text-[#C45770]">{currentCompany.name}.</span>
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-1 bg-[#FFF0F3] p-1 rounded-full border border-[#FAD8E1] self-start sm:self-auto z-10">
          {(['today', 'week', 'month', 'year'] as const).map((filter, index) => {
            const isActive = dateFilter === filter;
            const label = filter === 'today' ? 'Today' : filter === 'week' ? 'This Week' : filter === 'month' ? 'This Month' : 'This Year';
            return (
              <React.Fragment key={filter}>
                {index > 0 && !isActive && dateFilter !== (['today', 'week', 'month', 'year'][index - 1]) && (
                  <span className="text-[#FAD8E1] text-xs">|</span>
                )}
                <button
                  onClick={() => setDateFilter(filter)}
                  className={`px-3.5 py-1 text-xs font-bold rounded-full transition-all ${
                    isActive
                      ? 'bg-[#F2BAC5] text-[#5C2A36] shadow-xs'
                      : 'text-[#8C5E6A] hover:text-[#3E2027]'
                  }`}
                >
                  {label}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Announcements Banner Cards */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          {announcements.slice(0, 2).map((ann, idx) => {
            const isAcknowledged = ann.acknowledgedUserIds.includes(currentUser.id);
            return (
              <div
                key={ann.id}
                className="relative bg-white/85 backdrop-blur-md p-4 rounded-3xl border border-[#F9CAD4] shadow-[0_4px_20px_rgba(226,115,135,0.04)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden"
              >
                {/* Subtle floral background doodle on announcement 1 */}
                {idx === 0 && (
                  <div className="absolute right-28 top-3 pointer-events-none opacity-25">
                    <SakuraFlowerIcon className="w-5 h-5" />
                  </div>
                )}

                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-9 h-9 rounded-2xl bg-[#FFE5EC] border border-[#F9CAD4] flex items-center justify-center shrink-0 mt-0.5">
                    <SakuraFlowerIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-xs text-[#3E2027]">{ann.title}</span>
                      {ann.isPinned && (
                        <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-[#FFCCD7] text-[#A73D54]">
                          PINNED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#734954] mt-0.5 max-w-2xl leading-relaxed">{ann.content}</p>
                    <span className="text-[10px] text-[#A77B86] mt-1 block">
                      Posted by {ann.createdByName}
                    </span>
                  </div>
                </div>

                {ann.requiresAcknowledgement && (
                  <button
                    onClick={() => acknowledgeAnnouncement(ann.id)}
                    disabled={isAcknowledged}
                    className="px-5 py-2 text-xs font-bold rounded-full shrink-0 transition-all bg-[#E5889B] hover:bg-[#D4778A] text-white shadow-xs"
                  >
                    Got it
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Main Financial KPI Grid (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: AVAILABLE MONEY (Strawberry Rose Gradient with Peeking Kitty) */}
        <div className="relative bg-gradient-to-br from-[#D96B82] via-[#CD5971] to-[#BA465E] text-white p-5 rounded-3xl shadow-[0_12px_32px_rgba(205,89,113,0.28)] flex flex-col justify-between overflow-visible">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-widest text-pink-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-200" />
                <span>AVAILABLE MONEY</span>
              </span>
              <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs shadow-inner">
                $
              </span>
            </div>
            <h3 className="text-2xl font-black mt-3 tracking-tight">
              {formatMoney(finances.availableMoney)}
            </h3>
            <p className="text-[11px] text-pink-100/90 mt-1">
              Calculated from verified transactions ledger
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs">
            <span className="text-pink-100 font-medium">Net Profit</span>
            <span className="font-extrabold">{formatMoney(finances.netProfit)}</span>
          </div>

          {/* Peeking Kitty Mascot Sticker on Bottom Right Edge */}
          <div className="absolute -bottom-4.5 right-3 pointer-events-none z-10">
            <PeekingKitty className="w-13 h-11" />
          </div>
        </div>

        {/* Card 2: TOTAL REVENUE */}
        <div className="bg-white/85 backdrop-blur-md p-5 rounded-3xl border border-[#F9CAD4] shadow-[0_8px_30px_rgba(226,115,135,0.06)] flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#8C5E6A]">
                TOTAL REVENUE
              </span>
              <span className="w-8 h-8 rounded-xl bg-[#FFE8EE] text-[#E27387] border border-[#F9CAD4] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-2xl font-black mt-3 text-[#3E2027] tracking-tight">
              {formatMoney(finances.revenue)}
            </h3>
            <p className="text-[11px] text-[#8C5E6A] mt-1">
              {finances.salesCount} total sales recorded
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#FCE5EB] flex items-center justify-between text-xs">
            <span className="text-[#8C5E6A] font-medium">Customers</span>
            <span className="font-bold text-[#3E2027]">{finances.customersCount} active</span>
          </div>
        </div>

        {/* Card 3: INVENTORY PURCHASES */}
        <div className="bg-white/85 backdrop-blur-md p-5 rounded-3xl border border-[#F9CAD4] shadow-[0_8px_30px_rgba(226,115,135,0.06)] flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#8C5E6A]">
                INVENTORY PURCHASES
              </span>
              <span className="w-8 h-8 rounded-xl bg-[#FFE8EE] text-[#E27387] border border-[#F9CAD4] flex items-center justify-center">
                <Package className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-2xl font-black mt-3 text-[#3E2027] tracking-tight">
              {formatMoney(finances.purchasesTotal)}
            </h3>
            <p className="text-[11px] text-[#8C5E6A] mt-1">
              Stock asset value: {formatMoney(finances.inventoryValue)}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#FCE5EB] flex items-center justify-between text-xs">
            <span className="text-[#8C5E6A] font-medium">Pending Incoming</span>
            <span className="font-bold text-[#C44D63]">{formatMoney(finances.comingSoonValue)}</span>
          </div>
        </div>

        {/* Card 4: ADMIN SPENDING */}
        <div className="bg-white/85 backdrop-blur-md p-5 rounded-3xl border border-[#F9CAD4] shadow-[0_8px_30px_rgba(226,115,135,0.06)] flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#8C5E6A]">
                ADMIN SPENDING
              </span>
              <span className="w-8 h-8 rounded-xl bg-[#FFE8EE] text-[#E27387] border border-[#F9CAD4] flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-2xl font-black mt-3 text-[#3E2027] tracking-tight">
              {formatMoney(finances.adminSpendingTotal)}
            </h3>
            <p className="text-[11px] text-[#8C5E6A] mt-1">
              Operating expenses: {formatMoney(finances.expensesTotal)}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#FCE5EB] flex items-center justify-between text-xs">
            <span className="text-[#8C5E6A] font-medium">Completed Spending</span>
            <span className="font-bold text-[#3E2027]">{formatMoney(finances.adminSpendingTotal + finances.expensesTotal)}</span>
          </div>
        </div>
      </div>

      {/* 3 Alerts Cards Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Low Stock Alert */}
        <div className="bg-white/85 backdrop-blur-md p-4 rounded-3xl border border-[#F9CAD4] shadow-[0_4px_20px_rgba(226,115,135,0.04)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF0F3] border border-[#FAD8E1] text-[#E27387] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-[#3E2027]">
                {lowStockProducts.length || 2} Products Under Alert
              </p>
              <p className="text-[11px] text-[#8C5E6A]">Low or zero inventory thresholds</p>
            </div>
          </div>
          <button
            onClick={() => setActiveView('products')}
            className="text-xs font-bold text-[#E27387] hover:text-[#B85269] flex items-center gap-1 shrink-0"
          >
            <span>View</span>
            <ArrowRight className="w-3.5 h-3.5" />
            <span className="text-[10px]">✦</span>
          </button>
        </div>

        {/* Coming Soon Alert */}
        <div className="bg-white/85 backdrop-blur-md p-4 rounded-3xl border border-[#F9CAD4] shadow-[0_4px_20px_rgba(226,115,135,0.04)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF0F3] border border-[#FAD8E1] text-[#E27387] flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-[#3E2027]">
                {comingSoonItems.length || 2} Coming Soon Orders
              </p>
              <p className="text-[11px] text-[#8C5E6A]">Non-sellable pre-stock orders</p>
            </div>
          </div>
          <button
            onClick={() => setActiveView('coming_soon')}
            className="text-xs font-bold text-[#E27387] hover:text-[#B85269] flex items-center gap-1 shrink-0"
          >
            <span>Manage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pending Tasks Alert */}
        <div className="bg-white/85 backdrop-blur-md p-4 rounded-3xl border border-[#F9CAD4] shadow-[0_4px_20px_rgba(226,115,135,0.04)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF0F3] border border-[#FAD8E1] text-[#E27387] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-[#3E2027]">
                {upcomingTasks.length || 2} Pending Tasks
              </p>
              <p className="text-[11px] text-[#8C5E6A]">Assigned across team members</p>
            </div>
          </div>
          <button
            onClick={() => setActiveView('goals')}
            className="text-xs font-bold text-[#E27387] hover:text-[#B85269] flex items-center gap-1 shrink-0"
          >
            <span>Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
            <span className="text-[10px]">✦</span>
          </button>
        </div>
      </div>

      {/* Middle Split: Active Goals & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Business Milestones */}
        <div className="bg-white/85 backdrop-blur-md p-5 rounded-3xl border border-[#F9CAD4] shadow-[0_4px_20px_rgba(226,115,135,0.04)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-[#E27387]" />
              <h3 className="text-sm font-black text-[#3E2027]">Active Business Milestones</h3>
            </div>
            <button
              onClick={() => setActiveView('goals')}
              className="text-xs font-bold text-[#E27387] hover:underline flex items-center gap-1.5"
            >
              <SakuraFlowerIcon className="w-3.5 h-3.5" />
              <span>All Goals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {activeGoals.length === 0 ? (
              <p className="text-xs text-[#8C5E6A] py-6 text-center">No active goals set. Create one in Goals & Plans.</p>
            ) : (
              activeGoals.map(goal => {
                const percentage = Math.min(100, Math.round((goal.current / goal.target) * 100));
                return (
                  <div key={goal.id} className="space-y-1.5 p-3 rounded-2xl bg-[#FFF0F3] border border-[#FAD8E1]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-[#3E2027]">{goal.title}</span>
                      <span className="text-[#E27387] font-black">{percentage}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#F4A7B7] to-[#E27387] rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#8C5E6A] font-medium">
                      <span>{goal.current} / {goal.target} {goal.unit}</span>
                      <span>Target: {goal.deadline}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Sales & Receipts */}
        <div className="bg-white/85 backdrop-blur-md p-5 rounded-3xl border border-[#F9CAD4] shadow-[0_4px_20px_rgba(226,115,135,0.04)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#E27387]" />
              <h3 className="text-sm font-black text-[#3E2027]">Recent Sales & Receipts</h3>
            </div>
            <button
              onClick={() => setActiveView('sell')}
              className="text-xs font-bold text-[#E27387] hover:underline flex items-center gap-1.5"
            >
              <SakuraFlowerIcon className="w-3.5 h-3.5" />
              <span>Open POS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 pt-1">
            {state.sales.filter(s => s.companyId === currentCompany.id).slice(0, 4).map(sale => (
              <div
                key={sale.id}
                onClick={() => setSelectedReceipt(sale)}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#FFF0F3] border border-[#FAD8E1]/60 transition-all cursor-pointer group bg-white/70"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFE8EE] text-[#E27387] flex items-center justify-center font-mono text-xs font-bold border border-[#F9CAD4]">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#3E2027]">{sale.customerName}</span>
                      <span className="text-[10px] font-mono text-[#E27387] font-bold bg-[#FFE5EC] px-1.5 py-0.2 rounded border border-[#F9CAD4]">{sale.receiptId}</span>
                    </div>
                    <p className="text-[11px] text-[#8C5E6A]">
                      {sale.items.length} items • by {sale.createdByName}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-extrabold text-[#3E2027] block">{formatMoney(sale.finalTotal)}</span>
                  <span className="text-[10px] text-emerald-600 font-bold">+{formatMoney(sale.profit)} profit</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
