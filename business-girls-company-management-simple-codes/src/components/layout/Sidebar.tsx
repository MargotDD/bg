import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Home, ShoppingBag, Package, Sparkles, Truck,
  Users, Wallet, Receipt, BarChart3, Target,
  MessageCircle, Megaphone, History, Heart, Download, UserRound
} from 'lucide-react';
import { UserPermission } from '../../types';
import { MascotGirlCheering, PiggyBankCuteIcon, SakuraFlowerIcon } from '../common/KawaiiMascot';

interface SidebarProps {
  onOpenNewCompany?: () => void;
  onOpenDownload?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenNewCompany, onOpenDownload }) => {
  const { activeView, setActiveView, state, currentCompany, can } = useApp();

  // Badges
  const lowStockCount = state.products.filter(
    p => p.companyId === currentCompany.id && (p.stockStatus === 'Low Stock' || p.stockStatus === 'Out of Stock')
  ).length;

  const comingSoonCount = state.comingSoon.filter(
    cs => cs.companyId === currentCompany.id && cs.status !== 'Added to Stock' && cs.status !== 'Cancelled'
  ).length;

  interface NavItem {
    id: string;
    label: string;
    icon: any;
    badge?: string;
    requires?: keyof UserPermission;
    isCustomIcon?: boolean;
  }

  const navItems: { group: string; items: NavItem[] }[] = [
    {
      group: 'CORE OPERATIONS',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'sell', label: 'Sell (POS)', icon: ShoppingBag },
        { id: 'products', label: 'Products & Stock', icon: Package, badge: lowStockCount > 0 ? `${lowStockCount}` : '2' },
        { id: 'coming_soon', label: 'Coming Soon', icon: Sparkles, badge: comingSoonCount > 0 ? `${comingSoonCount}` : '2' },
        { id: 'purchases', label: 'Purchases', icon: Truck },
        { id: 'customers', label: 'Customers', icon: Users },
      ]
    },
    {
      group: 'FINANCES & SPENDING',
      items: [
        { id: 'money', label: 'Finances & Ledger', icon: Wallet, requires: 'view_finances' as const },
        { id: 'admin_spending', label: 'Admin Spending', icon: PiggyBankCuteIcon, isCustomIcon: true, requires: 'create_admin_spending' as const },
        { id: 'expenses', label: 'Business Expenses', icon: Receipt, requires: 'view_finances' as const },
        { id: 'reports', label: 'Analytics & Reports', icon: BarChart3, requires: 'view_finances' as const },
      ]
    },
    {
      group: 'STRATEGY & WORKSPACE',
      items: [
        { id: 'goals', label: 'Goals & Plans', icon: Target },
        { id: 'chat', label: 'Team Chat', icon: MessageCircle },
        { id: 'announcements', label: 'Announcements', icon: Megaphone },
        { id: 'activity', label: 'Activity Log', icon: History },
        { id: 'profile', label: 'Profile', icon: UserRound },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-white/85 backdrop-blur-md border border-[#F9CAD4] rounded-3xl shadow-[0_8px_30px_rgba(226,115,135,0.08)] flex flex-col h-[calc(100vh-76px)] sticky top-16 hidden lg:flex select-none p-3.5 shrink-0 relative">
      {/* Brand Header with Mascot */}
      <div className="p-2.5 mb-2 bg-[#FFF3F6] rounded-2xl border border-[#FAD8E1] flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 ring-2 ring-[#F9CAD4]/80 bg-white">
          <MascotGirlCheering className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="font-black text-[#A7445C] text-sm tracking-tight leading-tight">
            Business Girls
          </h1>
          <p className="text-[9px] text-[#D47C90] font-extrabold tracking-[0.2em] uppercase mt-0.5">
            ENTERPRISE STUDIO
          </p>
        </div>
      </div>

      {/* Nav List with Exact Pill Highlighting and Cute Heart */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {navItems.map((group, gIdx) => {
          const visibleItems = group.items.filter(item => {
            if (item.requires && !can(item.requires)) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-extrabold text-[#B37B89] uppercase tracking-wider mb-1">
                {group.group}
              </p>
              {visibleItems.map(item => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                const isAdminSpending = item.id === 'admin_spending';

                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#E5889B] text-white shadow-[0_4px_14px_rgba(226,115,135,0.3)]'
                        : isAdminSpending
                          ? 'text-[#C45770] bg-[#FFF2F5] hover:bg-[#FFEBF0]'
                          : 'text-[#6B3F4A] hover:bg-[#FFEBF0]/75 hover:text-[#3E2027]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isAdminSpending ? 'text-[#C45770]' : 'text-[#A7546A]'}`} />
                      <span className="tracking-tight">{item.label}</span>
                    </div>

                    {/* Right element: White heart if active, or badge */}
                    {isActive ? (
                      <Heart className="w-3.5 h-3.5 text-white fill-white shrink-0" />
                    ) : item.badge ? (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-[#F4A7B7] text-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Decorative subtle Sakura flower sticker in bottom corner of sidebar */}
      <div className="absolute bottom-4 right-4 pointer-events-none opacity-40">
        <SakuraFlowerIcon className="w-5 h-5" />
      </div>

      {/* Bottom PWA Install Shortcut if available */}
      {onOpenDownload && (
        <div className="pt-2 border-t border-[#FCE5EB] mt-1">
          <button
            onClick={onOpenDownload}
            className="w-full flex items-center justify-between px-3 py-2 rounded-2xl bg-[#FFE8EE] hover:bg-[#FFDDE6] text-[#A7445C] text-xs font-bold transition-all border border-[#F9CAD4]"
          >
            <div className="flex items-center gap-2">
              <Download className="w-3.5 h-3.5 text-[#E27387]" />
              <span>Install Ready App</span>
            </div>
            <span className="text-[10px] text-[#E27387]">🌸</span>
          </button>
        </div>
      )}
    </aside>
  );
};
