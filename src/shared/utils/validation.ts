import { 
  BillCategory, 
  ExpenseCategory, 
  PaymentMethod, 
  PaymentSplitType,
  PaymentFrequency,
  BillStatus
} from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export class Validator {
  private errors: ValidationError[] = [];

  constructor() {
    this.errors = [];
  }

  // ===== BASIC VALIDATION METHODS =====

  required(value: any, field: string): this {
    if (value === null || value === undefined || value === '') {
      this.addError(field, `${field} is required`, 'REQUIRED');
    }
    return this;
  }

  email(value: string, field: string = 'email'): this {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      this.addError(field, 'Invalid email format', 'INVALID_EMAIL');
    }
    return this;
  }

  minLength(value: string, min: number, field: string): this {
    if (value && value.length < min) {
      this.addError(field, `${field} must be at least ${min} characters`, 'MIN_LENGTH');
    }
    return this;
  }

  maxLength(value: string, max: number, field: string): this {
    if (value && value.length > max) {
      this.addError(field, `${field} must be no more than ${max} characters`, 'MAX_LENGTH');
    }
    return this;
  }

  min(value: number, min: number, field: string): this {
    if (value !== undefined && value < min) {
      this.addError(field, `${field} must be at least ${min}`, 'MIN_VALUE');
    }
    return this;
  }

  max(value: number, max: number, field: string): this {
    if (value !== undefined && value > max) {
      this.addError(field, `${field} must be no more than ${max}`, 'MAX_VALUE');
    }
    return this;
  }

  pattern(value: string, pattern: RegExp, field: string, message?: string): this {
    if (value && !pattern.test(value)) {
      this.addError(field, message || `${field} format is invalid`, 'INVALID_FORMAT');
    }
    return this;
  }

  oneOf<T>(value: T, allowedValues: T[], field: string): this {
    if (value !== undefined && !allowedValues.includes(value)) {
      this.addError(field, `${field} must be one of: ${allowedValues.join(', ')}`, 'INVALID_VALUE');
    }
    return this;
  }

  // ===== DATE VALIDATION =====

  isValidDate(value: string, field: string): this {
    if (value && isNaN(Date.parse(value))) {
      this.addError(field, `${field} must be a valid ISO date`, 'INVALID_DATE');
    }
    return this;
  }

  isFutureDate(value: string, field: string): this {
    if (value) {
      const date = new Date(value);
      const now = new Date();
      if (date <= now) {
        this.addError(field, `${field} must be in the future`, 'DATE_NOT_FUTURE');
      }
    }
    return this;
  }

  isDateWithinRange(value: string, minDays: number, maxDays: number, field: string): this {
    if (value) {
      const date = new Date(value);
      const now = new Date();
      const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < minDays || diffDays > maxDays) {
        this.addError(field, `${field} must be between ${minDays} and ${maxDays} days from now`, 'DATE_OUT_OF_RANGE');
      }
    }
    return this;
  }

  // ===== BUSINESS LOGIC VALIDATION =====

  isValidBillCategory(value: string, field: string = 'category'): this {
    const validCategories: BillCategory[] = [
      'housing', 'utilities', 'debt', 'insurance', 'transportation',
      'food', 'healthcare', 'education', 'entertainment', 'personal',
      'savings', 'other'
    ];
    return this.oneOf(value as BillCategory, validCategories, field);
  }

  isValidExpenseCategory(value: string, field: string = 'category'): this {
    const validCategories: ExpenseCategory[] = [
      'housing', 'food', 'transportation', 'healthcare', 'personal_care',
      'clothing', 'entertainment', 'education', 'gifts_donations',
      'savings', 'miscellaneous'
    ];
    return this.oneOf(value as ExpenseCategory, validCategories, field);
  }

  isValidPaymentMethod(value: string, field: string = 'paymentMethod'): this {
    const validMethods: PaymentMethod[] = [
      'bank_transfer', 'credit_card', 'debit_card', 'paypal', 'venmo'
    ];
    return this.oneOf(value as PaymentMethod, validMethods, field);
  }

  isValidPaymentSplitType(value: string, field: string = 'splitType'): this {
    const validTypes: PaymentSplitType[] = [
      'full', 'installments', 'minimum_plus', 'percentage', 'custom'
    ];
    return this.oneOf(value as PaymentSplitType, validTypes, field);
  }

  isValidPaymentFrequency(value: string, field: string = 'frequency'): this {
    const validFrequencies: PaymentFrequency[] = [
      'weekly', 'bi-weekly', 'monthly', 'quarterly'
    ];
    return this.oneOf(value as PaymentFrequency, validFrequencies, field);
  }

  isValidBillStatus(value: string, field: string = 'status'): this {
    const validStatuses: BillStatus[] = [
      'pending', 'scheduled', 'paid', 'partial', 'overdue', 'disputed', 'cancelled'
    ];
    return this.oneOf(value as BillStatus, validStatuses, field);
  }

  isValidPriorityScore(value: number, field: string = 'priorityScore'): this {
    return this.min(value, 0, field).max(value, 100, field);
  }

  isValidMoneyAmount(value: number, field: string): this {
    if (value !== undefined) {
      if (value < 0) {
        this.addError(field, `${field} cannot be negative`, 'NEGATIVE_AMOUNT');
      }
      if (value > 1000000) { // $1M limit
        this.addError(field, `${field} cannot exceed $1,000,000`, 'AMOUNT_TOO_LARGE');
      }
      // Check for reasonable decimal places (max 2)
      if (value % 0.01 !== 0) {
        this.addError(field, `${field} can have at most 2 decimal places`, 'INVALID_DECIMAL');
      }
    }
    return this;
  }

  // ===== PHONE NUMBER VALIDATION =====

  isValidPhone(value: string, field: string = 'phone'): this {
    if (value) {
      // Basic US phone number validation
      const phoneRegex = /^\+?1?[-.\s]?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
      if (!phoneRegex.test(value)) {
        this.addError(field, 'Invalid phone number format', 'INVALID_PHONE');
      }
    }
    return this;
  }

  // ===== UTILITY METHODS =====

  private addError(field: string, message: string, code: string): void {
    this.errors.push({ field, message, code });
  }

  getResult(): ValidationResult {
    return {
      isValid: this.errors.length === 0,
      errors: [...this.errors]
    };
  }

  reset(): this {
    this.errors = [];
    return this;
  }
}

