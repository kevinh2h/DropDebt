import { User, Bill, Expense, PaymentArrangement } from './index';

// Common API Response Structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string; // For validation errors
}

// API Request/Response Types for Each Feature

// ===== BILL PRIORITIZATION =====
export interface BillPrioritizationRequest {
  userId: string;
  availableAmount?: number; // Optional: to get payment recommendations
  priorityFactors?: {
    dueDateWeight?: number;    // 0-1, default 0.3
    essentialWeight?: number;  // 0-1, default 0.4
    lateFeeWeight?: number;   // 0-1, default 0.2
    interestWeight?: number;  // 0-1, default 0.1
  };
}

export interface BillPrioritizationResponse {
  userId: string;
  bills: PrioritizedBill[];
  totalBillAmount: number;
  highPriorityCount: number;
  recommendations: string[];
  calculatedAt: string;
}

export interface PrioritizedBill extends Bill {
  rank: number;
  priorityFactors: {
    daysUntilDue: number;
    isEssential: boolean;
    lateFeeRisk: number;
    interestImpact: number;
  };
  recommendedAction: 'pay_full' | 'pay_minimum' | 'defer' | 'negotiate';
}

// ===== PAYMENT SPLITTING =====
export interface PaymentSplittingRequest {
  userId: string;
  availableAmount: number;
  billIds?: string[]; // Optional: specific bills to consider
  strategy: 'priority_first' | 'equal_split' | 'minimum_first' | 'avalanche' | 'snowball';
  allowPartialPayments: boolean;
}

export interface PaymentSplittingResponse {
  userId: string;
  availableAmount: number;
  allocatedAmount: number;
  remainingAmount: number;
  paymentPlan: PaymentAllocation[];
  unallocatedBills: UnallocatedBill[];
  projectedSavings: number; // Interest/fees saved
  optimizationScore: number; // 0-100, how optimal this split is
}

export interface PaymentAllocation {
  billId: string;
  billName: string;
  originalAmount: number;
  allocatedAmount: number;
  paymentType: 'full' | 'partial' | 'minimum';
  priority: number;
  reasoning: string;
}

export interface UnallocatedBill {
  billId: string;
  billName: string;
  amount: number;
  daysUntilDue: number;
  consequence: string; // What happens if not paid
}

// ===== ESSENTIAL NEEDS PROTECTION =====
export interface EssentialProtectionRequest {
  userId: string;
  proposedBudget?: Record<string, number>; // category -> amount
  monthlyIncome: number;
}

export interface EssentialProtectionResponse {
  userId: string;
  totalEssentialCost: number;
  essentialCoverageRatio: number; // essential cost / income
  protectionStatus: 'safe' | 'at_risk' | 'endangered';
  essentialExpenses: EssentialExpenseItem[];
  recommendations: ProtectionRecommendation[];
  emergencyFundNeeded: number;
}

export interface EssentialExpenseItem {
  expenseId: string;
  name: string;
  category: string;
  amount: number;
  essentialLevel: 'critical' | 'important' | 'moderate';
  canReduce: boolean;
  reductionPotential?: number;
}

export interface ProtectionRecommendation {
  type: 'increase_income' | 'reduce_expense' | 'build_emergency_fund' | 'restructure_debt';
  priority: 'high' | 'medium' | 'low';
  description: string;
  potentialImpact: number; // Dollar amount
  timeframe: 'immediate' | 'short_term' | 'long_term';
}

// ===== BUDGET ANALYSIS =====
export interface BudgetAnalysisRequest {
  userId: string;
  timeframe: 'current_month' | 'last_month' | 'last_3_months' | 'last_6_months';
  includeProjections: boolean;
}

export interface BudgetAnalysisResponse {
  userId: string;
  timeframe: string;
  totalIncome: number;
  totalExpenses: number;
  totalBills: number;
  netCashFlow: number;
  categoryBreakdown: CategoryBreakdown[];
  trends: BudgetTrend[];
  alerts: BudgetAlert[];
  recommendations: BudgetRecommendation[];
  projections?: BudgetProjection;
}

export interface CategoryBreakdown {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  percentageOfIncome: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface BudgetTrend {
  category: string;
  direction: 'up' | 'down' | 'stable';
  percentageChange: number;
  significance: 'minor' | 'moderate' | 'major';
}

export interface BudgetAlert {
  type: 'overspending' | 'underspending' | 'unusual_pattern' | 'bill_increase';
  category?: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  suggestedAction?: string;
}

export interface BudgetRecommendation {
  category: string;
  currentAmount: number;
  recommendedAmount: number;
  reasoning: string;
  difficulty: 'easy' | 'moderate' | 'hard';
  potentialSavings: number;
}

export interface BudgetProjection {
  nextMonthForecast: {
    expectedIncome: number;
    projectedExpenses: number;
    projectedSurplus: number;
  };
  yearEndProjection: {
    totalSavings: number;
    debtReduction: number;
    financialHealthScore: number;
  };
}

// ===== USER MANAGEMENT =====
export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  totalMonthlyIncome: number;
  preferredPaymentMethod: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  totalMonthlyIncome?: number;
  preferredPaymentMethod?: string;
}

export interface GetUserResponse extends ApiResponse<User> {}
export interface CreateUserResponse extends ApiResponse<User> {}
export interface UpdateUserResponse extends ApiResponse<User> {}

// ===== BILL MANAGEMENT =====
export interface CreateBillRequest {
  billName: string;
  amount: number;
  dueDate: string;
  category: string;
  isEssential: boolean;
  minimumPayment?: number;
  interestRate?: number;
  lateFee?: number;
  description?: string;
  creditorName?: string;
}

export interface UpdateBillRequest {
  billName?: string;
  amount?: number;
  dueDate?: string;
  category?: string;
  isEssential?: boolean;
  minimumPayment?: number;
  interestRate?: number;
  lateFee?: number;
  description?: string;
  status?: string;
}

export interface ListBillsResponse extends ApiResponse<Bill[]> {}
export interface CreateBillResponse extends ApiResponse<Bill> {}
export interface UpdateBillResponse extends ApiResponse<Bill> {}
export interface DeleteBillResponse extends ApiResponse<{ billId: string }> {}

// Common query parameters
export interface ListQueryParams {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: Record<string, any>;
}