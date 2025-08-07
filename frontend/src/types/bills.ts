// Bill types and interfaces for Priority Matrix UI

export type BillType = 'utility' | 'housing' | 'vehicle' | 'credit' | 'medical' | 'other';
export type BillStatus = 'active' | 'paid' | 'archived';
export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low';

// Core bill interface
export interface Bill {
  billId: string;
  name: string;
  creditorName: string;
  amountOverdue: number;
  totalAmount: number;
  originalDueDate: string;
  daysPastDue: number;
  billType: BillType;
  shutoffRisk: boolean;
  shutoffDate?: string;
  repoRisk: boolean;
  lateFeesAccruing: boolean;
  lateFeeAmount?: number;
  priorityScore: number;
  priorityLevel: PriorityLevel;
  priorityReason: string;
  status: BillStatus;
  createdAt: string;
  updatedAt: string;
}

// Bill creation/update payload
export interface BillPayload {
  name: string;
  creditorName: string;
  amountOverdue: number;
  totalAmount: number;
  originalDueDate: string;
  billType: BillType;
  shutoffRisk?: boolean;
  shutoffDate?: string;
  repoRisk?: boolean;
  lateFeesAccruing?: boolean;
  lateFeeAmount?: number;
}

// Priority calculation request
export interface PriorityCalculationRequest {
  billIds?: string[];
  recalculateAll?: boolean;
  userIncome?: number;
  essentialExpenses?: number;
}

// Priority calculation response
export interface PriorityCalculationResponse {
  success: boolean;
  data: {
    updatedBills: Bill[];
    calculationTimestamp: string;
    totalProcessed: number;
  };
  error?: string;
}

// Bills list API response
export interface BillsResponse {
  success: boolean;
  data: {
    bills: Bill[];
    totalCount: number;
    lastUpdated: string;
  };
  error?: string;
}

// Bill action responses
export interface BillActionResponse {
  success: boolean;
  data: {
    bill: Bill;
    message: string;
  };
  error?: string;
}

// Priority badge props
export interface PriorityBadgeProps {
  level: PriorityLevel;
  score: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
  className?: string;
  'aria-label'?: string;
}

// Bill priority card props
export interface BillPriorityCardProps {
  bill: Bill;
  onPayNow: (billId: string) => void;
  onSplitPayment: (billId: string) => void;
  onNegotiate: (billId: string) => void;
  onMarkPaid: (billId: string) => void;
  isLoading?: boolean;
  showActions?: boolean;
  className?: string;
}

// Priority matrix props
export interface PriorityMatrixProps {
  className?: string;
  showFilters?: boolean;
  showBulkActions?: boolean;
  onBillAction?: (action: BillAction, billId: string | string[]) => void;
  refreshInterval?: number;
}

// Bill actions
export type BillAction = 'pay' | 'split' | 'negotiate' | 'mark_paid' | 'archive' | 'edit';

// Filter options
export interface BillFilters {
  priorityLevels?: PriorityLevel[];
  billTypes?: BillType[];
  riskCategories?: ('shutoff' | 'repo' | 'late_fees')[];
  amountRange?: {
    min: number;
    max: number;
  };
  dateRange?: {
    start: string;
    end: string;
  };
}

// Sort options
export interface BillSortOptions {
  field: 'priorityScore' | 'amountOverdue' | 'originalDueDate' | 'name';
  direction: 'asc' | 'desc';
}

// Bills context state
export interface BillsState {
  bills: Bill[];
  selectedBills: string[];
  filters: BillFilters;
  sortOptions: BillSortOptions;
  isLoading: boolean;
  isCalculating: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// Bills context actions
export type BillsAction =
  | { type: 'FETCH_BILLS_START' }
  | { type: 'FETCH_BILLS_SUCCESS'; payload: { bills: Bill[]; lastUpdated: string } }
  | { type: 'FETCH_BILLS_ERROR'; payload: { error: string } }
  | { type: 'CALCULATE_PRIORITIES_START' }
  | { type: 'CALCULATE_PRIORITIES_SUCCESS'; payload: { bills: Bill[] } }
  | { type: 'CALCULATE_PRIORITIES_ERROR'; payload: { error: string } }
  | { type: 'UPDATE_BILL'; payload: { bill: Bill } }
  | { type: 'UPDATE_BILLS'; payload: { bills: Bill[] } }
  | { type: 'SELECT_BILLS'; payload: { billIds: string[] } }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_FILTERS'; payload: { filters: BillFilters } }
  | { type: 'SET_SORT'; payload: { sortOptions: BillSortOptions } }
  | { type: 'CLEAR_ERROR' };

// Bills context type
export interface BillsContextType extends BillsState {
  dispatch: React.Dispatch<BillsAction>;
  fetchBills: () => Promise<void>;
  calculatePriorities: (request?: PriorityCalculationRequest) => Promise<void>;
  updateBill: (billId: string, updates: Partial<Bill>) => Promise<void>;
  markBillPaid: (billId: string) => Promise<void>;
  markBillsPaid: (billIds: string[]) => Promise<void>;
  selectBill: (billId: string) => void;
  selectBills: (billIds: string[]) => void;
  clearSelection: () => void;
  setFilters: (filters: BillFilters) => void;
  setSortOptions: (sortOptions: BillSortOptions) => void;
}

// Utility types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
  data?: any;
}

