import React from 'react';
import { 
  ShoppingBag, Package, Wallet, CreditCard, Target, 
  MessageCircle, BarChart3, Settings, Truck, Users, 
  Sparkles, Download 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SmileGirlIconShelfProps {
  onOpenDownload?: () => void;
}

export const SmileGirlIconShelf: React.FC<SmileGirlIconShelfProps> = ({ onOpenDownload }) => {
  const { setActiveView, state, currentCompany } = useApp();

  const lowStockCount = state.products.filter(
    p => p.companyId === currentCompany.id && (p.stockStatus === 'Low Stock' || p.stockStatus === 'Out of Stock')
  ).length;

  const quickIcons = [
    { id: 'sell', label: 'POS Register', icon: ShoppingBag, color: 'text-pink-600', bg: 'bg-[#FFE4EC]', border: 'border-pink-200' },
    { id: 'products', label: 'Products', icon: Package, badge: lowStockCount > 0 ? `${lowStockCount}` : undefined, color: 'text-rose-600', bg: 'bg-[#FFEBEF]', border: 'border-rose-200' },
    { id: 'money', label: 'Finances', icon: Wallet, color: 'text-pink-600', bg: 'bg-[#FFDEEB]', border: 'border-pink-200' },
    { id: 'admin_spending', label: 'Spending', icon: CreditCard, color: 'text-purple-600', bg: 'bg-[#F5E8FF]', border: 'border-purple-200' },
    { id: 'goals', label: 'Planner', icon: Target, color: 'text-pink-600', bg: 'bg-[#FFE5ED]', border: 'border-pink-200' },
    { id: 'chat', label: 'Team Chat', icon: MessageCircle, color: 'text-rose-600', bg: 'bg-[#FFE3EB]', border: 'border-rose-200' },
    { id: 'reports', label: 'Analytics', icon: BarChart3, color: 'text-pink-600', bg: 'bg-[#FFEBF2]', border: 'border-pink-200' },
    { id: 'purchases', label: 'Suppliers', icon: Truck, color: 'text-rose-600', bg: 'bg-[#FFDFE9]', border: 'border-rose-200' },
    { id: 'customers', label: 'Customers', icon: Users, color: 'text-pink-600', bg: 'bg-[#FFE3EE]', border: 'border-pink-200' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-stone-700', bg: 'bg-[#F5EDF0]', border: 'border-pink-200' },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 border-2 border-pink-200/90 shadow-[0_4px_20px_-2px_rgba(251,66,156,0.06)] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-extrabold text-[#3F1D26] uppercase tracking-wider">
            Smile Girl Quick Apps • iOS Icon Shelf
          </h3>
        </div>
        <span className="text-[10px] font-bold text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
          Tap to Open
        </span>
      </div>

      {/* Grid of iOS style squircle icons matching the user's reference image */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 pt-1">
        {quickIcons.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className="flex flex-col items-center gap-1.5 group transition-all"
            >
              <div className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${item.bg} ${item.border} border shadow-xs flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:shadow-md group-hover:border-pink-400 group-active:scale-95`}>
                <Icon className={`w-5 h-5 ${item.color} transition-transform group-hover:scale-105`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-[#FB429C] text-white text-[9px] font-bold rounded-full border border-white shadow-2xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-[#5C3A42] tracking-tight truncate max-w-[60px] text-center group-hover:text-pink-600">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
