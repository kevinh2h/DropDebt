/**
 * Progress Calculator - Meaningful Milestones, Not Percentages
 * 
 * Shows real progress toward financial stability with clear counts and
 * timelines instead of abstract percentages.
 */

import { ProgressCategory } from '../types/dashboard';

export interface BillProgress {
  totalBills: number;
  currentBills: number;
  criticalBills: number;
  criticalCurrent: number;
  highPriorityBills: number;
  highPriorityCurrent: number;
}

export interface ProgressInsight {
  mainProgress: string;              // "3 of 7 bills current"
  category: ProgressCategory;
  nextMilestone: string;            // "All utilities current after Friday's payment"
  timelineToStability: string;      // "All bills current in 6 weeks"
  weeklyProgress: string;           // "1 bill becomes current each week"
  encouragement?: string;           // Context-appropriate positive reinforcement
}

/**
 * Calculate meaningful progress from bill data
 */
export function calculateBillProgress(bills: any[]): BillProgress {
  const totalBills = bills.length;
  const currentBills = bills.filter(bill => bill.currentBalance === 0).length;
  
  const criticalBills = bills.filter(bill => bill.priorityCategory === 'CRITICAL').length;
  const criticalCurrent = bills.filter(
    bill => bill.priorityCategory === 'CRITICAL' && bill.currentBalance === 0
  ).length;
  
  const highPriorityBills = bills.filter(bill => bill.priorityCategory === 'HIGH').length;
  const highPriorityCurrent = bills.filter(
    bill => bill.priorityCategory === 'HIGH' && bill.currentBalance === 0
  ).length;
  
  return {
    totalBills,
    currentBills,
    criticalBills,
    criticalCurrent,
    highPriorityBills,
    highPriorityCurrent
  };
}

/**
 * Generate progress insights based on current situation
 */
export function generateProgressInsights(
  billProgress: BillProgress,
  availableWeekly: number,
  totalDebt: number
): ProgressInsight {
  const { totalBills, currentBills, criticalBills, criticalCurrent } = billProgress;
  
  // Determine progress category
  const category = determineProgressCategory(billProgress);
  
  // Main progress message - always show clear count
  const mainProgress = `${currentBills} of ${totalBills} bills current`;
  
  // Calculate timeline to stability
  const weeksToStability = calculateWeeksToStability(totalDebt, availableWeekly);
  const timelineToStability = formatTimelineToStability(weeksToStability);
  
  // Generate next milestone based on current progress
  const nextMilestone = generateNextMilestone(billProgress, availableWeekly);
  
  // Calculate weekly progress rate
  const weeklyProgress = calculateWeeklyProgress(totalDebt, availableWeekly, billProgress);
  
  // Add encouragement for users making progress
  const encouragement = generateEncouragement(category, billProgress);
  
  return {
    mainProgress,
    category,
    nextMilestone,
    timelineToStability,
    weeklyProgress,
    encouragement
  };
}

/**
 * Determine which progress category user is in
 */
function determineProgressCategory(progress: BillProgress): ProgressCategory {
  const { totalBills, currentBills, criticalBills, criticalCurrent } = progress;
  
  // All bills current - building ahead
  if (currentBills === totalBills) {
    return ProgressCategory.BUILDING_AHEAD;
  }
  
  // All bills current - ready to build emergency fund
  if (currentBills === totalBills) {
    return ProgressCategory.ALL_CURRENT;
  }
  
  // All critical bills current - survival secured
  if (criticalCurrent === criticalBills && criticalBills > 0) {
    return ProgressCategory.SURVIVAL_SECURED;
  }
  
  // Default - still working on critical bills
  return ProgressCategory.SURVIVAL_SECURED;
}

/**
 * Calculate weeks to financial stability
 */
function calculateWeeksToStability(totalDebt: number, weeklyAvailable: number): number {
  if (weeklyAvailable <= 0) return 999; // No progress possible
  if (totalDebt <= 0) return 0; // Already stable
  
  return Math.ceil(totalDebt / weeklyAvailable);
}

/**
 * Format timeline message based on weeks
 */
