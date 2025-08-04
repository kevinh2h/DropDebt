// Export all type definitions
export * from './user';
export * from './bill';
export * from './expense';
export * from './payment';
export * from './api';

// Common utility types
export interface PaginationParams {
  limit?: number;
  offset?: number;
  nextToken?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  count: number;
  nextToken?: string;
  hasMore: boolean;
}

export interface TimestampFields {
  createdAt: string;
  updatedAt: string;
}

export interface BaseEntity extends TimestampFields {
  userId: string;
}

// DynamoDB specific types
export interface DynamoDbKey {
  PK: string;
  SK: string;
}

export interface DynamoDbItem extends DynamoDbKey {
  EntityType: string;
  GSI1PK?: string;
  GSI1SK?: string;
  CreatedAt: string;
  UpdatedAt: string;
}

// Common enums
export enum ErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INVALID_PAYMENT_METHOD = 'INVALID_PAYMENT_METHOD',
  BILL_ALREADY_PAID = 'BILL_ALREADY_PAID',
  ARRANGEMENT_CONFLICT = 'ARRANGEMENT_CONFLICT'
}

export enum EntityTypes {
  USER = 'User',
  BILL = 'Bill',
  EXPENSE = 'Expense',
  PAYMENT_ARRANGEMENT = 'PaymentArrangement'
}

// Priority score ranges
export enum PriorityRanges {
  CRITICAL_MIN = 90,
  CRITICAL_MAX = 99,
  HIGH_MIN = 80,
  HIGH_MAX = 89,
  MEDIUM_MIN = 70,
  MEDIUM_MAX = 79,
  LOW_MIN = 60,
  LOW_MAX = 69,
  MINIMAL_MAX = 59
}