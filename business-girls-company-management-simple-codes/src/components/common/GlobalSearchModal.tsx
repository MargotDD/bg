import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, X, Package, ShoppingBag, Users, Truck, 
  CreditCard, Receipt, Target, ArrowRight 
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { 
    isSearchOpen: contextIsOpen, setIsSearchOpen, searchQuery, setSearchQuery, 
    state, currentCompany, setActiveView, setSelectedReceipt, formatMoney 
  } = useApp();

  const open = isOpen !== undefined ? isOpen : contextIsOpen;
  const handleClose = () => {
    if (onClose) onClose();
    setIsSearchOpen(false);
  };

  if (!open) return null;

  const results = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();

    const matchedProducts = state.products
      .filter(p => p.companyId === currentCompany.id && (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)))
      .map(p => ({
        id: p.id,
        type: 'Product',
        title: p.name,
        subtitle: `SKU: ${p.sku} • Stock: ${p.quantity} • ${formatMoney(p.sellingPrice)}`,
        icon: Package,
        action: () => {
          setActiveView('products');
          setIsSearchOpen(false);
        }
      }));

    const matchedCustomers = state.customers
      .filter(c => c.companyId === currentCompany.id && (c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))))
      .map(c => ({
        id: c.id,
        type: 'Customer',
        title: c.name,
        subtitle: `${c.phone || c.email || 'No phone'} • Spent: ${formatMoney(c.totalSpent)} • Status: ${c.status}`,
        icon: Users,
        action: () => {
          setActiveView('customers');
          setIsSearchOpen(false);
        }
      }));

    const matchedSales = state.sales
      .filter(s => s.companyId === currentCompany.id && (s.receiptId.toLowerCase().includes(q) || s.customerName.toLowerCase().includes(q)))
      .map(s => ({
        id: s.id,
        type: 'Sale',
        title: `Sale ${s.receiptId} — ${s.customerName}`,
        subtitle: `${s.date} ${s.time} • ${formatMoney(s.finalTotal)} • ${s.items.length} items`,
        icon: ShoppingBag,
        action: () => {
          setSelectedReceipt(s);
          setIsSearchOpen(false);
        }
      }));

    const matchedAdminSpending = state.adminSpending
      .filter(sp => sp.companyId === currentCompany.id && (sp.why.toLowerCase().includes(q) || sp.personName.toLowerCase().includes(q)))
      .map(sp => ({
        id: sp.id,
        type: 'Admin Spending',
        title: `Spending: ${sp.why}`,
        subtitle: `${sp.personName} • ${sp.date} • ${formatMoney(sp.amount)}`,
        icon: CreditCard,
        action: () => {
          setActiveView('admin_spending');
          setIsSearchOpen(false);
        }
      }));

    const matchedGoals = state.goals
      .filter(g => g.companyId === currentCompany.id && g.title.toLowerCase().includes(q))
      .map(g => ({
        id: g.id,
        type: 'Goal',
        title: g.title,
        subtitle: `Progress: ${g.current}/${g.target} ${g.unit} • Deadline: ${g.deadline}`,
        icon: Target,
        action: () => {
          setActiveView('goals');
          setIsSearchOpen(false);
        }
      }));

    return [...matchedProducts, ...matchedCustomers, ...matchedSales, ...matchedAdminSpending, ...matchedGoals];
  }, [searchQuery, state, currentCompany.id, formatMoney, setActiveView, setIsSearchOpen, setSelectedReceipt]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-rose-100 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-rose-100">
          <Search className="w-5 h-5 text-rose-500" />
          <input
            type="text"
            placeholder="Search products, customers, sales, spending, goals..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoFocus
            className="flex-1 text-sm bg-transparent border-none outline-hidden text-stone-800 placeholder:text-stone-400"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="text-stone-400 hover:text-stone-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleClose}
            className="text-xs px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-md font-mono"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-rose-50">
          {searchQuery.trim() === '' ? (
            <div className="py-12 text-center text-stone-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-rose-200" />
              <p className="text-xs">Type to search across your workspace records.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <p className="text-xs">No matching records found for "{searchQuery}".</p>
            </div>
          ) : (
            results.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={`${item.type}_${item.id}`}
                  onClick={item.action}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-rose-50/60 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 group-hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-stone-900">{item.title}</span>
                        <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-rose-100 text-rose-700">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400">{item.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
