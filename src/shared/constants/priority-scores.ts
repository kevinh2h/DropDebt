// Priority score calculation constants and weights

// Base priority scores by category
export const CATEGORY_BASE_SCORES = {
  housing: 95,        // Rent, mortgage - highest priority
  utilities: 90,      // Electric, gas, water - essential services
  debt: 85,          // Credit cards, loans - avoid interest/fees
  insurance: 80,      // Health, auto - important protection
  transportation: 75, // Car payment, public transport
  healthcare: 85,     // Medical bills - health is priority
  education: 70,      // Student loans, tuition
  food: 80,          // Groceries - essential need
  personal: 60,       // Personal care, clothing
  entertainment: 50,  // Subscriptions, memberships
  savings: 65,        // Emergency fund, retirement
  other: 55          // Miscellaneous
} as const;

// Priority score ranges
export const PRIORITY_RANGES = {
  CRITICAL: { min: 90, max: 99, label: 'Critical' },
  HIGH: { min: 80, max: 89, label: 'High' },
  MEDIUM: { min: 70, max: 79, label: 'Medium' },
  LOW: { min: 60, max: 69, label: 'Low' },
  MINIMAL: { min: 0, max: 59, label: 'Minimal' }
} as const;

// Weighting factors for priority calculation
export const PRIORITY_WEIGHTS = {
  DUE_DATE: 0.3,      // How soon the bill is due
  ESSENTIAL: 0.4,     // Whether it's an essential bill
  LATE_FEE: 0.2,      // Potential late fee impact
  INTEREST: 0.1       // Interest rate impact
} as const;

// Due date scoring (days until due -> score modifier)
export const DUE_DATE_MODIFIERS = {
  OVERDUE: 15,        // Past due - maximum urgency
  TODAY: 12,          // Due today
  TOMORROW: 10,       // Due tomorrow
  THIS_WEEK: 8,       // Due within 7 days
  NEXT_WEEK: 5,       // Due within 14 days
  THIS_MONTH: 3,      // Due within 30 days
  NEXT_MONTH: 1,      // Due 31-60 days
  FUTURE: 0           // Due more than 60 days
} as const;

// Essential bill modifiers
export const ESSENTIAL_MODIFIERS = {
  ESSENTIAL: 10,      // Essential bills get priority boost
  NON_ESSENTIAL: 0    // No modifier for non-essential
} as const;

// Late fee impact scoring
export const LATE_FEE_MODIFIERS = {
  HIGH_FEE: 8,        // Late fee > $50
  MEDIUM_FEE: 5,      // Late fee $20-$50
  LOW_FEE: 2,         // Late fee $5-$20
  NO_FEE: 0           // No late fee
} as const;

// Interest rate impact scoring
export const INTEREST_MODIFIERS = {
  HIGH_INTEREST: 6,   // Interest rate > 20%
  MEDIUM_INTEREST: 4, // Interest rate 10-20%
  LOW_INTEREST: 2,    // Interest rate 5-10%
  NO_INTEREST: 0      // No interest
} as const;

// Payment strategy constants
export const PAYMENT_STRATEGIES = {
  PRIORITY_FIRST: 'priority_first',     // Pay highest priority bills first
  EQUAL_SPLIT: 'equal_split',           // Split money equally among bills
  MINIMUM_FIRST: 'minimum_first',       // Pay minimum amounts first
  AVALANCHE: 'avalanche',               // Pay highest interest rates first
  SNOWBALL: 'snowball'                  // Pay smallest balances first
} as const;

// Essential spending protection thresholds
export const ESSENTIAL_THRESHOLDS = {
  SAFE_RATIO: 0.6,        // Essential expenses should be < 60% of income
  AT_RISK_RATIO: 0.75,    // 60-75% is at risk
  ENDANGERED_RATIO: 0.9   // >75% is endangered
} as const;

// Emergency fund recommendations
export const EMERGENCY_FUND = {
  MINIMUM_MONTHS: 3,      // Minimum 3 months of essential expenses
  RECOMMENDED_MONTHS: 6,  // Recommended 6 months
  IDEAL_MONTHS: 12       // Ideal 12 months
} as const;

// Budget analysis thresholds
export const BUDGET_THRESHOLDS = {
  OVERSPENDING_THRESHOLD: 1.1,    // 10% over budget
  UNDERSPENDING_THRESHOLD: 0.8,   // 20% under budget
  VARIANCE_WARNING: 0.15,         // 15% variance triggers warning
  TREND_SIGNIFICANCE: 0.2         // 20% change is significant
} as const;

// Helper functions for priority calculation
export const getDueDateModifier = (daysUntilDue: number): number => {
  if (daysUntilDue < 0) return DUE_DATE_MODIFIERS.OVERDUE;
  if (daysUntilDue === 0) return DUE_DATE_MODIFIERS.TODAY;
  if (daysUntilDue === 1) return DUE_DATE_MODIFIERS.TOMORROW;
  if (daysUntilDue <= 7) return DUE_DATE_MODIFIERS.THIS_WEEK;
  if (daysUntilDue <= 14) return DUE_DATE_MODIFIERS.NEXT_WEEK;
  if (daysUntilDue <= 30) return DUE_DATE_MODIFIERS.THIS_MONTH;
  if (daysUntilDue <= 60) return DUE_DATE_MODIFIERS.NEXT_MONTH;
  return DUE_DATE_MODIFIERS.FUTURE;
};

export const getLateFeeModifier = (lateFee: number): number => {
  if (lateFee > 50) return LATE_FEE_MODIFIERS.HIGH_FEE;
  if (lateFee >= 20) return LATE_FEE_MODIFIERS.MEDIUM_FEE;
  if (lateFee >= 5) return LATE_FEE_MODIFIERS.LOW_FEE;
  return LATE_FEE_MODIFIERS.NO_FEE;
};

export const getInterestModifier = (interestRate: number): number => {
  if (interestRate > 20) return INTEREST_MODIFIERS.HIGH_INTEREST;
  if (interestRate >= 10) return INTEREST_MODIFIERS.MEDIUM_INTEREST;
  if (interestRate >= 5) return INTEREST_MODIFIERS.LOW_INTEREST;
  return INTEREST_MODIFIERS.NO_INTEREST;
};

export const getPriorityLabel = (score: number): string => {
  if (score >= PRIORITY_RANGES.CRITICAL.min) return PRIORITY_RANGES.CRITICAL.label;
  if (score >= PRIORITY_RANGES.HIGH.min) return PRIORITY_RANGES.HIGH.label;
  if (score >= PRIORITY_RANGES.MEDIUM.min) return PRIORITY_RANGES.MEDIUM.label;
  if (score >= PRIORITY_RANGES.LOW.min) return PRIORITY_RANGES.LOW.label;
  return PRIORITY_RANGES.MINIMAL.label;
};

// Income-based spending guidelines (percentage of income)
export const SPENDING_GUIDELINES = {
  HOUSING: { min: 0.25, max: 0.35, recommended: 0.30 },
  TRANSPORTATION: { min: 0.10, max: 0.20, recommended: 0.15 },
  FOOD: { min: 0.10, max: 0.15, recommended: 0.12 },
  UTILITIES: { min: 0.05, max: 0.10, recommended: 0.08 },
  DEBT_PAYMENTS: { min: 0.10, max: 0.20, recommended: 0.15 },
  SAVINGS: { min: 0.10, max: 0.20, recommended: 0.15 },
  ENTERTAINMENT: { min: 0.02, max: 0.08, recommended: 0.05 },
  PERSONAL: { min: 0.03, max: 0.07, recommended: 0.05 }
} as const;