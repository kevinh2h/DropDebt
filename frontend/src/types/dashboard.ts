/**
 * Frontend Dashboard Types
 * 
 * TypeScript definitions matching the backend Dashboard API
 * for type-safe integration and development.
 */

export type FinancialStatus = 'CRISIS' | 'URGENT' | 'CAUTION' | 'STABLE' | 'COMFORTABLE';

export type ActionPriority = 'IMMEDIATE' | 'HIGH' | 'MEDIUM';

export type ProgressCategory = 'SURVIVAL_SECURED' | 'TRANSPORTATION_STABLE' | 'ALL_CURRENT' | 'BUILDING_AHEAD';

export type AlertType = 'BUDGET_CRISIS' | 'UTILITY_SHUTOFF' | 'TRANSPORTATION_RISK' | 'HOUSING_RISK';

export type AlertSeverity = 'EMERGENCY' | 'CRITICAL' | 'WARNING';

export type ResourceType = 'HOTLINE' | 'WEBSITE' | 'LOCAL_OFFICE';

export type ResourceUrgency = 'IMMEDIATE' | 'TODAY' | 'THIS_WEEK';

export interface NextAction {
  action: string;
  amount: number;
  deadline: string;
  daysUntil: number;
  consequence: string;
  priority: ActionPriority;
  resourceLink?: string;
}

export interface ProgressMilestone {
  description: string;
  currentCount: number;
  totalCount: number;
  nextMilestone: string;
  timelineToStability: string;
  category: ProgressCategory;
}

export interface AvailableMoney {
  totalIncome: number;
  essentialNeeds: number;
  availableForBills: number;
  nextPaycheckDate: string;
  nextPaycheckAmount: number;
}

export interface EmergencyResource {
  name: string;
  description: string;
  contactMethod: string;
  resourceType: ResourceType;
  urgency: ResourceUrgency;
}

export interface CrisisAlert {
  alertType: AlertType;
  severity: AlertSeverity;
  description: string;
  deadline?: string;
  immediateAction: string;
  emergencyResources: EmergencyResource[];
}

export interface Deadline {
  billName: string;
  amount: number;
  dueDate: string;
  daysUntil: number;
  consequence: string;
  paymentPossible: boolean;
}

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
  stale?: boolean;
  staleReason?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DashboardResponse extends ApiResponse<DashboardData> {}

export interface NextActionResponse extends ApiResponse<{ nextAction: NextAction; cached?: boolean }> {}

export interface ProgressResponse extends ApiResponse<{ progress: ProgressMilestone }> {}

export interface AlertsResponse extends ApiResponse<{ alerts: CrisisAlert[] }> {}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// UI State types
export interface DashboardUIState {
  isCrisisMode: boolean;
  isOffline: boolean;
  showAllDeadlines: boolean;
  refreshing: boolean;
}

// Component props
export interface StatusHeaderProps {
  status: FinancialStatus;
  explanation: string;
  availableMoney: AvailableMoney;
  lastUpdated: string;
  isStale?: boolean;
}

export interface NextActionCardProps {
  action: NextAction;
  onActionClick: () => void;
  loading?: boolean;
}

export interface ProgressSectionProps {
  progress: ProgressMilestone;
  loading?: boolean;
}

export interface CrisisAlertProps {
  alerts: CrisisAlert[];
  onResourceClick: (resource: EmergencyResource) => void;
}

export interface DeadlineListProps {
  deadlines: Deadline[];
  showAll?: boolean;
  onToggleShowAll: () => void;
}

// Error types
export interface DashboardError {
  code: string;
  message: string;
  canRetry: boolean;
  isNetworkError: boolean;
}

// Theme and styling
export interface StatusTheme {
  bgColor: string;
  textColor: string;
  borderColor: string;
  accentColor: string;
}

export const statusThemes: Record<FinancialStatus, StatusTheme> = {
  CRISIS: {
    bgColor: 'bg-crisis-50',
    textColor: 'text-crisis-700',
    borderColor: 'border-crisis-200',
    accentColor: 'crisis-500'
  },
  URGENT: {
    bgColor: 'bg-urgent-50',
    textColor: 'text-urgent-700', 
    borderColor: 'border-urgent-200',
    accentColor: 'urgent-500'
  },
  CAUTION: {
    bgColor: 'bg-caution-50',
    textColor: 'text-caution-700',
    borderColor: 'border-caution-200',
    accentColor: 'caution-500'
  },
  STABLE: {
    bgColor: 'bg-stable-50',
    textColor: 'text-stable-700',
    borderColor: 'border-stable-200',
    accentColor: 'stable-500'
  },
  COMFORTABLE: {
    bgColor: 'bg-comfortable-50',
    textColor: 'text-comfortable-700',
    borderColor: 'border-comfortable-200',
    accentColor: 'comfortable-500'
  }
};

// Utility functions
export function getStatusTheme(status: FinancialStatus): StatusTheme {
  return statusThemes[status];
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

export function getDaysUntilText(daysUntil: number): string {
  if (daysUntil === 0) return 'Due today';
  if (daysUntil === 1) return 'Due tomorrow';
  if (daysUntil > 1) return `Due in ${daysUntil} days`;
  if (daysUntil === -1) return 'Overdue by 1 day';
  return `Overdue by ${Math.abs(daysUntil)} days`;
}

export function isPastDue(daysUntil: number): boolean {
  return daysUntil < 0;
}

export function isUrgent(daysUntil: number): boolean {
  return daysUntil <= 3 && daysUntil >= 0;
}