import React from 'react';
import { Calendar, AlertTriangle, Phone, ArrowRight } from 'lucide-react';
import type { NextActionCardProps } from '@/types/dashboard';
import { formatCurrency, getDaysUntilText, isUrgent } from '@/types/dashboard';

export function NextActionCard({ action, onActionClick, loading }: NextActionCardProps) {
  const isEmergency = action.priority === 'IMMEDIATE';
  const isUrgentDeadline = isUrgent(action.daysUntil);

  // Handle emergency actions (like calling 2-1-1)
  const handleEmergencyAction = () => {
    if (action.action.toLowerCase().includes('2-1-1') || action.action.toLowerCase().includes('211')) {
      window.open('tel:211', '_self');
      return;
    }
    onActionClick();
  };

  const cardClass = isEmergency 
    ? 'card-crisis crisis-shadow' 
    : 'card';

  const buttonClass = isEmergency 
    ? 'btn-crisis' 
    : isUrgentDeadline 
    ? 'bg-urgent-500 hover:bg-urgent-600 text-white px-6 py-3 rounded-lg font-medium focus:ring-4 focus:ring-orange-200 transition-all duration-200 touch-target'
    : 'btn-primary';

  return (
    <div className={`${cardClass} ${loading ? 'opacity-75' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {isEmergency ? '🚨 Immediate Action Required' : 'Next Action'}
        </h2>
        {action.priority && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            action.priority === 'IMMEDIATE' ? 'bg-crisis-100 text-crisis-700' :
            action.priority === 'HIGH' ? 'bg-urgent-100 text-urgent-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {action.priority.toLowerCase()}
          </span>
        )}
      </div>

      {/* Main Action */}
      <div className="space-y-4">
        {/* Action Description */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {action.action}
            {action.amount > 0 && (
              <span className="text-gray-600"> ({formatCurrency(action.amount)})</span>
            )}
          </h3>
          {action.consequence && (
            <p className="text-gray-600">
              {action.priority === 'IMMEDIATE' ? 
                action.consequence : 
                `To avoid: ${action.consequence}`
              }
            </p>
          )}
        </div>

        {/* Deadline Information */}
        {action.deadline && action.daysUntil > 0 && (
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">
              {getDaysUntilText(action.daysUntil)}
            </span>
            {isUrgentDeadline && (
              <div className="flex items-center space-x-1 text-urgent-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Urgent</span>
              </div>
            )}
          </div>
        )}

        {/* Emergency Action Button */}
        {isEmergency ? (
          <div className="space-y-3">
            <button
              onClick={handleEmergencyAction}
              disabled={loading}
              className={`w-full ${buttonClass} text-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label={`Emergency action: ${action.action}`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Phone className="w-5 h-5" />
                <span>Get Help Now</span>
              </div>
            </button>
            <p className="text-sm text-gray-600 text-center">
              Free, confidential 24/7 assistance available
            </p>
          </div>
        ) : (
          /* Regular Action Button */
          <button
            onClick={onActionClick}
            disabled={loading}
            className={`w-full ${buttonClass} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={`Take action: ${action.action}`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span>Take Action</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            <span className="text-sm">Updating...</span>
          </div>
        )}
      </div>
    </div>
  );
}