export interface ActionButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'success';
  size: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

// Formatting utilities
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days ago`;
  } else if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else {
    return `${diffDays} days`;
  }
};

// Priority level utilities
export const getPriorityColor = (level: PriorityLevel): string => {
  switch (level) {
    case 'urgent':
      return 'crisis';
    case 'high':
      return 'urgent';
    case 'medium':
      return 'caution';
    case 'low':
      return 'stable';
    default:
      return 'gray';
  }
};

export const getPriorityLabel = (level: PriorityLevel): string => {
  switch (level) {
    case 'urgent':
      return 'Urgent';
    case 'high':
      return 'High Priority';
    case 'medium':
      return 'Medium Priority';
    case 'low':
      return 'Low Priority';
    default:
      return 'Unknown';
  }
};

// Bill type utilities
export const getBillTypeIcon = (type: BillType): string => {
  switch (type) {
    case 'utility':
      return '⚡';
    case 'housing':
      return '🏠';
    case 'vehicle':
      return '🚗';
    case 'credit':
      return '💳';
    case 'medical':
      return '🏥';
    default:
      return '📄';
  }
};

export const getBillTypeLabel = (type: BillType): string => {
  switch (type) {
    case 'utility':
      return 'Utility';
    case 'housing':
      return 'Housing';
    case 'vehicle':
      return 'Vehicle';
    case 'credit':
      return 'Credit Card';
    case 'medical':
      return 'Medical';
    case 'other':
      return 'Other';
    default:
      return 'Unknown';
  }
};

// Validation utilities
export const validateBill = (bill: Partial<BillPayload>): string[] => {
  const errors: string[] = [];
  
  if (!bill.name?.trim()) {
    errors.push('Bill name is required');
  }
  
  if (!bill.creditorName?.trim()) {
    errors.push('Creditor name is required');
  }
  
  if (!bill.amountOverdue || bill.amountOverdue <= 0) {
    errors.push('Amount overdue must be greater than $0');
  }
  
  if (!bill.totalAmount || bill.totalAmount <= 0) {
    errors.push('Total amount must be greater than $0');
  }
  
  if (bill.amountOverdue && bill.totalAmount && bill.amountOverdue > bill.totalAmount) {
    errors.push('Amount overdue cannot exceed total amount');
  }
  
  if (!bill.originalDueDate) {
    errors.push('Original due date is required');
  }
  
  if (!bill.billType) {
    errors.push('Bill type is required');
  }
  
  return errors;
};

// Risk assessment utilities
export const getRiskIndicators = (bill: Bill): { type: string; label: string; color: string }[] => {
  const risks = [];
  
  if (bill.shutoffRisk) {
    risks.push({
      type: 'shutoff',
      label: 'Shutoff Risk',
      color: 'crisis'
    });
  }
  
  if (bill.repoRisk) {
    risks.push({
      type: 'repo',
      label: 'Repo Risk',
      color: 'crisis'
    });
  }
  
  if (bill.lateFeesAccruing) {
    risks.push({
      type: 'late_fees',
      label: 'Late Fees',
      color: 'urgent'
    });
  }
  
  return risks;
};

// Default values
export const DEFAULT_BILL_FILTERS: BillFilters = {
  priorityLevels: [],
  billTypes: [],
  riskCategories: [],
};

export const DEFAULT_SORT_OPTIONS: BillSortOptions = {
  field: 'priorityScore',
  direction: 'desc',
};

export const DEFAULT_BILLS_STATE: BillsState = {
  bills: [],
  selectedBills: [],
  filters: DEFAULT_BILL_FILTERS,
  sortOptions: DEFAULT_SORT_OPTIONS,
  isLoading: false,
  isCalculating: false,
  error: null,
  lastUpdated: null,
};