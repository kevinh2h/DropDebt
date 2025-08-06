/**
 * Crisis Triage System
 * 
 * Simple triage logic that tells users exactly what to pay when to avoid
 * immediate consequences. No complex optimization - just clear emergency guidance.
 */

export interface BillDeadline {
  billId: string;
  billName: string;
  amount: number;
  consequence: string;
  deadline: string; // ISO date
  daysUntil: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  canWait: boolean;
}

export interface TriageAction {
  type: 'PAY_NOW' | 'PAY_NEXT' | 'CALL_CREDITOR' | 'GET_HELP' | 'PARTIAL_PAYMENT';
  billId: string;
  billName: string;
  amount: number;
  reason: string;
  instructions: string;
  urgency: 'IMMEDIATE' | 'THIS_WEEK' | 'NEXT_PAYCHECK';
}

export interface CrisisTriageResult {
  isCrisis: boolean;
  availableAmount: number;
  totalCriticalBills: number;
  canPayAll: boolean;
  immediateActions: TriageAction[];
  consequences: string[];
  helpResources: string[];
  nextSteps: string[];
}

/**
 * Simple Crisis Triage Engine - replaces complex optimization
 */
export class CrisisTriage {
  
  /**
   * Perform crisis triage - tells user exactly what to do next
   */
  triagePayments(
    bills: Array<{
      billId: string;
      billName?: string;
      currentBalance: number;
      priority: number;
      priorityCategory: string;
      shutoffDate?: string;
      consequence?: string;
    }>,
    availableAmount: number,
    strategy: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE' = 'BALANCED'
  ): CrisisTriageResult {
    
    // Get strategy multiplier (how much of available money to use)
    const strategyMultipliers = {
      'CONSERVATIVE': 0.5,  // Use 50% - keep large safety buffer
      'BALANCED': 0.7,      // Use 70% - keep small safety buffer  
      'AGGRESSIVE': 0.9     // Use 90% - minimal buffer
    };
    
    const usableAmount = Math.floor(availableAmount * strategyMultipliers[strategy]);
    
    // Create bill deadlines with consequences
    const deadlines = this.createBillDeadlines(bills);
    
    // Sort by urgency - critical bills with nearest deadlines first
    const urgentBills = deadlines
      .filter(bill => bill.priority === 'CRITICAL' || bill.daysUntil <= 7)
      .sort((a, b) => a.daysUntil - b.daysUntil);
    
    const totalCriticalAmount = urgentBills.reduce((sum, bill) => sum + bill.amount, 0);
    const isCrisis = totalCriticalAmount > usableAmount;
    
    // Generate triage actions
    const actions = this.generateTriageActions(urgentBills, usableAmount, isCrisis);
    
    return {
      isCrisis,
      availableAmount: usableAmount,
      totalCriticalBills: urgentBills.length,
      canPayAll: !isCrisis,
      immediateActions: actions.filter(a => a.urgency === 'IMMEDIATE'),
      consequences: this.getConsequences(urgentBills, usableAmount),
      helpResources: this.getHelpResources(isCrisis, urgentBills),
      nextSteps: this.getNextSteps(actions, isCrisis)
    };
  }
  
  /**
   * Create bill deadlines with real consequences
   */
  private createBillDeadlines(bills: any[]): BillDeadline[] {
    return bills.map(bill => {
      const deadline = bill.shutoffDate || this.estimateDeadline(bill.priorityCategory);
      const daysUntil = this.calculateDaysUntil(deadline);
      
      return {
        billId: bill.billId,
        billName: bill.billName || `Bill ${bill.billId}`,
        amount: bill.currentBalance,
        consequence: this.getConsequence(bill.priorityCategory, bill.billName),
        deadline,
        daysUntil,
        priority: bill.priorityCategory as any,
        canWait: daysUntil > 14 && bill.priorityCategory !== 'CRITICAL'
      };
    });
  }
  
  /**
   * Generate clear triage actions - what to do right now
   */
  private generateTriageActions(
    urgentBills: BillDeadline[],
    availableAmount: number,
    isCrisis: boolean
  ): TriageAction[] {
    
    const actions: TriageAction[] = [];
    let remainingAmount = availableAmount;
    
    if (urgentBills.length === 0) {
      actions.push({
        type: 'PAY_NOW',
        billId: 'none',
        billName: 'No urgent bills',
        amount: 0,
        reason: 'No critical bills requiring immediate payment',
        instructions: 'You have breathing room - consider building emergency fund',
        urgency: 'NEXT_PAYCHECK'
      });
      return actions;
    }
    
    for (const bill of urgentBills) {
      if (remainingAmount <= 0) {
        // No money left - provide crisis guidance
        actions.push({
          type: 'GET_HELP',
          billId: bill.billId,
          billName: bill.billName,
          amount: bill.amount,
          reason: `Cannot pay ${bill.billName} - ${bill.consequence}`,
          instructions: bill.daysUntil <= 3 
            ? `EMERGENCY: Call creditor immediately at [phone] - explain situation`
            : `Call 2-1-1 for assistance programs in your area`,
          urgency: bill.daysUntil <= 3 ? 'IMMEDIATE' : 'THIS_WEEK'
        });
        continue;
      }
      
      if (remainingAmount >= bill.amount) {
        // Can pay full amount
        actions.push({
          type: 'PAY_NOW',
          billId: bill.billId,
          billName: bill.billName,
          amount: bill.amount,
          reason: `Prevents ${bill.consequence}`,
          instructions: bill.daysUntil <= 3 
            ? `PAY TODAY - ${bill.consequence} in ${bill.daysUntil} days`
            : `Pay by ${new Date(bill.deadline).toLocaleDateString()}`,
          urgency: bill.daysUntil <= 3 ? 'IMMEDIATE' : 'THIS_WEEK'
        });
        remainingAmount -= bill.amount;
      } else {
        // Partial payment or call creditor
        if (remainingAmount >= 25) { // Minimum meaningful payment
          actions.push({
            type: 'PARTIAL_PAYMENT',
            billId: bill.billId,
            billName: bill.billName,
            amount: remainingAmount,
            reason: `Partial payment to prevent ${bill.consequence}`,
            instructions: `Pay $${remainingAmount} now, call creditor to arrange payment plan for remaining $${bill.amount - remainingAmount}`,
            urgency: bill.daysUntil <= 3 ? 'IMMEDIATE' : 'THIS_WEEK'
          });
          remainingAmount = 0;
        } else {
          actions.push({
            type: 'CALL_CREDITOR',
            billId: bill.billId,
            billName: bill.billName,
            amount: bill.amount,
            reason: `Cannot afford payment - need payment arrangement`,
            instructions: `Call creditor immediately - explain you can pay $${remainingAmount} now and need payment plan`,
            urgency: 'IMMEDIATE'
          });
        }
      }
    }
    
    return actions;
  }
  
