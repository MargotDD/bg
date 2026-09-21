export type UserRole = 'Owner' | 'Admin' | 'Manager' | 'Member';

export interface UserPermission {
  create_edit_delete_products?: boolean;
  make_sales?: boolean;
  view_customers?: boolean;
  create_purchases?: boolean;
  view_finances?: boolean;
  edit_financial_records?: boolean;
  delete_financial_records?: boolean;
  manage_members?: boolean;
  manage_announcements?: boolean;
  manage_goals?: boolean;
  manage_plans?: boolean;
  create_admin_spending?: boolean;
  edit_delete_admin_spending?: boolean;
  view_sensitive_finance?: boolean;
  create_sales?: boolean;
  process_returns?: boolean;
  create_expenses?: boolean;
  manage_customers?: boolean;
  restrict_customers?: boolean;
  manage_team?: boolean;
  adjust_finances?: boolean;
  view_activity_logs?: boolean;
}

export type PermissionKey = keyof UserPermission;

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  phone?: string;
  role: UserRole;
  permissions: UserPermission;
  companyIds: string[];
}

export interface Company {
  id: string;
  name: string;
  logoUrl: string;
  description: string;
  currency: string; // MAD, USD, EUR, GBP, etc.
  ownerId: string;
  createdAt: string;
  settings: {
    allowNegativeStockSales: boolean;
    accountingMethod: 'weighted_average' | 'fifo';
    taxRate: number;
    receiptFooterMessage: string;
    lowStockDefault?: number;
  };
}

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Coming Soon';

export interface ProductPurchaseHistory {
  id: string;
  date: string;
  quantity: number;
  unitCost: number;
  supplier: string;
  notes?: string;
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  description: string;
  category: string;
  sku: string;
  purchaseCost: number; // current or weighted average
  sellingPrice: number;
  quantity: number;
  minimumStock: number;
  stockStatus: StockStatus;
  supplier: string;
  isFavorite: boolean;
  imageUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  purchaseHistory: ProductPurchaseHistory[];
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitCost: number; // weighted cost at time of sale
  discountAmount: number;
  subtotal: number;
  total: number;
  profit: number;
}

export type SaleStatus = 'Completed' | 'Returned_Full' | 'Returned_Partial' | 'Cancelled';

export interface Sale {
  id: string;
  companyId: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  createdById: string;
  createdByName: string;
  items: SaleItem[];
  originalSubtotal: number;
  discountType: 'none' | 'percent' | 'fixed';
  discountValue: number;
  discountAmount: number;
  finalTotal: number;
  totalCost: number;
  profit: number;
  status: SaleStatus;
  notes?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  returnedItems?: {
    productId: string;
    quantity: number;
    returnedAt: string;
    refundAmount: number;
  }[];
  receiptId: string;
  createdAt: string;
}

export type CustomerStatus = 'Active' | 'Restricted' | 'Blocked';

export interface CustomerRestriction {
  id: string;
  status: CustomerStatus;
  reason: string;
  date: string;
  createdById: string;
  createdByName: string;
  expiresAt?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  avatarUrl: string;
  phone?: string;
  email?: string;
  address?: string;
  status: CustomerStatus;
  restrictionHistory?: CustomerRestriction[];
  currentRestrictionReason?: string;
  tags: string[];
  notes?: string;
  isVip: boolean;
  totalSpent: number;
  purchaseCount: number;
  createdAt: string;
}

export type ComingSoonStatus = 
  | 'Ordered'
  | 'On the Way'
  | 'Coming Soon'
  | 'Arrived'
  | 'Added to Stock'
  | 'Cancelled';

export interface ComingSoonProduct {
  id: string;
  companyId: string;
  productId?: string; // linked product if existing
  productName: string;
  quantity: number;
  purchasePrice: number;
  supplier: string;
  orderDate: string;
  expectedArrival: string;
  status: ComingSoonStatus;
  orderedById: string;
  orderedByName: string;
  notes?: string;
  imageUrl?: string;
  addedToStockDate?: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  companyId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  supplier: string;
  date: string;
  createdById: string;
  createdByName: string;
  status: 'Completed' | 'Pending' | 'Cancelled';
  notes?: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'video' | 'audio' | 'file';
  attachmentName?: string;
  createdAt: string;
}

