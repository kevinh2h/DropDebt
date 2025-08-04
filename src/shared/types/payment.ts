export interface PaymentArrangement {
  arrangementId: string;
  userId: string;
  billId: string;
  totalAmount: number;
  splitType: PaymentSplitType;
  installmentCount?: number;
  installmentAmount?: number;
  paymentFrequency: PaymentFrequency;
  nextPaymentDate: string;
  status: ArrangementStatus;
  autoPay: boolean;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentSplitType = 
  | 'full'             // Pay full amount at once
  | 'installments'     // Split into equal payments
  | 'minimum_plus'     // Pay minimum + extra amount
  | 'percentage'       // Pay percentage of total
  | 'custom';          // Custom payment schedule

export type PaymentFrequency = 
  | 'weekly'
  | 'bi-weekly'
  | 'monthly'
  | 'quarterly';

export type ArrangementStatus = 
  | 'active'           // Currently active
  | 'completed'        // All payments made
  | 'paused'           // Temporarily paused
  | 'cancelled'        // Cancelled by user
  | 'defaulted';       // Failed to make payments

export interface PaymentSplit {
  billId: string;
  billName: string;
  originalAmount: number;
  allocatedAmount: number;
  priorityScore: number;
  splitReason: string;
  paymentDate: string;
}

export interface PaymentSplitResult {
  totalAvailable: number;
  totalAllocated: number;
  remainingAmount: number;
  splits: PaymentSplit[];
  unallocatedBills: string[]; // Bills that couldn't be paid
  recommendations: PaymentRecommendation[];
}

export interface PaymentRecommendation {
  type: 'defer' | 'reduce' | 'prioritize' | 'consolidate';
  billId: string;
  currentAmount: number;
  suggestedAmount: number;
  reason: string;
  impact: 'positive' | 'neutral' | 'negative';
  urgency: 'low' | 'medium' | 'high';
}

export interface PaymentSchedule {
  userId: string;
  scheduleDate: string;
  payments: ScheduledPayment[];
  totalAmount: number;
  optimizationScore: number; // How well optimized this schedule is
}

export interface ScheduledPayment {
  billId: string;
  amount: number;
  paymentDate: string;
  method: string;
  priority: number;
  isAutomatic: boolean;
}

// DynamoDB item structure for Payment Arrangement
export interface PaymentArrangementDynamoItem {
  PK: string;               // USER#<userId>
  SK: string;               // ARRANGEMENT#<arrangementId>
  EntityType: string;       // PaymentArrangement
  GSI1PK: string;           // ARRANGEMENTS_BY_STATUS#<userId>
  GSI1SK: string;           // <status>#<next_payment_date>#<arrangementId>
  ArrangementId: string;
  UserId: string;
  BillId: string;
  TotalAmount: number;
  SplitType: PaymentSplitType;
  InstallmentCount?: number;
  InstallmentAmount?: number;
  PaymentFrequency: PaymentFrequency;
  NextPaymentDate: string;
  Status: ArrangementStatus;
  AutoPay: boolean;
  PaymentMethod: string;
  CreatedAt: string;
  UpdatedAt: string;
}