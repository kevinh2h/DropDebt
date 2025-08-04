import { ErrorCodes } from '../types';

export class DropDebtError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    code: string = ErrorCodes.INTERNAL_ERROR,
    statusCode: number = 500,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'DropDebtError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DropDebtError);
    }
  }
}

// ===== SPECIFIC ERROR CLASSES =====

export class ValidationError extends DropDebtError {
  constructor(message: string, field?: string) {
    super(message, ErrorCodes.VALIDATION_ERROR, 400, field ? { field } : undefined);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends DropDebtError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, ErrorCodes.NOT_FOUND, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends DropDebtError {
  constructor(message: string = 'Unauthorized access') {
    super(message, ErrorCodes.UNAUTHORIZED, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends DropDebtError {
  constructor(message: string = 'Access forbidden') {
    super(message, ErrorCodes.FORBIDDEN, 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends DropDebtError {
  constructor(message: string) {
    super(message, ErrorCodes.ARRANGEMENT_CONFLICT, 409);
    this.name = 'ConflictError';
  }
}

export class InsufficientFundsError extends DropDebtError {
  constructor(available: number, required: number) {
    super(
      `Insufficient funds: $${available.toFixed(2)} available, $${required.toFixed(2)} required`,
      ErrorCodes.INSUFFICIENT_FUNDS,
      400,
      { available, required }
    );
    this.name = 'InsufficientFundsError';
  }
}

export class InvalidPaymentMethodError extends DropDebtError {
  constructor(method: string) {
    super(
      `Invalid payment method: ${method}`,
      ErrorCodes.INVALID_PAYMENT_METHOD,
      400,
      { method }
    );
    this.name = 'InvalidPaymentMethodError';
  }
}

export class BillAlreadyPaidError extends DropDebtError {
  constructor(billId: string) {
    super(
      `Bill ${billId} has already been paid`,
      ErrorCodes.BILL_ALREADY_PAID,
      409,
      { billId }
    );
    this.name = 'BillAlreadyPaidError';
  }
}

export class RateLimitError extends DropDebtError {
  constructor(limit: number, timeWindow: string) {
    super(
      `Rate limit exceeded: ${limit} requests per ${timeWindow}`,
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      429,
      { limit, timeWindow }
    );
    this.name = 'RateLimitError';
  }
}

// ===== ERROR HANDLING UTILITIES =====

export const isDropDebtError = (error: any): error is DropDebtError => {
  return error instanceof DropDebtError;
};

export const getErrorResponse = (error: unknown) => {
  if (isDropDebtError(error)) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details
    };
  }

  // Handle AWS SDK errors
  if (error && typeof error === 'object' && 'name' in error) {
    const awsError = error as any;
    
    switch (awsError.name) {
      case 'ValidationException':
        return {
          statusCode: 400,
          code: ErrorCodes.VALIDATION_ERROR,
          message: awsError.message || 'Validation failed',
          details: { awsError: awsError.name }
        };
        
      case 'ConditionalCheckFailedException':
        return {
          statusCode: 409,
          code: ErrorCodes.ARRANGEMENT_CONFLICT,
          message: 'Resource conflict or condition not met',
          details: { awsError: awsError.name }
        };
        
      case 'ResourceNotFoundException':
        return {
          statusCode: 404,
          code: ErrorCodes.NOT_FOUND,
          message: 'Resource not found',
          details: { awsError: awsError.name }
        };
        
      case 'AccessDenied':
      case 'UnauthorizedOperation':
        return {
          statusCode: 403,
          code: ErrorCodes.FORBIDDEN,
          message: 'Access denied',
          details: { awsError: awsError.name }
        };
        
      case 'ThrottlingException':
      case 'TooManyRequestsException':
        return {
          statusCode: 429,
          code: ErrorCodes.RATE_LIMIT_EXCEEDED,
          message: 'Too many requests',
          details: { awsError: awsError.name }
        };
    }
  }

  // Handle generic JavaScript errors
  if (error instanceof Error) {
    return {
      statusCode: 500,
      code: ErrorCodes.INTERNAL_ERROR,
      message: error.message,
      details: { type: error.constructor.name }
    };
  }

  // Handle unknown error types
  return {
    statusCode: 500,
    code: ErrorCodes.INTERNAL_ERROR,
    message: 'An unexpected error occurred',
    details: { type: typeof error }
  };
};

// ===== ERROR LOGGING UTILITY =====

export const logError = (error: unknown, context: Record<string, any> = {}) => {
  const errorInfo = getErrorResponse(error);
  
  console.error('DropDebt Error:', {
    ...errorInfo,
    context,
    timestamp: new Date().toISOString(),
    stack: error instanceof Error ? error.stack : undefined
  });
};

// ===== ASSERTION UTILITIES =====

export const assert = (condition: any, message: string, ErrorClass = DropDebtError) => {
  if (!condition) {
    throw new ErrorClass(message);
  }
};

export const assertExists = <T>(value: T | null | undefined, message: string): T => {
  if (value === null || value === undefined) {
    throw new NotFoundError(message);
  }
  return value;
};

export const assertValidAmount = (amount: number, fieldName: string = 'amount') => {
  if (amount < 0) {
    throw new ValidationError(`${fieldName} cannot be negative`);
  }
  if (amount > 1000000) {
    throw new ValidationError(`${fieldName} cannot exceed $1,000,000`);
  }
  if (amount % 0.01 !== 0) {
    throw new ValidationError(`${fieldName} can have at most 2 decimal places`);
  }
};

export const assertSufficientFunds = (available: number, required: number) => {
  if (available < required) {
    throw new InsufficientFundsError(available, required);
  }
};

// ===== ERROR RECOVERY UTILITIES =====

export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  backoffMs: number = 1000
): Promise<T> => {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (isDropDebtError(error) && error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff
      const delay = backoffMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.warn(`Retry attempt ${attempt} failed, retrying in ${delay}ms:`, error);
    }
  }
  
  throw lastError;
};

export const withCircuitBreaker = <T>(
  operation: () => Promise<T>,
  options: {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
  }
) => {
  // Simple circuit breaker implementation
  // In production, use a more robust solution like Hystrix or similar
  let failures = 0;
  let lastFailureTime = 0;
  
  return async (): Promise<T> => {
    const now = Date.now();
    
    // Reset failure count if monitoring period has elapsed
    if (now - lastFailureTime > options.monitoringPeriod) {
      failures = 0;
    }
    
    // Circuit is open - fail fast
    if (failures >= options.failureThreshold) {
      if (now - lastFailureTime < options.recoveryTimeout) {
        throw new DropDebtError('Service temporarily unavailable', 'CIRCUIT_BREAKER_OPEN', 503);
      } else {
        // Try to close the circuit
        failures = 0;
      }
    }
    
    try {
      const result = await operation();
      failures = 0; // Reset on success
      return result;
    } catch (error) {
      failures++;
      lastFailureTime = now;
      throw error;
    }
  };
};