// ===== STATIC VALIDATION FUNCTIONS =====

export const validateUserId = (userId: string): boolean => {
  return /^[a-zA-Z0-9_-]+$/.test(userId) && userId.length >= 3 && userId.length <= 50;
};

export const validateBillId = (billId: string): boolean => {
  return /^bill_[0-9]+_[a-zA-Z0-9]+$/.test(billId);
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validateAmount = (amount: number): boolean => {
  return amount >= 0 && amount <= 1000000 && amount % 0.01 === 0;
};

export const validatePercentage = (value: number): boolean => {
  return value >= 0 && value <= 100;
};

// ===== PRE-BUILT VALIDATORS FOR COMMON OBJECTS =====

export const validateUser = (user: any): ValidationResult => {
  return new Validator()
    .required(user.email, 'email')
    .email(user.email, 'email')
    .required(user.firstName, 'firstName')
    .minLength(user.firstName, 1, 'firstName')
    .maxLength(user.firstName, 50, 'firstName')
    .required(user.lastName, 'lastName')
    .minLength(user.lastName, 1, 'lastName')
    .maxLength(user.lastName, 50, 'lastName')
    .isValidPhone(user.phone, 'phone')
    .required(user.totalMonthlyIncome, 'totalMonthlyIncome')
    .min(user.totalMonthlyIncome, 0, 'totalMonthlyIncome')
    .max(user.totalMonthlyIncome, 1000000, 'totalMonthlyIncome')
    .required(user.preferredPaymentMethod, 'preferredPaymentMethod')
    .isValidPaymentMethod(user.preferredPaymentMethod, 'preferredPaymentMethod')
    .getResult();
};

export const validateBill = (bill: any): ValidationResult => {
  return new Validator()
    .required(bill.billName, 'billName')
    .minLength(bill.billName, 1, 'billName')
    .maxLength(bill.billName, 100, 'billName')
    .required(bill.amount, 'amount')
    .isValidMoneyAmount(bill.amount, 'amount')
    .required(bill.dueDate, 'dueDate')
    .isValidDate(bill.dueDate, 'dueDate')
    .required(bill.category, 'category')
    .isValidBillCategory(bill.category, 'category')
    .required(bill.isEssential, 'isEssential')
    .isValidMoneyAmount(bill.minimumPayment, 'minimumPayment')
    .min(bill.interestRate, 0, 'interestRate')
    .max(bill.interestRate, 100, 'interestRate')
    .isValidMoneyAmount(bill.lateFee, 'lateFee')
    .isValidBillStatus(bill.status, 'status')
    .getResult();
};

export const validatePaymentSplitting = (request: any): ValidationResult => {
  return new Validator()
    .required(request.userId, 'userId')
    .required(request.availableAmount, 'availableAmount')
    .isValidMoneyAmount(request.availableAmount, 'availableAmount')
    .min(request.availableAmount, 0.01, 'availableAmount')
    .required(request.strategy, 'strategy')
    .oneOf(request.strategy, ['priority_first', 'equal_split', 'minimum_first', 'avalanche', 'snowball'], 'strategy')
    .required(request.allowPartialPayments, 'allowPartialPayments')
    .getResult();
};