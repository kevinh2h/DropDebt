/**
 * Budget-Bill Integration Utilities
 * 
 * Handles integration between Essential Needs Protection and Bill Prioritization
 * Ensures payment recommendations respect budget safety constraints
 */

import {
  BudgetCalculation,
  PaymentValidationResult,
  BudgetSafetyLevel
} from '../types/expenses';

export interface Bill {
  billId: string;
  name: string;
  currentBalance: number;
  minimumPayment?: number;
  daysOverdue: number;
  priority: number;
  status: string;
  isEssential: boolean;
  type: string;
}

export interface PaymentRecommendation {
  billId: string;
  billName: string;
  recommendedPayment: number;
  priorityReason: string;
  budgetImpact: BudgetSafetyLevel;
  isAffordable: boolean;
}

export interface IntegratedPaymentPlan {
  totalMonthlyPayment: number;
  availableBudget: number;
  budgetSafetyLevel: BudgetSafetyLevel;
  recommendations: PaymentRecommendation[];
  unaffordableBills: Bill[];
  emergencyActions: string[];
  isViable: boolean;
}

export class BudgetBillIntegrator {
  
  /**
   * Create integrated payment plan that respects both bill priority and budget safety
   */
  createIntegratedPaymentPlan(
    bills: Bill[],
    budgetCalculation: BudgetCalculation
  ): IntegratedPaymentPlan {
    const availableBudget = budgetCalculation.availableForDebt;
    const activeBills = bills.filter(bill => bill.status === 'ACTIVE');
    
    // Separate essential bills (must be paid) from non-essential
    const essentialBills = activeBills.filter(bill => bill.isEssential);
    const nonEssentialBills = activeBills.filter(bill => !bill.isEssential);
    
    // Calculate total minimum payments required
    const totalMinimumPayments = activeBills.reduce((total, bill) => {
      return total + (bill.minimumPayment || Math.min(bill.currentBalance, 50));
    }, 0);
    
    let remainingBudget = availableBudget;
    const recommendations: PaymentRecommendation[] = [];
    const unaffordableBills: Bill[] = [];
    const emergencyActions: string[] = [];
    
    // First pass: Essential bills with critical priority
    const criticalBills = essentialBills
      .filter(bill => bill.priority >= 90)
      .sort((a, b) => b.priority - a.priority);
    
    for (const bill of criticalBills) {
      const minimumPayment = bill.minimumPayment || Math.min(bill.currentBalance, 50);
      
      if (remainingBudget >= minimumPayment) {
        recommendations.push({
          billId: bill.billId,
          billName: bill.name,
          recommendedPayment: minimumPayment,
          priorityReason: 'Critical essential service - must pay to avoid shutoff/eviction',
          budgetImpact: this.calculateBudgetImpact(minimumPayment, remainingBudget, budgetCalculation),
          isAffordable: true
        });
        remainingBudget -= minimumPayment;
      } else {
        unaffordableBills.push(bill);
        emergencyActions.push(`Contact ${bill.name} immediately - cannot afford minimum payment of $${minimumPayment.toFixed(2)}`);
      }
    }
    
    // Second pass: High priority bills (credit damage risk)
    const highPriorityBills = activeBills
      .filter(bill => bill.priority >= 70 && bill.priority < 90)
      .sort((a, b) => b.priority - a.priority);
    
    for (const bill of highPriorityBills) {
      const minimumPayment = bill.minimumPayment || Math.min(bill.currentBalance, 50);
      
      if (remainingBudget >= minimumPayment) {
        recommendations.push({
          billId: bill.billId,
          billName: bill.name,
          recommendedPayment: minimumPayment,
          priorityReason: 'High priority - prevents credit damage or significant late fees',
          budgetImpact: this.calculateBudgetImpact(minimumPayment, remainingBudget, budgetCalculation),
          isAffordable: true
        });
        remainingBudget -= minimumPayment;
      } else {
        // Try partial payment if possible
        if (remainingBudget >= 25 && bill.currentBalance > 100) {
          recommendations.push({
            billId: bill.billId,
            billName: bill.name,
            recommendedPayment: remainingBudget,
            priorityReason: 'Partial payment - all available budget allocated',
            budgetImpact: BudgetSafetyLevel.TIGHT,
            isAffordable: true
          });
          remainingBudget = 0;
        } else {
          unaffordableBills.push(bill);
          emergencyActions.push(`Cannot afford ${bill.name} - consider payment plan or deferment`);
        }
      }
    }
    
    // Add emergency actions if budget is insufficient
    if (unaffordableBills.length > 0) {
      emergencyActions.push('Contact non-profit credit counseling service for budget crisis assistance');
      emergencyActions.push('Look into local emergency assistance programs for utilities and housing');
      
      if (totalMinimumPayments > availableBudget * 2) {
        emergencyActions.push('Consider bankruptcy consultation - bills may be unsustainable');
      }
    }
    
    // Determine overall viability
    const totalRecommendedPayment = recommendations.reduce((sum, rec) => sum + rec.recommendedPayment, 0);
    const isViable = unaffordableBills.length === 0 || unaffordableBills.every(bill => !bill.isEssential);
    
    // Calculate overall budget safety level
    const budgetSafetyLevel = this.calculateOverallSafetyLevel(
      totalRecommendedPayment,
      budgetCalculation,
      unaffordableBills.length > 0
    );
    
    return {
      totalMonthlyPayment: totalRecommendedPayment,
      availableBudget,
      budgetSafetyLevel,
      recommendations,
      unaffordableBills,
      emergencyActions,
      isViable
    };
  }
  
