/**
 * DropDebt Sample Bill Data
 * 
 * Realistic bill scenarios demonstrating consequence-based prioritization
 * Used for testing, demonstrations, and user onboarding
 */

import {
  Bill,
  BillType,
  BillStatus,
  ConsequenceType,
  ConsequenceUrgency,
  UtilityShutoffConsequence,
  HousingLossConsequence,
  VehicleRepoConsequence,
  CreditDamageConsequence,
  LateFeeConsequence,
  LicenseSuspensionConsequence
} from '../types/bill-models';

// ===================
// Scenario 1: Single Parent - Utilities at Risk
// ===================

export const SINGLE_PARENT_SCENARIO: Omit<Bill, 'PK' | 'SK' | 'GSI1PK' | 'GSI1SK' | 'billId' | 'priority' | 'priorityCalculatedAt' | 'createdAt' | 'updatedAt'>[] = [
  // CRITICAL: Electric Bill - Shutoff Notice
  {
    userId: 'user-single-parent',
    name: 'Electric Bill - City Power',
    description: 'Received final shutoff notice',
    type: BillType.ELECTRIC,
    status: BillStatus.OVERDUE,
    originalAmount: 245.67,
    currentBalance: 270.67, // Includes late fee
    minimumPayment: 270.67,
    interestRate: 0,
    dueDate: '2024-01-20T00:00:00Z',
    originalDueDate: '2024-01-20T00:00:00Z',
    lastPaymentDate: '2023-12-15T00:00:00Z',
    daysOverdue: 12,
    isEssential: true,
    highestConsequenceSeverity: 95,
    consequences: [
      {
        type: ConsequenceType.SHUTOFF,
        urgency: ConsequenceUrgency.IMMEDIATE,
        severity: 95,
        description: 'Electric service will be disconnected on February 5th at 5:00 PM',
        estimatedDays: 3,
        preventable: true,
        recoverable: true,
        recoveryCost: 150.00,
        recoveryTimeMonths: 0,
        utilityType: 'electric',
        shutoffDate: '2024-02-05T17:00:00Z',
        reconnectionFee: 150.00,
        gracePeriodDays: 10
      } as UtilityShutoffConsequence
    ],
    paymentTerms: {
      gracePeriodDays: 10,
      lateFeeAmount: 25.00,
      paymentDueDayOfMonth: 20
    },
    creditor: {
      name: 'City Power & Electric',
      phone: '555-POWER-1 (555-769-3731)',
      customerServiceHours: 'Mon-Fri 7AM-7PM, Sat 8AM-5PM',
      onlineAccountUrl: 'https://citypower.com/pay'
    },
    source: 'manual',
    category: 'utilities',
    tags: ['essential', 'shutoff-risk', 'final-notice'],
    notes: 'Called 1/30 - can extend 3 days if I pay $100 by Friday'
  },

  // HIGH: Rent - Eviction Notice Served
  {
    userId: 'user-single-parent',
    name: 'Rent - Maplewood Apartments',
    description: '3-day notice to pay or quit served',
    type: BillType.RENT,
    status: BillStatus.OVERDUE,
    originalAmount: 1200.00,
    currentBalance: 1275.00, // Includes late fee
    minimumPayment: 1275.00,
    dueDate: '2024-01-01T00:00:00Z',
    originalDueDate: '2024-01-01T00:00:00Z',
    daysOverdue: 32,
    isEssential: true,
    highestConsequenceSeverity: 90,
    consequences: [
      {
        type: ConsequenceType.EVICTION,
        urgency: ConsequenceUrgency.SHORT_TERM,
        severity: 90,
        description: 'Eviction proceedings will begin if not paid within 3 days of notice (served 1/30)',
        estimatedDays: 10,
        preventable: true,
        recoverable: false,
        recoveryCost: 2500.00, // Moving costs, deposits, etc.
        recoveryTimeMonths: 1,
        noticeDate: '2024-01-30T00:00:00Z',
        moveOutDate: '2024-02-15T00:00:00Z',
        legalFees: 400.00,
        movingCosts: 1500.00,
        securityDepositLoss: 600.00
      } as HousingLossConsequence
    ],
    paymentTerms: {
      gracePeriodDays: 5,
      lateFeeAmount: 75.00,
      paymentDueDayOfMonth: 1
    },
    creditor: {
      name: 'Maplewood Property Management',
      phone: '555-HOME-911',
      address: {
        street: '123 Management Way',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701'
      }
    },
    source: 'manual',
    category: 'housing',
    tags: ['essential', 'eviction-notice', 'legal-action']
  },

  // MEDIUM: Credit Card - About to hit 30 days late
  {
    userId: 'user-single-parent',
    name: 'Chase Visa Credit Card',
    description: 'Approaching 30-day late mark - credit report impact',
    type: BillType.CREDIT_CARD,
    status: BillStatus.OVERDUE,
    originalAmount: 856.45,
    currentBalance: 895.45, // Includes late fee and interest
    minimumPayment: 35.00,
    interestRate: 0.2799, // 27.99% APR
    dueDate: '2024-01-10T00:00:00Z',
    originalDueDate: '2024-01-10T00:00:00Z',
    daysOverdue: 23,
    isEssential: false,
    highestConsequenceSeverity: 75,
    consequences: [
      {
        type: ConsequenceType.LATE_FEES,
        urgency: ConsequenceUrgency.IMMEDIATE,
        severity: 40,
        description: 'Late fee of $39 applied, another will apply next month',
        estimatedDays: 0,
        preventable: false,
        recoverable: false,
        lateFeeAmount: 39.00,
        isCompounding: true,
        compoundingFrequency: 'monthly'
      } as LateFeeConsequence,
      {
        type: ConsequenceType.CREDIT_DAMAGE,
        urgency: ConsequenceUrgency.SHORT_TERM,
        severity: 75,
        description: 'Will be reported as 30+ days late to credit bureaus in 7 days',
        estimatedDays: 7,
        preventable: true,
        recoverable: true,
        recoveryCost: 0,
        recoveryTimeMonths: 24,
        estimatedScoreDrop: 50,
        reportingDate: '2024-02-09T00:00:00Z',
        yearsOnReport: 7,
        impactOnBorrowing: 'moderate'
      } as CreditDamageConsequence
    ],
    paymentTerms: {
      minimumPayment: 35.00,
      gracePeriodDays: 25,
      lateFeeAmount: 39.00,
      interestRate: 0.2799,
      compoundingFrequency: 'daily',
      paymentDueDayOfMonth: 10
    },
    creditor: {
      name: 'Chase Bank',
      phone: '800-CHASE-1',
      customerServiceHours: '24/7',
      onlineAccountUrl: 'https://chase.com'
    },
    source: 'manual',
    category: 'credit',
    tags: ['credit-card', 'credit-risk']
  },

  // LOW: Internet - Service suspension but not essential
  {
    userId: 'user-single-parent',
    name: 'Internet - Comcast Xfinity',
    type: BillType.INTERNET,
    status: BillStatus.OVERDUE,
    originalAmount: 89.99,
    currentBalance: 99.99,
    dueDate: '2024-01-15T00:00:00Z',
    originalDueDate: '2024-01-15T00:00:00Z',
    daysOverdue: 18,
    isEssential: false,
    highestConsequenceSeverity: 60,
    consequences: [
      {
        type: ConsequenceType.SHUTOFF,
        urgency: ConsequenceUrgency.SHORT_TERM,
        severity: 60,
        description: 'Internet service will be suspended after 45 days overdue',
        estimatedDays: 27,
        preventable: true,
        recoverable: true,
        recoveryCost: 100.00,
        recoveryTimeMonths: 0,
        utilityType: 'internet',
        reconnectionFee: 100.00,
        gracePeriodDays: 45
      } as UtilityShutoffConsequence
    ],
    paymentTerms: {
      gracePeriodDays: 30,
      lateFeeAmount: 10.00,
      paymentDueDayOfMonth: 15
    },
    creditor: {
      name: 'Comcast Xfinity',
      phone: '800-XFINITY',
      customerServiceHours: '24/7'
    },
    source: 'manual',
    category: 'utilities',
    tags: ['internet', 'non-essential']
  }
];

