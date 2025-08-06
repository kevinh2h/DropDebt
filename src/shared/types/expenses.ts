/**
 * DropDebt Essential Needs Protection System
 * 
 * Comprehensive data model for protecting users' essential living expenses
 * while managing debt repayment. Prevents dangerous financial decisions
 * by calculating protected amounts for basic needs.
 */

import { BillType } from './bills';

// ===================
// Core Enums & Types
// ===================

export enum EssentialCategory {
  // Housing & Shelter
  RENT_MORTGAGE = 'RENT_MORTGAGE',
  UTILITIES = 'UTILITIES',
  PROPERTY_TAX = 'PROPERTY_TAX',
  HOME_INSURANCE = 'HOME_INSURANCE',
  
  // Food & Nutrition
  GROCERIES = 'GROCERIES',
  BASIC_NUTRITION = 'BASIC_NUTRITION',
  
  // Transportation
  CAR_PAYMENT = 'CAR_PAYMENT',
  CAR_INSURANCE = 'CAR_INSURANCE',
  GAS_MAINTENANCE = 'GAS_MAINTENANCE',
  PUBLIC_TRANSIT = 'PUBLIC_TRANSIT',
  
  // Healthcare
  HEALTH_INSURANCE = 'HEALTH_INSURANCE',
  PRESCRIPTIONS = 'PRESCRIPTIONS',
  MEDICAL_NECESSITIES = 'MEDICAL_NECESSITIES',
  
  // Dependent Care
  CHILDCARE = 'CHILDCARE',
  SCHOOL_COSTS = 'SCHOOL_COSTS',
  CHILD_SUPPORT = 'CHILD_SUPPORT',
  ELDER_CARE = 'ELDER_CARE',
  
  // Emergency Buffer
  EMERGENCY_CUSHION = 'EMERGENCY_CUSHION',
  MINIMUM_SAVINGS = 'MINIMUM_SAVINGS'
}

export enum FlexibilityLevel {
  FIXED = 'FIXED',               // Cannot be reduced (rent, insurance)
  SEMI_FLEXIBLE = 'SEMI_FLEXIBLE', // Can be slightly adjusted (utilities, gas)
  FLEXIBLE = 'FLEXIBLE',         // Can be significantly reduced (groceries)
  VARIABLE = 'VARIABLE'          // Highly variable month-to-month
}

export enum PaymentFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BI_WEEKLY = 'BI_WEEKLY',
  SEMI_MONTHLY = 'SEMI_MONTHLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUALLY = 'ANNUALLY',
  IRREGULAR = 'IRREGULAR'
}

export enum IncomeFrequency {
  WEEKLY = 'WEEKLY',
  BI_WEEKLY = 'BI_WEEKLY',
  SEMI_MONTHLY = 'SEMI_MONTHLY',
  MONTHLY = 'MONTHLY',
  IRREGULAR = 'IRREGULAR',
  SEASONAL = 'SEASONAL',
  COMMISSION = 'COMMISSION'
}

export enum IncomeSourceType {
  EMPLOYMENT = 'EMPLOYMENT',
  SELF_EMPLOYMENT = 'SELF_EMPLOYMENT',
  GIG_ECONOMY = 'GIG_ECONOMY',
  GOVERNMENT_BENEFITS = 'GOVERNMENT_BENEFITS',
  DISABILITY = 'DISABILITY',
  UNEMPLOYMENT = 'UNEMPLOYMENT',
  CHILD_SUPPORT = 'CHILD_SUPPORT',
  ALIMONY = 'ALIMONY',
  PENSION = 'PENSION',
  INVESTMENT = 'INVESTMENT',
  OTHER = 'OTHER'
}

export enum BudgetSafetyLevel {
  CRITICAL = 'CRITICAL',         // Cannot meet essentials
  DANGEROUS = 'DANGEROUS',       // Meeting essentials but no buffer
  TIGHT = 'TIGHT',              // Small buffer for emergencies
  MODERATE = 'MODERATE',         // Reasonable buffer
  COMFORTABLE = 'COMFORTABLE'    // Good financial cushion
}

