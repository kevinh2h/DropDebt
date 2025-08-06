/**
 * DropDebt Bills Data Model
 * 
 * Comprehensive data model for bills with consequence-based prioritization
 * Supports real-world consequence analysis for the Catch-Up Prioritization Matrix
 */

// ===================
// Core Enums & Types
// ===================

export enum BillStatus {
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  IN_ARRANGEMENT = 'IN_ARRANGEMENT',
  ARCHIVED = 'ARCHIVED',
  CANCELLED = 'CANCELLED'
}

export enum BillType {
  // Housing
  RENT = 'RENT',
  MORTGAGE = 'MORTGAGE',
  HOME_INSURANCE = 'HOME_INSURANCE',
  PROPERTY_TAX = 'PROPERTY_TAX',
  HOA_FEES = 'HOA_FEES',
  
  // Utilities
  ELECTRIC = 'ELECTRIC',
  GAS = 'GAS',
  WATER = 'WATER',
  SEWER = 'SEWER',
  TRASH = 'TRASH',
  INTERNET = 'INTERNET',
  CABLE_TV = 'CABLE_TV',
  PHONE = 'PHONE',
  
  // Transportation
  CAR_PAYMENT = 'CAR_PAYMENT',
  CAR_INSURANCE = 'CAR_INSURANCE',
  VEHICLE_REGISTRATION = 'VEHICLE_REGISTRATION',
  
  // Financial
  CREDIT_CARD = 'CREDIT_CARD',
  PERSONAL_LOAN = 'PERSONAL_LOAN',
  STUDENT_LOAN = 'STUDENT_LOAN',
  PAYDAY_LOAN = 'PAYDAY_LOAN',
  
  // Healthcare
  HEALTH_INSURANCE = 'HEALTH_INSURANCE',
  MEDICAL_BILL = 'MEDICAL_BILL',
  PRESCRIPTION = 'PRESCRIPTION',
  
  // Other
  SUBSCRIPTION = 'SUBSCRIPTION',
  MEMBERSHIP = 'MEMBERSHIP',
  OTHER = 'OTHER'
}

export enum ConsequenceType {
  SHUTOFF = 'SHUTOFF',
  EVICTION = 'EVICTION',
  FORECLOSURE = 'FORECLOSURE',
  REPOSSESSION = 'REPOSSESSION',
  LICENSE_SUSPENSION = 'LICENSE_SUSPENSION',
  CREDIT_DAMAGE = 'CREDIT_DAMAGE',
  LATE_FEES = 'LATE_FEES',
  COLLECTION = 'COLLECTION',
  LEGAL_ACTION = 'LEGAL_ACTION'
}

export enum ConsequenceUrgency {
  IMMEDIATE = 'IMMEDIATE',        // 0-7 days
  SHORT_TERM = 'SHORT_TERM',      // 8-30 days
  MEDIUM_TERM = 'MEDIUM_TERM',    // 31-90 days
  LONG_TERM = 'LONG_TERM'         // 90+ days
}

// ===================
// Consequence Models
// ===================

export interface BaseConsequence {
  type: ConsequenceType;
  urgency: ConsequenceUrgency;
  severity: number; // 0-100 scale
  description: string;
  estimatedDays: number; // Days until consequence occurs
  preventable: boolean;
  recoverable: boolean;
  recoveryCost?: number;
  recoveryTimeMonths?: number;
}

export interface UtilityShutoffConsequence extends BaseConsequence {
  type: ConsequenceType.SHUTOFF;
  utilityType: 'electric' | 'gas' | 'water' | 'internet' | 'phone';
  shutoffDate?: string; // ISO date if known
  reconnectionFee: number;
  depositRequired?: number;
  gracePeriodDays: number;
  winterMoratorium?: boolean; // Protection during winter months
}

export interface HousingLossConsequence extends BaseConsequence {
  type: ConsequenceType.EVICTION | ConsequenceType.FORECLOSURE;
  noticeDate?: string;
  courtDate?: string;
  moveOutDate?: string;
  legalFees?: number;
  movingCosts?: number;
  securityDepositLoss?: number;
}

