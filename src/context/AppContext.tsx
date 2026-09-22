import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Company, User, Product, Customer, Sale, Purchase, ComingSoonProduct,
  BusinessExpense, AdminSpending, FinancialTransaction, InventoryTransaction,
  Goal, BusinessPlan, Task, ChatMessage, AdminAnnouncement, AppNotification, ActivityLog,
  UserPermission, StockStatus, SaleItem, UserRole, GoalStatus, CompanyMember, CompanyActionRequest, CompanyUserAlert
} from '../types';
import { api, getApiToken } from '../utils/api';
import {
  AppState, getInitialState, saveStateToStorage, resetStateToDefaults,
  calculateWeightedAverageCost, determineStockStatus, formatCurrency
} from '../utils/storage';

interface AppContextType {
  state: AppState;
  currentCompany: Company;
  currentUser: User;
  can: (permission: keyof UserPermission) => boolean;
  currency: string;
  formatMoney: (amount: number) => string;
  
  // Workspaces & Users
  switchCompany: (companyId: string) => void;
  createCompany: (name: string, description: string, currency: string, logoUrl?: string) => Promise<{ company: Company; inviteLink?: string }>;
  updateCompanySettings: (updates: Partial<Company['settings']> & Partial<Omit<Company, 'settings'>> & { settings?: Partial<Company['settings']> }) => void;
  createUser: (name: string, email: string, role: UserRole, permissions: UserPermission) => void;
  adjustMoney: (type: 'Deposit' | 'Withdrawal' | 'Correction', amount: number, reason: string) => void;
  switchUser: (userId: string) => void;
  updateUserPermissions: (userId: string, permissions: Partial<UserPermission>) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  updateCurrentUserProfile: (name: string, avatarUrl: string) => Promise<void>;
  createInviteLink: (companyId?: string) => Promise<string>;
  companyAlerts: CompanyUserAlert[];
  markCompanyAlertRead: (id: string) => Promise<void>;

  // Financial Stats (calculated dynamically from transactions)
  finances: {
    revenue: number;
    purchasesTotal: number;
    expensesTotal: number;
    adminSpendingTotal: number;
    availableMoney: number;
    netProfit: number;
    inventoryValue: number;
    comingSoonValue: number;
    salesCount: number;
    customersCount: number;
  };

  // Operations
  createSale: (saleData: {
    customerId?: string;
    customerName: string;
    customerPhone?: string;
    items: { productId: string; quantity: number; unitPrice: number; discountAmount?: number }[];
    discountType: 'none' | 'percent' | 'fixed';
    discountValue: number;
    notes?: string;
  }) => { success: boolean; error?: string; sale?: Sale };
  
  returnSale: (saleId: string, returnItems: { productId: string; quantity: number }[], reason: string) => { success: boolean; error?: string };

  createProduct: (productData: Omit<Product, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'purchaseHistory' | 'stockStatus'> & { initialUnitCost?: number }) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => { success: boolean; error?: string };
  toggleProductFavorite: (id: string) => void;

  createPurchase: (purchaseData: {
    productId: string;
    quantity: number;
    unitCost: number;
    supplier: string;
    notes?: string;
    attachmentUrl?: string;
  }) => { success: boolean; error?: string };

  createComingSoonOrder: (orderData: {
    productId?: string;
    productName: string;
    quantity: number;
    purchasePrice: number;
    supplier: string;
    expectedArrival: string;
    notes?: string;
    imageUrl?: string;
    addImmediatelyToStock?: boolean;
  }) => void;
  
  addComingSoonToStock: (orderId: string) => { success: boolean; error?: string };
  updateComingSoonStatus: (orderId: string, status: ComingSoonProduct['status']) => void;

  createExpense: (expenseData: {
    amount: number;
    category: string;
    description: string;
    notes?: string;
    attachmentUrl?: string;
    date?: string;
  }) => void;

  createAdminSpending: (spendingData: {
    amount: number;
    date: string;
    time?: string;
    personId: string;
    why: string;
    category: string;
    notes?: string;
    attachmentUrl?: string;
  }) => { success: boolean; error?: string };
  
  updateAdminSpending: (id: string, updates: Partial<AdminSpending>) => { success: boolean; error?: string };
  deleteAdminSpending: (id: string) => { success: boolean; error?: string };

