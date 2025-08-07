import React, { useState } from 'react';
import {
  DollarSign,
  Calendar,
  AlertTriangle,
  Clock,
  CreditCard,
  Phone,
  MoreVertical,
  CheckCircle,
  Split,
  MessageCircle,
  Zap,
  Home,
  Car,
  Heart,
  FileText,
  Info,
} from 'lucide-react';
import type { BillPriorityCardProps, Bill } from '@/types/bills';
import {
  formatCurrency,
  formatDate,
  formatRelativeDate,
  getBillTypeIcon,
  getBillTypeLabel,
  getRiskIndicators,
} from '@/types/bills';
import { PriorityBadge, PriorityIndicator } from './PriorityBadge';

export function BillPriorityCard({
  bill,
  onPayNow,
  onSplitPayment,
  onNegotiate,
  onMarkPaid,
  isLoading = false,
  showActions = true,
  className = '',
}: BillPriorityCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Get bill type icon component
  const getBillTypeIconComponent = (billType: string) => {
    const iconClass = 'w-5 h-5 text-gray-600';
    
    switch (billType) {
      case 'utility':
        return <Zap className={iconClass} />;
      case 'housing':
        return <Home className={iconClass} />;
      case 'vehicle':
        return <Car className={iconClass} />;
      case 'credit':
        return <CreditCard className={iconClass} />;
      case 'medical':
        return <Heart className={iconClass} />;
      default:
        return <FileText className={iconClass} />;
    }
  };

  // Get risk indicators
  const riskIndicators = getRiskIndicators(bill);

  // Calculate days past due
  const daysPastDue = bill.daysPastDue;
  const isOverdue = daysPastDue > 0;

  // Card styling based on priority
  const getCardStyling = () => {
    const baseClasses = 'bg-white rounded-lg border transition-all duration-200 hover:shadow-md';
    
    switch (bill.priorityLevel) {
      case 'urgent':
        return `${baseClasses} border-l-4 border-l-crisis-500 border-crisis-200 bg-crisis-50`;
      case 'high':
        return `${baseClasses} border-l-4 border-l-urgent-500 border-urgent-200`;
      case 'medium':
        return `${baseClasses} border-l-4 border-l-caution-500 border-gray-200`;
      case 'low':
        return `${baseClasses} border-l-4 border-l-stable-500 border-gray-200`;
      default:
        return `${baseClasses} border-gray-200`;
    }
  };

  // Action button handlers
  const handlePayNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPayNow(bill.billId);
  };

  const handleSplitPayment = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSplitPayment(bill.billId);
  };

  const handleNegotiate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNegotiate(bill.billId);
  };

  const handleMarkPaid = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkPaid(bill.billId);
  };

  const handleToggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const handleToggleActionsMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActionsMenu(!showActionsMenu);
  };

  return (
    <div className={`${getCardStyling()} ${className} relative`}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center z-10">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            <span className="text-sm text-gray-600">Updating...</span>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {/* Bill type icon */}
            <div className="flex-shrink-0 mt-0.5">
              {getBillTypeIconComponent(bill.billType)}
            </div>

            {/* Bill info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {bill.name}
                </h3>
                <PriorityIndicator level={bill.priorityLevel} />
              </div>
              
              <p className="text-sm text-gray-600 truncate">
                {bill.creditorName}
              </p>
              
              <div className="flex items-center space-x-1 mt-1">
                <span className="text-xs text-gray-500">
                  {getBillTypeLabel(bill.billType)}
                </span>
                {bill.billType !== 'other' && (
                  <>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {formatRelativeDate(bill.originalDueDate)}
                      {isOverdue && ` (${daysPastDue} days late)`}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions menu */}
          {showActions && (
            <div className="relative flex-shrink-0">
              <button
                type="button"
                className="p-1 rounded-md hover:bg-gray-100 focus:ring-2 focus:ring-gray-200"
                onClick={handleToggleActionsMenu}
                aria-label="More actions"
              >
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>

              {/* Actions dropdown */}
              {showActionsMenu && (
                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-48">
                  <div className="py-1">
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={handleMarkPaid}
                    >
                      <CheckCircle className="w-4 h-4 inline mr-2" />
                      Mark as Paid
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Amount and Priority Badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(bill.amountOverdue)}
          </div>
          <PriorityBadge
            level={bill.priorityLevel}
            score={bill.priorityScore}
            showScore={true}
            size="md"
            showPulse={bill.priorityLevel === 'urgent'}
          />
        </div>

        {/* Risk Indicators */}
        {riskIndicators.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {riskIndicators.map((risk, index) => (
              <span
                key={index}
                className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md ${
                  risk.color === 'crisis'
                    ? 'bg-crisis-100 text-crisis-700 border border-crisis-300'
                    : 'bg-urgent-100 text-urgent-700 border border-urgent-300'
                }`}
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                {risk.label}
              </span>
            ))}
          </div>
        )}

        {/* Key Details */}
        <div className="space-y-2 mb-4">
          {/* Due Date */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Due Date</span>
            </div>
            <span className={`font-medium ${isOverdue ? 'text-crisis-600' : 'text-gray-900'}`}>
              {formatDate(bill.originalDueDate)}
            </span>
          </div>

          {/* Shutoff Date */}
          {bill.shutoffDate && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-crisis-600">
                <AlertTriangle className="w-4 h-4" />
                <span>Shutoff Date</span>
              </div>
              <span className="font-medium text-crisis-600">
                {formatDate(bill.shutoffDate)}
              </span>
            </div>
          )}

          {/* Late Fees */}
          {bill.lateFeesAccruing && bill.lateFeeAmount && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-urgent-600">
                <Clock className="w-4 h-4" />
                <span>Late Fees</span>
              </div>
              <span className="font-medium text-urgent-600">
                +{formatCurrency(bill.lateFeeAmount)}
              </span>
            </div>
          )}
        </div>

        {/* Priority Reason - Expandable */}
        <div className="mb-4">
          <button
            type="button"
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
            onClick={handleToggleDetails}
          >
            <Info className="w-4 h-4" />
            <span>Why this priority?</span>
          </button>
          
          {showDetails && (
            <div className="mt-2 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">
                {bill.priorityReason}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="grid grid-cols-3 gap-2">
            {/* Pay Now - Primary Action */}
            <button
              type="button"
              className={`flex items-center justify-center space-x-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                bill.priorityLevel === 'urgent'
                  ? 'bg-crisis-500 hover:bg-crisis-600 text-white focus:ring-4 focus:ring-red-200'
                  : 'bg-stable-500 hover:bg-stable-600 text-white focus:ring-4 focus:ring-green-200'
              }`}
              onClick={handlePayNow}
              disabled={isLoading}
            >
              <DollarSign className="w-4 h-4" />
              <span>Pay Now</span>
            </button>

            {/* Split Payment */}
            <button
              type="button"
              className="flex items-center justify-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors focus:ring-4 focus:ring-gray-200"
              onClick={handleSplitPayment}
              disabled={isLoading}
            >
              <Split className="w-4 h-4" />
              <span>Split</span>
            </button>

            {/* Negotiate */}
            <button
              type="button"
              className="flex items-center justify-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors focus:ring-4 focus:ring-gray-200"
              onClick={handleNegotiate}
              disabled={isLoading}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Talk</span>
            </button>
          </div>
        )}

        {/* Emergency Contact for Critical Bills */}
        {bill.priorityLevel === 'urgent' && (bill.shutoffRisk || bill.repoRisk) && (
          <div className="mt-3 p-3 bg-crisis-50 border border-crisis-200 rounded-md">
            <div className="flex items-center space-x-2 text-crisis-700">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">Need help?</span>
            </div>
            <p className="text-xs text-crisis-600 mt-1">
              Call 2-1-1 for emergency assistance with essential bills
            </p>
            <button
              type="button"
              className="mt-2 text-xs text-crisis-700 underline hover:text-crisis-800"
              onClick={() => window.open('tel:211', '_self')}
            >
              Call 2-1-1 Now
            </button>
          </div>
        )}
      </div>

      {/* Click away listener for actions menu */}
      {showActionsMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowActionsMenu(false)}
        />
      )}
    </div>
  );
}

// Skeleton loading version of the card
export function BillPriorityCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Header skeleton */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          <div className="w-5 h-5 bg-gray-200 rounded animate-gentle-pulse" />
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded animate-gentle-pulse mb-2 w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-gentle-pulse w-1/2" />
          </div>
        </div>
        <div className="w-4 h-4 bg-gray-200 rounded animate-gentle-pulse" />
      </div>

      {/* Amount and badge skeleton */}
      <div className="flex items-center justify-between mb-3">
        <div className="h-8 bg-gray-200 rounded animate-gentle-pulse w-24" />
        <div className="h-6 bg-gray-200 rounded-full animate-gentle-pulse w-20" />
      </div>

      {/* Details skeleton */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded animate-gentle-pulse w-16" />
          <div className="h-4 bg-gray-200 rounded animate-gentle-pulse w-20" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded animate-gentle-pulse w-20" />
          <div className="h-4 bg-gray-200 rounded animate-gentle-pulse w-16" />
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="grid grid-cols-3 gap-2">
        <div className="h-9 bg-gray-200 rounded animate-gentle-pulse" />
        <div className="h-9 bg-gray-200 rounded animate-gentle-pulse" />
        <div className="h-9 bg-gray-200 rounded animate-gentle-pulse" />
      </div>
    </div>
  );
}

export default BillPriorityCard;