// ===================
// Scenario 2: College Student - Multiple Financial Pressures
// ===================

export const COLLEGE_STUDENT_SCENARIO: Omit<Bill, 'PK' | 'SK' | 'GSI1PK' | 'GSI1SK' | 'billId' | 'priority' | 'priorityCalculatedAt' | 'createdAt' | 'updatedAt'>[] = [
  // CRITICAL: Car Payment - Repo Notice
  {
    userId: 'user-college-student',
    name: 'Auto Loan - Honda Civic',
    description: 'Received repossession warning',
    type: BillType.CAR_PAYMENT,
    status: BillStatus.OVERDUE,
    originalAmount: 285.00,
    currentBalance: 285.00,
    minimumPayment: 285.00,
    dueDate: '2024-01-05T00:00:00Z',
    originalDueDate: '2024-01-05T00:00:00Z',
    daysOverdue: 28,
    isEssential: true,
    highestConsequenceSeverity: 95,
    consequences: [
      {
        type: ConsequenceType.REPOSSESSION,
        urgency: ConsequenceUrgency.IMMEDIATE,
        severity: 95,
        description: 'Vehicle may be repossessed at any time - need transportation for work and school',
        estimatedDays: 2,
        preventable: true,
        recoverable: true,
        recoveryCost: 1200.00,
        recoveryTimeMonths: 0,
        vehicleValue: 8500.00,
        deficiencyBalance: 12500.00,
        repoFees: 500.00,
        storageFeesPerDay: 25.00,
        redemptionPeriodDays: 10
      } as VehicleRepoConsequence
    ],
    paymentTerms: {
      gracePeriodDays: 10,
      lateFeeAmount: 25.00,
      paymentDueDayOfMonth: 5
    },
    creditor: {
      name: 'Honda Financial Services',
      phone: '800-708-6555',
      customerServiceHours: 'Mon-Fri 8AM-11PM ET, Sat 9AM-6PM ET'
    },
    source: 'manual',
    category: 'transportation',
    tags: ['essential', 'repo-risk', 'transportation']
  },

  // HIGH: Car Insurance - License Suspension Risk
  {
    userId: 'user-college-student',
    name: 'Auto Insurance - State Farm',
    description: 'Policy lapsed - driving without insurance',
    type: BillType.CAR_INSURANCE,
    status: BillStatus.OVERDUE,
    originalAmount: 165.00,
    currentBalance: 190.00, // Includes reinstatement fee
    dueDate: '2024-01-01T00:00:00Z',
    originalDueDate: '2024-01-01T00:00:00Z',
    daysOverdue: 32,
    isEssential: true,
    highestConsequenceSeverity: 85,
    consequences: [
      {
        type: ConsequenceType.LICENSE_SUSPENSION,
        urgency: ConsequenceUrgency.SHORT_TERM,
        severity: 85,
        description: 'Driver license will be suspended for driving without insurance - state has automatic reporting',
        estimatedDays: 14,
        preventable: true,
        recoverable: true,
        recoveryCost: 250.00,
        recoveryTimeMonths: 1,
        suspensionType: 'drivers_license',
        reinstatementFee: 250.00,
        additionalRequirements: ['SR-22 filing', 'Proof of insurance for 3 years']
      } as LicenseSuspensionConsequence
    ],
    paymentTerms: {
      gracePeriodDays: 10,
      paymentDueDayOfMonth: 1
    },
    creditor: {
      name: 'State Farm Insurance',
      phone: '800-STATE-FARM',
      customerServiceHours: '24/7'
    },
    source: 'manual',
    category: 'insurance',
    tags: ['essential', 'license-risk', 'insurance']
  },

  // MEDIUM: Student Loan - Default Prevention
  {
    userId: 'user-college-student',
    name: 'Federal Student Loan - Sallie Mae',
    type: BillType.STUDENT_LOAN,
    status: BillStatus.OVERDUE,
    originalAmount: 225.00,
    currentBalance: 225.00,
    minimumPayment: 225.00,
    dueDate: '2024-01-15T00:00:00Z',
    originalDueDate: '2024-01-15T00:00:00Z',
    daysOverdue: 18,
    isEssential: false,
    highestConsequenceSeverity: 70,
    consequences: [
      {
        type: ConsequenceType.CREDIT_DAMAGE,
        urgency: ConsequenceUrgency.MEDIUM_TERM,
        severity: 70,
        description: 'Student loan default has severe long-term consequences including wage garnishment',
        estimatedDays: 60,
        preventable: true,
        recoverable: true,
        recoveryCost: 0,
        recoveryTimeMonths: 36,
        estimatedScoreDrop: 80,
        yearsOnReport: 7,
        impactOnBorrowing: 'severe'
      } as CreditDamageConsequence
    ],
    paymentTerms: {
      gracePeriodDays: 15,
      paymentDueDayOfMonth: 15
    },
    creditor: {
      name: 'Sallie Mae',
      phone: '800-4-SALLIE',
      customerServiceHours: 'Mon-Fri 8AM-11PM ET'
    },
    negotiationOpportunity: {
      windowDays: 45,
      likelihood: 'high',
      strategies: ['Income-driven repayment plan', 'Forbearance', 'Deferment'],
      successFactors: ['Student status', 'Financial hardship documentation']
    },
    source: 'manual',
    category: 'education',
    tags: ['student-loan', 'federal-loan']
  }
];

