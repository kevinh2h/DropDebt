/**
 * DropDebt Essential Needs Calculator
 * 
 * Calculates protected amounts for basic living expenses to ensure users
 * don't compromise their survival needs while catching up on debt
 */

import {
  EssentialExpenses,
  IncomeSource,
  PaymentFrequency,
  FlexibilityLevel,
  BudgetCalculation,
  ProtectedAmounts,
  SeasonalVariation,
  BudgetSafetyLevel,
  PaymentValidationResult
} from '../types/expenses';

export class EssentialNeedsCalculator {
  private readonly DAYS_IN_YEAR = 365;
  private readonly WEEKS_IN_YEAR = 52;
  private readonly MONTHS_IN_YEAR = 12;
  private readonly BIWEEKLY_PERIODS_IN_YEAR = 26;

  /**
   * Calculate total protected amount and available funds for debt payments
   */
  calculateBudgetProtection(
    expenses: EssentialExpenses,
    incomeSources: IncomeSource[]
  ): BudgetCalculation {
    const totalMonthlyIncome = this.calculateTotalMonthlyIncome(incomeSources);
    const totalMonthlyExpenses = this.calculateTotalMonthlyExpenses(expenses);
    const emergencyCushion = this.calculateEmergencyCushion(expenses, totalMonthlyIncome);
    
    const protectedAmount = totalMonthlyExpenses + emergencyCushion;
    const availableForDebt = Math.max(0, totalMonthlyIncome - protectedAmount);
    
    // Calculate per-paycheck protection
    const protectedAmounts = this.calculatePerPaycheckProtection(
      protectedAmount,
      incomeSources
    );
    
    // Check for seasonal stress periods
    const monthlyVariations = this.calculateMonthlyVariations(expenses);
    const criticalMonths = this.identifyCriticalMonths(
      monthlyVariations,
      totalMonthlyIncome,
      emergencyCushion
    );
    
    return {
      totalMonthlyIncome,
      totalMonthlyExpenses,
      emergencyCushion,
      protectedAmount,
      availableForDebt,
      protectedAmounts,
      monthlyBreakdown: this.generateMonthlyBreakdown(expenses, monthlyVariations),
      incomeStability: this.assessIncomeStability(incomeSources),
      seasonalRisks: criticalMonths,
      lastCalculated: new Date().toISOString()
    };
  }

  /**
   * Calculate total monthly income from all sources
   */
  private calculateTotalMonthlyIncome(incomeSources: IncomeSource[]): number {
    return incomeSources.reduce((total, source) => {
      if (!source.isActive) return total;
      
      const monthlyAmount = this.convertToMonthly(
        source.amount,
        source.frequency
      );
      
      // Apply stability factor for irregular income
      const stabilityFactor = source.stability || 1.0;
      return total + (monthlyAmount * stabilityFactor);
    }, 0);
  }

  /**
   * Calculate total monthly essential expenses
   */
  private calculateTotalMonthlyExpenses(expenses: EssentialExpenses): number {
    let total = 0;
    
    // Sum all expense categories
    Object.values(expenses.categories).forEach(category => {
      // Use actual amount or minimum if not set
      const amount = category.actualAmount || category.minimumAmount;
      const monthlyAmount = this.convertToMonthly(amount, category.frequency);
      total += monthlyAmount;
    });
    
    return total;
  }

  /**
   * Calculate emergency cushion based on income and expense stability
   */
  private calculateEmergencyCushion(
    expenses: EssentialExpenses,
    monthlyIncome: number
  ): number {
    // Base cushion is 5% of monthly income or $100, whichever is greater
    let cushion = Math.max(100, monthlyIncome * 0.05);
    
    // Increase for dependents
    const dependentCount = expenses.specialCircumstances?.dependents || 0;
    cushion += dependentCount * 50;
    
    // Increase for variable expenses
    Object.values(expenses.categories).forEach(category => {
      if (category.flexibility === FlexibilityLevel.VARIABLE) {
        const monthlyAmount = this.convertToMonthly(
          category.actualAmount || category.minimumAmount,
          category.frequency
        );
        cushion += monthlyAmount * 0.1; // Add 10% of variable expenses
      }
    });
    
    // Increase for seasonal variations
    if (this.hasSignificantSeasonalVariation(expenses)) {
      cushion *= 1.2; // 20% increase for seasonal variation
    }
    
    // Cap at reasonable maximum
    return Math.min(cushion, 500);
  }

