import React from 'react';
import { CheckCircle, X, Calendar, DollarSign, Phone, Mail, Bell } from 'lucide-react';
import { formatCurrency } from '@/types/bills';

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  splitPlan: {
    option: 'partial' | 'installments' | 'minimum';
    immediateAmount: number;
    remainingAmount: number;
    nextPaymentDate: string;
    totalWithFees: number;
    installments?: number;
  };
  billName: string;
  creditorName: string;
}

export function PaymentConfirmationModal({
  isOpen,
  onClose,
  splitPlan,
  billName,
  creditorName,
}: PaymentConfirmationModalProps) {
  if (!isOpen) return null;

  const paymentType = splitPlan.option === 'partial' ? 'Partial Payment' :
                     splitPlan.option === 'installments' ? 'Installment Plan' : 
                     'Minimum Payment';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="bg-stable-50 px-6 py-4 rounded-t-lg border-b border-stable-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-stable-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-stable-800">Payment Confirmed!</h2>
                <p className="text-sm text-stable-600">{paymentType} processed successfully</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-stable-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5 text-stable-600" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">{billName} - {creditorName}</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-stable-600" />
                  <span className="text-sm text-gray-700">Payment processed today</span>
                </div>
                <span className="font-bold text-stable-600">{formatCurrency(splitPlan.immediateAmount)}</span>
              </div>
              
              {splitPlan.remainingAmount > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Remaining balance due</span>
                  </div>
                  <span className="font-bold text-gray-900">{formatCurrency(splitPlan.remainingAmount)}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Next payment date</span>
                <span className="font-medium text-gray-900">{formatDate(splitPlan.nextPaymentDate)}</span>
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">What happens next:</h4>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-stable-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-stable-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Service continues uninterrupted</p>
                  <p className="text-xs text-gray-600">Your {billName.toLowerCase()} will remain active</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-stable-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Phone className="w-4 h-4 text-stable-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Creditor notified</p>
                  <p className="text-xs text-gray-600">{creditorName} has been informed of your payment arrangement</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-stable-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail className="w-4 h-4 text-stable-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Confirmation email sent</p>
                  <p className="text-xs text-gray-600">Payment receipt and schedule details sent to your email</p>
                </div>
              </div>
              
              {splitPlan.remainingAmount > 0 && (
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-stable-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bell className="w-4 h-4 text-stable-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Payment reminder set</p>
                    <p className="text-xs text-gray-600">We'll remind you before {formatDate(splitPlan.nextPaymentDate)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Important Note */}
          {splitPlan.option === 'minimum' && (
            <div className="mt-6 p-4 bg-caution-50 border border-caution-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Phone className="w-5 h-5 text-caution-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-caution-800">Follow up recommended</p>
                  <p className="text-xs text-caution-700 mt-1">
                    Since this was a minimum payment, consider calling {creditorName} to confirm 
                    this prevents service interruption and discuss your situation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-stable-500 text-white rounded-lg font-medium hover:bg-stable-600 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>

          {/* Emergency Support */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
            <p className="text-sm text-blue-800">
              Need help with remaining balance? Call{' '}
              <button
                onClick={() => window.open('tel:211', '_self')}
                className="font-medium underline hover:text-blue-900"
              >
                2-1-1
              </button>
              {' '}for financial assistance programs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}