// ===================
// Scenario 3: Small Business Owner - Cash Flow Crisis
// ===================

export const SMALL_BUSINESS_SCENARIO: Omit<Bill, 'PK' | 'SK' | 'GSI1PK' | 'GSI1SK' | 'billId' | 'priority' | 'priorityCalculatedAt' | 'createdAt' | 'updatedAt'>[] = [
  // CRITICAL: Business Electric - Operations at Risk
  {
    userId: 'user-business-owner',
    name: 'Business Electric - Commercial Power',
    description: 'Restaurant kitchen equipment depends on power',
    type: BillType.ELECTRIC,
    status: BillStatus.OVERDUE,
    originalAmount: 485.67,
    currentBalance: 485.67,
    dueDate: '2024-01-10T00:00:00Z',
    originalDueDate: '2024-01-10T00:00:00Z',
    daysOverdue: 23,
    isEssential: true,
    highestConsequenceSeverity: 100,
    consequences: [
      {
        type: ConsequenceType.SHUTOFF,
        urgency: ConsequenceUrgency.IMMEDIATE,
        severity: 100,
        description: 'Commercial power shutoff will close restaurant - lose daily revenue of $800',
        estimatedDays: 2,
        preventable: true,
        recoverable: true,
        recoveryCost: 300.00,
        recoveryTimeMonths: 0,
        utilityType: 'electric',
        shutoffDate: '2024-02-04T09:00:00Z',
        reconnectionFee: 300.00,
        depositRequired: 1000.00,
        gracePeriodDays: 5
      } as UtilityShutoffConsequence
    ],
    paymentTerms: {
      gracePeriodDays: 5,
      lateFeeAmount: 50.00,
      paymentDueDayOfMonth: 10
    },
    creditor: {
      name: 'Metro Business Electric',
      phone: '555-BIZ-POWER',
      customerServiceHours: 'Mon-Fri 7AM-6PM'
    },
    source: 'manual',
    category: 'utilities',
    tags: ['essential', 'business-critical', 'revenue-impact']
  },

  // HIGH: Commercial Rent - Eviction Proceedings
  {
    userId: 'user-business-owner',
    name: 'Commercial Rent - Main Street Plaza',
    type: BillType.RENT,
    status: BillStatus.OVERDUE,
    originalAmount: 3200.00,
    currentBalance: 3400.00, // Includes late fees
    dueDate: '2023-12-01T00:00:00Z',
    originalDueDate: '2023-12-01T00:00:00Z',
    daysOverdue: 63,
    isEssential: true,
    highestConsequenceSeverity: 90,
    consequences: [
      {
        type: ConsequenceType.EVICTION,
        urgency: ConsequenceUrgency.SHORT_TERM,
        severity: 90,
        description: 'Commercial eviction will force business closure - lose customer base and equipment',
        estimatedDays: 21,
        preventable: true,
        recoverable: false,
        recoveryCost: 15000.00,
        recoveryTimeMonths: 6,
        noticeDate: '2024-01-15T00:00:00Z',
        courtDate: '2024-02-20T09:00:00Z',
        legalFees: 2500.00,
        movingCosts: 5000.00
      } as HousingLossConsequence
    ],
    paymentTerms: {
      gracePeriodDays: 5,
      lateFeeAmount: 200.00,
      paymentDueDayOfMonth: 1
    },
    creditor: {
      name: 'Main Street Property Group',
      phone: '555-RENT-DUE'
    },
    negotiationOpportunity: {
      windowDays: 14,
      likelihood: 'medium',
      strategies: ['Payment plan', 'Partial payment with timeline'],
      successFactors: ['Business history', 'Future revenue projections']
    },
    source: 'manual',
    category: 'business-rent',
    tags: ['essential', 'business-critical', 'eviction-risk']
  },

  // MEDIUM: Business Credit Card - High Interest Accumulating
  {
    userId: 'user-business-owner',
    name: 'Business Credit Card - American Express',
    type: BillType.CREDIT_CARD,
    status: BillStatus.OVERDUE,
    originalAmount: 4567.89,
    currentBalance: 4750.23, // Includes interest and fees
    minimumPayment: 95.00,
    interestRate: 0.2199, // 21.99% APR
    dueDate: '2024-01-20T00:00:00Z',
    originalDueDate: '2024-01-20T00:00:00Z',
    daysOverdue: 13,
    isEssential: false,
    highestConsequenceSeverity: 65,
    consequences: [
      {
        type: ConsequenceType.LATE_FEES,
        urgency: ConsequenceUrgency.IMMEDIATE,
        severity: 50,
        description: 'Business card late fees are higher - $49 monthly late fee applied',
        estimatedDays: 0,
        preventable: false,
        recoverable: false,
        lateFeeAmount: 49.00,
        isCompounding: true,
        compoundingFrequency: 'monthly'
      } as LateFeeConsequence,
      {
        type: ConsequenceType.CREDIT_DAMAGE,
        urgency: ConsequenceUrgency.SHORT_TERM,
        severity: 65,
        description: 'Business credit damage affects ability to get business loans and supplier credit',
        estimatedDays: 17,
        preventable: true,
        recoverable: true,
        recoveryCost: 0,
        recoveryTimeMonths: 18,
        estimatedScoreDrop: 40,
        yearsOnReport: 7,
        impactOnBorrowing: 'moderate'
      } as CreditDamageConsequence
    ],
    paymentTerms: {
      minimumPayment: 95.00,
      gracePeriodDays: 25,
      lateFeeAmount: 49.00,
      interestRate: 0.2199,
      compoundingFrequency: 'daily',
      paymentDueDayOfMonth: 20
    },
    creditor: {
      name: 'American Express Business',
      phone: '800-492-3344',
      customerServiceHours: '24/7'
    },
    source: 'manual',
    category: 'business-credit',
    tags: ['credit-card', 'business-credit']
  }
];