export interface VehicleRepoConsequence extends BaseConsequence {
  type: ConsequenceType.REPOSSESSION;
  vehicleValue: number;
  deficiencyBalance?: number;
  repoFees?: number;
  storageFeesPerDay?: number;
  redemptionPeriodDays?: number;
}

export interface LicenseSuspensionConsequence extends BaseConsequence {
  type: ConsequenceType.LICENSE_SUSPENSION;
  suspensionType: 'drivers_license' | 'vehicle_registration' | 'professional_license';
  reinstatementFee: number;
  additionalRequirements?: string[];
}

export interface CreditDamageConsequence extends BaseConsequence {
  type: ConsequenceType.CREDIT_DAMAGE;
  currentCreditScore?: number;
  estimatedScoreDrop: number;
  reportingDate?: string;
  yearsOnReport: number;
  impactOnBorrowing: 'severe' | 'moderate' | 'minimal';
}

export interface LateFeeConsequence extends BaseConsequence {
  type: ConsequenceType.LATE_FEES;
  lateFeeAmount: number;
  isCompounding: boolean;
  compoundingFrequency?: 'daily' | 'weekly' | 'monthly';
  maxFeeAmount?: number;
  feePercentage?: number;
}

export type BillConsequence = 
  | UtilityShutoffConsequence
  | HousingLossConsequence
  | VehicleRepoConsequence
  | LicenseSuspensionConsequence
  | CreditDamageConsequence
  | LateFeeConsequence;

// ===================
// Payment Terms
// ===================

export interface PaymentTerms {
  minimumPayment?: number;
  gracePeriodDays: number;
  lateFeeAmount?: number;
  lateFeePercentage?: number;
  interestRate?: number; // APR as decimal (0.24 = 24%)
  compoundingFrequency?: 'daily' | 'monthly' | 'annually';
  paymentDueDayOfMonth?: number;
  autopayDiscount?: number;
  earlyPaymentDiscount?: number;
}

// ===================
// Negotiation & Arrangements
// ===================

export interface PaymentArrangement {
  arrangementId: string;
  createdAt: string;
  expiresAt?: string;
  type: 'payment_plan' | 'forbearance' | 'modification' | 'settlement';
  status: 'active' | 'completed' | 'broken' | 'expired';
  originalAmount: number;
  arrangementAmount: number;
  monthlyPayment?: number;
  numberOfPayments?: number;
  nextPaymentDate?: string;
  remainingPayments?: number;
  terms: string;
  creditorContact?: {
    name: string;
    phone: string;
    email?: string;
    department?: string;
  };
}

export interface NegotiationOpportunity {
  windowDays: number; // Days remaining to negotiate
  likelihood: 'high' | 'medium' | 'low';
  strategies: string[];
  bestContactTime?: string;
  successFactors: string[];
  requiredDocuments?: string[];
}

// ===================
// Main Bill Interface
// ===================

export interface Bill {
  // Primary Keys (DynamoDB)
  PK: string;           // USER#{userId}
  SK: string;           // BILL#{billId}
  
  // GSI1 Keys for priority queries
  GSI1PK: string;       // USER#{userId}#PRIORITY
  GSI1SK: string;       // Zero-padded priority score for sorting
  
  // Basic Information
  billId: string;
  userId: string;
  name: string;
  description?: string;
  type: BillType;
  status: BillStatus;
  
  // Financial Details
  originalAmount: number;
  currentBalance: number;
  minimumPayment?: number;
  interestRate?: number;
  
  // Dates
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  originalDueDate: string;
  lastPaymentDate?: string;
  nextDueDate?: string;
  
  // Priority & Consequences
  priority: number;                    // 0-100 calculated score
  priorityCalculatedAt: string;
  isEssential: boolean;
  consequences: BillConsequence[];
  highestConsequenceSeverity: number;  // Max severity from consequences
  daysOverdue: number;
  
