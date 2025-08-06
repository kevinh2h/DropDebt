import React from 'react';
import { AlertTriangle, Phone, ExternalLink, MapPin, Clock } from 'lucide-react';
import type { CrisisAlertProps, EmergencyResource } from '@/types/dashboard';

export function CrisisAlert({ alerts, onResourceClick }: CrisisAlertProps) {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  // Get the most severe alert to display prominently
  const primaryAlert = alerts.find(alert => alert.severity === 'EMERGENCY') || alerts[0];
  const hasMultipleAlerts = alerts.length > 1;

  // Get appropriate styling based on severity
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'EMERGENCY':
        return {
          bgColor: 'bg-crisis-500',
          textColor: 'text-white',
          borderColor: 'border-crisis-600',
          cardBg: 'bg-crisis-50',
          cardBorder: 'border-crisis-200'
        };
      case 'CRITICAL':
        return {
          bgColor: 'bg-crisis-400',
          textColor: 'text-white',
          borderColor: 'border-crisis-500',
          cardBg: 'bg-crisis-50',
          cardBorder: 'border-crisis-200'
        };
      case 'WARNING':
        return {
          bgColor: 'bg-urgent-500',
          textColor: 'text-white',
          borderColor: 'border-urgent-600',
          cardBg: 'bg-urgent-50',
          cardBorder: 'border-urgent-200'
        };
      default:
        return {
          bgColor: 'bg-gray-500',
          textColor: 'text-white',
          borderColor: 'border-gray-600',
          cardBg: 'bg-gray-50',
          cardBorder: 'border-gray-200'
        };
    }
  };

  const primaryStyle = getSeverityStyle(primaryAlert.severity);

  // Get resource icon
  const getResourceIcon = (resource: EmergencyResource) => {
    switch (resource.resourceType) {
      case 'HOTLINE':
        return Phone;
      case 'WEBSITE':
        return ExternalLink;
      case 'LOCAL_OFFICE':
        return MapPin;
      default:
        return ExternalLink;
    }
  };

  // Get urgency styling
  const getUrgencyStyle = (urgency: string) => {
    switch (urgency) {
      case 'IMMEDIATE':
        return 'bg-crisis-600 hover:bg-crisis-700 text-white animate-gentle-pulse';
      case 'TODAY':
        return 'bg-crisis-500 hover:bg-crisis-600 text-white';
      case 'THIS_WEEK':
        return 'bg-urgent-500 hover:bg-urgent-600 text-white';
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  // Render emergency resource button
  const renderResourceButton = (resource: EmergencyResource) => {
    const Icon = getResourceIcon(resource);
    const urgencyStyle = getUrgencyStyle(resource.urgency);

    return (
      <button
        key={resource.name}
        onClick={() => onResourceClick(resource)}
        className={`
          w-full flex items-center space-x-4 p-4 rounded-lg font-semibold text-left
          transition-all duration-200 transform hover:scale-105 active:scale-95
          touch-target shadow-card hover:shadow-lg
          ${urgencyStyle}
        `}
        aria-label={`Contact ${resource.name}: ${resource.description}`}
      >
        <div className="flex-shrink-0">
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-lg font-bold">{resource.name}</div>
          <div className="text-sm opacity-90 line-clamp-2">
            {resource.description}
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <Clock className="w-3 h-3 opacity-75" />
            <span className="text-xs opacity-75 uppercase font-medium">
              {resource.urgency === 'IMMEDIATE' ? 'Call Now' :
               resource.urgency === 'TODAY' ? 'Contact Today' :
               'This Week'}
            </span>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className={`${primaryStyle.cardBg} border-2 ${primaryStyle.cardBorder} rounded-lg overflow-hidden shadow-card`}>
      {/* Alert Header */}
      <div className={`${primaryStyle.bgColor} ${primaryStyle.textColor} px-6 py-4`}>
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold">
                {primaryAlert.severity === 'EMERGENCY' ? 'EMERGENCY ALERT' :
                 primaryAlert.severity === 'CRITICAL' ? 'CRITICAL ALERT' :
                 'FINANCIAL ALERT'}
              </h2>
              {hasMultipleAlerts && (
                <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-sm">
                  +{alerts.length - 1} more
                </span>
              )}
            </div>
            <p className="text-lg opacity-95">
              {primaryAlert.description}
            </p>
            {primaryAlert.deadline && (
              <div className="mt-2 text-sm opacity-90">
                ⏰ Deadline: {new Date(primaryAlert.deadline).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alert Content */}
      <div className="p-6">
        {/* Immediate Action Required */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Immediate Action Required
          </h3>
          <div className="bg-white border border-crisis-200 rounded-lg p-4">
            <p className="text-gray-800 font-medium">
              {primaryAlert.immediateAction}
            </p>
          </div>
        </div>

        {/* Emergency Resources */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Phone className="w-5 h-5 mr-2 text-crisis-600" />
            Emergency Resources
          </h3>
          <div className="space-y-3">
            {primaryAlert.emergencyResources.map((resource) => renderResourceButton(resource))}
          </div>
        </div>

        {/* Additional Alerts */}
        {hasMultipleAlerts && (
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">
              Additional Alerts
            </h4>
            <div className="space-y-3">
              {alerts.slice(1).map((alert, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                      alert.severity === 'EMERGENCY' ? 'text-crisis-500' :
                      alert.severity === 'CRITICAL' ? 'text-crisis-400' :
                      'text-urgent-500'
                    }`} />
                    <div>
                      <h5 className="font-medium text-gray-900">{alert.description}</h5>
                      <p className="text-sm text-gray-600 mt-1">{alert.immediateAction}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Crisis Support Message */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-crisis-100 border border-crisis-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-crisis-500 rounded-full flex items-center justify-center">
                <Phone className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-crisis-800 mb-1">
                  24/7 Crisis Support Available
                </h4>
                <p className="text-sm text-crisis-700 mb-3">
                  You don't have to face this alone. Free, confidential help is available right now.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => window.open('tel:211', '_self')}
                    className="flex items-center justify-center space-x-2 bg-crisis-600 hover:bg-crisis-700 text-white px-4 py-2 rounded font-medium transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call 2-1-1</span>
                  </button>
                  <button
                    onClick={() => window.open('tel:988', '_self')}
                    className="flex items-center justify-center space-x-2 bg-crisis-500 hover:bg-crisis-600 text-white px-4 py-2 rounded font-medium transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Crisis Lifeline 988</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}