// ===================
// Scenario 4: Retiree - Fixed Income Challenges
// ===================

export const RETIREE_SCENARIO: Omit<Bill, 'PK' | 'SK' | 'GSI1PK' | 'GSI1SK' | 'billId' | 'priority' | 'priorityCalculatedAt' | 'createdAt' | 'updatedAt'>[] = [
  // CRITICAL: Prescription Medication
  {
    userId: 'user-retiree',
    name: 'Prescription - Heart Medication',
    type: BillType.PRESCRIPTION,
    status: BillStatus.OVERDUE,
    originalAmount: 156.78,
    currentBalance: 156.78,
    dueDate: '2024-01-25T00:00:00Z',
    originalDueDate: '2024-01-25T00:00:00Z',
    daysOverdue: 8,
    isEssential: true,
    highestConsequenceSeverity: 100,
    consequences: [
      {
        type: ConsequenceType.SHUTOFF,
        urgency: ConsequenceUrgency.IMMEDIATE,
        severity: 100,
        description: 'Pharmacy will not refill essential heart medication without payment - health risk',
        estimatedDays: 0,
        preventable: true,
        recoverable: true,
        recoveryCost: 0,
        recoveryTimeMonths: 0,
        utilityType: 'phone', // Using as generic service type
        reconnectionFee: 0,
        gracePeriodDays: 0
      } as UtilityShutoffConsequence
    ],
    paymentTerms: {
      gracePeriodDays: 0,
      paymentDueDayOfMonth: 25
    },
    creditor: {
      name: 'MediCare Pharmacy',
      phone: '555-MEDS-NOW',
      customerServiceHours: 'Mon-Fri 9AM-7PM, Sat 9AM-5PM'
    },
    source: 'manual',
    category: 'healthcare',
    tags: ['essential', 'health-critical', 'medication']
  },

  // HIGH: Mortgage - Foreclosure Prevention
  {
    userId: 'user-retiree',
    name: 'Mortgage - First National Bank',
    type: BillType.MORTGAGE,
    status: BillStatus.OVERDUE,
    originalAmount: 1245.67,
    currentBalance: 1370.43, // Includes late fees
    dueDate: '2023-12-01T00:00:00Z',
    originalDueDate: '2023-12-01T00:00:00Z',
    daysOverdue: 63,
    isEssential: true,
    highestConsequenceSeverity: 85,
    consequences: [
      {
        type: ConsequenceType.FORECLOSURE,
        urgency: ConsequenceUrgency.MEDIUM_TERM,
        severity: 85,
        description: 'Foreclosure proceedings may begin - family home of 30 years at risk',
        estimatedDays: 90,
        preventable: true,
        recoverable: true,
        recoveryCost: 5000.00,
        recoveryTimeMonths: 12,
        legalFees: 3000.00,
        movingCosts: 2000.00
      } as HousingLossConsequence
    ],
    paymentTerms: {
      gracePeriodDays: 15,
      lateFeeAmount: 124.76,
      paymentDueDayOfMonth: 1
    },
    creditor: {
      name: 'First National Bank Mortgage',
      phone: '800-555-LOAN',
      customerServiceHours: 'Mon-Fri 8AM-8PM'
    },
    negotiationOpportunity: {
      windowDays: 60,
      likelihood: 'high',
      strategies: ['Loan modification', 'Forbearance', 'Refinancing'],
      successFactors: ['Long payment history', 'Senior citizen status', 'Fixed income documentation']
    },
    source: 'manual',
    category: 'housing',
    tags: ['essential', 'foreclosure-risk', 'family-home']
  }
];

