import {
  Company, User, Product, Customer, Sale, Purchase, ComingSoonProduct,
  BusinessExpense, AdminSpending, FinancialTransaction, InventoryTransaction,
  Goal, BusinessPlan, Task, ChatMessage, AdminAnnouncement, AppNotification, ActivityLog,
  ProductPurchaseHistory, SaleItem, SaleStatus
} from '../types';


const STORAGE_KEY = 'business_girls_state_v1';

export interface AppState {
  companies: Company[];
  activeCompanyId: string;
  users: User[];
  activeUserId: string;
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  purchases: Purchase[];
  comingSoon: ComingSoonProduct[];
  expenses: BusinessExpense[];
  adminSpending: AdminSpending[];
  financialTransactions: FinancialTransaction[];
  inventoryTransactions: InventoryTransaction[];
  goals: Goal[];
  plans: BusinessPlan[];
  tasks: Task[];
  announcements: AdminAnnouncement[];
  chatMessages: ChatMessage[];
  notifications: AppNotification[];
  activityLogs: ActivityLog[];
  theme: 'pastel-pink' | 'blush-rose' | 'lavender-cream';
  darkMode: boolean;
}

export function getInitialState(): AppState {
  const empty: AppState = {
    companies: [], activeCompanyId: '', users: [], activeUserId: '',
    products: [], customers: [], sales: [], purchases: [], comingSoon: [],
    expenses: [], adminSpending: [], financialTransactions: [], inventoryTransactions: [],
    goals: [], plans: [], tasks: [], announcements: [], chatMessages: [], notifications: [],
    activityLogs: [], theme: 'pastel-pink', darkMode: false
  };
  if (typeof window === 'undefined') return empty;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...empty, ...parsed, companies: parsed.companies || [], users: parsed.users || [] };
    }
  } catch (err) { console.error('Failed to parse saved state:', err); }
  return empty;
}

export function saveStateToStorage(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

export function resetStateToDefaults(): AppState {
  localStorage.removeItem(STORAGE_KEY);
  return getInitialState();
}

/**
 * Format currency with elegant spacing
 */
export function formatCurrency(amount: number, currency: string = 'MAD'): string {
  const formatted = new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${currency}`;
}

/**
 * Recalculate Weighted Average Cost (WAC) when new stock is added
 * New Avg Cost = ((Current Stock * Current Cost) + (New Qty * New Cost)) / (Current Stock + New Qty)
 */
export function calculateWeightedAverageCost(
  currentQty: number,
  currentCost: number,
  addedQty: number,
  addedCost: number
): number {
  if (currentQty <= 0) return addedCost;
  if (addedQty <= 0) return currentCost;
  const totalCost = (currentQty * currentCost) + (addedQty * addedCost);
  const totalQty = currentQty + addedQty;
  return Math.round((totalCost / totalQty) * 100) / 100;
}

/**
 * Compute stock status based on current quantity and threshold
 */
export function determineStockStatus(qty: number, minStock: number): 'In Stock' | 'Low Stock' | 'Out of Stock' {
  if (qty <= 0) return 'Out of Stock';
  if (qty <= minStock) return 'Low Stock';
  return 'In Stock';
}