  createCustomer: (customerData: Omit<Customer, 'id' | 'companyId' | 'totalSpent' | 'purchaseCount' | 'createdAt'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  restrictCustomer: (customerId: string, status: 'Active' | 'Restricted' | 'Blocked', reason: string, notes?: string) => void;

  createGoal: (goal: Omit<Goal, 'id' | 'companyId' | 'current' | 'createdAt'>) => void;
  updateGoalProgress: (id: string, current: number) => void;
  celebrateGoal: () => void;

  createBusinessPlan: (plan: Omit<BusinessPlan, 'id' | 'companyId' | 'progress' | 'createdAt'>) => void;
  createTask: (task: Omit<Task, 'id' | 'companyId' | 'createdAt'>) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;

  createAnnouncement: (announcement: Omit<AdminAnnouncement, 'id' | 'companyId' | 'createdById' | 'createdByName' | 'acknowledgedUserIds' | 'createdAt'>) => void;
  acknowledgeAnnouncement: (announcementId: string) => void;

  sendChatMessage: (text: string, attachmentUrl?: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  resetDatabase: () => void;
  resetAllData: () => void;

  // Active view routing & modals
  activeView: string;
  setActiveView: (view: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  selectedReceipt: Sale | null;
  setSelectedReceipt: (sale: Sale | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(getInitialState);
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Sale | null>(null);
  const hydratedRef = React.useRef(false);
  const syncTimerRef = React.useRef<number | null>(null);
  const [companyAlerts, setCompanyAlerts] = useState<CompanyUserAlert[]>([]);

  // Hydrate shared state from the online account. Local storage remains a fallback.
  useEffect(() => {
    const token = getApiToken();
    if (!token) { hydratedRef.current = true; return; }
    Promise.all([api('/api/state'), api('/api/me')]).then(([data, me]) => {
      if (!me?.user) return;
      const account = me.user;
      const companyIds = account.companyIds || [];
      setState(prev => {
        // A fresh account has no company and must never inherit the old demo/test workspace.
        if (!companyIds.length) {
          return {
            ...prev, companies: [], activeCompanyId: '',
            users: [{ id: account.id, name: account.name, email: account.email, avatarUrl: account.avatarUrl || '', role: 'Member', permissions: {}, companyIds: [] }],
            activeUserId: account.id, products: [], customers: [], sales: [], purchases: [], comingSoon: [], expenses: [],
            adminSpending: [], financialTransactions: [], inventoryTransactions: [], goals: [], plans: [], tasks: [],
            announcements: [], chatMessages: [], notifications: [], activityLogs: []
          };
        }
        const serverState = data.state as AppState | null;
        const base = serverState || prev;
        const allowed = new Set(companyIds);
        const existingAccountUser = base.users.find(u => u.id === account.id);
        const accountUser: User = {
          ...(existingAccountUser || { id: account.id, name: account.name, email: account.email, avatarUrl: '', role: 'Member' as UserRole, permissions: {} }),
          id: account.id, name: account.name, email: account.email, avatarUrl: account.avatarUrl || existingAccountUser?.avatarUrl || '',
          role: existingAccountUser?.role || 'Member', permissions: existingAccountUser?.permissions || {}, companyIds
        };
        const filtered = {
          ...base,
          companies: base.companies.filter(c => allowed.has(c.id)),
          products: base.products.filter(x => allowed.has(x.companyId)),
          customers: base.customers.filter(x => allowed.has(x.companyId)),
          sales: base.sales.filter(x => allowed.has(x.companyId)),
          purchases: base.purchases.filter(x => allowed.has(x.companyId)),
          comingSoon: base.comingSoon.filter(x => allowed.has(x.companyId)),
          expenses: base.expenses.filter(x => allowed.has(x.companyId)),
          adminSpending: base.adminSpending.filter(x => allowed.has(x.companyId)),
          financialTransactions: base.financialTransactions.filter(x => allowed.has(x.companyId)),
          inventoryTransactions: base.inventoryTransactions.filter(x => allowed.has(x.companyId)),
          goals: base.goals.filter(x => allowed.has(x.companyId)),
          plans: base.plans.filter(x => allowed.has(x.companyId)),
          tasks: base.tasks.filter(x => allowed.has(x.companyId)),
          announcements: base.announcements.filter(x => allowed.has(x.companyId)),
          chatMessages: base.chatMessages.filter(x => allowed.has(x.companyId)),
          activityLogs: base.activityLogs.filter(x => allowed.has(x.companyId)),
          users: [...base.users.filter(u => u.id === account.id || (u.companyIds || []).some(id => allowed.has(id))), accountUser].filter((u,i,a)=>a.findIndex(v=>v.id===u.id)===i),
          activeUserId: account.id,
          activeCompanyId: companyIds.find(id => filtered.companies.some(c => c.id === id)) || ''
        };
        return filtered;
      });
    }).catch(() => {}).finally(() => { hydratedRef.current = true; });
  }, []);

  // Sync to local storage and online account.

  useEffect(() => {
    saveStateToStorage(state);
    if (!hydratedRef.current || !getApiToken()) return;
    if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    syncTimerRef.current = window.setTimeout(() => {
      api('/api/state', { method: 'PUT', body: JSON.stringify({ state }) }).catch(() => {});
    }, 500);
    return () => { if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current); };
  }, [state]);

  // Current Company
  const currentCompany = useMemo(() => {
    const found = state.companies.find(c => c.id === state.activeCompanyId);
    return found || state.companies[0] || { id:'', name:'No company', logoUrl:'', description:'', currency:'MAD', ownerId:currentUserIdFallback(state), createdAt:'', settings:{allowNegativeStockSales:false, accountingMethod:'weighted_average', taxRate:0, receiptFooterMessage:''} };
  }, [state.companies, state.activeCompanyId]);

  function currentUserIdFallback(s: AppState) { return s.activeUserId || ''; }

  // Current User
  const currentUser = useMemo(() => {
    const found = state.users.find(u => u.id === state.activeUserId);
    return found || state.users[0] || { id:'', name:'User', email:'', avatarUrl:'', role:'Member' as UserRole, permissions:{}, companyIds:[] };
  }, [state.users, state.activeUserId]);

  useEffect(() => {
    if (!currentCompany.id || !getApiToken()) { setCompanyAlerts([]); return; }
    let alive = true;
    const load = () => api(`/api/company/alerts?companyId=${encodeURIComponent(currentCompany.id)}`)
      .then(data => { if (alive) setCompanyAlerts(data.alerts || []); })
      .catch(() => { if (alive) setCompanyAlerts([]); });
    load();
    const timer = window.setInterval(load, 10000);
    return () => { alive = false; window.clearInterval(timer); };
  }, [currentCompany.id]);

  const currency = currentCompany.currency || 'MAD';

  const formatMoney = useCallback((amount: number) => {
    return formatCurrency(amount, currency);
  }, [currency]);

  // Check RBAC Permissions
  const can = useCallback((permission: keyof UserPermission): boolean => {
    if (!currentCompany.id || !currentUser.companyIds.includes(currentCompany.id)) return false;
    if (currentUser.role === 'Owner') return true;
    return !!currentUser.permissions[permission];
  }, [currentUser, currentCompany.id]);

  // Financial Stats Calculation (Pure Transaction-Based Ledger)
  const finances = useMemo(() => {
    const compTxs = state.financialTransactions.filter(t => t.companyId === currentCompany.id);
    
    let revenue = 0;
    let purchasesTotal = 0;
    let expensesTotal = 0;
    let adminSpendingTotal = 0;
    let availableMoney = 0;

    compTxs.forEach(tx => {
      availableMoney += tx.amount;
      if (tx.type === 'SALE_REVENUE') {
        revenue += tx.amount;
      } else if (tx.type === 'REFUND') {
        revenue += tx.amount; // refund amounts are negative
      } else if (tx.type === 'PRODUCT_PURCHASE') {
        purchasesTotal += Math.abs(tx.amount);
      } else if (tx.type === 'BUSINESS_EXPENSE') {
        expensesTotal += Math.abs(tx.amount);
      } else if (tx.type === 'ADMIN_SPENDING') {
        adminSpendingTotal += Math.abs(tx.amount);
      }
    });

    // Calculate COGS and Net Profit from sales
    const compSales = state.sales.filter(s => s.companyId === currentCompany.id && s.status !== 'Cancelled');
    const totalSalesProfit = compSales.reduce((acc, s) => {
      if (s.status === 'Returned_Full') return acc;
      return acc + s.profit;
    }, 0);
    const netProfit = totalSalesProfit - expensesTotal - adminSpendingTotal;

    // Inventory Value
    const compProducts = state.products.filter(p => p.companyId === currentCompany.id);
    const inventoryValue = compProducts.reduce((acc, p) => acc + (p.quantity * p.purchaseCost), 0);

    // Pending/Coming Soon Value
    const compComingSoon = state.comingSoon.filter(
      cs => cs.companyId === currentCompany.id && cs.status !== 'Added to Stock' && cs.status !== 'Cancelled'
    );
    const comingSoonValue = compComingSoon.reduce((acc, cs) => acc + (cs.quantity * cs.purchasePrice), 0);

    const compCustomers = state.customers.filter(c => c.companyId === currentCompany.id);

    return {
      revenue,
      purchasesTotal,
      expensesTotal,
      adminSpendingTotal,
      availableMoney,
      netProfit,
      inventoryValue,
      comingSoonValue,
      salesCount: compSales.length,
      customersCount: compCustomers.length
    };
  }, [state.financialTransactions, state.sales, state.products, state.comingSoon, state.customers, currentCompany.id]);

  const celebrateGoal = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F43F5E', '#FDA4AF', '#F472B6', '#FBCFE8', '#BE185D']
      });
    } catch {
      // ignore
    }
  }, []);

  const addActivity = useCallback((action: string, objectType: ActivityLog['objectType'], details: string) => {
    const now = new Date();
    const newLog: ActivityLog = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      companyId: currentCompany.id,
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      objectType,
      details,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: now.toISOString()
    };
    return newLog;
  }, [currentCompany.id, currentUser.id, currentUser.name]);

  // Switch Company
  const switchCompany = useCallback((companyId: string) => {
    setState(prev => ({ ...prev, activeCompanyId: companyId }));
  }, []);

  // Create Company
  const createCompany = useCallback(async (name: string, description: string, currency: string, logoUrl?: string) => {
    const newCompany: Company = {
      id: `comp_${Date.now()}`, name, logoUrl: logoUrl || '', description, currency: currency || 'MAD', ownerId: currentUser.id,
      createdAt: new Date().toISOString(), settings: { allowNegativeStockSales:false, accountingMethod:'weighted_average', taxRate:0, receiptFooterMessage:`Thank you for choosing ${name}!` }
    };
    const now = new Date();
    const newUser: User = { ...currentUser, role:'Owner', companyIds:Array.from(new Set([...(currentUser.companyIds||[]), newCompany.id])),
      permissions:{ ...currentUser.permissions, create_edit_delete_products:true, make_sales:true, view_customers:true, create_purchases:true, view_finances:true, edit_financial_records:true, delete_financial_records:true, manage_members:true, manage_announcements:true, manage_goals:true, manage_plans:true, create_admin_spending:true, edit_delete_admin_spending:true, view_sensitive_finance:true, create_sales:true, process_returns:true, create_expenses:true, manage_customers:true, restrict_customers:true, manage_team:true, adjust_finances:true, view_activity_logs:true } };
    const newState: AppState = { ...state, companies:[...state.companies,newCompany], activeCompanyId:newCompany.id, activeUserId:currentUser.id, users:[...state.users.filter(u=>u.id!==currentUser.id),newUser],
      activityLogs:[{id:`act_${Date.now()}`,companyId:newCompany.id,userId:currentUser.id,userName:currentUser.name,action:'Created Workspace',objectType:'Member',details:`Created new workspace "${name}".`,date:now.toISOString().split('T')[0],time:now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),createdAt:now.toISOString()},...state.activityLogs] };
    setState(newState);
    let inviteLink: string | undefined;
    try {
      const companyState:any = { companyId:newCompany.id, company:newCompany };
      for (const [key,value] of Object.entries(newState)) if (Array.isArray(value)) companyState[key]=value.filter((x:any)=>x && typeof x==='object' && 'companyId' in x && x.companyId===newCompany.id);
      const invite = await api('/api/invites',{method:'POST',body:JSON.stringify({company:newCompany,companyState})});
      inviteLink=invite.link;
    } catch { /* company creation still succeeds; invite can be generated later */ }
    return { company:newCompany, inviteLink };
  }, [state, currentUser]);

  const createInviteLink = useCallback(async (companyId?: string) => {
    const cid=companyId || currentCompany.id;
    const company=state.companies.find(c=>c.id===cid);
    if(!company) throw new Error('Create a company first.');
    const companyState:any={companyId:company.id,company};
    for(const [key,value] of Object.entries(state)) if(Array.isArray(value)) companyState[key]=value.filter((x:any)=>x && typeof x==='object' && 'companyId' in x && x.companyId===company.id);
    const invite=await api('/api/invites',{method:'POST',body:JSON.stringify({company,companyState})});
    return invite.link as string;
  }, [state, currentCompany.id]);

  const updateCompanySettings = useCallback((updates: Partial<Company['settings']> & Partial<Omit<Company, 'settings'>> & { settings?: Partial<Company['settings']> }) => {
    setState(prev => ({
      ...prev,
      companies: prev.companies.map(c => {
        if (c.id !== currentCompany.id) return c;
        const newSettings = updates.settings ? { ...c.settings, ...updates.settings } : { ...c.settings, ...updates };
        return {
          ...c,
          name: updates.name ?? c.name,
          description: updates.description ?? c.description,
          currency: updates.currency ?? c.currency,
          logoUrl: updates.logoUrl ?? c.logoUrl,
          settings: newSettings
        };
      })
    }));
  }, [currentCompany.id]);

  const createUser = useCallback((name: string, email: string, role: UserRole, permissions: UserPermission) => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      email,
      role,
      avatarUrl: '',
      permissions,
      companyIds: [currentCompany.id]
    };
    setState(prev => ({
      ...prev,
      users: [...prev.users, newUser],
      activityLogs: [addActivity('Added Staff Member', 'Member', `Added team member ${name} (${role})`), ...prev.activityLogs]
    }));
  }, [currentCompany.id, addActivity]);

  const adjustMoney = useCallback((type: 'Deposit' | 'Withdrawal' | 'Correction', amount: number, reason: string) => {
    const signedAmount = type === 'Withdrawal' ? -Math.abs(amount) : Math.abs(amount);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const txId = `adj_${Date.now()}`;

    const finTx: FinancialTransaction = {
      id: txId,
      companyId: currentCompany.id,
      type: 'ADJUSTMENT',
      amount: signedAmount,
      referenceType: 'manual',
      referenceId: txId,
      description: `Manual ${type}: ${reason}`,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      date: dateStr,
      createdAt: now.toISOString()
    };

    const act = addActivity('Financial Adjustment', 'Sale', `Manual balance adjustment (${type}): ${signedAmount > 0 ? '+' : ''}${formatMoney(signedAmount)}. Reason: ${reason}`);

    setState(prev => ({
      ...prev,
      financialTransactions: [finTx, ...prev.financialTransactions],
      activityLogs: [act, ...prev.activityLogs]
    }));
  }, [currentCompany.id, currentUser, addActivity, formatMoney]);

  // Switch User
  const switchUser = useCallback((userId: string) => {
    setState(prev => ({ ...prev, activeUserId: userId }));
  }, []);

  const updateUserPermissions = useCallback((userId: string, permissions: Partial<UserPermission>) => {
    if (!can('manage_team')) return;
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => {
        if (u.id !== userId) return u;
        return { ...u, permissions: { ...u.permissions, ...permissions } };
      })
    }));
  }, [can]);

  const updateCurrentUserProfile = useCallback(async (name: string, avatarUrl: string) => {
    const result = await api('/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ name: name.trim(), avatarUrl })
    });
    const user = result.user;
    setState(prev => ({
      ...prev,
      activeUserId: user.id,
      users: prev.users.map(u => u.id === user.id ? { ...u, name: user.name, avatarUrl: user.avatarUrl } : u)
    }));
  }, []);

  const updateUserRole = useCallback((userId: string, role: UserRole) => {
    if (!can('manage_team')) return;
    if (userId === currentUser.id) return;
    if (role === 'Owner') return;
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, role } : u)
    }));
  }, [can, currentUser.id]);

  // 1. CREATE SALE (Full POS Atomic Transaction)
  const createSale = useCallback((saleData: {
    customerId?: string;
    customerName: string;
    customerPhone?: string;
    items: { productId: string; quantity: number; unitPrice: number; discountAmount?: number }[];
    discountType: 'none' | 'percent' | 'fixed';
    discountValue: number;
    notes?: string;
  }) => {
    if (!can('make_sales')) {
      return { success: false, error: 'Insufficient permission to process sales.' };
    }

    if (saleData.items.length === 0) {
      return { success: false, error: 'Sale must contain at least one product.' };
    }

    // Check customer restriction
    if (saleData.customerId) {
      const customer = state.customers.find(c => c.id === saleData.customerId);
      if (customer?.status === 'Blocked') {
        return {
          success: false,
          error: `Customer ${customer.name} is BLOCKED (${customer.currentRestrictionReason || 'Restriction on file'}). Sales prohibited.`
        };
      }
    }

    // Check inventory availability
    for (const item of saleData.items) {
      const prod = state.products.find(p => p.id === item.productId && p.companyId === currentCompany.id);
      if (!prod) {
        return { success: false, error: `Product not found in current company.` };
      }
      if (prod.quantity < item.quantity && !currentCompany.settings.allowNegativeStockSales) {
        return {
          success: false,
          error: `Insufficient stock for "${prod.name}". Available: ${prod.quantity}, Requested: ${item.quantity}.`
        };
      }
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const saleId = `sale_${Date.now()}`;
    const receiptId = `RCP-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let originalSubtotal = 0;
    let totalCost = 0;
    const saleItems: SaleItem[] = [];
    const inventoryTxs: InventoryTransaction[] = [];

    // Calculate item details
    for (const item of saleData.items) {
      const prod = state.products.find(p => p.id === item.productId)!;
      const itemSubtotal = item.unitPrice * item.quantity;
      const itemDiscount = item.discountAmount || 0;
      const itemTotal = itemSubtotal - itemDiscount;
      const itemCost = (prod.purchaseCost || 0) * item.quantity;
      const itemProfit = itemTotal - itemCost;

      originalSubtotal += itemSubtotal;
      totalCost += itemCost;

      saleItems.push({
        id: `si_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCost: prod.purchaseCost,
        discountAmount: itemDiscount,
        subtotal: itemSubtotal,
        total: itemTotal,
        profit: itemProfit
      });

      // Prepare inventory audit log
      inventoryTxs.push({
        id: `it_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        companyId: currentCompany.id,
        productId: prod.id,
        productName: prod.name,
        type: 'Sale',
        quantityChange: -item.quantity,
        newQuantity: prod.quantity - item.quantity,
        unitCost: prod.purchaseCost,
        referenceId: saleId,
        notes: `Sold via ${receiptId} to ${saleData.customerName}`,
        createdByName: currentUser.name,
        createdAt: now.toISOString()
      });
    }

    // Sale-wide discount calculation
    let totalDiscountAmount = saleItems.reduce((acc, i) => acc + i.discountAmount, 0);
    if (saleData.discountType === 'percent' && saleData.discountValue > 0) {
      totalDiscountAmount = (originalSubtotal * saleData.discountValue) / 100;
    } else if (saleData.discountType === 'fixed' && saleData.discountValue > 0) {
      totalDiscountAmount = saleData.discountValue;
    }

    const finalTotal = Math.max(0, originalSubtotal - totalDiscountAmount);
    const overallProfit = finalTotal - totalCost;

    const newSale: Sale = {
      id: saleId,
      companyId: currentCompany.id,
      customerId: saleData.customerId,
      customerName: saleData.customerName,
      customerPhone: saleData.customerPhone,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      items: saleItems,
      originalSubtotal,
      discountType: saleData.discountType,
      discountValue: saleData.discountValue,
      discountAmount: totalDiscountAmount,
      finalTotal,
      totalCost,
      profit: overallProfit,
      status: 'Completed',
      notes: saleData.notes,
      date: dateStr,
      time: timeStr,
      receiptId,
      createdAt: now.toISOString()
    };

    // Financial Transaction
    const finTx: FinancialTransaction = {
      id: `ft_${saleId}`,
      companyId: currentCompany.id,
      type: 'SALE_REVENUE',
      amount: finalTotal,
      referenceType: 'sale',
      referenceId: saleId,
      description: `Sale ${receiptId} (${saleData.customerName})`,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      date: dateStr,
      createdAt: now.toISOString()
    };

    // Activity Log
    const actLog = addActivity('Completed Sale', 'Sale', `Processed receipt ${receiptId} for ${formatMoney(finalTotal)} (${saleItems.length} items).`);

    // Notification
    const notif: AppNotification = {
      id: `notif_${Date.now()}`,
      companyId: currentCompany.id,
      title: 'New Sale Completed',
      message: `${currentUser.name} registered sale ${receiptId} for ${formatMoney(finalTotal)}.`,
      type: 'sale',
      isRead: false,
      createdAt: now.toISOString(),
      linkView: 'money'
    };

    // Update Products & Stock status
    setState(prev => {
      const updatedProducts = prev.products.map(p => {
        const soldItem = saleData.items.find(i => i.productId === p.id);
        if (!soldItem) return p;
        const newQty = p.quantity - soldItem.quantity;
        return {
          ...p,
          quantity: newQty,
          stockStatus: determineStockStatus(newQty, p.minimumStock),
          updatedAt: now.toISOString()
        };
      });

      // Update customer stats if selected
      const updatedCustomers = prev.customers.map(c => {
        if (c.id !== saleData.customerId) return c;
        return {
          ...c,
          totalSpent: c.totalSpent + finalTotal,
          purchaseCount: c.purchaseCount + 1
        };
      });

      // Update revenue & sales count goals
      const updatedGoals = prev.goals.map(g => {
        if (g.companyId !== currentCompany.id || g.status === 'Completed') return g;
        let newCurrent = g.current;
        if (g.type === 'Revenue') {
          newCurrent += finalTotal;
        } else if (g.type === 'Sales Count') {
          newCurrent += 1;
        } else if (g.type === 'Items Sold') {
          newCurrent += saleItems.reduce((sum, item) => sum + item.quantity, 0);
        } else if (g.type === 'Profit') {
          newCurrent += overallProfit;
        }

        const isCompleted = newCurrent >= g.target;
        if (isCompleted) {
          celebrateGoal();
        }

        return {
          ...g,
          current: newCurrent,
          status: (isCompleted ? 'Completed' : g.status) as GoalStatus
        };
      });

      return {
        ...prev,
        products: updatedProducts,
        customers: updatedCustomers,
        sales: [newSale, ...prev.sales],
        financialTransactions: [finTx, ...prev.financialTransactions],
        inventoryTransactions: [...inventoryTxs, ...prev.inventoryTransactions],
        goals: updatedGoals,
        notifications: [notif, ...prev.notifications],
        activityLogs: [actLog, ...prev.activityLogs]
      };
    });

    setSelectedReceipt(newSale);
    return { success: true, sale: newSale };
  }, [can, state.customers, state.products, currentCompany, currentUser, addActivity, formatMoney, celebrateGoal]);

  // 2. RETURN SALE (Full or Partial Return with Inventory & Financial Reversal)
  const returnSale = useCallback((
    saleId: string,
    returnItems: { productId: string; quantity: number }[],
    reason: string
  ) => {
    if (!can('make_sales')) {
      return { success: false, error: 'Insufficient permission to process returns.' };
    }

    const sale = state.sales.find(s => s.id === saleId && s.companyId === currentCompany.id);
    if (!sale) {
      return { success: false, error: 'Sale record not found.' };
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    let refundAmount = 0;
    const inventoryTxs: InventoryTransaction[] = [];

    // Calculate refund value based on sale item unit prices
    for (const ret of returnItems) {
      const saleItem = sale.items.find(i => i.productId === ret.productId);
      if (saleItem && ret.quantity > 0) {
        const itemRefund = (saleItem.total / saleItem.quantity) * ret.quantity;
        refundAmount += itemRefund;

        const prod = state.products.find(p => p.id === ret.productId);
        inventoryTxs.push({
          id: `it_ret_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          companyId: currentCompany.id,
          productId: ret.productId,
          productName: saleItem.productName,
          type: 'Return',
          quantityChange: ret.quantity,
          newQuantity: (prod?.quantity || 0) + ret.quantity,
          referenceId: sale.id,
          notes: `Return processed: ${reason}`,
          createdByName: currentUser.name,
          createdAt: now.toISOString()
        });
      }
    }

    // Determine status: full or partial
    const totalOriginalQty = sale.items.reduce((sum, i) => sum + i.quantity, 0);
    const totalReturnedQty = returnItems.reduce((sum, i) => sum + i.quantity, 0);
    const newStatus: Sale['status'] = totalReturnedQty >= totalOriginalQty ? 'Returned_Full' : 'Returned_Partial';

    // Financial refund transaction (negative revenue)
    const finTx: FinancialTransaction = {
      id: `ft_refund_${Date.now()}`,
      companyId: currentCompany.id,
      type: 'REFUND',
      amount: -refundAmount,
      referenceType: 'return',
      referenceId: sale.id,
      description: `Refund for receipt ${sale.receiptId} (${reason})`,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      date: dateStr,
      createdAt: now.toISOString()
    };

    const actLog = addActivity('Processed Return', 'Return', `Refunded ${formatMoney(refundAmount)} on receipt ${sale.receiptId}. Reason: ${reason}`);

    setState(prev => {
      // Restore inventory
      const updatedProducts = prev.products.map(p => {
        const retItem = returnItems.find(r => r.productId === p.id);
        if (!retItem) return p;
        const newQty = p.quantity + retItem.quantity;
        return {
          ...p,
          quantity: newQty,
          stockStatus: determineStockStatus(newQty, p.minimumStock),
          updatedAt: now.toISOString()
        };
      });

      // Update sale
      const updatedSales = prev.sales.map(s => {
        if (s.id !== saleId) return s;
        const existingReturns = s.returnedItems || [];
        const newReturnRecords = returnItems.map(r => ({
          productId: r.productId,
          quantity: r.quantity,
          returnedAt: now.toISOString(),
          refundAmount: refundAmount
        }));
        return {
          ...s,
          status: newStatus,
          returnedItems: [...existingReturns, ...newReturnRecords]
        };
      });

      // Adjust customer total spent if applicable
      const updatedCustomers = prev.customers.map(c => {
        if (c.id !== sale.customerId) return c;
        return {
          ...c,
          totalSpent: Math.max(0, c.totalSpent - refundAmount)
        };
      });

      return {
        ...prev,
        products: updatedProducts,
        sales: updatedSales,
        customers: updatedCustomers,
        financialTransactions: [finTx, ...prev.financialTransactions],
        inventoryTransactions: [...inventoryTxs, ...prev.inventoryTransactions],
        activityLogs: [actLog, ...prev.activityLogs]
      };
    });

    return { success: true };
  }, [can, state.sales, currentCompany.id, currentUser.name, currentUser.id, addActivity, formatMoney, state.products]);

  // 3. PRODUCT CRUD & FAVORITES
  const createProduct = useCallback((productData: Omit<Product, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'purchaseHistory' | 'stockStatus'> & { initialUnitCost?: number }) => {
    if (!can('create_edit_delete_products')) return;

    const now = new Date();
    const newId = `prod_${Date.now()}`;
    const status = determineStockStatus(productData.quantity, productData.minimumStock);
    
    const newProduct: Product = {
      ...productData,
      id: newId,
      companyId: currentCompany.id,
      stockStatus: status,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      purchaseHistory: productData.initialUnitCost && productData.quantity > 0 ? [
        {
          id: `ph_${Date.now()}`,
          date: now.toISOString().split('T')[0],
          quantity: productData.quantity,
          unitCost: productData.purchaseCost,
          supplier: productData.supplier,
          notes: 'Initial inventory entry'
        }
      ] : []
    };

    const act = addActivity('Created Product', 'Product', `Added new product "${newProduct.name}" (SKU: ${newProduct.sku})`);

    setState(prev => ({
      ...prev,
      products: [newProduct, ...prev.products],
      activityLogs: [act, ...prev.activityLogs]
    }));
  }, [can, currentCompany.id, addActivity]);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    if (!can('create_edit_delete_products')) return;

    const now = new Date();
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => {
        if (p.id !== id) return p;
        const newQty = updates.quantity !== undefined ? updates.quantity : p.quantity;
        const newMin = updates.minimumStock !== undefined ? updates.minimumStock : p.minimumStock;
        return {
          ...p,
          ...updates,
          quantity: newQty,
          minimumStock: newMin,
          stockStatus: determineStockStatus(newQty, newMin),
          updatedAt: now.toISOString()
        };
      }),
      activityLogs: [addActivity('Updated Product', 'Product', `Modified product details for ${updates.name || id}`), ...prev.activityLogs]
    }));
  }, [can, addActivity]);

  const deleteProduct = useCallback((id: string) => {
    if (!can('create_edit_delete_products')) {
      return { success: false, error: 'Insufficient permissions.' };
    }

    const prod = state.products.find(p => p.id === id);
    if (!prod) return { success: false, error: 'Product not found.' };

    setState(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id),
      activityLogs: [addActivity('Deleted Product', 'Product', `Deleted product "${prod.name}"`), ...prev.activityLogs]
    }));
    return { success: true };
  }, [can, state.products, addActivity]);

  const toggleProductFavorite = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p)
    }));
  }, []);

  // 4. PURCHASES (With Weighted Average Cost Recalculation)
  const createPurchase = useCallback((purchaseData: {
    productId: string;
    quantity: number;
    unitCost: number;
    supplier: string;
    notes?: string;
    attachmentUrl?: string;
  }) => {
    if (!can('create_purchases')) {
      return { success: false, error: 'Insufficient permission to log purchases.' };
    }

    const prod = state.products.find(p => p.id === purchaseData.productId && p.companyId === currentCompany.id);
    if (!prod) {
      return { success: false, error: 'Product not found.' };
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const totalCost = purchaseData.quantity * purchaseData.unitCost;
    const purchaseId = `pur_${Date.now()}`;

    // Weighted Average Cost calculation
    const newWeightedCost = calculateWeightedAverageCost(
      prod.quantity,
      prod.purchaseCost,
      purchaseData.quantity,
      purchaseData.unitCost
    );
    const newQty = prod.quantity + purchaseData.quantity;

    const newPurchase: Purchase = {
      id: purchaseId,
      companyId: currentCompany.id,
      productId: prod.id,
      productName: prod.name,
      quantity: purchaseData.quantity,
      unitCost: purchaseData.unitCost,
      totalCost,
      supplier: purchaseData.supplier,
      date: dateStr,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      status: 'Completed',
      notes: purchaseData.notes,
      attachmentUrl: purchaseData.attachmentUrl,
      createdAt: now.toISOString()
    };

    // Financial Transaction (Deducts available money)
    const finTx: FinancialTransaction = {
      id: `ft_${purchaseId}`,
      companyId: currentCompany.id,
      type: 'PRODUCT_PURCHASE',
      amount: -totalCost,
      referenceType: 'purchase',
      referenceId: purchaseId,
      description: `Purchase: ${purchaseData.quantity}x ${prod.name} from ${purchaseData.supplier}`,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      date: dateStr,
      createdAt: now.toISOString()
    };

    // Inventory Transaction
    const invTx: InventoryTransaction = {
      id: `it_${Date.now()}`,
      companyId: currentCompany.id,
      productId: prod.id,
      productName: prod.name,
      type: 'Purchase',
      quantityChange: purchaseData.quantity,
      newQuantity: newQty,
      unitCost: purchaseData.unitCost,
      referenceId: purchaseId,
      notes: `Shipment from ${purchaseData.supplier}`,
      createdByName: currentUser.name,
      createdAt: now.toISOString()
    };

    const act = addActivity(
      'Created Purchase',
      'Purchase',
      `Purchased ${purchaseData.quantity}x "${prod.name}" for ${formatMoney(totalCost)}. Weighted cost updated to ${formatMoney(newWeightedCost)}.`
    );

    setState(prev => {
      const updatedProducts = prev.products.map(p => {
        if (p.id !== prod.id) return p;
        return {
          ...p,
          quantity: newQty,
          purchaseCost: newWeightedCost,
          stockStatus: determineStockStatus(newQty, p.minimumStock),
          purchaseHistory: [
            ...p.purchaseHistory,
            {
              id: `ph_${Date.now()}`,
              date: dateStr,
              quantity: purchaseData.quantity,
              unitCost: purchaseData.unitCost,
              supplier: purchaseData.supplier,
              notes: purchaseData.notes
            }
          ],
          updatedAt: now.toISOString()
        };
      });

      return {
        ...prev,
        products: updatedProducts,
        purchases: [newPurchase, ...prev.purchases],
        financialTransactions: [finTx, ...prev.financialTransactions],
        inventoryTransactions: [invTx, ...prev.inventoryTransactions],
        activityLogs: [act, ...prev.activityLogs]
      };
    });

    return { success: true };
  }, [can, state.products, currentCompany.id, currentUser, addActivity, formatMoney]);

  // 5. COMING SOON / PRE-ORDERS
  const createComingSoonOrder = useCallback((orderData: {
    productId?: string;
    productName: string;
    quantity: number;
    purchasePrice: number;
    supplier: string;
    expectedArrival: string;
    notes?: string;
    imageUrl?: string;
    addImmediatelyToStock?: boolean;
  }) => {
    if (!can('create_purchases')) return;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const csId = `cs_${Date.now()}`;
    const totalCost = orderData.quantity * orderData.purchasePrice;

    if (orderData.addImmediatelyToStock && orderData.productId) {
      // Direct to stock
      createPurchase({
        productId: orderData.productId,
        quantity: orderData.quantity,
        unitCost: orderData.purchasePrice,
        supplier: orderData.supplier,
        notes: orderData.notes
      });
      return;
    }

    const newCS: ComingSoonProduct = {
      id: csId,
      companyId: currentCompany.id,
      productId: orderData.productId,
      productName: orderData.productName,
      quantity: orderData.quantity,
      purchasePrice: orderData.purchasePrice,
      supplier: orderData.supplier,
      orderDate: dateStr,
      expectedArrival: orderData.expectedArrival,
      status: 'Coming Soon',
      orderedById: currentUser.id,
      orderedByName: currentUser.name,
      notes: orderData.notes,
      imageUrl: orderData.imageUrl,
      createdAt: now.toISOString()
    };

    // Financial transaction for the ordered inventory
    const finTx: FinancialTransaction = {
      id: `ft_${csId}`,
      companyId: currentCompany.id,
      type: 'PRODUCT_PURCHASE',
      amount: -totalCost,
      referenceType: 'purchase',
      referenceId: csId,
      description: `Coming Soon Order: ${orderData.quantity}x ${orderData.productName} (${orderData.supplier})`,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      date: dateStr,
      createdAt: now.toISOString()
    };

    const act = addActivity('Created Coming Soon Order', 'Product', `Ordered ${orderData.quantity} units of "${orderData.productName}" (Arriving ${orderData.expectedArrival})`);

    setState(prev => ({
      ...prev,
      comingSoon: [newCS, ...prev.comingSoon],
      financialTransactions: [finTx, ...prev.financialTransactions],
      activityLogs: [act, ...prev.activityLogs]
    }));
  }, [can, currentCompany.id, currentUser, createPurchase, addActivity]);

  const addComingSoonToStock = useCallback((orderId: string) => {
    if (!can('create_purchases')) {
      return { success: false, error: 'Insufficient permission.' };
    }

    const cs = state.comingSoon.find(c => c.id === orderId && c.companyId === currentCompany.id);
    if (!cs) return { success: false, error: 'Coming Soon order not found.' };

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    // Find linked product or create new product
    let targetProductId = cs.productId;
    let existingProd = targetProductId ? state.products.find(p => p.id === targetProductId) : undefined;

    if (!existingProd) {
      existingProd = state.products.find(p => p.name.toLowerCase() === cs.productName.toLowerCase());
      if (existingProd) targetProductId = existingProd.id;
    }

    setState(prev => {
      let updatedProducts = [...prev.products];
      let newInvTx: InventoryTransaction;

      if (existingProd) {
        const newWeightedCost = calculateWeightedAverageCost(
          existingProd.quantity,
          existingProd.purchaseCost,
          cs.quantity,
          cs.purchasePrice
        );
        const newQty = existingProd.quantity + cs.quantity;

        updatedProducts = updatedProducts.map(p => {
          if (p.id !== existingProd!.id) return p;
          return {
            ...p,
            quantity: newQty,
            purchaseCost: newWeightedCost,
            stockStatus: determineStockStatus(newQty, p.minimumStock),
            purchaseHistory: [
              ...p.purchaseHistory,
              {
                id: `ph_${Date.now()}`,
                date: dateStr,
                quantity: cs.quantity,
                unitCost: cs.purchasePrice,
                supplier: cs.supplier,
                notes: 'Arrived from Coming Soon'
              }
            ],
            updatedAt: now.toISOString()
          };
        });

        newInvTx = {
          id: `it_${Date.now()}`,
          companyId: currentCompany.id,
          productId: existingProd.id,
          productName: existingProd.name,
          type: 'Arrival',
          quantityChange: cs.quantity,
          newQuantity: newQty,
          unitCost: cs.purchasePrice,
          referenceId: cs.id,
          notes: 'Received from Coming Soon order',
          createdByName: currentUser.name,
          createdAt: now.toISOString()
        };
      } else {
        // Create new product directly
        const newProdId = `prod_${Date.now()}`;
        const newProd: Product = {
          id: newProdId,
          companyId: currentCompany.id,
          name: cs.productName,
          description: cs.notes || 'Arrived from Coming Soon shipment',
          category: 'New Arrivals',
          sku: `SKU-${Date.now().toString().slice(-4)}`,
          purchaseCost: cs.purchasePrice,
          sellingPrice: Math.round(cs.purchasePrice * 2.2), // reasonable default margin
          quantity: cs.quantity,
          minimumStock: 5,
          stockStatus: 'In Stock',
          supplier: cs.supplier,
          isFavorite: false,
          imageUrl: cs.imageUrl,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          purchaseHistory: [
            {
              id: `ph_${Date.now()}`,
              date: dateStr,
              quantity: cs.quantity,
              unitCost: cs.purchasePrice,
              supplier: cs.supplier,
              notes: 'First arrival from Coming Soon'
            }
          ]
        };
        updatedProducts = [newProd, ...updatedProducts];

        newInvTx = {
          id: `it_${Date.now()}`,
          companyId: currentCompany.id,
          productId: newProdId,
          productName: cs.productName,
          type: 'Arrival',
          quantityChange: cs.quantity,
          newQuantity: cs.quantity,
          unitCost: cs.purchasePrice,
          referenceId: cs.id,
          notes: 'New product arrived from Coming Soon',
          createdByName: currentUser.name,
          createdAt: now.toISOString()
        };
      }

      // Update Coming Soon status to 'Added to Stock'
      const updatedCS = prev.comingSoon.map(item => {
        if (item.id !== orderId) return item;
        return {
          ...item,
          status: 'Added to Stock' as const,
          addedToStockDate: now.toISOString()
        };
      });

      const act = addActivity('Added to Stock', 'Product', `Transferred ${cs.quantity} units of "${cs.productName}" from Coming Soon to live Inventory.`);

      return {
        ...prev,
        products: updatedProducts,
        comingSoon: updatedCS,
        inventoryTransactions: [newInvTx, ...prev.inventoryTransactions],
        activityLogs: [act, ...prev.activityLogs]
      };
    });

    return { success: true };
  }, [can, state.comingSoon, state.products, currentCompany.id, currentUser.name, addActivity]);

  const updateComingSoonStatus = useCallback((orderId: string, status: ComingSoonProduct['status']) => {
    setState(prev => ({
      ...prev,
      comingSoon: prev.comingSoon.map(c => c.id === orderId ? { ...c, status } : c)
    }));
  }, []);

  // 6. BUSINESS EXPENSES
  const createExpense = useCallback((expenseData: {
    amount: number;
    category: string;
    description: string;
    notes?: string;
    attachmentUrl?: string;
    date?: string;
  }) => {
    if (!can('view_finances')) return;

    const now = new Date();
    const dateStr = expenseData.date || now.toISOString().split('T')[0];
    const expId = `exp_${Date.now()}`;

    const newExpense: BusinessExpense = {
      id: expId,
      companyId: currentCompany.id,
      amount: expenseData.amount,
      date: dateStr,
      category: expenseData.category,
      description: expenseData.description,
      notes: expenseData.notes,
      attachmentUrl: expenseData.attachmentUrl,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      createdAt: now.toISOString()
    };

    const finTx: FinancialTransaction = {
      id: `ft_${expId}`,
      companyId: currentCompany.id,
      type: 'BUSINESS_EXPENSE',
      amount: -expenseData.amount,
      referenceType: 'expense',
      referenceId: expId,
      description: `${expenseData.category}: ${expenseData.description}`,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      date: dateStr,
      createdAt: now.toISOString()
    };

    const act = addActivity('Created Expense', 'Expense', `Recorded expense of ${formatMoney(expenseData.amount)} for "${expenseData.description}".`);

    setState(prev => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses],
      financialTransactions: [finTx, ...prev.financialTransactions],
      activityLogs: [act, ...prev.activityLogs]
    }));
  }, [can, currentCompany.id, currentUser, addActivity, formatMoney]);

  // 7. ADMIN SPENDING / MONEY TAKEN (Prominent "+ New Spending" with Strict Audit and Financial Recalculation)
  const createAdminSpending = useCallback((spendingData: {
    amount: number;
    date: string;
    time?: string;
    personId: string;
    why: string;
    category: string;
    notes?: string;
    attachmentUrl?: string;
  }) => {
    if (!can('create_admin_spending')) {
      return { success: false, error: 'Permission denied: You cannot record Admin Spending.' };
    }

    if (spendingData.amount <= 0) {
      return { success: false, error: 'Spending amount must be greater than zero.' };
    }

    const person = state.users.find(u => u.id === spendingData.personId) || currentUser;
    const now = new Date();
    const aspId = `asp_${Date.now()}`;

    const newSpending: AdminSpending = {
      id: aspId,
      companyId: currentCompany.id,
      amount: spendingData.amount,
      date: spendingData.date,
      time: spendingData.time || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      personId: person.id,
      personName: person.name,
      why: spendingData.why,
      notes: spendingData.notes,
      category: spendingData.category,
      attachmentUrl: spendingData.attachmentUrl,
      createdById: currentUser.id,
      createdByName: `${currentUser.name} (${currentUser.role})`,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      isDeleted: false
    };

    // Financial Transaction (Deducts available money immediately)
    const finTx: FinancialTransaction = {
      id: `ft_${aspId}`,
      companyId: currentCompany.id,
      type: 'ADMIN_SPENDING',
      amount: -spendingData.amount,
      referenceType: 'admin_spending',
      referenceId: aspId,
      description: `Admin Spending (${person.name}): ${spendingData.why}`,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      date: spendingData.date,
      createdAt: now.toISOString()
    };

    const act = addActivity('Created Admin Spending', 'Admin Spending', `Recorded ${formatMoney(spendingData.amount)} taken by ${person.name}. Reason: ${spendingData.why}`);

    setState(prev => ({
      ...prev,
      adminSpending: [newSpending, ...prev.adminSpending],
      financialTransactions: [finTx, ...prev.financialTransactions],
      activityLogs: [act, ...prev.activityLogs]
    }));

    return { success: true };
  }, [can, state.users, currentUser, currentCompany.id, addActivity, formatMoney]);

  const updateAdminSpending = useCallback((id: string, updates: Partial<AdminSpending>) => {
    if (!can('edit_delete_admin_spending')) {
      return { success: false, error: 'Permission denied: You cannot edit Admin Spending records.' };
    }

    const existing = state.adminSpending.find(s => s.id === id && s.companyId === currentCompany.id);
    if (!existing) return { success: false, error: 'Record not found.' };

    const now = new Date();

    setState(prev => {
      const updatedRecords = prev.adminSpending.map(s => {
        if (s.id !== id) return s;
        return {
          ...s,
          ...updates,
          updatedAt: now.toISOString()
        };
      });

      // Update matching financial transaction amount if amount was edited
      let updatedFinTxs = prev.financialTransactions;
      if (updates.amount !== undefined && updates.amount !== existing.amount) {
        updatedFinTxs = prev.financialTransactions.map(tx => {
          if (tx.referenceType === 'admin_spending' && tx.referenceId === id) {
            return {
              ...tx,
              amount: -updates.amount!,
              description: `Admin Spending (${updates.personName || existing.personName}): ${updates.why || existing.why}`
            };
          }
          return tx;
        });
      }

      const act = addActivity(
        'Edited Admin Spending',
        'Admin Spending',
        `Edited spending record ${id}. Amount: ${formatMoney(updates.amount ?? existing.amount)}. Reason: ${updates.why ?? existing.why}`
      );

      return {
        ...prev,
        adminSpending: updatedRecords,
        financialTransactions: updatedFinTxs,
        activityLogs: [act, ...prev.activityLogs]
      };
    });

    return { success: true };
  }, [can, state.adminSpending, currentCompany.id, addActivity, formatMoney]);

  const deleteAdminSpending = useCallback((id: string) => {
    if (!can('edit_delete_admin_spending')) {
      return { success: false, error: 'Permission denied: You cannot delete Admin Spending records.' };
    }

    const existing = state.adminSpending.find(s => s.id === id && s.companyId === currentCompany.id);
    if (!existing) return { success: false, error: 'Record not found.' };

    const act = addActivity(
      'Deleted Admin Spending',
      'Admin Spending',
      `Deleted spending record for ${formatMoney(existing.amount)} (${existing.personName} - ${existing.why}). Financial effect reversed.`
    );

    setState(prev => ({
      ...prev,
      // Soft-delete or remove record
      adminSpending: prev.adminSpending.filter(s => s.id !== id),
      // Remove or reverse financial transaction
      financialTransactions: prev.financialTransactions.filter(
        tx => !(tx.referenceType === 'admin_spending' && tx.referenceId === id)
      ),
      activityLogs: [act, ...prev.activityLogs]
    }));

    return { success: true };
  }, [can, state.adminSpending, currentCompany.id, addActivity, formatMoney]);

  // 8. CUSTOMERS & RESTRICTIONS
  const createCustomer = useCallback((customerData: Omit<Customer, 'id' | 'companyId' | 'totalSpent' | 'purchaseCount' | 'createdAt'>) => {
    const newCust: Customer = {
      ...customerData,
      id: `cust_${Date.now()}`,
      companyId: currentCompany.id,
      totalSpent: 0,
      purchaseCount: 0,
      createdAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      customers: [newCust, ...prev.customers],
      activityLogs: [addActivity('Added Customer', 'Customer', `Registered new customer "${newCust.name}"`), ...prev.activityLogs]
    }));
  }, [currentCompany.id, addActivity]);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setState(prev => ({
      ...prev,
      customers: prev.customers.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  }, []);

  const restrictCustomer = useCallback((
    customerId: string,
    status: 'Active' | 'Restricted' | 'Blocked',
    reason: string,
    notes?: string
  ) => {
    const cust = state.customers.find(c => c.id === customerId);
    if (!cust) return;

    const now = new Date();
    const restrictionRecord = {
      id: `restr_${Date.now()}`,
      status,
      reason,
      date: now.toISOString().split('T')[0],
      createdById: currentUser.id,
      createdByName: `${currentUser.name} (${currentUser.role})`,
      notes
    };

    const act = addActivity(
      status === 'Blocked' ? 'Blocked Customer' : status === 'Restricted' ? 'Restricted Customer' : 'Unblocked Customer',
      'Customer',
      `Changed status of customer "${cust.name}" to ${status}. Reason: ${reason}`
    );

    setState(prev => ({
      ...prev,
      customers: prev.customers.map(c => {
        if (c.id !== customerId) return c;
        return {
          ...c,
          status,
          currentRestrictionReason: status === 'Active' ? undefined : reason,
          restrictionHistory: [restrictionRecord, ...(c.restrictionHistory || [])]
        };
      }),
      activityLogs: [act, ...prev.activityLogs]
    }));
  }, [state.customers, currentUser, addActivity]);

  // 9. GOALS & PLANS
  const createGoal = useCallback((goalData: Omit<Goal, 'id' | 'companyId' | 'current' | 'createdAt'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: `goal_${Date.now()}`,
      companyId: currentCompany.id,
      current: 0,
      createdAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      goals: [newGoal, ...prev.goals],
      activityLogs: [addActivity('Created Goal', 'Goal', `Created business goal "${newGoal.title}" (Target: ${newGoal.target} ${newGoal.unit})`), ...prev.activityLogs]
    }));
  }, [currentCompany.id, addActivity]);

  const updateGoalProgress = useCallback((id: string, current: number) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(g => {
        if (g.id !== id) return g;
        const isCompleted = current >= g.target;
        if (isCompleted && g.status !== 'Completed') {
          celebrateGoal();
        }
        return {
          ...g,
          current,
          status: isCompleted ? 'Completed' : g.status
        };
      })
    }));
  }, [celebrateGoal]);

  const createBusinessPlan = useCallback((planData: Omit<BusinessPlan, 'id' | 'companyId' | 'progress' | 'createdAt'>) => {
    const newPlan: BusinessPlan = {
      ...planData,
      id: `plan_${Date.now()}`,
      companyId: currentCompany.id,
      progress: 0,
      createdAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      plans: [newPlan, ...prev.plans],
      activityLogs: [addActivity('Created Plan', 'Plan', `Launched business plan "${newPlan.name}"`), ...prev.activityLogs]
    }));
  }, [currentCompany.id, addActivity]);

  const createTask = useCallback((taskData: Omit<Task, 'id' | 'companyId' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`,
      companyId: currentCompany.id,
      createdAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      tasks: [newTask, ...prev.tasks]
    }));
  }, [currentCompany.id]);

  const updateTaskStatus = useCallback((taskId: string, status: Task['status']) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status } : t)
    }));
  }, []);

  // 10. ANNOUNCEMENTS (With "Got it" acknowledgement)
  const createAnnouncement = useCallback((annData: Omit<AdminAnnouncement, 'id' | 'companyId' | 'createdById' | 'createdByName' | 'acknowledgedUserIds' | 'createdAt'>) => {
    if (!can('manage_announcements')) return;

    const newAnn: AdminAnnouncement = {
      ...annData,
      id: `ann_${Date.now()}`,
      companyId: currentCompany.id,
      createdById: currentUser.id,
      createdByName: `${currentUser.name} (${currentUser.role})`,
      acknowledgedUserIds: [currentUser.id],
      createdAt: new Date().toISOString()
    };

    const notif: AppNotification = {
      id: `notif_${Date.now()}`,
      companyId: currentCompany.id,
      title: 'New Announcement',
      message: `${currentUser.name} posted: ${annData.title}`,
      type: 'announcement',
      isRead: false,
      createdAt: new Date().toISOString(),
      linkView: 'announcements'
    };

    setState(prev => ({
      ...prev,
      announcements: [newAnn, ...prev.announcements],
      notifications: [notif, ...prev.notifications],
      activityLogs: [addActivity('Posted Announcement', 'Announcement', `Published announcement "${annData.title}"`), ...prev.activityLogs]
    }));
  }, [can, currentCompany.id, currentUser, addActivity]);

  const acknowledgeAnnouncement = useCallback((announcementId: string) => {
    setState(prev => ({
      ...prev,
      announcements: prev.announcements.map(a => {
        if (a.id !== announcementId) return a;
        if (a.acknowledgedUserIds.includes(currentUser.id)) return a;
        return {
          ...a,
          acknowledgedUserIds: [...a.acknowledgedUserIds, currentUser.id]
        };
      })
    }));
  }, [currentUser.id]);

  // 11. TEAM CHAT
  const sendChatMessage = useCallback((text: string, attachmentUrl?: string) => {
    if (!text.trim()) return;
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      companyId: currentCompany.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatarUrl,
      senderRole: currentUser.role,
      text: text.trim(),
      attachmentUrl,
      createdAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages, newMsg]
    }));
  }, [currentCompany.id, currentUser]);

  // 12. NOTIFICATIONS
  const markNotificationAsRead = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
    }));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, isRead: true }))
    }));
  }, []);

  const markCompanyAlertRead = useCallback(async (id: string) => {
    try { await api('/api/company/alert/read', {method:'POST', body:JSON.stringify({alertId:id})}); } catch {}
    setCompanyAlerts(prev => prev.map(a => a.id === id ? {...a, isRead:true} : a));
  }, []);

  // 13. RESET DATABASE
  const resetDatabase = useCallback(() => {
    const def = resetStateToDefaults();
    setState(def);
  }, []);

  const value = useMemo(() => ({
    state,
    currentCompany,
    currentUser,
    can,
    currency,
    formatMoney,
    switchCompany,
    createCompany,
    updateCompanySettings,
    createUser,
    adjustMoney,
    switchUser,
    updateUserPermissions,
    updateUserRole,
    updateCurrentUserProfile, createInviteLink, companyAlerts, markCompanyAlertRead,
    finances,
    createSale,
    returnSale,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductFavorite,
    createPurchase,
    createComingSoonOrder,
    addComingSoonToStock,
    updateComingSoonStatus,
    createExpense,
    createAdminSpending,
    updateAdminSpending,
    deleteAdminSpending,
    createCustomer,
    updateCustomer,
    restrictCustomer,
    createGoal,
    updateGoalProgress,
    celebrateGoal,
    createBusinessPlan,
    createTask,
    updateTaskStatus,
    createAnnouncement,
    acknowledgeAnnouncement,
    sendChatMessage,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    resetDatabase,
    resetAllData: resetDatabase,
    activeView,
    setActiveView,
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,
    selectedReceipt,
    setSelectedReceipt
  }), [
    state, currentCompany, currentUser, can, currency, formatMoney,
    switchCompany, createCompany, updateCompanySettings, createUser, adjustMoney, switchUser, updateUserPermissions, updateUserRole, updateCurrentUserProfile,
    finances, createSale, returnSale, createProduct, updateProduct, deleteProduct,
    toggleProductFavorite, createPurchase, createComingSoonOrder, addComingSoonToStock,
    updateComingSoonStatus, createExpense, createAdminSpending, updateAdminSpending,
    deleteAdminSpending, createCustomer, updateCustomer, restrictCustomer,
    createGoal, updateGoalProgress, celebrateGoal, createBusinessPlan, createTask,
    updateTaskStatus, createAnnouncement, acknowledgeAnnouncement, sendChatMessage,
    markNotificationAsRead, markAllNotificationsAsRead, resetDatabase,
    activeView, searchQuery, isSearchOpen, selectedReceipt
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
