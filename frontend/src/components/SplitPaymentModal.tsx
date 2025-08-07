import React, { useState } from 'react';
import { X, Calculator, Calendar, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/types/bills';
import type { Bill } from '@/types/bills';

interface SplitPaymentModalProps {
  bill: Bill;
  onClose: () => void;
  onConfirm: (splitPlan: SplitPlan) => void;
}

interface SplitPlan {
  option: 'partial' | 'installments' | 'minimum';
  immediateAmount: number;
  remainingAmount: number;
  nextPaymentDate: string;
  installments?: number;
  totalWithFees: number;
}

export function SplitPaymentModal({ bill, onClose, onConfirm }: SplitPaymentModalProps) {
  const [selectedOption, setSelectedOption] = useState<'partial' | 'installments' | 'minimum'>('partial');
  const [immediateAmount, setImmediateAmount] = useState(Math.round(bill.amountOverdue * 0.5));
  const [installments, setInstallments] = useState(2);
  const [nextPaymentDate, setNextPaymentDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Calculate different split options
  const calculateSplitPlan = (): SplitPlan => {
    const lateFee = bill.lateFeeAmount || 0;
    
    switch (selectedOption) {
      case 'partial':
        return {
          option: 'partial',
          immediateAmount,
          remainingAmount: bill.amountOverdue - immediateAmount,
          nextPaymentDate,
          totalWithFees: bill.amountOverdue + (lateFee * 0.5), // Reduced late fee for partial payment
        };
      
      case 'installments':
        const perInstallment = Math.round(bill.amountOverdue / installments);
        return {
          option: 'installments',
          immediateAmount: perInstallment,
          remainingAmount: bill.amountOverdue - perInstallment,
          nextPaymentDate,
          installments,
          totalWithFees: bill.amountOverdue + lateFee,
        };
      
      case 'minimum':
        const minimumPayment = Math.max(50, Math.round(bill.amountOverdue * 0.25));
        return {
          option: 'minimum',
          immediateAmount: minimumPayment,
          remainingAmount: bill.amountOverdue - minimumPayment,
          nextPaymentDate,
          totalWithFees: bill.amountOverdue + lateFee + (lateFee * 0.25), // Additional fees for minimum payment
        };
    }
  };

  const splitPlan = calculateSplitPlan();
  const canAffordImmediate = immediateAmount <= 500; // Simple affordability check

  const handleConfirm = () => {
    onConfirm(splitPlan);
    onClose();
  };

  // Get next payment date in readable format
  const formatPaymentDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Split Payment</h2>
            <p className="text-sm text-gray-600 mt-1">{bill.name} - {bill.creditorName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Bill Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Total Amount Due</span>
              <span className="text-lg font-bold text-gray-900">{formatCurrency(bill.amountOverdue)}</span>
            </div>
            
            {bill.shutoffDate && (
              <div className="flex items-center space-x-2 text-crisis-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Shutoff date: {formatPaymentDate(bill.shutoffDate)}</span>
              </div>
            )}
          </div>

          {/* Split Options */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Payment Options
            </h3>

            {/* Partial Payment Option */}
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedOption === 'partial' ? 'border-stable-500 bg-stable-50' : 'border-gray-200'
              }`}
              onClick={() => setSelectedOption('partial')}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <input
                    type="radio"
                    checked={selectedOption === 'partial'}
                    onChange={() => setSelectedOption('partial')}
                    className="mr-3 text-stable-500"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">Partial Payment</h4>
                    <p className="text-sm text-gray-600">Pay what you can afford now</p>
                  </div>
                </div>
              </div>
              
              {selectedOption === 'partial' && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount to pay now
                    </label>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <input
                        type="number"
                        value={immediateAmount}
                        onChange={(e) => setImmediateAmount(Math.max(25, Number(e.target.value)))}
                        min="25"
                        max={bill.amountOverdue}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-stable-500 focus:border-stable-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Remaining: {formatCurrency(bill.amountOverdue - immediateAmount)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Installment Plan Option */}
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedOption === 'installments' ? 'border-stable-500 bg-stable-50' : 'border-gray-200'
              }`}
              onClick={() => setSelectedOption('installments')}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  checked={selectedOption === 'installments'}
                  onChange={() => setSelectedOption('installments')}
                  className="mr-3 text-stable-500"
                />
                <div>
                  <h4 className="font-medium text-gray-900">Equal Installments</h4>
                  <p className="text-sm text-gray-600">Split into equal payments</p>
                </div>
              </div>

              {selectedOption === 'installments' && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of payments
                    </label>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-stable-500 focus:border-stable-500"
                    >
                      <option value={2}>2 payments</option>
                      <option value={3}>3 payments</option>
                      <option value={4}>4 payments</option>
                    </select>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Payment 1 (today): {formatCurrency(Math.round(bill.amountOverdue / installments))}</p>
                    <p>Remaining {installments - 1} payments: {formatCurrency(Math.round(bill.amountOverdue / installments))} each</p>
                  </div>
                </div>
              )}
            </div>

            {/* Minimum Payment Option */}
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedOption === 'minimum' ? 'border-caution-500 bg-caution-50' : 'border-gray-200'
              }`}
              onClick={() => setSelectedOption('minimum')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="radio"
                    checked={selectedOption === 'minimum'}
                    onChange={() => setSelectedOption('minimum')}
                    className="mr-3 text-caution-500"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">Minimum Payment</h4>
                    <p className="text-sm text-gray-600">Smallest amount to avoid shutoff</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-caution-600">
                  {formatCurrency(Math.max(50, Math.round(bill.amountOverdue * 0.25)))}
                </span>
              </div>
              
              {selectedOption === 'minimum' && (
                <div className="mt-3 p-3 bg-caution-100 rounded-md">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-caution-600 mt-0.5" />
                    <div className="text-sm text-caution-700">
                      <p className="font-medium">Additional fees may apply</p>
                      <p>Contact creditor to confirm minimum payment prevents service interruption</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Next Payment Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Next payment date
            </label>
            <input
              type="date"
              value={nextPaymentDate}
              onChange={(e) => setNextPaymentDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-stable-500 focus:border-stable-500"
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Payment Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Pay today:</span>
                <span className="font-medium">{formatCurrency(splitPlan.immediateAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining balance:</span>
                <span>{formatCurrency(splitPlan.remainingAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Next payment due:</span>
                <span>{formatPaymentDate(splitPlan.nextPaymentDate)}</span>
              </div>
              {splitPlan.totalWithFees > bill.amountOverdue && (
                <div className="flex justify-between text-caution-600">
                  <span>Total with fees:</span>
                  <span className="font-medium">{formatCurrency(splitPlan.totalWithFees)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Affordability Check */}
          {!canAffordImmediate && (
            <div className="bg-crisis-50 border border-crisis-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-crisis-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-crisis-800">Need emergency assistance?</p>
                  <p className="text-sm text-crisis-700 mt-1">
                    If you can't afford this payment, call 2-1-1 for emergency bill assistance programs.
                  </p>
                  <button
                    onClick={() => window.open('tel:211', '_self')}
                    className="mt-2 text-sm text-crisis-600 underline hover:text-crisis-800"
                  >
                    Call 2-1-1 now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 text-white bg-stable-500 hover:bg-stable-600 rounded-md font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirm Split Payment</span>
            </button>
          </div>

          {/* Contact Creditor */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Contact {bill.creditorName} to discuss your payment plan and avoid surprises. 
              Many creditors prefer customers who communicate proactively.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}