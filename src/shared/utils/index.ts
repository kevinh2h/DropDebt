// Export all utility functions and classes with explicit exports to avoid conflicts
export * from './dynamodb';
export * from './response';
export * from './auth';
export * from './cognito';

// From validation.ts - rename ValidationError to avoid conflict with errors.ts
export { 
  ValidationResult,
  ValidationError as ValidatorError,
  Validator,
  validateUserId,
  validateBillId,
  validateEmail,
  validateAmount,
  validatePercentage,
  validateUser,
  validateBill,
  validatePaymentSplitting
} from './validation';

// From errors.ts
export * from './errors';

// Additional utility functions that don't warrant their own files

// ===== DATE UTILITIES =====

export const formatISODate = (date: Date = new Date()): string => {
  return date.toISOString();
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const getDaysDifference = (date1: Date, date2: Date): number => {
  const timeDiff = date2.getTime() - date1.getTime();
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const isOverdue = (dueDate: string): boolean => {
  const due = new Date(dueDate);
  const now = new Date();
  return due < now;
};

export const getDaysUntilDue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const now = new Date();
  return getDaysDifference(now, due);
};

// ===== MONEY UTILITIES =====

export const formatMoney = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const roundMoney = (amount: number): number => {
  return Math.round(amount * 100) / 100;
};

export const percentageOfAmount = (amount: number, percentage: number): number => {
  return roundMoney((amount * percentage) / 100);
};

export const calculateTotalAmount = (amounts: number[]): number => {
  return roundMoney(amounts.reduce((sum, amount) => sum + amount, 0));
};

// ===== STRING UTILITIES =====

export const generateId = (prefix: string = 'id'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}_${timestamp}_${random}`;
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
    .trim();
};

export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const truncate = (text: string, length: number = 100): string => {
  if (text.length <= length) return text;
  return text.substr(0, length) + '...';
};

// ===== ARRAY UTILITIES =====

export const sortByProperty = <T>(array: T[], property: keyof T, ascending: boolean = true): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[property];
    const bVal = b[property];
    
    if (aVal < bVal) return ascending ? -1 : 1;
    if (aVal > bVal) return ascending ? 1 : -1;
    return 0;
  });
};

export const groupBy = <T, K extends keyof T>(array: T[], key: K): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const sumBy = <T>(array: T[], property: keyof T): number => {
  return array.reduce((sum, item) => {
    const value = item[property];
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);
};

export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// ===== OBJECT UTILITIES =====

export const omit = <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

export const pick = <T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

export const isEmpty = (obj: any): boolean => {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  if (typeof obj === 'string') return obj.trim().length === 0;
  return false;
};

export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// ===== LAMBDA UTILITIES =====

export const parseRequestBody = <T>(body: string | null): T | null => {
  if (!body) return null;
  
  try {
    return JSON.parse(body) as T;
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
};

export const extractPathParameters = (event: any): Record<string, string> => {
  return event.pathParameters || {};
};

export const extractQueryParameters = (event: any): Record<string, string> => {
  return event.queryStringParameters || {};
};

export const extractHeaders = (event: any): Record<string, string> => {
  return event.headers || {};
};

export const getUserIdFromEvent = (event: any): string => {
  // Extract user ID from JWT token claims or path parameters
  const pathParams = extractPathParameters(event);
  const userId = pathParams.userId;
  
  if (!userId) {
    throw new Error('User ID not found in request');
  }
  
  return userId;
};

// ===== ENVIRONMENT UTILITIES =====

export const getEnvironmentVariable = (name: string, defaultValue?: string): string => {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value || defaultValue!;
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

// ===== PERFORMANCE UTILITIES =====

export const measureExecutionTime = async <T>(
  operation: () => Promise<T>,
  operationName: string = 'operation'
): Promise<T> => {
  const startTime = Date.now();
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    console.log(`${operationName} completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`${operationName} failed after ${duration}ms:`, error);
    throw error;
  }
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};