// ===================
// Essential Expense Interfaces
// ===================

export interface EssentialExpense {
  expenseId: string;
  category: EssentialCategory;
  name: string;
  description?: string;
  
  // Amount calculations
  monthlyAmount: number;
  minimumAmount: number;        // Absolute minimum to survive
  comfortableAmount: number;    // Reasonable living standard
  currentAmount: number;        // What user currently spends
  
  // Payment details
  paymentFrequency: PaymentFrequency;
  nextPaymentDate?: string;
  dayOfMonth?: number;          // For monthly payments
  dayOfWeek?: number;           // For weekly payments
  
  // Flexibility
  flexibility: FlexibilityLevel;
  canDefer: boolean;
  deferralConsequence?: string;
  maximumDeferralDays?: number;
  
  // Seasonal variations
  hasSeasonalVariation: boolean;
  seasonalFactors?: SeasonalFactor[];
  
  // Related bills
  linkedBillIds?: string[];     // Connect to bills in the system
  linkedBillTypes?: BillType[];
  
  // Validation
  isVerified: boolean;
  verificationMethod?: 'bank_statement' | 'bill_upload' | 'manual_entry';
  lastVerifiedDate?: string;
}

export interface SeasonalFactor {
  months: number[];             // e.g., [11, 12, 1, 2] for winter
  multiplier: number;           // e.g., 1.5 for 50% increase
  reason: string;               // e.g., "Winter heating costs"
}

// ===================
// Income Models
// ===================

export interface IncomeSource {
  sourceId: string;
  userId: string;
  name: string;
  type: IncomeSourceType;
  
  // Amount details
  grossAmount: number;
  netAmount: number;            // After taxes/deductions
  frequency: IncomeFrequency;
  
  // Payment dates
  nextPaymentDate?: string;
  payDates?: PaySchedule;
  
  // Stability
  isStable: boolean;
  startDate: string;
  endDate?: string;             // For temporary income
  probabilityOfContinuation: number; // 0-1 confidence score
  
  // Deductions
  deductions?: IncomeDeduction[];
  
  // Verification
  isVerified: boolean;
  verificationMethod?: 'pay_stub' | 'bank_deposit' | 'tax_document' | 'manual';
  lastVerifiedDate?: string;
}

export interface PaySchedule {
  type: 'fixed_dates' | 'day_of_month' | 'day_of_week' | 'irregular';
  
  // For fixed dates (semi-monthly)
  fixedDates?: number[];        // e.g., [1, 15] or [5, 20]
  
  // For monthly
  dayOfMonth?: number;
  
  // For weekly/bi-weekly
  dayOfWeek?: number;           // 0-6 (Sunday-Saturday)
  weekInterval?: number;        // 1 for weekly, 2 for bi-weekly
  
  // For irregular
  expectedDates?: string[];     // ISO date strings
}

export interface IncomeDeduction {
  name: string;
  type: 'tax' | 'insurance' | 'retirement' | 'garnishment' | 'other';
  amount: number;
  isPreTax: boolean;
  isVoluntary: boolean;
}

// ===================
// Budget Protection Models
// ===================

export interface EssentialNeedsProfile {
  userId: string;
  profileId: string;
  createdAt: string;
  updatedAt: string;
  
  // Household info
  householdSize: number;
  dependents: number;
  hasSpecialNeeds: boolean;
  specialNeedsDetails?: string;
  
  // Location factors
  zipCode: string;
  costOfLivingIndex?: number;  // Relative to national average
  
  // Essential expenses
  essentialExpenses: EssentialExpense[];
  totalMonthlyEssentials: number;
  totalMinimumEssentials: number;
  
  // Income sources
  incomeSources: IncomeSource[];
  totalMonthlyIncome: number;
  totalStableIncome: number;
  
