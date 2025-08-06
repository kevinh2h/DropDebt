/**
 * Consequence Timeline System
 * 
 * Shows exact deadlines and consequences for unpaid bills.
 * No complex forecasting - just facts and deadlines users need to know.
 */

export interface ConsequenceEvent {
  billId: string;
  billName: string;
  amount: number;
  date: string;
  daysUntil: number;
  consequence: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  canPrevent: boolean;
  preventionCost: number;
}

export interface ConsequenceTimeline {
  thisWeek: ConsequenceEvent[];
  nextWeek: ConsequenceEvent[];
  thisMonth: ConsequenceEvent[];
  urgent: ConsequenceEvent[];  // Within 3 days
  total: {
    thisWeek: number;
    nextWeek: number; 
    thisMonth: number;
  };
}

/**
 * Simple Consequence Timeline - shows what happens when
 */
export class ConsequenceTracker {
  
  /**
   * Create timeline of consequences for unpaid bills
   */
  createTimeline(bills: Array<{
    billId: string;
    billName: string;
    currentBalance: number;
    priorityCategory: string;
    shutoffDate?: string;
    lastPaymentDate?: string;
  }>): ConsequenceTimeline {
    
    const events: ConsequenceEvent[] = [];
    const now = new Date();
    
    for (const bill of bills) {
      const event = this.createConsequenceEvent(bill, now);
      if (event) {
        events.push(event);
      }
    }
    
    // Sort by urgency - nearest deadlines first
    events.sort((a, b) => a.daysUntil - b.daysUntil);
    
    return this.organizeByTimeframe(events);
  }
  
  /**
   * Create consequence event for a single bill
   */
  private createConsequenceEvent(bill: any, now: Date): ConsequenceEvent | null {
    const deadlineDate = bill.shutoffDate 
      ? new Date(bill.shutoffDate)
      : this.estimateConsequenceDate(bill, now);
    
    const daysUntil = Math.max(0, Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Don't show events more than 90 days away - too far to be actionable
    if (daysUntil > 90) {
      return null;
    }
    
    return {
      billId: bill.billId,
      billName: bill.billName,
      amount: bill.currentBalance,
      date: deadlineDate.toISOString(),
      daysUntil,
      consequence: this.getSpecificConsequence(bill.billName, bill.priorityCategory),
      severity: bill.priorityCategory as any,
      canPrevent: daysUntil > 0,
      preventionCost: bill.currentBalance
    };
  }
  
  /**
   * Estimate when consequence will occur based on bill type
   */
  private estimateConsequenceDate(bill: any, now: Date): Date {
    const lastPayment = bill.lastPaymentDate ? new Date(bill.lastPaymentDate) : now;
    const daysSincePayment = Math.ceil((now.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24));
    
    const billType = this.identifyBillType(bill.billName);
    const consequenceDate = new Date(now);
    
    // Estimate based on bill type and how long it's been unpaid
    switch (billType) {
      case 'electric':
      case 'gas':
      case 'water':
        // Utilities: typically 30-45 days from last payment
        consequenceDate.setDate(consequenceDate.getDate() + Math.max(1, 45 - daysSincePayment));
        break;
        
      case 'rent':
        // Rent: eviction process starts around 10-30 days after due date
        consequenceDate.setDate(consequenceDate.getDate() + Math.max(1, 30 - daysSincePayment));
        break;
        
      case 'mortgage':
        // Mortgage: foreclosure process starts around 90-120 days
        consequenceDate.setDate(consequenceDate.getDate() + Math.max(1, 120 - daysSincePayment));
        break;
        
      case 'car':
        // Car loan: repo can start after 30-90 days
        consequenceDate.setDate(consequenceDate.getDate() + Math.max(1, 60 - daysSincePayment));
        break;
        
      case 'credit_card':
        // Credit cards: mostly credit damage, late fees
        consequenceDate.setDate(consequenceDate.getDate() + 30);
        break;
        
      default:
        // Unknown bill type - conservative estimate
        consequenceDate.setDate(consequenceDate.getDate() + 30);
    }
    
    return consequenceDate;
  }
  
  /**
   * Get specific consequence based on bill type
   */
  private getSpecificConsequence(billName: string, priority: string): string {
    const billType = this.identifyBillType(billName);
    
    switch (billType) {
      case 'electric':
        return 'Power will be shut off - reconnection fee required';
      case 'gas':
        return 'Gas service disconnected - no heating/cooking';
      case 'water':
        return 'Water service shut off - reconnection fee required';
      case 'rent':
        return 'Eviction notice posted - court proceedings begin';
      case 'mortgage':
        return 'Foreclosure process initiated - home at risk';
      case 'car':
        return 'Vehicle repossession - transportation lost';
      case 'insurance':
        return 'Coverage cancelled - no protection from claims';
      case 'credit_card':
        return 'Late fees added - credit score damage';
      case 'medical':
        return 'Account sent to collections - credit damage';
      case 'phone':
        return 'Service disconnected - communication lost';
      default:
        return priority === 'CRITICAL' 
          ? 'Service disconnection or legal action'
          : 'Late fees and credit damage';
    }
  }
  
  /**
   * Identify bill type from name
   */
  private identifyBillType(billName: string): string {
    const name = billName.toLowerCase();
    
    if (name.includes('electric') || name.includes('power')) return 'electric';
    if (name.includes('gas')) return 'gas';
    if (name.includes('water') || name.includes('sewer')) return 'water';
    if (name.includes('rent')) return 'rent';
    if (name.includes('mortgage')) return 'mortgage';
    if (name.includes('car') || name.includes('auto') || name.includes('vehicle')) return 'car';
    if (name.includes('insurance')) return 'insurance';
    if (name.includes('credit') || name.includes('card')) return 'credit_card';
    if (name.includes('medical') || name.includes('hospital') || name.includes('doctor')) return 'medical';
    if (name.includes('phone') || name.includes('cell') || name.includes('mobile')) return 'phone';
    
    return 'unknown';
  }
  
  /**
   * Organize events by timeframe for easy display
   */
  private organizeByTimeframe(events: ConsequenceEvent[]): ConsequenceTimeline {
    const urgent = events.filter(e => e.daysUntil <= 3);
    const thisWeek = events.filter(e => e.daysUntil <= 7);
    const nextWeek = events.filter(e => e.daysUntil > 7 && e.daysUntil <= 14);
    const thisMonth = events.filter(e => e.daysUntil > 14 && e.daysUntil <= 30);
    
    return {
      thisWeek,
      nextWeek, 
      thisMonth,
      urgent,
      total: {
        thisWeek: thisWeek.reduce((sum, e) => sum + e.amount, 0),
        nextWeek: nextWeek.reduce((sum, e) => sum + e.amount, 0),
        thisMonth: thisMonth.reduce((sum, e) => sum + e.amount, 0)
      }
    };
  }
  
  /**
   * Get urgent actions needed to prevent consequences
   */
  getUrgentActions(timeline: ConsequenceTimeline): string[] {
    const actions: string[] = [];
    
    for (const event of timeline.urgent) {
      actions.push(
        `URGENT: Pay ${event.billName} $${event.amount} within ${event.daysUntil} days to prevent ${event.consequence}`
      );
    }
    
    for (const event of timeline.thisWeek.filter(e => !timeline.urgent.includes(e))) {
      actions.push(
        `This week: Pay ${event.billName} $${event.amount} by ${new Date(event.date).toLocaleDateString()} to prevent ${event.consequence}`
      );
    }
    
    if (actions.length === 0) {
      actions.push('No urgent payment deadlines this week');
    }
    
    return actions;
  }
}