export interface BusinessExpense {
  id: string;
  companyId: string;
  amount: number;
  date: string;
  category: string; // Advertising, Software, Rent, Utilities, Transportation, Services, Equipment, Other
  description: string;
  notes?: string;
  createdById: string;
  createdByName: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'video' | 'audio' | 'file';
  attachmentName?: string;
  createdAt: string;
}

export interface AdminSpending {
  id: string;
  companyId: string;
  amount: number;
  date: string;
  time?: string;
  personId: string;
  personName: string;
  why: string; // explanation
  notes?: string;
  category: string; // Transportation, Supplies, Advertising, Food, Equipment, Delivery, Business, Reimbursement, Other
  attachmentUrl?: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export type FinancialTransactionType = 
  | 'SALE_REVENUE'
  | 'PRODUCT_PURCHASE'
  | 'BUSINESS_EXPENSE'
  | 'ADMIN_SPENDING'
  | 'REFUND'
  | 'ADJUSTMENT';

export interface FinancialTransaction {
  id: string;
  companyId: string;
  type: FinancialTransactionType;
  amount: number; // positive or negative contribution to available money
  referenceType: 'sale' | 'purchase' | 'expense' | 'admin_spending' | 'return' | 'manual';
  referenceId: string;
  description: string;
  createdById: string;
  createdByName: string;
  date: string;
  createdAt: string;
}

export type InventoryTransactionType = 
  | 'Purchase'
  | 'Sale'
  | 'Return'
  | 'Arrival'
  | 'Manual Adjustment'
  | 'Cancellation';

export interface InventoryTransaction {
  id: string;
  companyId: string;
  productId: string;
  productName: string;
  type: InventoryTransactionType;
  quantityChange: number; // e.g. +20, -3
  newQuantity: number;
  unitCost?: number;
  referenceId?: string;
  notes?: string;
  createdByName: string;
  createdAt: string;
}

export type GoalType = 'Revenue' | 'Profit' | 'Sales Count' | 'Items Sold' | 'Custom';
export type GoalStatus = 'Active' | 'Completed' | 'Expired';

export interface Goal {
  id: string;
  companyId: string;
  title: string;
  type: GoalType;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  description: string;
  status: GoalStatus;
  createdAt: string;
}

export type PlanStatus = 'Planned' | 'Active' | 'Completed' | 'Cancelled';

export interface BusinessPlan {
  id: string;
  companyId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  expectedCost: number;
  expectedRevenue: number;
  expectedProfit: number;
  progress: number;
  status: PlanStatus;
  isFavorite: boolean;
  createdAt: string;
}

export type TaskStatus = 'To Do' | 'In Progress' | 'Completed' | 'Cancelled';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Task {
  id: string;
  companyId: string;
  title: string;
  description: string;
  assignedMemberId: string;
  assignedMemberName: string;
  assignedTo?: string;
  assignedToName?: string;
  deadline: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  planId?: string;
  planName?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  companyId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: UserRole;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  text: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'video' | 'audio' | 'file';
  attachmentName?: string;
  createdAt: string;
}

export interface AdminAnnouncement {
  id: string;
  companyId: string;
  title: string;
  content: string;
  createdById: string;
  createdByName: string;
  isPinned: boolean;
  isImportant: boolean;
  requiresAcknowledgement: boolean;
  acknowledgedUserIds: string[];
  expiresAt?: string;
  createdAt: string;
}

export type Announcement = AdminAnnouncement;

export interface AppNotification {
  id: string;
  companyId: string;
  title: string;
  message: string;
  type: 'sale' | 'stock' | 'purchase' | 'spending' | 'goal' | 'announcement' | 'task' | 'customer';
  isRead: boolean;
  createdAt: string;
  linkView?: string;
}

export interface ActivityLog {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  action: string;
  objectType: 'Product' | 'Sale' | 'Return' | 'Purchase' | 'Expense' | 'Admin Spending' | 'Customer' | 'Member' | 'Announcement' | 'Goal' | 'Plan';
  details: string;
  date: string;
  time: string;
  createdAt: string;
}
