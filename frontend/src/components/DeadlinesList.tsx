import React from 'react';
import { 
  Calendar, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  ChevronUp,
  DollarSign 
} from 'lucide-react';
import type { DeadlineListProps, Deadline } from '@/types/dashboard';
import { 
  formatCurrency, 
  getDaysUntilText, 
  isPastDue, 
  isUrgent, 
  formatDate 
} from '@/types/dashboard';

export function DeadlinesList({ deadlines, showAll = false, onToggleShowAll }: DeadlineListProps) {
  if (!deadlines || deadlines.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-card">
        <div className="flex items-center space-x-3 mb-4">
          <Calendar className="w-6 h-6 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h3>
        </div>
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-stable-500 mx-auto mb-3" />
          <p className="text-gray-600">No upcoming deadlines</p>
          <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
        </div>
      </div>
    );
  }

  // Sort deadlines by urgency and date
  const sortedDeadlines = [...deadlines].sort((a, b) => {
    // Past due items first
    if (isPastDue(a.daysUntil) && !isPastDue(b.daysUntil)) return -1;
    if (!isPastDue(a.daysUntil) && isPastDue(b.daysUntil)) return 1;
    
    // Then by days until due
    return a.daysUntil - b.daysUntil;
  });

  // Determine how many to show
  const displayCount = showAll ? sortedDeadlines.length : Math.min(5, sortedDeadlines.length);
  const visibleDeadlines = sortedDeadlines.slice(0, displayCount);
  const hiddenCount = sortedDeadlines.length - displayCount;

  // Get deadline styling based on status
  const getDeadlineStyle = (deadline: Deadline) => {
    if (isPastDue(deadline.daysUntil)) {
      return {
        cardBg: 'bg-crisis-50',
        borderColor: 'border-crisis-300',
        iconColor: 'text-crisis-600',
        textColor: 'text-crisis-700',
        statusBg: 'bg-crisis-100',
        statusText: 'text-crisis-700'
      };
    } else if (isUrgent(deadline.daysUntil)) {
      return {
        cardBg: 'bg-urgent-50',
        borderColor: 'border-urgent-300',
        iconColor: 'text-urgent-600',
        textColor: 'text-urgent-700',
        statusBg: 'bg-urgent-100',
        statusText: 'text-urgent-700'
      };
    } else {
      return {
        cardBg: 'bg-white',
        borderColor: 'border-gray-200',
        iconColor: 'text-gray-500',
        textColor: 'text-gray-700',
        statusBg: 'bg-gray-100',
        statusText: 'text-gray-700'
      };
    }
  };

  // Render individual deadline item
  const renderDeadline = (deadline: Deadline, index: number) => {
    const styling = getDeadlineStyle(deadline);
    const daysUntilText = getDaysUntilText(deadline.daysUntil);
    const isOverdue = isPastDue(deadline.daysUntil);
    const isUrgentDeadline = isUrgent(deadline.daysUntil);

    return (
      <div
        key={`${deadline.billName}-${deadline.dueDate}-${index}`}
        className={`
          ${styling.cardBg} border ${styling.borderColor} rounded-lg p-4 
          transition-all duration-200 hover:shadow-md
          ${isOverdue ? 'animate-gentle-pulse' : ''}
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className={`flex-shrink-0 mt-0.5 ${styling.iconColor}`}>
              {isOverdue ? (
                <AlertTriangle className="w-5 h-5" />
              ) : isUrgentDeadline ? (
                <Clock className="w-5 h-5" />
              ) : (
                <Calendar className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">
                {deadline.billName}
              </h4>
              <p className="text-sm text-gray-600">
                Due {formatDate(deadline.dueDate)}
              </p>
            </div>
          </div>
          
          {/* Amount */}
          <div className="text-right flex-shrink-0 ml-3">
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(deadline.amount)}
            </div>
          </div>
        </div>

        {/* Status and Details */}
        <div className="flex items-center justify-between">
          {/* Urgency Status */}
          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${styling.statusBg} ${styling.statusText}`}>
            <Clock className="w-3 h-3" />
            <span>{daysUntilText}</span>
          </div>

          {/* Payment Status */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 text-xs text-gray-600">
              <DollarSign className="w-3 h-3" />
              <span>
                {deadline.paymentPossible ? 'Payable' : 'Cannot pay'}
              </span>
              {deadline.paymentPossible ? (
                <CheckCircle className="w-3 h-3 text-stable-500" />
              ) : (
                <XCircle className="w-3 h-3 text-crisis-500" />
              )}
            </div>
          </div>
        </div>

        {/* Consequence Warning */}
        {deadline.consequence && (isOverdue || isUrgentDeadline) && (
          <div className={`mt-3 p-3 rounded-lg ${styling.statusBg}`}>
            <div className="flex items-start space-x-2">
              <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${styling.textColor}`} />
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">
                  Risk if not paid:
                </p>
                <p className={`text-sm ${styling.textColor}`}>
                  {deadline.consequence}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Calculate summary stats
  const overdueCount = sortedDeadlines.filter(d => isPastDue(d.daysUntil)).length;
  const urgentCount = sortedDeadlines.filter(d => isUrgent(d.daysUntil)).length;
  const payableCount = sortedDeadlines.filter(d => d.paymentPossible).length;
  const totalAmount = sortedDeadlines.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="bg-white rounded-lg p-6 shadow-card">
      {/* Header with Summary */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calendar className="w-6 h-6 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Upcoming Deadlines
          </h3>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">
            {deadlines.length} bill{deadlines.length !== 1 ? 's' : ''}
          </div>
          <div className="text-lg font-bold text-gray-900">
            {formatCurrency(totalAmount)}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {(overdueCount > 0 || urgentCount > 0) && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {overdueCount > 0 && (
            <div className="bg-crisis-50 border border-crisis-200 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-crisis-600">{overdueCount}</div>
              <div className="text-xs text-crisis-700">Overdue</div>
            </div>
          )}
          {urgentCount > 0 && (
            <div className="bg-urgent-50 border border-urgent-200 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-urgent-600">{urgentCount}</div>
              <div className="text-xs text-urgent-700">Due Soon</div>
            </div>
          )}
        </div>
      )}

      {/* Payment Status Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Can afford to pay:</span>
          <span className="font-semibold">
            {payableCount} of {deadlines.length} bills
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-stable-500 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${deadlines.length > 0 ? (payableCount / deadlines.length) * 100 : 0}%` 
            }}
          />
        </div>
      </div>

      {/* Deadlines List */}
      <div className="space-y-3">
        {visibleDeadlines.map((deadline, index) => renderDeadline(deadline, index))}
      </div>

      {/* Show More/Less Toggle */}
      {deadlines.length > 5 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onToggleShowAll}
            className="w-full flex items-center justify-center space-x-2 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>Show Less</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>Show All {deadlines.length} Deadlines</span>
                {hiddenCount > 0 && (
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                    +{hiddenCount}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      )}

      {/* Emergency Help Link */}
      {overdueCount > 0 && (
        <div className="mt-6 pt-4 border-t border-crisis-200 bg-crisis-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
          <p className="text-sm text-crisis-700 text-center">
            Having trouble paying overdue bills?{' '}
            <button
              onClick={() => window.open('tel:211', '_self')}
              className="font-medium underline hover:text-crisis-800"
            >
              Call 2-1-1
            </button>
            {' '}for emergency assistance.
          </p>
        </div>
      )}
    </div>
  );
}