function formatTimelineToStability(weeks: number): string {
  if (weeks === 0) return 'All bills current - maintain momentum';
  if (weeks === 1) return 'All bills current after this week';
  if (weeks <= 4) return `All bills current in ${weeks} weeks`;
  if (weeks <= 12) return `All bills current in ${Math.ceil(weeks / 4)} months`;
  if (weeks <= 52) return `All bills current in ${Math.ceil(weeks / 4)} months with current plan`;
  return 'Timeline unclear - need budget assistance';
}

/**
 * Generate specific next milestone
 */
function generateNextMilestone(progress: BillProgress, weeklyAvailable: number): string {
  const { criticalBills, criticalCurrent, highPriorityBills, highPriorityCurrent } = progress;
  
  // Critical bills not yet secured
  if (criticalCurrent < criticalBills) {
    const remaining = criticalBills - criticalCurrent;
    if (remaining === 1) {
      return 'Last critical bill (utilities/housing) secured after next payment';
    }
    return `All critical bills (utilities/housing) secured after ${remaining} more payments`;
  }
  
  // High priority bills next
  if (highPriorityCurrent < highPriorityBills) {
    const remaining = highPriorityBills - highPriorityCurrent;
    if (remaining === 1) {
      return 'Transportation secured after next payment';
    }
    return `All high priority bills current after ${remaining} more payments`;
  }
  
  // All bills nearly current
  const totalRemaining = progress.totalBills - progress.currentBills;
  if (totalRemaining === 1) {
    return 'Last bill becomes current next week';
  }
  if (totalRemaining > 0) {
    return `All ${totalRemaining} remaining bills current soon`;
  }
  
  return 'All bills current - time to build emergency fund';
}

/**
 * Calculate weekly progress rate
 */
function calculateWeeklyProgress(
  totalDebt: number,
  weeklyAvailable: number,
  progress: BillProgress
): string {
  if (weeklyAvailable <= 0) {
    return 'No funds available - emergency assistance needed';
  }
  
  // Estimate bills paid per week based on available funds
  const averageBillAmount = totalDebt / (progress.totalBills - progress.currentBills || 1);
  const billsPerWeek = weeklyAvailable / averageBillAmount;
  
  if (billsPerWeek >= 2) {
    return `Paying off ${Math.floor(billsPerWeek)} bills per week at current rate`;
  }
  if (billsPerWeek >= 1) {
    return '1 bill becomes current each week';
  }
  if (billsPerWeek >= 0.5) {
    return '1 bill becomes current every 2 weeks';
  }
  
  return '1 bill becomes current each month';
}

/**
 * Generate appropriate encouragement
 */
function generateEncouragement(
  category: ProgressCategory,
  progress: BillProgress
): string | undefined {
  switch (category) {
    case ProgressCategory.SURVIVAL_SECURED:
      if (progress.criticalCurrent === progress.criticalBills) {
        return 'Great work - essential services are secure';
      }
      return 'Keep going - securing essential services first';
      
    case ProgressCategory.TRANSPORTATION_STABLE:
      return 'Excellent - transportation secured means work stability';
      
    case ProgressCategory.ALL_CURRENT:
      return 'Outstanding progress - all bills are now current';
      
    case ProgressCategory.BUILDING_AHEAD:
      return 'Exceptional - building emergency fund for future stability';
      
    default:
      if (progress.currentBills > progress.totalBills * 0.5) {
        return 'Over halfway there - momentum is building';
      }
      return undefined;
  }
}

/**
 * Special handling for crisis situations
 */
export function generateCrisisProgress(
  availableAmount: number,
  essentialNeeds: number,
  criticalBills: number
): ProgressInsight {
  return {
    mainProgress: 'Crisis mode - focus on survival',
    category: ProgressCategory.SURVIVAL_SECURED,
    nextMilestone: 'Secure essential services first',
    timelineToStability: 'Timeline depends on emergency assistance',
    weeklyProgress: 'Emergency resources needed immediately',
    encouragement: 'Help is available - you\'re not alone'
  };
}