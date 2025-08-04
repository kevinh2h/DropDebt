// Export all constants
export * from './entity-types';
export * from './priority-scores';

// API configuration constants
export const API_CONFIG = {
  MAX_REQUEST_SIZE: 1024 * 1024, // 1MB
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  RATE_LIMIT_PER_MINUTE: 60,
  REQUEST_TIMEOUT_MS: 30000
} as const;

// DynamoDB configuration
export const DYNAMODB_CONFIG = {
  MAX_BATCH_SIZE: 25,
  MAX_TRANSACTION_SIZE: 25,
  QUERY_LIMIT: 100,
  SCAN_LIMIT: 100
} as const;

// Lambda configuration
export const LAMBDA_CONFIG = {
  MEMORY_SIZE: 512,
  TIMEOUT_SECONDS: 30,
  RUNTIME: 'nodejs18.x',
  ENVIRONMENT_VARIABLES: {
    NODE_ENV: process.env.NODE_ENV || 'development',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info'
  }
} as const;

// Business logic constants
export const BUSINESS_RULES = {
  MIN_BILL_AMOUNT: 0.01,
  MAX_BILL_AMOUNT: 1000000,
  MIN_INCOME: 0,
  MAX_INCOME: 10000000,
  MIN_PRIORITY_SCORE: 0,
  MAX_PRIORITY_SCORE: 100,
  DEFAULT_PRIORITY_SCORE: 50
} as const;

// Time constants
export const TIME_CONSTANTS = {
  MILLISECONDS_PER_SECOND: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,
  DAYS_PER_MONTH: 30,
  DAYS_PER_YEAR: 365
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

// Default values
export const DEFAULTS = {
  PAYMENT_METHOD: 'bank_transfer',
  BILL_STATUS: 'pending',
  PAYMENT_FREQUENCY: 'monthly',
  ARRANGEMENT_STATUS: 'active',
  AUTO_PAY: false,
  IS_ESSENTIAL: false,
  PRIORITY_SCORE: 50
} as const;