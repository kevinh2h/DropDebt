import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { useApi, useApiError } from '@/hooks/useApi';
import type { DashboardData, DashboardUIState, LoadingState } from '@/types/dashboard';
import { StatusHeader } from './StatusHeader';
import { NextActionCard } from './NextActionCard';
import { ProgressSection } from './ProgressSection';
import { CrisisAlert } from './CrisisAlert';
import { DeadlinesList } from './DeadlinesList';
import { LoadingState as LoadingComponent } from './LoadingState';
import { PriorityMatrix } from './PriorityMatrix';
import { SplitPaymentModal } from './SplitPaymentModal';
import { PaymentConfirmationModal } from './PaymentConfirmationModal';
import { PaymentProcessingModal } from './PaymentProcessingModal';
import { NegotiationHelpModal } from './NegotiationHelpModal';
import { BillsProvider } from '@/context/BillsContext';
import type { Bill } from '@/types/bills';

export function Dashboard() {
  // API and error handling
  const api = useApi();
  const { formatError, canRetry } = useApiError();

  // Component state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    error: null,
    lastUpdated: null
  });
  const [uiState, setUIState] = useState<DashboardUIState>({
    isCrisisMode: false,
    isOffline: false,
    showAllDeadlines: false,
    refreshing: false
  });

  // Split payment modal state
  const [splitPaymentModal, setSplitPaymentModal] = useState<{
    isOpen: boolean;
    bill: Bill | null;
  }>({
    isOpen: false,
    bill: null
  });

  // Payment confirmation modal state
  const [paymentConfirmationModal, setPaymentConfirmationModal] = useState<{
    isOpen: boolean;
    splitPlan: any;
    billName: string;
    creditorName: string;
  }>({
    isOpen: false,
    splitPlan: null,
    billName: '',
    creditorName: ''
  });

  // Payment processing modal state
  const [paymentProcessingModal, setPaymentProcessingModal] = useState<{
    isOpen: boolean;
    billNames: string;
    amount?: number;
  }>({
    isOpen: false,
    billNames: '',
    amount: 0
  });

  // Negotiation help modal state
  const [negotiationHelpModal, setNegotiationHelpModal] = useState<{
    isOpen: boolean;
    billId: string;
    creditorName: string;
  }>({
    isOpen: false,
    billId: '',
    creditorName: ''
  });

  // Load dashboard data
  const loadDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setUIState(prev => ({ ...prev, refreshing: true }));
      } else {
        setLoadingState(prev => ({ ...prev, isLoading: true, error: null }));
      }

      const data = isRefresh ? await api.refreshDashboard() : await api.getDashboard();
      
      setDashboardData(data);
      setLoadingState({
        isLoading: false,
        error: null,
        lastUpdated: data.lastUpdated
      });

      // Automatically enable crisis mode if user is in crisis
      const shouldEnableCrisisMode = data.financialStatus === 'CRISIS' || data.crisisAlerts.length > 0;
      setUIState(prev => ({
        ...prev,
        isCrisisMode: shouldEnableCrisisMode,
        refreshing: false
      }));

    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setLoadingState({
        isLoading: false,
        error: formatError(error),
        lastUpdated: null
      });
      setUIState(prev => ({ ...prev, refreshing: false }));
    }
  };

  // Initial load
  useEffect(() => {
    loadDashboard();
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setUIState(prev => ({ ...prev, isOffline: false }));
    const handleOffline = () => setUIState(prev => ({ ...prev, isOffline: true }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-refresh every 5 minutes (when online and not in crisis mode)
  useEffect(() => {
    if (uiState.isOffline || uiState.isCrisisMode) return;

    const interval = setInterval(() => {
      loadDashboard(true);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [uiState.isOffline, uiState.isCrisisMode]);

  // Handle manual refresh
  const handleRefresh = () => {
    loadDashboard(true);
  };

  // Handle retry after error
  const handleRetry = () => {
    loadDashboard();
  };

  // Handle next action click
  const handleNextActionClick = () => {
    const action = dashboardData?.nextAction;
    if (!action) return;

    // For crisis actions, show emergency resources
    if (action.priority === 'IMMEDIATE' && action.action.includes('2-1-1')) {
      window.open('tel:211', '_self');
      return;
    }

    // For bill payments, could integrate with payment systems
    console.log('Next action clicked:', action);
  };

  // Handle emergency resource click
  const handleResourceClick = (resource: any) => {
    if (resource.contactMethod.includes('Dial')) {
      const phone = resource.contactMethod.replace(/[^0-9]/g, '');
      window.open(`tel:${phone}`, '_self');
    } else if (resource.contactMethod.includes('http')) {
      window.open(resource.contactMethod, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle bill actions from Priority Matrix
  const handleBillAction = (action: string, billId: string | string[]) => {
    const billIds = Array.isArray(billId) ? billId : [billId];
    
    switch (action) {
      case 'pay':
        // Show payment processing modal
        const billNames = billIds.length === 1 ? `bill ${billIds[0]}` : `${billIds.length} bills`;
        if (confirm(`Ready to pay ${billNames}? This will connect to your payment method.`)) {
          setPaymentProcessingModal({
            isOpen: true,
            billNames,
            amount: undefined // Could calculate total amount from billIds
          });
        }
        break;
        
      case 'split':
        // Show split payment calculator modal
        // For now, create a mock bill object - in real app this would come from API
        const mockBill: Bill = {
          billId: billIds[0],
          name: 'Electric Bill',
          creditorName: 'Metro Electric',
          amountOverdue: 320,
          totalAmount: 320,
          originalDueDate: '2025-07-25',
          daysPastDue: 12,
          billType: 'utility',
          shutoffRisk: true,
          shutoffDate: '2025-08-15',
          repoRisk: false,
          lateFeesAccruing: true,
          lateFeeAmount: 25,
          priorityScore: 95,
          priorityLevel: 'urgent',
          priorityReason: 'Utility shutoff imminent - essential service at risk',
          status: 'active',
          createdAt: '2025-07-20T10:00:00Z',
          updatedAt: new Date().toISOString(),
        };
        
        setSplitPaymentModal({
          isOpen: true,
          bill: mockBill
        });
        break;
        
      case 'negotiate':
        // Show negotiation help modal
        setNegotiationHelpModal({
          isOpen: true,
          billId: billIds[0],
          creditorName: 'Metro Electric' // In real app, get from API
        });
        break;
      case 'edit':
        // Show bill editing interface
        console.log('Editing bill:', billId);
        // You could show a bill editing modal
        break;
      default:
        console.log('Unknown bill action:', action);
    }
  };

  // Toggle crisis mode
  const toggleCrisisMode = () => {
    setUIState(prev => ({ ...prev, isCrisisMode: !prev.isCrisisMode }));
  };

  // Toggle show all deadlines
  const toggleShowAllDeadlines = () => {
    setUIState(prev => ({ ...prev, showAllDeadlines: !prev.showAllDeadlines }));
  };

  // Split payment modal handlers
  const handleCloseSplitPayment = () => {
    setSplitPaymentModal({
      isOpen: false,
      bill: null
    });
  };

  const handleConfirmSplitPayment = (splitPlan: any) => {
    // Close the split payment modal
    handleCloseSplitPayment();
    
    // Show the confirmation modal with payment details
    setPaymentConfirmationModal({
      isOpen: true,
      splitPlan,
      billName: splitPaymentModal.bill?.name || '',
      creditorName: splitPaymentModal.bill?.creditorName || ''
    });
  };

  // Handle closing payment confirmation modal
  const handleClosePaymentConfirmation = () => {
    setPaymentConfirmationModal({
      isOpen: false,
      splitPlan: null,
      billName: '',
      creditorName: ''
    });
    
    // Refresh dashboard to show updated status
    handleRefresh();
  };

  // Handle closing payment processing modal
  const handleClosePaymentProcessing = () => {
    setPaymentProcessingModal({
      isOpen: false,
      billNames: '',
      amount: 0
    });
    
    // Refresh dashboard to show updated status
    handleRefresh();
  };

  // Handle closing negotiation help modal
  const handleCloseNegotiationHelp = () => {
    setNegotiationHelpModal({
      isOpen: false,
      billId: '',
      creditorName: ''
    });
  };

  // Currency formatter (temporary - should be imported from types)
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Loading state
  if (loadingState.isLoading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoadingComponent />
      </div>
    );
  }

  // Error state
  if (loadingState.error && !dashboardData) {
    const showRetry = canRetry({ message: loadingState.error });
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-card p-6 text-center">
          <div className="text-crisis-500 text-4xl mb-4">
            <AlertTriangle className="w-12 h-12 mx-auto" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to load dashboard
          </h1>
          <p className="text-gray-600 mb-6">
            {loadingState.error}
          </p>
          <div className="space-y-3">
            {showRetry && (
              <button
                onClick={handleRetry}
                className="w-full btn-primary"
              >
                Try Again
              </button>
            )}
            <div className="text-sm text-gray-500 pt-4 border-t">
              <p className="font-medium mb-2">Need immediate help?</p>
              <button
                onClick={() => window.open('tel:211', '_self')}
                className="text-crisis-600 hover:text-crisis-700 font-medium"
              >
                Call 2-1-1 for emergency assistance
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  // Crisis mode layout
  if (uiState.isCrisisMode) {
    return (
      <div className="min-h-screen bg-crisis-50 crisis-mode">
        <div className="safe-top">
          {/* Crisis Header */}
          <div className="bg-crisis-500 text-white px-4 py-3">
            <div className="flex items-center justify-between max-w-lg mx-auto">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">Crisis Mode</span>
              </div>
              <button
                onClick={toggleCrisisMode}
                className="text-crisis-100 hover:text-white text-sm"
              >
                Exit Crisis Mode
              </button>
            </div>
          </div>

          {/* Crisis Content */}
          <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
            {/* Crisis Alerts */}
            {dashboardData.crisisAlerts.length > 0 && (
              <CrisisAlert 
                alerts={dashboardData.crisisAlerts}
                onResourceClick={handleResourceClick}
              />
            )}

            {/* Emergency Next Action */}
            <div className="bg-white rounded-lg p-6 shadow-card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Immediate Action Needed
              </h2>
              <NextActionCard
                action={dashboardData.nextAction}
                onActionClick={handleNextActionClick}
                loading={uiState.refreshing}
              />
            </div>

            {/* Essential Info Only */}
            <div className="bg-white rounded-lg p-6 shadow-card">
              <h3 className="font-semibold text-gray-900 mb-3">Available Money</h3>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  ${dashboardData.availableMoney.availableForBills.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">
                  Available for bills after essentials
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal dashboard layout
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="safe-top">
        {/* Header with offline indicator */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">DropDebt</h1>
                <p className="text-sm text-gray-600">Financial guidance when you need it most</p>
              </div>
              <div className="flex items-center space-x-3">
                {uiState.isOffline && (
                  <div className="flex items-center space-x-1 text-urgent-600">
                    <WifiOff className="w-4 h-4" />
                    <span className="text-sm">Offline</span>
                  </div>
                )}
                {!uiState.isOffline && (
                  <button
                    onClick={handleRefresh}
                    disabled={uiState.refreshing}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
                    aria-label="Refresh dashboard"
                  >
                    <RefreshCw className={`w-4 h-4 ${uiState.refreshing ? 'animate-spin' : ''}`} />
                    <span className="text-sm">Refresh</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-6">
            {/* Status Header */}
            <StatusHeader
              status={dashboardData.financialStatus}
              explanation={dashboardData.statusExplanation}
              availableMoney={dashboardData.availableMoney}
              lastUpdated={dashboardData.lastUpdated}
              isStale={dashboardData.stale}
            />

            {/* Crisis Alerts (if any) */}
            {dashboardData.crisisAlerts.length > 0 && (
              <CrisisAlert 
                alerts={dashboardData.crisisAlerts}
                onResourceClick={handleResourceClick}
              />
            )}

            {/* Next Action */}
            <NextActionCard
              action={dashboardData.nextAction}
              onActionClick={handleNextActionClick}
              loading={uiState.refreshing}
            />

            {/* Two-column layout for desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Progress Section */}
              <ProgressSection
                progress={dashboardData.progressMilestone}
                loading={uiState.refreshing}
              />

              {/* Upcoming Deadlines */}
              <DeadlinesList
                deadlines={dashboardData.upcomingDeadlines}
                showAll={uiState.showAllDeadlines}
                onToggleShowAll={toggleShowAllDeadlines}
              />
            </div>

            {/* Priority Matrix Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Your Bills by Priority</h2>
                <p className="text-sm text-gray-600">
                  Smart prioritization to help you make the best decisions
                </p>
              </div>
              
              <BillsProvider autoRefreshInterval={5 * 60 * 1000}>
                <PriorityMatrix
                  onBillAction={handleBillAction}
                  showFilters={true}
                  showBulkActions={true}
                  refreshInterval={0} // Handled by provider
                  className="bg-white rounded-lg border border-gray-200 p-6"
                />
              </BillsProvider>
            </div>

            {/* Crisis Mode Toggle */}
            {dashboardData.financialStatus === 'CRISIS' && (
              <div className="bg-crisis-50 border border-crisis-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-crisis-700">Crisis Mode Available</h3>
                    <p className="text-sm text-crisis-600">
                      Simplified interface focused on emergency actions
                    </p>
                  </div>
                  <button
                    onClick={toggleCrisisMode}
                    className="btn-crisis"
                  >
                    Enable Crisis Mode
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12 safe-bottom">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="text-center text-sm text-gray-600">
              <p className="mb-2">
                Last updated: {dashboardData.lastUpdated ? 
                  new Date(dashboardData.lastUpdated).toLocaleString() : 'Unknown'}
              </p>
              <p className="text-xs">
                Need help? Call <button 
                  onClick={() => window.open('tel:211', '_self')}
                  className="text-crisis-600 hover:text-crisis-700 font-medium underline"
                >
                  2-1-1
                </button> for emergency assistance
              </p>
            </div>
          </div>
        </footer>

        {/* Split Payment Modal */}
        {splitPaymentModal.isOpen && splitPaymentModal.bill && (
          <SplitPaymentModal
            bill={splitPaymentModal.bill}
            onClose={handleCloseSplitPayment}
            onConfirm={handleConfirmSplitPayment}
          />
        )}

        {/* Payment Confirmation Modal */}
        {paymentConfirmationModal.isOpen && paymentConfirmationModal.splitPlan && (
          <PaymentConfirmationModal
            isOpen={paymentConfirmationModal.isOpen}
            onClose={handleClosePaymentConfirmation}
            splitPlan={paymentConfirmationModal.splitPlan}
            billName={paymentConfirmationModal.billName}
            creditorName={paymentConfirmationModal.creditorName}
          />
        )}

        {/* Payment Processing Modal */}
        <PaymentProcessingModal
          isOpen={paymentProcessingModal.isOpen}
          onClose={handleClosePaymentProcessing}
          billNames={paymentProcessingModal.billNames}
          amount={paymentProcessingModal.amount}
        />

        {/* Negotiation Help Modal */}
        <NegotiationHelpModal
          isOpen={negotiationHelpModal.isOpen}
          onClose={handleCloseNegotiationHelp}
          billId={negotiationHelpModal.billId}
          creditorName={negotiationHelpModal.creditorName}
        />
      </div>
    </div>
  );
}