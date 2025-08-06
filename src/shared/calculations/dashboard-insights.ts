/**
 * Dashboard Insights Aggregator
 * 
 * Efficiently pulls data from all DropDebt core systems and generates
 * meaningful, actionable insights for users. No vanity metrics.
 */

import {
  DashboardData,
  FinancialStatus,
  NextAction,
  ProgressMilestone,
  AvailableMoney,
  CrisisAlert,
  Deadline,
  ProgressCategory
} from '../types/dashboard';

export interface SystemData {
  bills: any;           // From Bills Lambda
  budget: any;          // From Essential Needs Lambda
  triage: any;          // From Crisis Triage Lambda
}

/**
 * Main dashboard aggregator - combines all system data into insights
 */
export async function generateDashboardInsights(
  userId: string,
  systemData: SystemData
): Promise<DashboardData> {
  const { bills, budget, triage } = systemData;
  
  // Determine financial status based on all systems
  const financialStatus = determineFinancialStatus(bills, budget, triage);
  
  // Generate next action based on priorities
  const nextAction = generateNextAction(bills, budget, triage);
  
  // Calculate meaningful progress
  const progressMilestone = calculateProgress(bills, budget);
  
  // Format available money clearly
  const availableMoney = formatAvailableMoney(budget);
  
  // Detect crisis situations
  const crisisAlerts = detectCrisisAlerts(bills, budget, triage);
  
  // Get upcoming deadlines
  const upcomingDeadlines = getUpcomingDeadlines(bills, budget);
  
  return {
    userId,
    lastUpdated: new Date().toISOString(),
    financialStatus,
    statusExplanation: getStatusExplanation(financialStatus, budget, bills),
    nextAction,
    progressMilestone,
    availableMoney,
    crisisAlerts,
    upcomingDeadlines
  };
}

/**
 * Determine overall financial status from system data
 */
function determineFinancialStatus(
  bills: any,
  budget: any,
  triage: any
): FinancialStatus {
  // Crisis if essential needs exceed income
  if (budget.budgetCalculation.totalEssentialNeeds > budget.incomeInfo.monthlyIncome) {
    return FinancialStatus.CRISIS;
  }
  
  // Crisis if triage system detected crisis
  if (triage.isCrisis) {
    return FinancialStatus.CRISIS;
  }
  
  // Urgent if critical bills due within 3 days
  const criticalBillsDueSoon = bills.bills.filter(
    (bill: any) => bill.priorityCategory === 'CRITICAL' && bill.daysUntilDue <= 3
  );
  if (criticalBillsDueSoon.length > 0) {
    return FinancialStatus.URGENT;
  }
  
  // Caution if available money is less than 20% of income
  const availablePercent = budget.budgetCalculation.availableForDebt / budget.incomeInfo.monthlyIncome;
  if (availablePercent < 0.2) {
    return FinancialStatus.CAUTION;
  }
  
  // Comfortable if all bills current and >30% available
  const allBillsCurrent = bills.bills.every((bill: any) => bill.currentBalance === 0);
  if (allBillsCurrent && availablePercent > 0.3) {
    return FinancialStatus.COMFORTABLE;
  }
  
  // Otherwise stable
  return FinancialStatus.STABLE;
}

/**
 * Generate specific next action with deadline
 */
function generateNextAction(bills: any, budget: any, triage: any): NextAction {
  // Use triage system's next action if in crisis
  if (triage.actions && triage.actions.length > 0) {
    const triageAction = triage.actions[0];
    return {
      action: triageAction.split(':')[0],
      amount: extractAmount(triageAction),
      deadline: getNextDeadline(bills),
      daysUntil: calculateDaysUntil(getNextDeadline(bills)),
      consequence: extractConsequence(triageAction),
      priority: 'IMMEDIATE',
      resourceLink: triage.helpResources?.[0]
    };
  }
  
  // Find highest priority bill that can be paid
  const availableAmount = budget.budgetCalculation.availableForDebt;
  const payableBills = bills.bills
    .filter((bill: any) => bill.currentBalance > 0 && bill.currentBalance <= availableAmount)
    .sort((a: any, b: any) => {
      const priorityOrder: any = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      return priorityOrder[b.priorityCategory] - priorityOrder[a.priorityCategory];
    });
  
  if (payableBills.length > 0) {
    const nextBill = payableBills[0];
    return {
      action: `Pay ${nextBill.name}`,
      amount: nextBill.currentBalance,
      deadline: nextBill.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntil: nextBill.daysUntilDue || 7,
      consequence: getConsequenceForBill(nextBill),
      priority: nextBill.priorityCategory === 'CRITICAL' ? 'IMMEDIATE' : 'HIGH'
    };
  }
  
  // Default action if nothing can be paid
  return {
    action: 'Build emergency fund',
    amount: 50,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    daysUntil: 30,
    consequence: 'Improve financial stability',
    priority: 'MEDIUM'
  };
}

/**
 * Calculate meaningful progress milestones
 */
