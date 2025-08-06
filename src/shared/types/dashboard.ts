/**
 * Dashboard Types - Real Insights, Not Vanity Metrics
 * 
 * Data structures for meaningful, actionable financial insights that help
 * users understand their situation and know exactly what to do next.
 */

/**
 * Financial status categories based on budget safety and crisis detection
 */
export enum FinancialStatus {
  CRISIS = 'CRISIS',           // Essential needs exceed income
  URGENT = 'URGENT',           // Critical bills due within days
  CAUTION = 'CAUTION',         // Tight budget, careful management needed
  STABLE = 'STABLE',           // Bills manageable, on track
  COMFORTABLE = 'COMFORTABLE'   // Good margin, opportunities for advancement
}

/**
 * Main dashboard data structure with actionable insights
 */
export interface DashboardData {
  userId: string;
  lastUpdated: string;
  financialStatus: FinancialStatus;
  statusExplanation: string;
  nextAction: NextAction;
  progressMilestone: ProgressMilestone;
  availableMoney: AvailableMoney;
  crisisAlerts: CrisisAlert[];
  upcomingDeadlines: Deadline[];
}

/**
 * Specific next action with amount and deadline
 */
export interface NextAction {
  action: string;              // "Pay electric bill"
  amount: number;              // 183.00
  deadline: string;            // ISO date
  daysUntil: number;          // 3
  consequence: string;         // "Power shutoff"
  priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM';
  resourceLink?: string;       // Link to payment or help resource
}

/**
 * Meaningful progress tracking
 */
export interface ProgressMilestone {
  description: string;         // "3 of 7 bills will be current"
  currentCount: number;        // 3
  totalCount: number;          // 7
  nextMilestone: string;       // "All utilities current after Friday's payment"
  timelineToStability: string; // "All bills current in 6 weeks"
  category: ProgressCategory;
}

export enum ProgressCategory {
  SURVIVAL_SECURED = 'SURVIVAL_SECURED',        // Utilities and housing current
  TRANSPORTATION_STABLE = 'TRANSPORTATION_STABLE', // Car and insurance current
  ALL_CURRENT = 'ALL_CURRENT',                  // No overdue bills
  BUILDING_AHEAD = 'BUILDING_AHEAD'             // Emergency fund growing
}

/**
 * Clear available money display
 */
export interface AvailableMoney {
  totalIncome: number;
  essentialNeeds: number;
  availableForBills: number;
  nextPaycheckDate: string;
  nextPaycheckAmount: number;
}

/**
 * Crisis alert with emergency resources
 */
export interface CrisisAlert {
  alertType: 'BUDGET_CRISIS' | 'UTILITY_SHUTOFF' | 'TRANSPORTATION_RISK' | 'HOUSING_RISK';
  severity: 'EMERGENCY' | 'CRITICAL' | 'WARNING';
  description: string;
  deadline?: string;
  immediateAction: string;
  emergencyResources: EmergencyResource[];
}

/**
 * Emergency resource connection
 */
export interface EmergencyResource {
  name: string;               // "2-1-1"
  description: string;        // "24/7 emergency assistance hotline"
  contactMethod: string;      // "Call 2-1-1"
  resourceType: 'HOTLINE' | 'WEBSITE' | 'LOCAL_OFFICE';
  urgency: 'IMMEDIATE' | 'TODAY' | 'THIS_WEEK';
}

/**
 * Upcoming deadline tracking
 */
export interface Deadline {
  billName: string;
  amount: number;
  dueDate: string;
  daysUntil: number;
  consequence: string;
  paymentPossible: boolean;
}

/**
 * Dashboard refresh request
 */
export interface DashboardRequest {
  userId: string;
  includeDetails?: boolean;
  focusArea?: 'CRISIS' | 'PROGRESS' | 'NEXT_ACTION';
}