  /**
   * Calculate protected amounts for each paycheck
   */
  private calculatePerPaycheckProtection(
    monthlyProtectedAmount: number,
    incomeSources: IncomeSource[]
  ): ProtectedAmounts {
    const protectedAmounts: ProtectedAmounts = {
      weekly: 0,
      biweekly: 0,
      monthly: monthlyProtectedAmount,
      perPaycheck: []
    };
    
    // Calculate standard conversions
    protectedAmounts.weekly = (monthlyProtectedAmount * 12) / 52;
    protectedAmounts.biweekly = (monthlyProtectedAmount * 12) / 26;
    
    // Calculate per-paycheck based on actual income sources
    const totalMonthlyIncome = this.calculateTotalMonthlyIncome(incomeSources);
    
    incomeSources.forEach(source => {
      if (!source.isActive) return;
      
      const monthlyFromSource = this.convertToMonthly(source.amount, source.frequency);
      const percentageOfIncome = monthlyFromSource / totalMonthlyIncome;
      
      let paycheckProtection = 0;
      switch (source.frequency) {
        case PaymentFrequency.WEEKLY:
          paycheckProtection = protectedAmounts.weekly;
          break;
        case PaymentFrequency.BIWEEKLY:
          paycheckProtection = protectedAmounts.biweekly;
          break;
        case PaymentFrequency.MONTHLY:
          paycheckProtection = monthlyProtectedAmount * percentageOfIncome;
          break;
        case PaymentFrequency.IRREGULAR:
          // For irregular income, protect a proportional amount
          paycheckProtection = source.amount * (monthlyProtectedAmount / totalMonthlyIncome);
          break;
      }
      
      protectedAmounts.perPaycheck.push({
        sourceId: source.id,
        sourceName: source.name,
        amount: Math.round(paycheckProtection * 100) / 100
      });
    });
    
    return protectedAmounts;
  }

  /**
   * Convert any payment frequency to monthly amount
   */
  private convertToMonthly(amount: number, frequency: PaymentFrequency): number {
    switch (frequency) {
      case PaymentFrequency.WEEKLY:
        return (amount * this.WEEKS_IN_YEAR) / this.MONTHS_IN_YEAR;
      case PaymentFrequency.BIWEEKLY:
        return (amount * this.BIWEEKLY_PERIODS_IN_YEAR) / this.MONTHS_IN_YEAR;
      case PaymentFrequency.MONTHLY:
        return amount;
      case PaymentFrequency.QUARTERLY:
        return amount / 3;
      case PaymentFrequency.ANNUALLY:
        return amount / this.MONTHS_IN_YEAR;
      case PaymentFrequency.IRREGULAR:
        // Assume irregular payments average out monthly
        return amount;
      default:
        return amount;
    }
  }

  /**
   * Calculate monthly expense variations based on seasonal patterns
   */
  private calculateMonthlyVariations(expenses: EssentialExpenses): Map<number, number> {
    const monthlyVariations = new Map<number, number>();
    
    // Initialize with base monthly expenses
    for (let month = 1; month <= 12; month++) {
      monthlyVariations.set(month, this.calculateTotalMonthlyExpenses(expenses));
    }
    
    // Apply seasonal variations
    Object.values(expenses.categories).forEach(category => {
      if (category.seasonalVariations) {
        category.seasonalVariations.forEach(variation => {
          variation.affectedMonths.forEach(month => {
            const currentAmount = monthlyVariations.get(month) || 0;
            const baseAmount = this.convertToMonthly(
              category.actualAmount || category.minimumAmount,
              category.frequency
            );
            const adjustment = baseAmount * (variation.adjustmentFactor - 1);
            monthlyVariations.set(month, currentAmount + adjustment);
          });
        });
      }
    });
    
    return monthlyVariations;
  }

  /**
   * Identify months where budget will be critically tight
   */
  private identifyCriticalMonths(
    monthlyVariations: Map<number, number>,
    monthlyIncome: number,
    emergencyCushion: number
  ): number[] {
    const criticalMonths: number[] = [];
    
    monthlyVariations.forEach((expenses, month) => {
      const availableFunds = monthlyIncome - expenses - emergencyCushion;
      if (availableFunds < 100) { // Less than $100 available for debt
        criticalMonths.push(month);
      }
    });
    
    return criticalMonths;
  }

  /**
   * Generate detailed monthly breakdown of expenses
   */
  private generateMonthlyBreakdown(
    expenses: EssentialExpenses,
    monthlyVariations: Map<number, number>
  ): any {
    const breakdown: any = {};
    
    for (let month = 1; month <= 12; month++) {
      breakdown[month] = {
        total: monthlyVariations.get(month) || 0,
        categories: {}
      };
      
      // Break down by category
      Object.entries(expenses.categories).forEach(([key, category]) => {
        const baseAmount = this.convertToMonthly(
          category.actualAmount || category.minimumAmount,
          category.frequency
        );
        
        // Apply seasonal adjustments
        let adjustedAmount = baseAmount;
        if (category.seasonalVariations) {
          const variation = category.seasonalVariations.find(v => 
            v.affectedMonths.includes(month)
          );
          if (variation) {
            adjustedAmount = baseAmount * variation.adjustmentFactor;
          }
        }
        
        breakdown[month].categories[key] = adjustedAmount;
      });
    }
    
    return breakdown;
  }

