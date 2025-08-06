import React from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, Info, TrendingUp } from 'lucide-react';
import type { StatusHeaderProps } from '@/types/dashboard';
import { getStatusTheme, formatCurrency, formatDate } from '@/types/dashboard';

const statusIcons = {
  CRISIS: AlertTriangle,
  URGENT: AlertTriangle,
  CAUTION: AlertCircle,
  STABLE: CheckCircle,
  COMFORTABLE: TrendingUp
};

const statusLabels = {
  CRISIS: 'Crisis',
  URGENT: 'Urgent',
  CAUTION: 'Caution',
  STABLE: 'Stable',
  COMFORTABLE: 'Comfortable'
};

export function StatusHeader({ 
  status, 
  explanation, 
  availableMoney, 
  lastUpdated, 
  isStale 
}: StatusHeaderProps) {
  const theme = getStatusTheme(status);
  const StatusIcon = statusIcons[status];
  const statusLabel = statusLabels[status];

  // Determine if user has positive available money
  const hasAvailableFunds = availableMoney.availableForBills > 0;
  const nextPaycheckDate = formatDate(availableMoney.nextPaycheckDate);

  return (
    <div className={`rounded-lg border-2 ${theme.borderColor} ${theme.bgColor} p-6`}>
      {/* Status Badge and Title */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center justify-center w-12 h-12 rounded-full bg-${theme.accentColor} bg-opacity-20`}>
            <StatusIcon className={`w-6 h-6 text-${theme.accentColor}`} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Financial Status: {statusLabel}
            </h2>
            <p className={`text-sm ${theme.textColor}`}>
              {explanation}
            </p>
          </div>
        </div>
        
        {isStale && (
          <div className="flex items-center space-x-1 text-urgent-600">
            <Info className="w-4 h-4" />
            <span className="text-xs">Data may be outdated</span>
          </div>
        )}
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Money */}
        <div className="bg-white bg-opacity-60 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Available for Bills</div>
          <div className={`text-2xl font-bold ${hasAvailableFunds ? 'text-stable-600' : 'text-crisis-600'}`}>
            {formatCurrency(availableMoney.availableForBills)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            After essential needs ({formatCurrency(availableMoney.essentialNeeds)})
          </div>
        </div>

        {/* Monthly Income */}
        <div className="bg-white bg-opacity-60 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Monthly Income</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(availableMoney.totalIncome)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Total monthly income
          </div>
        </div>

        {/* Next Paycheck */}
        <div className="bg-white bg-opacity-60 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Next Paycheck</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(availableMoney.nextPaycheckAmount)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {nextPaycheckDate}
          </div>
        </div>
      </div>

      {/* Crisis Warning */}
      {status === 'CRISIS' && (
        <div className="mt-6 bg-crisis-500 text-white rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-1">Emergency Assistance Needed</h3>
              <p className="text-sm text-crisis-100 mb-3">
                Your essential needs exceed your income. Immediate help is available.
              </p>
              <button
                onClick={() => window.open('tel:211', '_self')}
                className="bg-white text-crisis-600 px-4 py-2 rounded font-medium hover:bg-crisis-50 transition-colors"
              >
                Call 2-1-1 Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Budget Breakdown for Comfortable/Stable Users */}
      {(status === 'COMFORTABLE' || status === 'STABLE') && (
        <div className="mt-6">
          <div className="text-sm text-gray-600 mb-3">Budget Breakdown</div>
          <div className="bg-white bg-opacity-60 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Monthly Income</span>
                <span className="font-medium">{formatCurrency(availableMoney.totalIncome)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Essential Needs</span>
                <span className="font-medium">-{formatCurrency(availableMoney.essentialNeeds)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Available for Bills</span>
                  <span className="text-stable-600">
                    {formatCurrency(availableMoney.availableForBills)}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500 pt-1">
                {((availableMoney.availableForBills / availableMoney.totalIncome) * 100).toFixed(0)}% of income available for debt payments
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="mt-4 pt-4 border-t border-gray-200 border-opacity-50">
        <div className="text-xs text-gray-500">
          Last updated: {formatDate(lastUpdated)} at {new Date(lastUpdated).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}