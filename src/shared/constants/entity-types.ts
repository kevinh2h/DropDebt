// DynamoDB entity type constants
export const ENTITY_TYPES = {
  USER: 'User',
  BILL: 'Bill',
  EXPENSE: 'Expense',
  PAYMENT_ARRANGEMENT: 'PaymentArrangement'
} as const;

// Primary key patterns
export const PK_PATTERNS = {
  USER: (userId: string) => `USER#${userId}`,
  BILL: (userId: string) => `USER#${userId}`,
  EXPENSE: (userId: string) => `USER#${userId}`,
  PAYMENT_ARRANGEMENT: (userId: string) => `USER#${userId}`
} as const;

// Sort key patterns
export const SK_PATTERNS = {
  USER_PROFILE: 'PROFILE',
  BILL: (billId: string) => `BILL#${billId}`,
  EXPENSE: (expenseId: string) => `EXPENSE#${expenseId}`,
  PAYMENT_ARRANGEMENT: (arrangementId: string) => `ARRANGEMENT#${arrangementId}`
} as const;

// GSI1 patterns for cross-entity queries
export const GSI1_PATTERNS = {
  USER_PROFILE: {
    PK: (userId: string) => `USER#${userId}`,
    SK: 'PROFILE'
  },
  BILLS_BY_PRIORITY: {
    PK: (userId: string) => `BILLS_BY_PRIORITY#${userId}`,
    SK: (priorityScore: number, dueDate: string, billId: string) => 
      `${String(priorityScore).padStart(3, '0')}#${dueDate}#${billId}`
  },
  EXPENSES_BY_TYPE: {
    PK: (userId: string) => `EXPENSES_BY_TYPE#${userId}`,
    SK: (isEssential: boolean, category: string, expenseId: string) => 
      `${isEssential ? 'ESSENTIAL' : 'NON_ESSENTIAL'}#${category}#${expenseId}`
  },
  ARRANGEMENTS_BY_STATUS: {
    PK: (userId: string) => `ARRANGEMENTS_BY_STATUS#${userId}`,
    SK: (status: string, nextPaymentDate: string, arrangementId: string) => 
      `${status}#${nextPaymentDate}#${arrangementId}`
  }
} as const;

// Query prefixes for filtering
export const QUERY_PREFIXES = {
  BILLS_HIGH_PRIORITY: '09', // Priority 90-99
  BILLS_MEDIUM_PRIORITY: '08', // Priority 80-89
  BILLS_LOW_PRIORITY: '07', // Priority 70-79
  EXPENSES_ESSENTIAL: 'ESSENTIAL',
  EXPENSES_NON_ESSENTIAL: 'NON_ESSENTIAL',
  ARRANGEMENTS_ACTIVE: 'active',
  ARRANGEMENTS_COMPLETED: 'completed',
  ARRANGEMENTS_PAUSED: 'paused'
} as const;

// Table configuration
export const TABLE_CONFIG = {
  PARTITION_KEY: 'PK',
  SORT_KEY: 'SK',
  GSI1_PARTITION_KEY: 'GSI1PK',
  GSI1_SORT_KEY: 'GSI1SK',
  GSI1_INDEX_NAME: 'GSI1'
} as const;

export type EntityType = typeof ENTITY_TYPES[keyof typeof ENTITY_TYPES];