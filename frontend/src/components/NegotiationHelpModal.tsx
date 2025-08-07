import React from 'react';
import { X, Phone, FileText, MessageCircle, CheckCircle, Clock } from 'lucide-react';

interface NegotiationHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  billId: string;
  creditorName?: string;
}

export function NegotiationHelpModal({
  isOpen,
  onClose,
  billId,
  creditorName = 'your creditor'
}: NegotiationHelpModalProps) {
  if (!isOpen) return null;

  const negotiationSteps = [
    {
      icon: Phone,
      title: 'Call your creditor',
      description: 'Contact them as soon as possible to explain your situation',
      tip: 'Be honest about your financial difficulties'
    },
    {
      icon: MessageCircle,
      title: 'Explain your situation',
      description: 'Be clear about what caused the payment delay',
      tip: 'Focus on temporary vs permanent hardship'
    },
    {
      icon: Clock,
      title: 'Request a payment plan',
      description: 'Ask for a realistic payment schedule you can maintain',
      tip: 'Propose specific amounts and dates'
    },
    {
      icon: CheckCircle,
      title: 'Ask for fee waiver',
      description: 'Request removal of late fees as part of the agreement',
      tip: 'Mention your history as a customer if positive'
    },
    {
      icon: FileText,
      title: 'Document everything',
      description: 'Get any agreement in writing before making payments',
      tip: 'Take notes during the call including representative name'
    }
  ];

  const scriptSuggestions = [
    '"I\'m calling about my account. I\'ve had some unexpected financial difficulties and need to discuss payment options."',
    '"I want to resolve this debt responsibly. What payment arrangements do you offer?"',
    '"I can commit to $X per month starting on [date]. Can we set up a payment plan?"',
    '"Given my circumstances, would you consider waiving the late fees if I agree to this payment schedule?"'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Negotiation Help</h2>
            <p className="text-sm text-gray-600 mt-1">
              How to negotiate with {creditorName} for bill {billId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Steps */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Step-by-Step Negotiation Process
            </h3>
            <div className="space-y-4">
              {negotiationSteps.map((step, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{step.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                    <p className="text-xs text-blue-600 mt-2 font-medium">💡 {step.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Script Suggestions */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Suggested Conversation Starters
            </h3>
            <div className="space-y-3">
              {scriptSuggestions.map((script, index) => (
                <div key={index} className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                  <p className="text-sm text-gray-800 italic">{script}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-yellow-800 mb-2">
              <Phone className="w-5 h-5" />
              <h4 className="font-medium">Ready to make the call?</h4>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              Look for the customer service number on your bill or statement. 
              Call during business hours when you have time to focus on the conversation.
            </p>
            <div className="text-sm text-yellow-700">
              <p><strong>Best times to call:</strong> Mid-morning or mid-afternoon on weekdays</p>
              <p><strong>What to have ready:</strong> Account number, bill amount, proposed payment schedule</p>
            </div>
          </div>

          {/* Emergency Support */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-blue-800 mb-2">
              <MessageCircle className="w-5 h-5" />
              <h4 className="font-medium">Need help with the conversation?</h4>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              If you're nervous about negotiating, consider calling a nonprofit credit counseling service first. 
              They can provide free advice and sometimes help with the call.
            </p>
            <button
              onClick={() => window.open('tel:211', '_self')}
              className="text-sm text-blue-700 underline hover:text-blue-800"
            >
              Call 2-1-1 for free financial counseling
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                // Close modal and let user proceed with their call
                onClose();
              }}
              className="flex-1 px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Phone className="w-4 h-4" />
              <span>I'm Ready to Call</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}