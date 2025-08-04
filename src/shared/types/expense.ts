export interface Expense {
  expenseId: string;
  userId: string;
  expenseName: string;
  category: ExpenseCategory;
  amount: number;
  isEssential: boolean;
  frequency: ExpenseFrequency;
  dueDay?: number; // Day of month for monthly expenses
  description?: string;
  budgetLimit?: number;
  actualSpent?: number;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory = 
  | 'housing'           // Rent, utilities that aren't bills
  | 'food'             // Groceries, dining out
  | 'transportation'   // Gas, maintenance, parking
  | 'healthcare'       // Medicine, doctor visits
  | 'personal_care'    // Hygiene, grooming
  | 'clothing'         // Apparel, shoes
  | 'entertainment'    // Movies, games, hobbies
  | 'education'        // Books, courses, training
  | 'gifts_donations'  // Charitable giving, presents
  | 'savings'          // Emergency fund contributions
  | 'miscellaneous';   // Other expenses

export type ExpenseFrequency = 
  | 'daily'
  | 'weekly'
  | 'bi-weekly'
  | 'monthly'
  | 'quarterly'
  | 'annually'
  | 'irregular';       // As needed/irregular

export type EssentialLevel = 
  | 'critical'         // Absolute necessities (food, shelter)
  | 'important'        // Very important but some flexibility
  | 'moderate'         // Important but can be reduced
  | 'optional'         // Nice to have, easily deferred
  | 'luxury';          // Discretionary spending

export interface ExpenseAnalysis {
  totalEssential: number;
  totalNonEssential: number;
  categoryBreakdown: Record<ExpenseCategory, number>;
  essentialRatio: number; // essential expenses / total income
  recommendations: ExpenseRecommendation[];
}

export interface ExpenseRecommendation {
  type: 'reduce' | 'eliminate' | 'defer' | 'optimize';
  category: ExpenseCategory;
  currentAmount: number;
  suggestedAmount: number;
  potentialSavings: number;
  impact: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'moderate' | 'hard';
  description: string;
}

export interface BudgetAllocation {
  category: ExpenseCategory;
  allocated: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  status: 'under_budget' | 'on_budget' | 'over_budget';
}

// DynamoDB item structure for Expense
export interface ExpenseDynamoItem {
  PK: string;           // USER#<userId>
  SK: string;           // EXPENSE#<expenseId>
  EntityType: string;   // Expense
  GSI1PK: string;       // EXPENSES_BY_TYPE#<userId>
  GSI1SK: string;       // <essential_flag>#<category>#<expenseId>
  ExpenseId: string;
  UserId: string;
  ExpenseName: string;
  Category: ExpenseCategory;
  Amount: number;
  IsEssential: boolean;
  Frequency: ExpenseFrequency;
  DueDay?: number;
  Description?: string;
  BudgetLimit?: number;
  ActualSpent?: number;
  CreatedAt: string;
  UpdatedAt: string;
}