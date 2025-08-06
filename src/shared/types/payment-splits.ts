/**
 * Crisis Triage Types
 * 
 * Simple types for crisis triage system focused on immediate user needs.
 * Replaces over-engineered payment splitting with clear crisis guidance.
 */

// Re-export essential types from other systems
export { BudgetSafetyLevel } from './expenses';

/**
 * Simple payment strategies - how much of available money to use
 */
export enum PaymentStrategy {
  CONSERVATIVE = 'CONSERVATIVE', // Use 50% - large safety buffer
  BALANCED = 'BALANCED',         // Use 70% - reasonable buffer  
  AGGRESSIVE = 'AGGRESSIVE'      // Use 90% - minimal buffer
}

/**
 * Crisis triage result - tells user exactly what to do
 */
export interface CrisisTriageResult {
  isCrisis: boolean;
  strategy: PaymentStrategy;
  availableAmount: number;
  usableAmount: number;
  bufferAmount: number;
  totalBills: number;
  criticalBills: number;
  actions: string[];
  consequences: string[];
  helpResources: string[];
  nextSteps: string[];
}

/**
 * Bill information for triage
 */
export interface TriageBill {
  billId: string;
  name: string;
  currentBalance: number;
  priorityCategory: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  shutoffDate?: string;
}

/**
 * Crisis alert for tracking
 */
export interface CrisisAlert {
  userId: string;
  alertId: string;
  timestamp: string;
  severity: 'EMERGENCY' | 'CRISIS';
  criticalBills: number;
  availableAmount: number;
  strategy: PaymentStrategy;
  actions: string[];
  helpResources: string[];
}