// ===================
// All Scenarios Combined
// ===================

export const ALL_SAMPLE_BILLS = [
  ...SINGLE_PARENT_SCENARIO,
  ...COLLEGE_STUDENT_SCENARIO,
  ...SMALL_BUSINESS_SCENARIO,
  ...RETIREE_SCENARIO
];

// ===================
// Export Sample Data for Testing
// ===================

export const SAMPLE_USER_PROFILES = {
  'user-single-parent': {
    name: 'Sarah Johnson',
    scenario: 'Single parent working two part-time jobs',
    monthlyIncome: 2800,
    availableForBills: 800,
    priorityConcerns: ['Essential services', 'Housing stability', 'Childcare needs']
  },
  'user-college-student': {
    name: 'Mike Rodriguez',
    scenario: 'College student working part-time',
    monthlyIncome: 1200,
    availableForBills: 400,
    priorityConcerns: ['Transportation for work/school', 'Education continuation', 'Insurance compliance']
  },
  'user-business-owner': {
    name: 'Lisa Chen',
    scenario: 'Small restaurant owner facing seasonal slowdown',
    monthlyIncome: 4500,
    availableForBills: 2000,
    priorityConcerns: ['Business operations', 'Employee payroll', 'Customer reputation']
  },
  'user-retiree': {
    name: 'Robert Miller',
    scenario: 'Retiree on fixed Social Security income',
    monthlyIncome: 1850,
    availableForBills: 600,
    priorityConcerns: ['Healthcare needs', 'Home security', 'Family legacy']
  }
};

// ===================
// Helper Functions
// ===================

export function getBillsByScenario(scenario: string): typeof SINGLE_PARENT_SCENARIO {
  switch (scenario) {
    case 'single-parent':
      return SINGLE_PARENT_SCENARIO;
    case 'college-student':
      return COLLEGE_STUDENT_SCENARIO;
    case 'business-owner':
      return SMALL_BUSINESS_SCENARIO;
    case 'retiree':
      return RETIREE_SCENARIO;
    default:
      return SINGLE_PARENT_SCENARIO;
  }
}

export function getRandomBillScenario(): typeof SINGLE_PARENT_SCENARIO {
  const scenarios = [
    SINGLE_PARENT_SCENARIO,
    COLLEGE_STUDENT_SCENARIO,
    SMALL_BUSINESS_SCENARIO,
    RETIREE_SCENARIO
  ];
  
  return scenarios[Math.floor(Math.random() * scenarios.length)];
}