import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, ShoppingBag, Package, Wallet, MoreHorizontal,
  Sparkles, Truck, Users, CreditCard, Receipt, BarChart3,
  Target, MessageCircle, Megaphone, History, Settings, UserRound, X, ChevronRight
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activeView, setActiveView, currentCompany, state, can } = useApp();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const lowStockCount = state.products.filter(
    p => p.companyId === currentCompany.id && (p.stockStatus === 'Low Stock' || p.stockStatus === 'Out of Stock')
  ).length;

  const moreItems = [
    { id: 'coming_soon', label: 'Coming Soon Orders', icon: Sparkles, badge: 'Restock' },
    { id: 'purchases', label: 'Purchases & Inventory', icon: Truck },
    { id: 'admin_spending', label: 'Admin Spending (Money Taken)', icon: CreditCard, requires: 'create_admin_spending' as const },
    { id: 'expenses', label: 'Business Expenses', icon: Receipt, requires: 'view_finances' as const },
    { id: 'customers', label: 'Customers Directory', icon: Users },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, requires: 'view_finances' as const },
    { id: 'goals', label: 'Goals & Plans', icon: Target },
    { id: 'chat', label: 'Team Chat', icon: MessageCircle },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'activity', label: 'Activity & Audit Log', icon: History },
    { id: 'settings', label: 'Company Settings', icon: Settings },
    { id: 'profile', label: 'Profile', icon: UserRound },
  ];

  return (
    <>
      {/* Bottom Nav Bar (Mobile / Android) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-rose-100 lg:hidden px-3 py-1.5 flex items-center justify-around shadow-lg shadow-rose-950/5">
        <button
          onClick={() => {
            setActiveView('dashboard');
            setIsMoreOpen(false);
          }}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors ${
            activeView === 'dashboard' ? 'text-rose-600 font-semibold' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => {
            setActiveView('products');
            setIsMoreOpen(false);
          }}
          className={`relative flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors ${
            activeView === 'products' ? 'text-rose-600 font-semibold' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Products</span>
          {lowStockCount > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-rose-500"></span>
          )}
        </button>

        {/* Hero Sell Action */}
        <button
          onClick={() => {
            setActiveView('sell');
            setIsMoreOpen(false);
          }}
          className="flex flex-col items-center justify-center -mt-5"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-300 active:scale-95 transition-transform">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-rose-600 mt-1">Sell POS</span>
        </button>

        <button
          onClick={() => {
            setActiveView('money');
            setIsMoreOpen(false);
          }}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors ${
            activeView === 'money' ? 'text-rose-600 font-semibold' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Wallet className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Money</span>
        </button>

        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors ${
            isMoreOpen ? 'text-rose-600 font-semibold' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">More</span>
        </button>
      </nav>

      {/* Slide-Up Drawer for "More" Navigation on Android */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl border-t border-rose-100 animate-in slide-in-from-bottom duration-250">
            
            {/* Header */}
            <div className="p-4 border-b border-rose-100/70 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">All Sections & Tools</h3>
                <p className="text-xs text-stone-400">{currentCompany.name}</p>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-full bg-rose-50 text-stone-500 hover:bg-rose-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="p-3 overflow-y-auto space-y-1 divide-y divide-rose-50">
              {moreItems.map(item => {
                if (item.requires && !can(item.requires)) return null;
                const Icon = item.icon;
                const isActive = activeView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id);
                      setIsMoreOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-rose-50 text-rose-800 font-semibold'
                        : 'text-stone-700 hover:bg-rose-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isActive ? 'bg-rose-200 text-rose-800' : 'bg-rose-50 text-rose-600'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-stone-800 text-left">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-400">
                      {item.badge && (
                        <span className="px-2 py-0.5 text-[10px] bg-rose-100 text-rose-700 rounded-full font-bold">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 bg-rose-50/40 text-center">
              <p className="text-[11px] text-stone-400 font-medium">Business Girls • Android & Windows Cross-Platform Edition</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