function calculateProgress(bills: any, budget: any): ProgressMilestone {
  const totalBills = bills.bills.length;
  const currentBills = bills.bills.filter((bill: any) => bill.currentBalance === 0).length;
  
  // Determine progress category
  let category = ProgressCategory.SURVIVAL_SECURED;
  const criticalCurrent = bills.bills
    .filter((bill: any) => bill.priorityCategory === 'CRITICAL' && bill.currentBalance === 0)
    .length;
  const criticalTotal = bills.bills
    .filter((bill: any) => bill.priorityCategory === 'CRITICAL')
    .length;
  
  if (currentBills === totalBills) {
    category = ProgressCategory.ALL_CURRENT;
  } else if (criticalCurrent === criticalTotal) {
    category = ProgressCategory.SURVIVAL_SECURED;
  }
  
  // Calculate timeline to stability
  const totalDebt = bills.bills.reduce((sum: number, bill: any) => sum + bill.currentBalance, 0);
  const monthlyAvailable = budget.budgetCalculation.availableForDebt;
  const weeksToStability = monthlyAvailable > 0 ? Math.ceil(totalDebt / (monthlyAvailable / 4)) : 999;
  
  return {
    description: `${currentBills} of ${totalBills} bills current`,
    currentCount: currentBills,
    totalCount: totalBills,
    nextMilestone: getNextMilestone(bills, budget),
    timelineToStability: weeksToStability < 52 ? `All bills current in ${weeksToStability} weeks` : 'Timeline unclear - need budget help',
    category
  };
}

/**
 * Helper functions
 */
function getStatusExplanation(status: FinancialStatus, budget: any, bills: any): string {
  switch (status) {
    case FinancialStatus.CRISIS:
      return 'Essential needs exceed income. Emergency assistance needed immediately.';
    case FinancialStatus.URGENT:
      return 'Critical bills due within days. Immediate action required to avoid shutoffs.';
    case FinancialStatus.CAUTION:
      return 'Tight budget requires careful management. Focus on critical bills only.';
    case FinancialStatus.STABLE:
      return 'Bills are manageable with current income. Stay on payment plan.';
    case FinancialStatus.COMFORTABLE:
      return 'Good financial margin. Consider building emergency fund or extra payments.';
  }
}

function formatAvailableMoney(budget: any): AvailableMoney {
  return {
    totalIncome: budget.incomeInfo.monthlyIncome,
    essentialNeeds: budget.budgetCalculation.totalEssentialNeeds,
    availableForBills: budget.budgetCalculation.availableForDebt,
    nextPaycheckDate: budget.incomeInfo.nextPaycheckDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    nextPaycheckAmount: budget.incomeInfo.paycheckAmount || budget.incomeInfo.monthlyIncome / 4
  };
}

function detectCrisisAlerts(bills: any, budget: any, triage: any): CrisisAlert[] {
  const alerts: CrisisAlert[] = [];
  
  // Budget crisis alert
  if (budget.budgetCalculation.totalEssentialNeeds > budget.incomeInfo.monthlyIncome) {
    alerts.push({
      alertType: 'BUDGET_CRISIS',
      severity: 'EMERGENCY',
      description: 'Essential needs exceed income by $' + 
        (budget.budgetCalculation.totalEssentialNeeds - budget.incomeInfo.monthlyIncome),
      immediateAction: 'Call 2-1-1 for emergency assistance',
      emergencyResources: [{
        name: '2-1-1',
        description: '24/7 emergency assistance hotline',
        contactMethod: 'Call 2-1-1',
        resourceType: 'HOTLINE',
        urgency: 'IMMEDIATE'
      }]
    });
  }
  
  return alerts;
}

function getUpcomingDeadlines(bills: any, budget: any): Deadline[] {
  return bills.bills
    .filter((bill: any) => bill.currentBalance > 0)
    .map((bill: any) => ({
      billName: bill.name,
      amount: bill.currentBalance,
      dueDate: bill.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntil: bill.daysUntilDue || 30,
      consequence: getConsequenceForBill(bill),
      paymentPossible: bill.currentBalance <= budget.budgetCalculation.availableForDebt
    }))
    .sort((a: any, b: any) => a.daysUntil - b.daysUntil)
    .slice(0, 5); // Show only next 5 deadlines
}

// Utility functions
function extractAmount(actionString: string): number {
  const match = actionString.match(/\$(\d+(?:\.\d{2})?)/);
  return match ? parseFloat(match[1]) : 0;
}

function extractConsequence(actionString: string): string {
  const parts = actionString.split(' - ');
  return parts.length > 1 ? parts[1] : 'Service disruption';
}

function getNextDeadline(bills: any): string {
  const nextBill = bills.bills
    .filter((bill: any) => bill.currentBalance > 0)
    .sort((a: any, b: any) => (a.daysUntilDue || 30) - (b.daysUntilDue || 30))[0];
  
  return nextBill?.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
}

function calculateDaysUntil(date: string): number {
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

function getConsequenceForBill(bill: any): string {
  const billType = bill.name.toLowerCase();
  if (billType.includes('electric')) return 'Power shutoff';
  if (billType.includes('gas')) return 'Gas disconnection';
  if (billType.includes('water')) return 'Water shutoff';
  if (billType.includes('rent')) return 'Eviction process';
  if (billType.includes('car')) return 'Vehicle repossession';
  return 'Service disruption';
}

function getNextMilestone(bills: any, budget: any): string {
  const criticalUnpaid = bills.bills.filter(
    (bill: any) => bill.priorityCategory === 'CRITICAL' && bill.currentBalance > 0
  );
  
  if (criticalUnpaid.length > 0) {
    return `All critical bills current after ${criticalUnpaid.length} more payments`;
  }
  
  const totalUnpaid = bills.bills.filter((bill: any) => bill.currentBalance > 0).length;
  if (totalUnpaid > 0) {
    return `All bills current after ${totalUnpaid} more payments`;
  }
  
  return 'All bills current - focus on building emergency fund';
}