  /**
   * Assess overall income stability
   */
  private assessIncomeStability(incomeSources: IncomeSource[]): number {
    if (incomeSources.length === 0) return 0;
    
    const totalMonthlyIncome = this.calculateTotalMonthlyIncome(incomeSources);
    let weightedStability = 0;
    
    incomeSources.forEach(source => {
      if (!source.isActive) return;
      
      const monthlyAmount = this.convertToMonthly(source.amount, source.frequency);
      const weight = monthlyAmount / totalMonthlyIncome;
      const stability = source.stability || 1.0;
      
      weightedStability += stability * weight;
    });
    
    return Math.round(weightedStability * 100) / 100;
  }

  /**
   * Check if expenses have significant seasonal variation
   */
  private hasSignificantSeasonalVariation(expenses: EssentialExpenses): boolean {
    let hasVariation = false;
    
    Object.values(expenses.categories).forEach(category => {
      if (category.seasonalVariations && category.seasonalVariations.length > 0) {
        category.seasonalVariations.forEach(variation => {
          // Significant if variation is more than 20%
          if (Math.abs(variation.adjustmentFactor - 1) > 0.2) {
            hasVariation = true;
          }
        });
      }
    });
    
    return hasVariation;
  }

  /**
   * Calculate available funds for a specific pay period
   */
  calculateAvailableForPayPeriod(
    budgetCalculation: BudgetCalculation,
    startDate: Date,
    endDate: Date,
    frequency: PaymentFrequency
  ): number {
    const daysInPeriod = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const dailyAvailable = budgetCalculation.availableForDebt / 30; // Approximate
    let periodAvailable = dailyAvailable * daysInPeriod;
    
    // Adjust for pay frequency to ensure smooth cash flow
    switch (frequency) {
      case PaymentFrequency.WEEKLY:
        periodAvailable = budgetCalculation.availableForDebt / 4;
        break;
      case PaymentFrequency.BIWEEKLY:
        periodAvailable = budgetCalculation.availableForDebt / 2;
        break;
      case PaymentFrequency.MONTHLY:
        periodAvailable = budgetCalculation.availableForDebt;
        break;
    }
    
    return Math.max(0, periodAvailable);
  }

  /**
   * Validate a proposed payment plan against budget safety
   * Prevents users from making financially dangerous decisions
   */
  validatePaymentPlan(
    budgetCalculation: BudgetCalculation,
    proposedPayment: number,
    frequency: PaymentFrequency = PaymentFrequency.MONTHLY
  ): PaymentValidationResult {
    // Convert proposed payment to monthly equivalent
    const monthlyPayment = this.convertToMonthly(proposedPayment, frequency);
    
    // Calculate remaining funds after payment
    const remainingFunds = budgetCalculation.availableForDebt - monthlyPayment;
    
    // Check if payment is affordable
    const isAffordable = remainingFunds >= 0;
    
    // Check if emergency buffer is maintained (at least 50% of cushion)
    const minimumBuffer = budgetCalculation.emergencyCushion * 0.5;
    const hasEmergencyBuffer = remainingFunds >= minimumBuffer;
    
    // Calculate maximum safe payment (80% of available funds to maintain buffer)
    const maxSafePayment = Math.max(0, budgetCalculation.availableForDebt * 0.8);
    
    // Determine safety level
    const safetyLevel = this.calculateSafetyLevel(remainingFunds, budgetCalculation);
    
    // Generate specific warnings
    const warnings = this.generatePaymentWarnings(
      monthlyPayment,
      remainingFunds,
      budgetCalculation,
      safetyLevel
    );
    
    // Calculate alternative suggestions
    const suggestions = this.generatePaymentSuggestions(
      monthlyPayment,
      maxSafePayment,
      budgetCalculation,
      safetyLevel
    );
    
    return {
      isAffordable,
      hasEmergencyBuffer,
      safetyLevel,
      maxSafePayment,
      remainingAfterPayment: Math.max(0, remainingFunds),
      warnings,
      suggestions,
      details: {
        proposedMonthlyPayment: monthlyPayment,
        availableForDebt: budgetCalculation.availableForDebt,
        emergencyCushionRequired: budgetCalculation.emergencyCushion,
        minimumBufferRequired: minimumBuffer
      }
    };
  }