  /**
   * Calculate budget impact for a specific payment
   */
  private calculateBudgetImpact(
    paymentAmount: number,
    remainingBudget: number,
    budgetCalculation: BudgetCalculation
  ): BudgetSafetyLevel {
    const afterPayment = remainingBudget - paymentAmount;
    const emergencyCushion = budgetCalculation.emergencyCushion;
    
    if (afterPayment < 0) {
      return BudgetSafetyLevel.CRITICAL;
    }
    
    if (afterPayment < emergencyCushion * 0.25) {
      return BudgetSafetyLevel.DANGEROUS;
    }
    
    if (afterPayment < emergencyCushion * 0.5) {
      return BudgetSafetyLevel.TIGHT;
    }
    
    if (afterPayment < emergencyCushion) {
      return BudgetSafetyLevel.MODERATE;
    }
    
    return BudgetSafetyLevel.COMFORTABLE;
  }
  
  /**
   * Calculate overall safety level for the payment plan
   */
  private calculateOverallSafetyLevel(
    totalPayment: number,
    budgetCalculation: BudgetCalculation,
    hasUnaffordableBills: boolean
  ): BudgetSafetyLevel {
    if (hasUnaffordableBills) {
      return BudgetSafetyLevel.CRITICAL;
    }
    
    const remainingAfterPayments = budgetCalculation.availableForDebt - totalPayment;
    const emergencyCushion = budgetCalculation.emergencyCushion;
    
    if (remainingAfterPayments < 0) {
      return BudgetSafetyLevel.CRITICAL;
    }
    
    if (remainingAfterPayments < emergencyCushion * 0.5) {
      return BudgetSafetyLevel.DANGEROUS;
    }
    
    return BudgetSafetyLevel.MODERATE;
  }
  
  /**
   * Generate crisis intervention recommendations
   */
  generateCrisisRecommendations(
    totalRequired: number,
    availableBudget: number,
    essentialBillsCount: number
  ): string[] {
    const shortfall = totalRequired - availableBudget;
    const recommendations: string[] = [];
    
    if (shortfall > availableBudget) {
      // Severe crisis - bills require more than double the available budget
      recommendations.push('EMERGENCY: Your bills exceed your available budget by more than 100%');
      recommendations.push('Contact 211 (dial 2-1-1) for immediate crisis assistance and resource referrals');
      recommendations.push('Apply for emergency utility assistance and food assistance programs immediately');
      recommendations.push('Consider bankruptcy consultation - this level of debt may be legally unsustainable');
    } else {
      // Manageable crisis with negotiation potential
      recommendations.push(`Your bills exceed budget by $${shortfall.toFixed(2)} - negotiation required`);
      recommendations.push('Contact creditors to negotiate payment plans or temporary forbearance');
      recommendations.push('Prioritize essential services (utilities, housing) to prevent shutoffs');
      recommendations.push('Look into local emergency assistance for gap funding');
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const budgetBillIntegrator = new BudgetBillIntegrator();