  // Protection calculations
  protectedAmount: number;      // Amount that cannot be used for debt
  emergencyCushion: number;     // Additional buffer
  availableForDebt: number;     // Safe amount for debt payments
  
  // Budget safety
  budgetSafetyLevel: BudgetSafetyLevel;
  safetyScore: number;          // 0-100 score
  riskFactors: string[];
  recommendations: ProtectionRecommendation[];
}

export interface ProtectionRecommendation {
  type: 'increase_cushion' | 'reduce_expense' | 'find_assistance' | 'defer_payment';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category?: EssentialCategory;
  description: string;
  potentialImpact: number;      // Dollar amount
  implementation: string;       // How to implement
  resources?: string[];         // Helpful resources/links
}

// ===================
// Calculation Structures
// ===================

export interface BudgetSafetyCalculation {
  calculatedAt: string;
  
  // Income analysis
  monthlyIncome: {
    gross: number;
    net: number;
    stable: number;
    variable: number;
  };
  
  // Expense analysis
  monthlyExpenses: {
    essentials: number;
    minimumEssentials: number;
    flexibleEssentials: number;
    nonEssentials: number;
  };
  
  // Protection levels
  protection: {
    baseProtection: number;     // Minimum essentials
    comfortProtection: number;  // Comfortable essentials
    emergencyBuffer: number;    // Additional cushion
    totalProtected: number;     // Total protected from debt
  };
  
  // Available for debt
  debtCapacity: {
    maximum: number;            // Absolute max for debt payments
    recommended: number;        // Safe amount recommended
    aggressive: number;         // Aggressive but possible
    conservative: number;       // Very safe amount
  };
  
  // Risk assessment
  riskMetrics: {
    incomeStability: number;    // 0-100
    expenseFlexibility: number; // 0-100
    emergencyReadiness: number; // 0-100
    overallSafety: number;      // 0-100
  };
  
  // Time-based analysis
  cashFlowProjection: CashFlowProjection[];
}

export interface CashFlowProjection {
  date: string;
  expectedIncome: number;
  essentialExpenses: number;
  availableCash: number;
  runningBalance: number;
  warnings?: string[];
}

// ===================
// Payment Plan Validation
// ===================

export interface PaymentPlanValidation {
  planId: string;
  validatedAt: string;
  
  // Plan details
  proposedPayment: number;
  paymentFrequency: PaymentFrequency;
  duration: number;             // Months
  
  // Validation results
  isSafe: boolean;
  safetyScore: number;          // 0-100
  
  // Impact analysis
  budgetImpact: {
    remainingAfterPayment: number;
    percentOfIncome: number;
    percentOfAvailable: number;
    emergencyBufferRemaining: number;
  };
  
  // Risk factors
  risks: ValidationRisk[];
  
  // Recommendations
  recommendations: string[];
  alternativePayment?: number;  // Suggested safer amount
}

export interface ValidationRisk {
  type: 'income_instability' | 'no_emergency_fund' | 'expense_increase' | 'seasonal_shortage';
  severity: 'high' | 'medium' | 'low';
  description: string;
  mitigation?: string;
}

// ===================
// Integration Interfaces
// ===================

export interface BillToEssentialMapping {
  billId: string;
  billType: BillType;
  essentialCategory: EssentialCategory;
  isFullyEssential: boolean;
  essentialPercentage?: number; // If partially essential
  notes?: string;
}

export interface EssentialNeedsAlert {
  alertId: string;
  userId: string;
  type: 'payment_too_high' | 'essential_at_risk' | 'no_emergency_fund' | 'income_decreased';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  triggerAmount?: number;
  recommendedAction: string;
  createdAt: string;
  acknowledged?: boolean;
  acknowledgedAt?: string;
}

// ===================
// DynamoDB Storage Patterns
// ===================

export interface EssentialNeedsDynamoItem {
  // Primary Keys
  PK: string;                   // USER#{userId}
  SK: string;                   // ESSENTIAL_PROFILE#{profileId}
  
