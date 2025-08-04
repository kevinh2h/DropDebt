export interface Bill {
  billId: string;
  userId: string;
  billName: string;
  amount: number;
  dueDate: string;
  priorityScore: number;
  category: BillCategory;
  isEssential: boolean;
  status: BillStatus;
  minimumPayment?: number;
  interestRate?: number;
  lateFee?: number;
  description?: string;
  creditorName?: string;
  accountNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export type BillCategory = 
  | 'housing'           // Rent, mortgage, property tax
  | 'utilities'         // Electric, gas, water, internet
  | 'debt'             // Credit cards, loans
  | 'insurance'        // Health, auto, life insurance
  | 'transportation'   // Car payment, public transport
  | 'food'             // Groceries, dining
  | 'healthcare'       // Medical bills, prescriptions
  | 'education'        // Student loans, tuition
  | 'entertainment'    // Subscriptions, memberships
  | 'personal'         // Clothing, personal care
  | 'savings'          // Emergency fund, retirement
  | 'other';           // Miscellaneous

export type BillStatus = 
  | 'pending'          // Awaiting payment
  | 'scheduled'        // Payment scheduled
  | 'paid'             // Fully paid
  | 'partial'          // Partially paid
  | 'overdue'          // Past due date
  | 'disputed'         // Under dispute
  | 'cancelled';       // Cancelled/voided

export type BillRecurrence = 
  | 'one-time'
  | 'weekly'
  | 'bi-weekly' 
  | 'monthly'
  | 'quarterly'
  | 'semi-annually'
  | 'annually';

export interface BillPriorityFactors {
  daysUntilDue: number;
  isEssential: boolean;
  lateFeeAmount: number;
  interestRate: number;
  category: BillCategory;
  minimumPaymentRatio: number; // minimum payment / total amount
  userIncomeRatio: number;     // bill amount / monthly income
}

export interface BillWithPriority extends Bill {
  priorityFactors: BillPriorityFactors;
  recommendedPaymentAmount: number;
  canDefer: boolean;
  deferralOptions?: DeferralOption[];
}

export interface DeferralOption {
  description: string;
  newDueDate: string;
  additionalCost: number;
  riskLevel: 'low' | 'medium' | 'high';
}

// DynamoDB item structure for Bill
export interface BillDynamoItem {
  PK: string;           // USER#<userId>
  SK: string;           // BILL#<billId>
  EntityType: string;   // Bill
  GSI1PK: string;       // BILLS_BY_PRIORITY#<userId>
  GSI1SK: string;       // <priority_score>#<due_date>#<billId>
  BillId: string;
  UserId: string;
  BillName: string;
  Amount: number;
  DueDate: string;
  PriorityScore: number;
  Category: BillCategory;
  IsEssential: boolean;
  Status: BillStatus;
  MinimumPayment?: number;
  InterestRate?: number;
  LateFee?: number;
  Description?: string;
  CreditorName?: string;
  AccountNumber?: string;
  Recurrence?: BillRecurrence;
  CreatedAt: string;
  UpdatedAt: string;
}