  /**
   * Get realistic consequences for bill types
   */
  private getConsequence(priorityCategory: string, billName?: string): string {
    const billType = this.identifyBillType(billName);
    
    switch (priorityCategory) {
      case 'CRITICAL':
        switch (billType) {
          case 'electric': return 'power shutoff';
          case 'gas': return 'gas service shutoff';
          case 'water': return 'water service shutoff';
          case 'rent': return 'eviction process starts';
          case 'mortgage': return 'foreclosure process starts';
          default: return 'service disconnection';
        }
      case 'HIGH':
        switch (billType) {
          case 'car': return 'vehicle repossession';
          case 'insurance': return 'coverage cancellation';
          default: return 'late fees and credit damage';
        }
      default:
        return 'late fees and credit damage';
    }
  }
  
  /**
   * Identify bill type from name for better consequences
   */
  private identifyBillType(billName?: string): string {
    if (!billName) return 'unknown';
    
    const name = billName.toLowerCase();
    if (name.includes('electric') || name.includes('power')) return 'electric';
    if (name.includes('gas')) return 'gas';
    if (name.includes('water') || name.includes('sewer')) return 'water';
    if (name.includes('rent')) return 'rent';
    if (name.includes('mortgage')) return 'mortgage';
    if (name.includes('car') || name.includes('auto') || name.includes('vehicle')) return 'car';
    if (name.includes('insurance')) return 'insurance';
    return 'unknown';
  }
  
  /**
   * Estimate deadline if not provided
   */
  private estimateDeadline(priorityCategory: string): string {
    const now = new Date();
    const daysToAdd = {
      'CRITICAL': 3,  // Critical bills - shutoff in 3 days
      'HIGH': 7,      // High priority - 1 week grace
      'MEDIUM': 30,   // Medium - 1 month
      'LOW': 60       // Low priority - 2 months
    };
    
    now.setDate(now.getDate() + daysToAdd[priorityCategory] || 30);
    return now.toISOString();
  }
  
  /**
   * Calculate days until deadline
   */
  private calculateDaysUntil(deadline: string): number {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }
  
  /**
   * Get consequences of unpaid bills
   */
  private getConsequences(bills: BillDeadline[], availableAmount: number): string[] {
    const consequences: string[] = [];
    let remaining = availableAmount;
    
    for (const bill of bills) {
      if (remaining >= bill.amount) {
        remaining -= bill.amount;
      } else {
        consequences.push(
          `${bill.billName}: ${bill.consequence} in ${bill.daysUntil} days if not paid`
        );
      }
    }
    
    return consequences;
  }
  
  /**
   * Get help resources for crisis situations
   */
  private getHelpResources(isCrisis: boolean, bills: BillDeadline[]): string[] {
    const resources: string[] = [];
    
    if (isCrisis) {
      resources.push('Call 2-1-1 immediately for emergency assistance programs');
      
      const hasUtility = bills.some(b => 
        b.billName.toLowerCase().includes('electric') || 
        b.billName.toLowerCase().includes('gas') ||
        b.billName.toLowerCase().includes('water')
      );
      
      if (hasUtility) {
        resources.push('Apply for LIHEAP (utility assistance) at https://www.acf.hhs.gov/ocs/programs/liheap');
      }
      
      const hasHousing = bills.some(b => 
        b.billName.toLowerCase().includes('rent') || 
        b.billName.toLowerCase().includes('mortgage')
      );
      
      if (hasHousing) {
        resources.push('Contact local housing assistance: search "housing assistance [your city]"');
      }
      
      resources.push('Food assistance: find food banks at https://www.feedingamerica.org/find-your-local-foodbank');
    }
    
    return resources;
  }
  
  /**
   * Get clear next steps
   */
  private getNextSteps(actions: TriageAction[], isCrisis: boolean): string[] {
    const steps: string[] = [];
    
    const immediateActions = actions.filter(a => a.urgency === 'IMMEDIATE');
    const weekActions = actions.filter(a => a.urgency === 'THIS_WEEK');
    
    if (immediateActions.length > 0) {
      steps.push(`TODAY: ${immediateActions[0].instructions}`);
    }
    
    if (weekActions.length > 0) {
      steps.push(`THIS WEEK: ${weekActions[0].instructions}`);
    }
    
    if (isCrisis) {
      steps.push('Call 2-1-1 for emergency assistance in your area');
      steps.push('Contact creditors to explain situation and request payment plans');
    } else {
      steps.push('Set aside money for next paycheck payments');
      steps.push('Consider building small emergency fund if possible');
    }
    
    return steps;
  }
}