import React, { useState, useEffect } from 'react';
import { CheckCircle, X, CreditCard, Loader, RefreshCw } from 'lucide-react';

interface PaymentProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  billNames: string;
  amount?: number;
}

export function PaymentProcessingModal({
  isOpen,
  onClose,
  billNames,
  amount
}: PaymentProcessingModalProps) {
  const [processing, setProcessing] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProcessing(true);
      setSuccess(false);
      
      // Simulate payment processing
      const timer = setTimeout(() => {
        setProcessing(false);
        setSuccess(true);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {processing ? 'Processing Payment' : 'Payment Complete'}
          </h2>
          {!processing && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        <div className="p-6">
          {processing ? (
            // Processing State
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Processing your payment...
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-center space-x-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Connecting to payment processor</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying payment method</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Updating bill status</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                This usually takes just a few seconds...
              </p>
            </div>
          ) : (
            // Success State
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-stable-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-stable-600" />
              </div>
              <h3 className="text-lg font-medium text-stable-800 mb-2">
                Payment Successful!
              </h3>
              <p className="text-gray-600 mb-4">
                Your payment for {billNames} has been processed successfully.
              </p>
              
              <div className="bg-stable-50 rounded-lg p-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center space-x-2 text-stable-700">
                    <CheckCircle className="w-4 h-4" />
                    <span>Payment confirmation sent to your email</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-stable-700">
                    <CheckCircle className="w-4 h-4" />
                    <span>Creditor has been notified</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-stable-700">
                    <CheckCircle className="w-4 h-4" />
                    <span>Bill status updated</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-stable-500 text-white rounded-lg font-medium hover:bg-stable-600 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}