  // Payment Information
  paymentTerms: PaymentTerms;
  paymentArrangement?: PaymentArrangement;
  negotiationOpportunity?: NegotiationOpportunity;
  
  // Creditor Information
  creditor: {
    name: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    customerServiceHours?: string;
    onlineAccountUrl?: string;
  };
  
  // Account Details
  accountNumber?: string;  // Encrypted/masked
  statementDate?: string;
  paymentMethods?: Array<{
    type: 'online' | 'phone' | 'mail' | 'autopay';
    details: string;
    processingDays: number;
    fee?: number;
  }>;
  
  // Historical Data
  paymentHistory?: Array<{
    date: string;
    amount: number;
    method: string;
    confirmationNumber?: string;
  }>;
  
  // Tags and Categories
  tags?: string[];
  category?: string;
  
  // Metadata
  source: 'manual' | 'imported' | 'linked';
  importedFrom?: string;
  lastSyncAt?: string;
  notes?: string;
}

// ===================
// Priority Calculation
// ===================

export interface PriorityFactors {
  // Consequence-based weights (primary factors)
  immediateConsequenceWeight: number;     // 0.40 - Shutoff, eviction, repo risk
  financialImpactWeight: number;          // 0.25 - Late fees, credit damage
  recoveryDifficultyWeight: number;       // 0.20 - Time/cost to fix after default
  
  // Traditional factors (secondary)
  dueDateWeight: number;                  // 0.10 - Days overdue/until due
  amountWeight: number;                   // 0.05 - Bill amount relative to others
  
  // Total should equal 1.0
}

export interface PriorityCalculation {
  billId: string;
  calculatedAt: string;
  finalScore: number;
  factors: PriorityFactors;
  
  // Individual component scores (0-100)
  scores: {
    immediateConsequence: number;
    financialImpact: number;
    recoveryDifficulty: number;
    dueDate: number;
    amount: number;
  };
  
  // Explanation for user
  reasoning: {
    primaryReason: string;
    riskFactors: string[];
    recommendations: string[];
  };
}

// ===================
// DynamoDB Patterns
// ===================

export interface BillQueryPatterns {
  // Get all bills for user
  getUserBills: {
    PK: string;           // USER#{userId}
    SK: string;           // begins_with(BILL#)
  };
  
  // Get bills by priority (GSI1)
  getBillsByPriority: {
    GSI1PK: string;       // USER#{userId}#PRIORITY
    GSI1SK: string;       // Sort by priority score (DESC)
  };
  
  // Get bills by status
  getBillsByStatus: {
    PK: string;           // USER#{userId}
    SK: string;           // begins_with(BILL#)
    FilterExpression: string; // status = :status
  };
  
  // Get overdue bills
  getOverdueBills: {
    PK: string;           // USER#{userId}
    SK: string;           // begins_with(BILL#)
    FilterExpression: string; // daysOverdue > :days
  };
}

// ===================
// Sample Data Examples
// ===================

export const SAMPLE_ELECTRIC_BILL: Bill = {
  PK: 'USER#user123',
  SK: 'BILL#electric-001',
  GSI1PK: 'USER#user123#PRIORITY',
  GSI1SK: '000095', // High priority - near shutoff
  
  billId: 'electric-001',
  userId: 'user123',
  name: 'Electric Bill - City Power',
  type: BillType.ELECTRIC,
  status: BillStatus.OVERDUE,
  
  originalAmount: 245.67,
  currentBalance: 245.67,
  minimumPayment: 245.67,
  
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-02-01T15:30:00Z',
  dueDate: '2024-01-25T00:00:00Z',
  originalDueDate: '2024-01-25T00:00:00Z',
  
  priority: 95,
  priorityCalculatedAt: '2024-02-01T15:30:00Z',
  isEssential: true,
  daysOverdue: 7,
  highestConsequenceSeverity: 95,
  
  consequences: [
    {
      type: ConsequenceType.SHUTOFF,
      urgency: ConsequenceUrgency.IMMEDIATE,
      severity: 95,
      description: 'Electric service will be disconnected in 3 days',
      estimatedDays: 3,
      preventable: true,
      recoverable: true,
      recoveryCost: 125.00,
      recoveryTimeMonths: 0,
      utilityType: 'electric',
      shutoffDate: '2024-02-04T17:00:00Z',
      reconnectionFee: 125.00,
      gracePeriodDays: 10
    } as UtilityShutoffConsequence
  ],
  
  paymentTerms: {
    gracePeriodDays: 10,
    lateFeeAmount: 25.00,
    paymentDueDayOfMonth: 25
  },
  
  creditor: {
    name: 'City Power Company',
    phone: '555-123-4567',
    customerServiceHours: 'Mon-Fri 8AM-6PM',
    onlineAccountUrl: 'https://citypower.com/account'
  },
  
  source: 'manual',
  category: 'utilities',
  tags: ['essential', 'shutoff-risk']
};