  // GSI for queries
  GSI1PK: string;               // USER#{userId}#ESSENTIALS
  GSI1SK: string;               // {updatedAt}
  
  // Data
  ProfileId: string;
  UserId: string;
  HouseholdSize: number;
  Dependents: number;
  ZipCode: string;
  
  // Aggregated data (denormalized for performance)
  TotalMonthlyEssentials: number;
  TotalMonthlyIncome: number;
  ProtectedAmount: number;
  AvailableForDebt: number;
  BudgetSafetyLevel: BudgetSafetyLevel;
  SafetyScore: number;
  
  // Complex data as JSON strings
  EssentialExpenses: string;    // JSON array
  IncomeSources: string;        // JSON array
  RiskFactors: string;          // JSON array
  Recommendations: string;      // JSON array
  
  // Timestamps
  CreatedAt: string;
  UpdatedAt: string;
  LastCalculatedAt: string;
}

export interface EssentialExpenseDynamoItem {
  // Primary Keys
  PK: string;                   // USER#{userId}
  SK: string;                   // ESSENTIAL_EXPENSE#{expenseId}
  
  // GSI for category queries
  GSI1PK: string;               // USER#{userId}#CATEGORY#{category}
  GSI1SK: string;               // {monthlyAmount}
  
  // Data
  ExpenseId: string;
  UserId: string;
  Category: EssentialCategory;
  Name: string;
  MonthlyAmount: number;
  MinimumAmount: number;
  CurrentAmount: number;
  Flexibility: FlexibilityLevel;
  IsVerified: boolean;
  
  // Timestamps
  CreatedAt: string;
  UpdatedAt: string;
}

// ===================
// Query Patterns
// ===================

export interface EssentialNeedsQueryPatterns {
  // Get user's essential profile
  getUserProfile: {
    PK: string;                 // USER#{userId}
    SK: string;                 // begins_with(ESSENTIAL_PROFILE#)
  };
  
  // Get all essential expenses
  getUserExpenses: {
    PK: string;                 // USER#{userId}
    SK: string;                 // begins_with(ESSENTIAL_EXPENSE#)
  };
  
  // Get expenses by category
  getExpensesByCategory: {
    GSI1PK: string;             // USER#{userId}#CATEGORY#{category}
    GSI1SK: string;             // Sort by amount
  };
  
  // Get income sources
  getIncomeSources: {
    PK: string;                 // USER#{userId}
    SK: string;                 // begins_with(INCOME_SOURCE#)
  };
}

// ===================
// Calculation Helpers
// ===================

export const ESSENTIAL_MINIMUMS = {
  // Per person per month minimums (adjust by location)
  FOOD_PER_PERSON: 300,
  UTILITIES_BASE: 150,
  TRANSPORTATION_MINIMUM: 200,
  HEALTHCARE_MINIMUM: 100,
  EMERGENCY_BUFFER_MINIMUM: 100,
  
  // Multipliers
  DEPENDENT_MULTIPLIER: 0.7,     // Additional per dependent
  HIGH_COL_MULTIPLIER: 1.5,      // High cost of living areas
  LOW_COL_MULTIPLIER: 0.8,       // Low cost of living areas
};

export const SAFETY_THRESHOLDS = {
  CRITICAL: 0.9,                  // Using >90% of income for essentials
  DANGEROUS: 0.8,                 // Using >80% of income for essentials
  TIGHT: 0.7,                     // Using >70% of income for essentials
  MODERATE: 0.6,                  // Using >60% of income for essentials
  COMFORTABLE: 0.5                // Using <50% of income for essentials
};

// ===================
// Export Types
// ===================

export type {
  EssentialNeedsProfile,
  EssentialExpense,
  IncomeSource,
  BudgetSafetyCalculation,
  PaymentPlanValidation,
  ProtectionRecommendation,
  EssentialNeedsAlert
};