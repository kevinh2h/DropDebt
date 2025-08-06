/**
 * DropDebt Priority Calculator
 * 
 * Implements consequence-based priority scoring for bills
 * Core algorithm for the Catch-Up Prioritization Matrix
 */

import {
  Bill,
  BillConsequence,
  ConsequenceType,
  ConsequenceUrgency,
  PriorityFactors,
  PriorityCalculation,
  DEFAULT_PRIORITY_FACTORS,
  UtilityShutoffConsequence,
  HousingLossConsequence,
  VehicleRepoConsequence,
  LicenseSuspensionConsequence,
  CreditDamageConsequence,
  LateFeeConsequence
} from '../types/bill-models';

export class PriorityCalculator {
  private factors: PriorityFactors;

  constructor(factors: PriorityFactors = DEFAULT_PRIORITY_FACTORS) {
    this.factors = this.validateFactors(factors);
  }

  /**
   * Calculate comprehensive priority score for a bill
   */
  calculatePriority(bill: Bill): PriorityCalculation {
    const now = new Date();
    const calculatedAt = now.toISOString();

    // Calculate individual component scores
    const immediateConsequence = this.calculateImmediateConsequenceScore(bill);
    const financialImpact = this.calculateFinancialImpactScore(bill);
    const recoveryDifficulty = this.calculateRecoveryDifficultyScore(bill);
    const dueDate = this.calculateDueDateScore(bill);
    const amount = this.calculateAmountScore(bill);

    // Calculate weighted final score
    const finalScore = Math.round(
      (immediateConsequence * this.factors.immediateConsequenceWeight +
       financialImpact * this.factors.financialImpactWeight +
       recoveryDifficulty * this.factors.recoveryDifficultyWeight +
       dueDate * this.factors.dueDateWeight +
       amount * this.factors.amountWeight) * 100
    ) / 100;

    // Generate reasoning and recommendations
    const reasoning = this.generateReasoning(bill, {
      immediateConsequence,
      financialImpact,
      recoveryDifficulty,
      dueDate,
      amount
    });

    return {
      billId: bill.billId,
      calculatedAt,
      finalScore: Math.min(100, Math.max(0, finalScore)),
      factors: this.factors,
      scores: {
        immediateConsequence,
        financialImpact,
        recoveryDifficulty,
        dueDate,
        amount
      },
      reasoning
    };
  }

  /**
   * Calculate immediate consequence score (0-100)
   * Focuses on shutoff, eviction, repo, license suspension risks
   */
  private calculateImmediateConsequenceScore(bill: Bill): number {
    if (!bill.consequences || bill.consequences.length === 0) {
      return 0;
    }

    let maxScore = 0;

    for (const consequence of bill.consequences) {
      let score = 0;

      switch (consequence.type) {
        case ConsequenceType.SHUTOFF:
          score = this.calculateShutoffScore(consequence as UtilityShutoffConsequence);
          break;
        case ConsequenceType.EVICTION:
        case ConsequenceType.FORECLOSURE:
          score = this.calculateHousingLossScore(consequence as HousingLossConsequence);
          break;
        case ConsequenceType.REPOSSESSION:
          score = this.calculateRepoScore(consequence as VehicleRepoConsequence);
          break;
        case ConsequenceType.LICENSE_SUSPENSION:
          score = this.calculateLicenseSuspensionScore(consequence as LicenseSuspensionConsequence);
          break;
        default:
          score = this.calculateGenericConsequenceScore(consequence);
      }

      maxScore = Math.max(maxScore, score);
    }

    return Math.min(100, maxScore);
  }