export const SAMPLE_CREDIT_CARD_BILL: Bill = {
  PK: 'USER#user123',
  SK: 'BILL#cc-001',
  GSI1PK: 'USER#user123#PRIORITY',
  GSI1SK: '000065', // Medium priority
  
  billId: 'cc-001',
  userId: 'user123',
  name: 'Chase Visa Credit Card',
  type: BillType.CREDIT_CARD,
  status: BillStatus.OVERDUE,
  
  originalAmount: 1245.67,
  currentBalance: 1270.67, // Includes late fee
  minimumPayment: 35.00,
  interestRate: 0.2399, // 23.99% APR
  
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-02-01T15:30:00Z',
  dueDate: '2024-01-15T00:00:00Z',
  originalDueDate: '2024-01-15T00:00:00Z',
  
  priority: 65,
  priorityCalculatedAt: '2024-02-01T15:30:00Z',
  isEssential: false,
  daysOverdue: 17,
  highestConsequenceSeverity: 70,
  
  consequences: [
    {
      type: ConsequenceType.LATE_FEES,
      urgency: ConsequenceUrgency.IMMEDIATE,
      severity: 40,
      description: 'Late fee of $25 has been applied, more fees will accrue',
      estimatedDays: 0,
      preventable: false,
      recoverable: false,
      lateFeeAmount: 25.00,
      isCompounding: true,
      compoundingFrequency: 'monthly'
    } as LateFeeConsequence,
    {
      type: ConsequenceType.CREDIT_DAMAGE,
      urgency: ConsequenceUrgency.SHORT_TERM,
      severity: 70,
      description: 'Payment is 30+ days late and will be reported to credit bureaus',
      estimatedDays: 13,
      preventable: true,
      recoverable: true,
      recoveryCost: 0,
      recoveryTimeMonths: 24,
      estimatedScoreDrop: 60,
      yearsOnReport: 7,
      impactOnBorrowing: 'moderate'
    } as CreditDamageConsequence
  ],
  
  paymentTerms: {
    minimumPayment: 35.00,
    gracePeriodDays: 25,
    lateFeeAmount: 25.00,
    interestRate: 0.2399,
    compoundingFrequency: 'daily',
    paymentDueDayOfMonth: 15
  },
  
  creditor: {
    name: 'Chase Bank',
    phone: '800-432-3117',
    customerServiceHours: '24/7',
    onlineAccountUrl: 'https://chase.com'
  },
  
  source: 'manual',
  category: 'credit',
  tags: ['credit-card', 'high-interest']
};

// ===================
// Default Priority Factors
// ===================

export const DEFAULT_PRIORITY_FACTORS: PriorityFactors = {
  immediateConsequenceWeight: 0.40,  // Primary: Shutoff, eviction, repo
  financialImpactWeight: 0.25,       // Late fees, credit damage cost
  recoveryDifficultyWeight: 0.20,    // Time/cost to recover
  dueDateWeight: 0.10,               // Traditional due date urgency
  amountWeight: 0.05                 // Relative amount consideration
};

// ===================
// Export Types
// ===================

export type {
  BillQueryPatterns,
  PriorityCalculation,
  PaymentArrangement,
  NegotiationOpportunity
};