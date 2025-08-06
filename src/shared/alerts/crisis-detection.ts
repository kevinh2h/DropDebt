/**
 * Crisis Detection and Alert System
 * 
 * Identifies emergency situations and connects users to immediate help.
 * No judgment, just clear guidance and resource connections.
 */

import { CrisisAlert, EmergencyResource } from '../types/dashboard';

export interface CrisisIndicators {
  essentialNeedsRatio: number;      // Essential needs / income
  criticalBillsOverdue: number;     // Count of critical bills past due
  daysUntilCriticalShutoff: number; // Days until first critical shutoff
  availableAmount: number;          // Total available for bills
  housingAtRisk: boolean;           // Rent/mortgage severely behind
  transportationAtRisk: boolean;    // Car payment/insurance at risk
}

/**
 * Detect all crisis situations from system data
 */
export function detectCrisisAlerts(
  bills: any,
  budget: any,
  triage: any
): CrisisAlert[] {
  const alerts: CrisisAlert[] = [];
  
  // Calculate crisis indicators
  const indicators = calculateCrisisIndicators(bills, budget);
  
  // Budget crisis - essential needs exceed income
  if (indicators.essentialNeedsRatio > 1) {
    alerts.push(createBudgetCrisisAlert(indicators, budget));
  }
  
  // Utility shutoff imminent
  const utilityShutoffs = detectUtilityShutoffs(bills);
  alerts.push(...utilityShutoffs);
  
  // Housing at risk
  if (indicators.housingAtRisk) {
    alerts.push(createHousingRiskAlert(bills));
  }
  
  // Transportation at risk
  if (indicators.transportationAtRisk) {
    alerts.push(createTransportationRiskAlert(bills));
  }
  
  // Sort by severity and urgency
  return alerts.sort((a, b) => {
    const severityOrder = { EMERGENCY: 3, CRITICAL: 2, WARNING: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}

/**
 * Calculate indicators for crisis detection
 */
function calculateCrisisIndicators(bills: any, budget: any): CrisisIndicators {
  const essentialNeeds = budget.budgetCalculation.totalEssentialNeeds;
  const income = budget.incomeInfo.monthlyIncome;
  
  const criticalBills = bills.bills.filter(
    (bill: any) => bill.priorityCategory === 'CRITICAL' && bill.currentBalance > 0
  );
  
  const housingBill = bills.bills.find(
    (bill: any) => bill.name.toLowerCase().includes('rent') || 
                   bill.name.toLowerCase().includes('mortgage')
  );
  
  const transportBills = bills.bills.filter(
    (bill: any) => bill.name.toLowerCase().includes('car') || 
                   bill.name.toLowerCase().includes('insurance')
  );
  
  return {
    essentialNeedsRatio: essentialNeeds / income,
    criticalBillsOverdue: criticalBills.length,
    daysUntilCriticalShutoff: getEarliestCriticalDeadline(criticalBills),
    availableAmount: budget.budgetCalculation.availableForDebt,
    housingAtRisk: housingBill && housingBill.daysOverdue > 30,
    transportationAtRisk: transportBills.some((bill: any) => bill.daysOverdue > 30)
  };
}

/**
 * Create budget crisis alert
 */
function createBudgetCrisisAlert(indicators: CrisisIndicators, budget: any): CrisisAlert {
  const deficit = budget.budgetCalculation.totalEssentialNeeds - budget.incomeInfo.monthlyIncome;
  
  return {
    alertType: 'BUDGET_CRISIS',
    severity: 'EMERGENCY',
    description: `Essential needs exceed income by $${deficit.toFixed(0)}/month`,
    immediateAction: 'Call 2-1-1 for emergency assistance today',
    emergencyResources: [
      {
        name: '2-1-1',
        description: 'Free, confidential 24/7 helpline for emergency assistance',
        contactMethod: 'Dial 2-1-1',
        resourceType: 'HOTLINE',
        urgency: 'IMMEDIATE'
      },
      {
        name: 'Local Food Bank',
        description: 'Free food assistance to reduce grocery costs',
        contactMethod: 'Search "food bank near me" or call 2-1-1',
        resourceType: 'LOCAL_OFFICE',
        urgency: 'TODAY'
      },
      {
        name: 'Emergency Cash Assistance',
        description: 'TANF/General Assistance for immediate needs',
        contactMethod: 'Apply at local social services or online',
        resourceType: 'WEBSITE',
        urgency: 'TODAY'
      }
    ]
  };
}

/**
 * Detect imminent utility shutoffs
 */
function detectUtilityShutoffs(bills: any): CrisisAlert[] {
  const alerts: CrisisAlert[] = [];
  
  const utilityBills = bills.bills.filter((bill: any) => 
    ['electric', 'gas', 'water', 'heat'].some(util => 
      bill.name.toLowerCase().includes(util)
    )
  );
  
  utilityBills.forEach((bill: any) => {
    if (bill.daysUntilDue <= 3 || bill.shutoffNotice) {
      alerts.push({
        alertType: 'UTILITY_SHUTOFF',
        severity: bill.daysUntilDue <= 1 ? 'EMERGENCY' : 'CRITICAL',
        description: `${bill.name} shutoff in ${bill.daysUntilDue} days - $${bill.currentBalance} due`,
        deadline: bill.dueDate,
        immediateAction: `Pay $${bill.minimumPayment || 50} today to prevent shutoff`,
        emergencyResources: [
          {
            name: 'LIHEAP',
            description: 'Low Income Home Energy Assistance Program',
            contactMethod: 'Call 1-866-674-6327 or apply online',
            resourceType: 'HOTLINE',
            urgency: 'IMMEDIATE'
          },
          {
            name: 'Utility Company Hardship',
            description: `Call ${bill.name} for payment plan or shutoff protection`,
            contactMethod: 'Call number on your bill immediately',
            resourceType: 'HOTLINE',
            urgency: 'IMMEDIATE'
          }
        ]
      });
    }
  });
  
  return alerts;
}

/**
 * Create housing risk alert
 */
function createHousingRiskAlert(bills: any): CrisisAlert {
  const housingBill = bills.bills.find(
    (bill: any) => bill.name.toLowerCase().includes('rent') || 
                   bill.name.toLowerCase().includes('mortgage')
  );
  
  return {
    alertType: 'HOUSING_RISK',
    severity: 'CRITICAL',
    description: `${housingBill.name} is ${housingBill.daysOverdue} days overdue - eviction risk`,
    deadline: housingBill.evictionDate,
    immediateAction: 'Contact landlord/lender today to negotiate payment plan',
    emergencyResources: [
      {
        name: 'Emergency Rental Assistance',
        description: 'Government program to prevent eviction',
        contactMethod: 'Call 2-1-1 or visit consumerfinance.gov/renthelp',
        resourceType: 'WEBSITE',
        urgency: 'TODAY'
      },
      {
        name: 'Legal Aid',
        description: 'Free legal help to prevent eviction',
        contactMethod: 'Search "legal aid near me" or call 2-1-1',
        resourceType: 'LOCAL_OFFICE',
        urgency: 'TODAY'
      },
      {
        name: 'Housing Counselor',
        description: 'Free HUD-approved counseling',
        contactMethod: 'Call 1-800-569-4287',
        resourceType: 'HOTLINE',
        urgency: 'TODAY'
      }
    ]
  };
}

/**
 * Create transportation risk alert
 */
function createTransportationRiskAlert(bills: any): CrisisAlert {
  const carBills = bills.bills.filter(
    (bill: any) => bill.name.toLowerCase().includes('car') || 
                   bill.name.toLowerCase().includes('auto')
  );
  
  const atRiskBill = carBills.find((bill: any) => bill.daysOverdue > 30);
  
  return {
    alertType: 'TRANSPORTATION_RISK',
    severity: 'CRITICAL',
    description: `${atRiskBill.name} is ${atRiskBill.daysOverdue} days overdue - repo risk`,
    deadline: atRiskBill.repoDate,
    immediateAction: 'Call lender today - partial payment may prevent repo',
    emergencyResources: [
      {
        name: 'Auto Lender',
        description: 'Negotiate forbearance or payment plan',
        contactMethod: 'Call number on your loan statement',
        resourceType: 'HOTLINE',
        urgency: 'IMMEDIATE'
      },
      {
        name: 'Local Transportation Aid',
        description: 'Bus passes or ride assistance programs',
        contactMethod: 'Call 2-1-1 for local programs',
        resourceType: 'LOCAL_OFFICE',
        urgency: 'THIS_WEEK'
      }
    ]
  };
}

/**
 * Get earliest critical deadline
 */
function getEarliestCriticalDeadline(criticalBills: any[]): number {
  if (criticalBills.length === 0) return 999;
  
  const earliestDays = Math.min(
    ...criticalBills.map((bill: any) => bill.daysUntilDue || 30)
  );
  
  return Math.max(0, earliestDays);
}

/**
 * Format alert for user display
 */
export function formatAlertForDisplay(alert: CrisisAlert): string {
  const urgencyPrefix = alert.severity === 'EMERGENCY' ? '🚨 EMERGENCY: ' : '⚠️ URGENT: ';
  return `${urgencyPrefix}${alert.description}\n→ ${alert.immediateAction}`;
}

/**
 * Get primary emergency resource
 */
export function getPrimaryResource(alert: CrisisAlert): EmergencyResource | undefined {
  return alert.emergencyResources.find(r => r.urgency === 'IMMEDIATE') || 
         alert.emergencyResources[0];
}