  private calculateShutoffScore(consequence: UtilityShutoffConsequence): number {
    let score = 0;

    // Base severity from consequence
    score += consequence.severity * 0.6;

    // Urgency multiplier
    if (consequence.estimatedDays <= 3) {
      score += 40; // Immediate shutoff risk
    } else if (consequence.estimatedDays <= 7) {
      score += 30;
    } else if (consequence.estimatedDays <= 14) {
      score += 20;
    } else {
      score += 10;
    }

    // Essential utility bonus
    if (['electric', 'gas', 'water'].includes(consequence.utilityType)) {
      score += 20;
    }

    // Winter protection consideration
    if (consequence.winterMoratorium) {
      score *= 0.7; // Reduce urgency during protected period
    }

    return Math.min(100, score);
  }

  private calculateHousingLossScore(consequence: HousingLossConsequence): number {
    let score = 90; // Housing loss is always high priority

    // Immediate risk if court date is set
    if (consequence.courtDate) {
      const courtDate = new Date(consequence.courtDate);
      const daysToCourtDate = Math.ceil((courtDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      if (daysToCourtDate <= 7) {
        score = 100;
      } else if (daysToCourtDate <= 30) {
        score = 95;
      }
    }

    return score;
  }

  private calculateRepoScore(consequence: VehicleRepoConsequence): number {
    let score = 85; // Vehicle repo is high priority

    // Adjust based on days until repo
    if (consequence.estimatedDays <= 5) {
      score = 100;
    } else if (consequence.estimatedDays <= 14) {
      score = 90;
    }

    // Consider vehicle value vs deficiency
    if (consequence.deficiencyBalance && consequence.vehicleValue) {
      if (consequence.deficiencyBalance > consequence.vehicleValue * 0.5) {
        score += 10; // High deficiency risk
      }
    }

    return Math.min(100, score);
  }

  private calculateLicenseSuspensionScore(consequence: LicenseSuspensionConsequence): number {
    let score = 70;

    // Driver's license suspension is most critical
    if (consequence.suspensionType === 'drivers_license') {
      score = 85;
    }

    // Professional license affects income
    if (consequence.suspensionType === 'professional_license') {
      score = 90;
    }

    return score;
  }

  private calculateGenericConsequenceScore(consequence: BillConsequence): number {
    let score = consequence.severity * 0.8;

    // Urgency adjustment
    switch (consequence.urgency) {
      case ConsequenceUrgency.IMMEDIATE:
        score += 20;
        break;
      case ConsequenceUrgency.SHORT_TERM:
        score += 15;
        break;
      case ConsequenceUrgency.MEDIUM_TERM:
        score += 10;
        break;
      case ConsequenceUrgency.LONG_TERM:
        score += 5;
        break;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate financial impact score (0-100)
   * Focuses on late fees, interest, credit damage costs
   */
  private calculateFinancialImpactScore(bill: Bill): number {
    let score = 0;

    // Late fee impact
    if (bill.paymentTerms.lateFeeAmount) {
      const feePercentage = (bill.paymentTerms.lateFeeAmount / bill.currentBalance) * 100;
      score += Math.min(30, feePercentage * 2);
    }

    // Interest rate impact
    if (bill.interestRate) {
      const monthlyRate = bill.interestRate / 12;
      const monthlyInterest = bill.currentBalance * monthlyRate;
      const interestPercentage = (monthlyInterest / bill.currentBalance) * 100;
      score += Math.min(25, interestPercentage * 3);
    }

    // Credit damage consequences
    const creditConsequences = bill.consequences?.filter(c => c.type === ConsequenceType.CREDIT_DAMAGE) || [];
    for (const consequence of creditConsequences) {
      const creditConsequence = consequence as CreditDamageConsequence;
      // High credit score drops are more impactful
      score += Math.min(30, creditConsequence.estimatedScoreDrop * 0.5);
    }

    // Late fee consequences
    const lateFeeConsequences = bill.consequences?.filter(c => c.type === ConsequenceType.LATE_FEES) || [];
    for (const consequence of lateFeeConsequences) {
      const lateFeeConsequence = consequence as LateFeeConsequence;
      if (lateFeeConsequence.isCompounding) {
        score += 15; // Compounding fees are more dangerous
      }
    }

    return Math.min(100, score);
  }

  /**
   * Calculate recovery difficulty score (0-100)
   * Focuses on how hard/expensive it is to fix after default
   */
  private calculateRecoveryDifficultyScore(bill: Bill): number {
    let score = 0;

    for (const consequence of bill.consequences || []) {
      // Recovery cost as percentage of original bill
      if (consequence.recoveryCost) {
        const costPercentage = (consequence.recoveryCost / bill.originalAmount) * 100;
        score += Math.min(40, costPercentage);
      }

      // Recovery time in months
      if (consequence.recoveryTimeMonths) {
        score += Math.min(30, consequence.recoveryTimeMonths * 2);
      }

      // Non-recoverable consequences are worst
      if (!consequence.recoverable) {
        score += 50;
      }

      // Non-preventable consequences add urgency
      if (!consequence.preventable) {
        score += 20;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Calculate due date urgency score (0-100)
   * Traditional overdue/due date calculation
   */
  private calculateDueDateScore(bill: Bill): number {
    if (bill.daysOverdue > 0) {
      // Overdue bills get escalating scores
      if (bill.daysOverdue >= 90) return 100;
      if (bill.daysOverdue >= 60) return 90;
      if (bill.daysOverdue >= 30) return 80;
      if (bill.daysOverdue >= 14) return 70;
      if (bill.daysOverdue >= 7) return 60;
      return 50 + bill.daysOverdue; // 50-56 for 0-6 days overdue
    }

    // Future due dates
    const dueDate = new Date(bill.dueDate);
    const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue <= 3) return 40;
    if (daysUntilDue <= 7) return 30;
    if (daysUntilDue <= 14) return 20;
    if (daysUntilDue <= 30) return 10;
    return 5; // Far future
  }

  /**
   * Calculate amount-based score (0-100)
   * Considers bill size relative to typical bills
   */
  private calculateAmountScore(bill: Bill, typicalBillAmount: number = 200): number {
    // Simple relative scoring - could be enhanced with user's bill history
    const ratio = bill.currentBalance / typicalBillAmount;
    
    if (ratio >= 10) return 100; // Very large bills
    if (ratio >= 5) return 80;
    if (ratio >= 2) return 60;
    if (ratio >= 1) return 40;
    return 20; // Small bills
  }

  /**
   * Generate human-readable reasoning for priority score
   */
  private generateReasoning(bill: Bill, scores: any): {
    primaryReason: string;
    riskFactors: string[];
    recommendations: string[];
  } {
    const riskFactors: string[] = [];
    const recommendations: string[] = [];
    let primaryReason = '';

    // Determine primary reason based on highest scoring factor
    const maxScore = Math.max(
      scores.immediateConsequence,
      scores.financialImpact,
      scores.recoveryDifficulty,
      scores.dueDate,
      scores.amount
    );

    if (maxScore === scores.immediateConsequence && scores.immediateConsequence > 60) {
      primaryReason = 'Immediate service shutoff or legal action risk';
      
      // Add specific risk factors
      for (const consequence of bill.consequences || []) {
        if (consequence.estimatedDays <= 7) {
          riskFactors.push(`${consequence.description}`);
        }
      }
      
      recommendations.push('Contact creditor immediately to arrange payment or payment plan');
      recommendations.push('Prioritize this bill above all others');
      
    } else if (maxScore === scores.financialImpact && scores.financialImpact > 50) {
      primaryReason = 'High financial impact from fees and interest';
      
      if (bill.paymentTerms.lateFeeAmount) {
        riskFactors.push(`Late fee of $${bill.paymentTerms.lateFeeAmount} applies`);
      }
      if (bill.interestRate && bill.interestRate > 0.15) {
        riskFactors.push(`High interest rate of ${(bill.interestRate * 100).toFixed(1)}%`);
      }
      
      recommendations.push('Make at least minimum payment to avoid additional fees');
      
    } else if (maxScore === scores.recoveryDifficulty && scores.recoveryDifficulty > 50) {
      primaryReason = 'Difficult and expensive to recover from default';
      
      for (const consequence of bill.consequences || []) {
        if (consequence.recoveryCost && consequence.recoveryCost > bill.originalAmount * 0.2) {
          riskFactors.push(`Recovery would cost $${consequence.recoveryCost.toFixed(2)}`);
        }
      }
      
      recommendations.push('Prevent default - recovery costs exceed current bill amount');
      
    } else if (bill.daysOverdue > 0) {
      primaryReason = `Bill is ${bill.daysOverdue} days overdue`;
      riskFactors.push('Overdue status may trigger additional consequences');
      recommendations.push('Contact creditor to discuss payment options');
      
    } else {
      primaryReason = 'Upcoming due date requires attention';
      recommendations.push('Schedule payment before due date');
    }

    // Add essential service factor
    if (bill.isEssential) {
      riskFactors.push('Essential service - impacts daily life');
    }

    // Add negotiation opportunities
    if (bill.negotiationOpportunity && bill.negotiationOpportunity.likelihood === 'high') {
      recommendations.push('Good opportunity for payment arrangement - contact creditor');
    }

    return {
      primaryReason,
      riskFactors,
      recommendations
    };
  }

  /**
   * Validate and normalize priority factors
   */
  private validateFactors(factors: PriorityFactors): PriorityFactors {
    const total = factors.immediateConsequenceWeight +
                  factors.financialImpactWeight +
                  factors.recoveryDifficultyWeight +
                  factors.dueDateWeight +
                  factors.amountWeight;

    if (Math.abs(total - 1.0) > 0.01) {
      throw new Error(`Priority factors must sum to 1.0, got ${total}`);
    }

    return factors;
  }

  /**
   * Update priority factors for future calculations
   */
  updateFactors(newFactors: Partial<PriorityFactors>): void {
    this.factors = this.validateFactors({
      ...this.factors,
      ...newFactors
    });
  }

  /**
   * Calculate priority for multiple bills and return sorted list
   */
  calculateMultiplePriorities(bills: Bill[]): Array<Bill & { priorityCalculation: PriorityCalculation }> {
    return bills
      .map(bill => ({
        ...bill,
        priorityCalculation: this.calculatePriority(bill)
      }))
      .sort((a, b) => b.priorityCalculation.finalScore - a.priorityCalculation.finalScore);
  }

  /**
   * Generate DynamoDB GSI keys for priority-based queries
   */
  static generatePriorityGSIKeys(userId: string, priority: number): { GSI1PK: string; GSI1SK: string } {
    return {
      GSI1PK: `USER#${userId}#PRIORITY`,
      GSI1SK: String(Math.round(priority)).padStart(6, '0') // Zero-padded for proper sorting
    };
  }
}

// Export singleton instance with default factors
export const defaultPriorityCalculator = new PriorityCalculator();

// Export helper functions
export const ConsequenceSeverityLevels = {
  CRITICAL: { min: 90, max: 100, label: 'Critical - Immediate Action Required' },
  HIGH: { min: 70, max: 89, label: 'High - Address This Week' },
  MEDIUM: { min: 40, max: 69, label: 'Medium - Address This Month' },
  LOW: { min: 0, max: 39, label: 'Low - Monitor and Plan' }
};

export function getPrioritySeverityLevel(score: number): { level: string; label: string; color: string } {
  if (score >= 90) return { level: 'CRITICAL', label: ConsequenceSeverityLevels.CRITICAL.label, color: '#dc2626' };
  if (score >= 70) return { level: 'HIGH', label: ConsequenceSeverityLevels.HIGH.label, color: '#ea580c' };
  if (score >= 40) return { level: 'MEDIUM', label: ConsequenceSeverityLevels.MEDIUM.label, color: '#ca8a04' };
  return { level: 'LOW', label: ConsequenceSeverityLevels.LOW.label, color: '#16a34a' };
}