  /**
   * Calculate budget safety level based on remaining funds
   */
  private calculateSafetyLevel(
    remainingFunds: number,
    budgetCalculation: BudgetCalculation
  ): BudgetSafetyLevel {
    if (remainingFunds < 0) {
      return BudgetSafetyLevel.CRITICAL; // Can't afford essentials
    }
    
    const emergencyCushion = budgetCalculation.emergencyCushion;
    const monthlyIncome = budgetCalculation.totalMonthlyIncome;
    
    if (remainingFunds < emergencyCushion * 0.25) {
      return BudgetSafetyLevel.DANGEROUS; // Very little buffer
    }
    
    if (remainingFunds < emergencyCushion * 0.5) {
      return BudgetSafetyLevel.TIGHT; // Minimal buffer
    }
    
    if (remainingFunds < emergencyCushion) {
      return BudgetSafetyLevel.MODERATE; // Reasonable buffer
    }
    
    return BudgetSafetyLevel.COMFORTABLE; // Good buffer
  }

  /**
   * Generate specific warnings based on safety level
   */
  private generatePaymentWarnings(
    monthlyPayment: number,
    remainingFunds: number,
    budgetCalculation: BudgetCalculation,
    safetyLevel: BudgetSafetyLevel
  ): string[] {
    const warnings: string[] = [];
    
    switch (safetyLevel) {
      case BudgetSafetyLevel.CRITICAL:
        const shortfall = Math.abs(remainingFunds);
        warnings.push(
          `CRITICAL: This payment plan would leave you $${shortfall.toFixed(2)} short of covering essential needs. This plan is not possible with your current budget.`
        );
        warnings.push(
          'You need to either reduce the payment amount or find additional income before proceeding.'
        );
        break;
        
      case BudgetSafetyLevel.DANGEROUS:
        warnings.push(
          `DANGEROUS: This payment would leave only $${remainingFunds.toFixed(2)} for unexpected expenses. One car repair or medical bill could create a financial emergency.`
        );
        warnings.push(
          `Consider reducing your payment by $${(monthlyPayment - budgetCalculation.availableForDebt * 0.7).toFixed(2)} to maintain a safety buffer.`
        );
        break;
        
      case BudgetSafetyLevel.TIGHT:
        warnings.push(
          `CAUTION: This payment is manageable but tight, leaving $${remainingFunds.toFixed(2)} buffer. Budget carefully and avoid unexpected expenses.`
        );
        break;
    }
    
    // Add seasonal warnings if applicable
    if (budgetCalculation.seasonalRisks.length > 0) {
      const months = budgetCalculation.seasonalRisks.map(m => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return monthNames[m - 1];
      });
      warnings.push(
        `Additional caution needed in ${months.join(', ')} due to seasonal expense increases.`
      );
    }
    
    return warnings;
  }

  /**
   * Generate payment suggestions to improve safety
   */
  private generatePaymentSuggestions(
    proposedPayment: number,
    maxSafePayment: number,
    budgetCalculation: BudgetCalculation,
    safetyLevel: BudgetSafetyLevel
  ): string[] {
    const suggestions: string[] = [];
    
    if (safetyLevel === BudgetSafetyLevel.CRITICAL) {
      suggestions.push(
        `Try a payment of $${maxSafePayment.toFixed(2)} instead to maintain essential needs coverage.`
      );
      suggestions.push(
        'Consider contacting creditors to negotiate lower minimum payments or payment plans.'
      );
      suggestions.push(
        'Look into local assistance programs for utilities, food, or housing if available.'
      );
    } else if (safetyLevel === BudgetSafetyLevel.DANGEROUS) {
      const saferPayment = budgetCalculation.availableForDebt * 0.7;
      suggestions.push(
        `A payment of $${saferPayment.toFixed(2)} would be safer while still making meaningful progress.`
      );
      suggestions.push(
        'Build a small emergency fund before increasing payment amounts.'
      );
    } else if (safetyLevel === BudgetSafetyLevel.TIGHT) {
      suggestions.push(
        'This payment is workable if you budget carefully and avoid discretionary spending.'
      );
      suggestions.push(
        'Consider starting with this amount and increasing gradually as your situation improves.'
      );
    }
    
    // Always suggest reviewing expenses
    if (budgetCalculation.availableForDebt < 200) {
      suggestions.push(
        'Review your essential expenses to see if any can be reduced to free up more funds for debt payments.'
      );
    }
    
    return suggestions;
  }
}

// Export singleton instance
export const essentialNeedsCalculator = new EssentialNeedsCalculator();