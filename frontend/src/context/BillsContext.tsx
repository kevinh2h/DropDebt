import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type {
  BillsState,
  BillsAction,
  BillsContextType,
  Bill,
  BillFilters,
  BillSortOptions,
  PriorityCalculationRequest,
} from '@/types/bills';
import { DEFAULT_BILLS_STATE } from '@/types/bills';
import { billsService } from '@/services/billsService';

// Bills reducer function
function billsReducer(state: BillsState, action: BillsAction): BillsState {
  switch (action.type) {
    case 'FETCH_BILLS_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'FETCH_BILLS_SUCCESS':
      return {
        ...state,
        isLoading: false,
        bills: action.payload.bills,
        lastUpdated: action.payload.lastUpdated,
        error: null,
      };

    case 'FETCH_BILLS_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload.error,
      };

    case 'CALCULATE_PRIORITIES_START':
      return {
        ...state,
        isCalculating: true,
        error: null,
      };

    case 'CALCULATE_PRIORITIES_SUCCESS':
      return {
        ...state,
        isCalculating: false,
        bills: action.payload.bills,
        lastUpdated: new Date().toISOString(),
        error: null,
      };

    case 'CALCULATE_PRIORITIES_ERROR':
      return {
        ...state,
        isCalculating: false,
        error: action.payload.error,
      };

    case 'UPDATE_BILL':
      return {
        ...state,
        bills: state.bills.map(bill =>
          bill.billId === action.payload.bill.billId
            ? action.payload.bill
            : bill
        ),
        lastUpdated: new Date().toISOString(),
      };

    case 'UPDATE_BILLS':
      return {
        ...state,
        bills: action.payload.bills,
        lastUpdated: new Date().toISOString(),
      };

    case 'SELECT_BILLS':
      return {
        ...state,
        selectedBills: action.payload.billIds,
      };

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedBills: [],
      };

    case 'SET_FILTERS':
      return {
        ...state,
        filters: action.payload.filters,
      };

    case 'SET_SORT':
      return {
        ...state,
        sortOptions: action.payload.sortOptions,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// Create context
const BillsContext = createContext<BillsContextType | undefined>(undefined);

// Bills provider component
interface BillsProviderProps {
  children: React.ReactNode;
  autoRefreshInterval?: number; // in milliseconds
}

export function BillsProvider({ 
  children, 
  autoRefreshInterval = 0 
}: BillsProviderProps) {
  const [state, dispatch] = useReducer(billsReducer, DEFAULT_BILLS_STATE);

  // Auto-refresh bills if interval is set
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        fetchBills();
      }, autoRefreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoRefreshInterval]);

  // Fetch bills function
  const fetchBills = useCallback(async () => {
    dispatch({ type: 'FETCH_BILLS_START' });
    
    try {
      const response = await billsService.fetchBills(state.filters, state.sortOptions);
      
      dispatch({
        type: 'FETCH_BILLS_SUCCESS',
        payload: {
          bills: response.data.bills,
          lastUpdated: response.data.lastUpdated,
        },
      });
      
      if (import.meta.env.DEV) {
        console.log(`Loaded ${response.data.bills.length} bills`);
      }
    } catch (error: any) {
      console.error('Failed to fetch bills:', error);
      
      dispatch({
        type: 'FETCH_BILLS_ERROR',
        payload: {
          error: error.userMessage || 'Failed to load bills',
        },
      });
    }
  }, [state.filters, state.sortOptions]);

  // Calculate priorities function
  const calculatePriorities = useCallback(async (request?: PriorityCalculationRequest) => {
    dispatch({ type: 'CALCULATE_PRIORITIES_START' });
    
    try {
      const response = await billsService.calculatePriorities({
        recalculateAll: true,
        ...request,
      });
      
      dispatch({
        type: 'CALCULATE_PRIORITIES_SUCCESS',
        payload: {
          bills: response.data.updatedBills,
        },
      });
      
      if (import.meta.env.DEV) {
        console.log(`Recalculated priorities for ${response.data.totalProcessed} bills`);
      }
    } catch (error: any) {
      console.error('Failed to calculate priorities:', error);
      
      dispatch({
        type: 'CALCULATE_PRIORITIES_ERROR',
        payload: {
          error: error.userMessage || 'Failed to calculate priorities',
        },
      });
    }
  }, []);

  // Update individual bill
  const updateBill = useCallback(async (billId: string, updates: Partial<Bill>) => {
    try {
      // Optimistic update
      const existingBill = state.bills.find(b => b.billId === billId);
      if (existingBill) {
        const optimisticBill = { ...existingBill, ...updates };
        dispatch({
          type: 'UPDATE_BILL',
          payload: { bill: optimisticBill },
        });
      }
      
      // Make API call
      const updatedBill = await billsService.updateBill(billId, updates);
      
      // Update with actual response
      dispatch({
        type: 'UPDATE_BILL',
        payload: { bill: updatedBill },
      });
      
    } catch (error: any) {
      console.error('Failed to update bill:', error);
      
      // Revert optimistic update by refetching
      fetchBills();
      
      // You could show an error toast here
      dispatch({
        type: 'FETCH_BILLS_ERROR',
        payload: {
          error: error.userMessage || 'Failed to update bill',
        },
      });
    }
  }, [state.bills, fetchBills]);

  // Mark single bill as paid
  const markBillPaid = useCallback(async (billId: string) => {
    try {
      // Optimistic update
      const existingBill = state.bills.find(b => b.billId === billId);
      if (existingBill) {
        const paidBill = { ...existingBill, status: 'paid' as const };
        dispatch({
          type: 'UPDATE_BILL',
          payload: { bill: paidBill },
        });
      }
      
      // Make API call
      const updatedBill = await billsService.markBillPaid(billId);
      
      // Update with actual response
      dispatch({
        type: 'UPDATE_BILL',
        payload: { bill: updatedBill },
      });
      
      // Clear from selection if selected
      if (state.selectedBills.includes(billId)) {
        dispatch({
          type: 'SELECT_BILLS',
          payload: {
            billIds: state.selectedBills.filter(id => id !== billId),
          },
        });
      }
      
    } catch (error: any) {
      console.error('Failed to mark bill as paid:', error);
      
      // Revert optimistic update
      fetchBills();
      
      dispatch({
        type: 'FETCH_BILLS_ERROR',
        payload: {
          error: error.userMessage || 'Failed to mark bill as paid',
        },
      });
    }
  }, [state.bills, state.selectedBills, fetchBills]);

  // Mark multiple bills as paid
  const markBillsPaid = useCallback(async (billIds: string[]) => {
    try {
      // Optimistic update
      const optimisticUpdates = state.bills.map(bill =>
        billIds.includes(bill.billId)
          ? { ...bill, status: 'paid' as const }
          : bill
      );
      
      dispatch({
        type: 'UPDATE_BILLS',
        payload: { bills: optimisticUpdates },
      });
      
      // Make API call
      const updatedBills = await billsService.markBillsPaid(billIds);
      
      // Update with actual response
      const finalBills = state.bills.map(bill => {
        const updatedBill = updatedBills.find(ub => ub.billId === bill.billId);
        return updatedBill || bill;
      });
      
      dispatch({
        type: 'UPDATE_BILLS',
        payload: { bills: finalBills },
      });
      
      // Clear selection
      dispatch({ type: 'CLEAR_SELECTION' });
      
    } catch (error: any) {
      console.error('Failed to mark bills as paid:', error);
      
      // Revert optimistic update
      fetchBills();
      
      dispatch({
        type: 'FETCH_BILLS_ERROR',
        payload: {
          error: error.userMessage || 'Failed to mark bills as paid',
        },
      });
    }
  }, [state.bills, fetchBills]);

  // Selection management functions
  const selectBill = useCallback((billId: string) => {
    const isSelected = state.selectedBills.includes(billId);
    const newSelection = isSelected
      ? state.selectedBills.filter(id => id !== billId)
      : [...state.selectedBills, billId];
    
    dispatch({
      type: 'SELECT_BILLS',
      payload: { billIds: newSelection },
    });
  }, [state.selectedBills]);

  const selectBills = useCallback((billIds: string[]) => {
    dispatch({
      type: 'SELECT_BILLS',
      payload: { billIds },
    });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  // Filter and sort functions
  const setFilters = useCallback((filters: BillFilters) => {
    dispatch({
      type: 'SET_FILTERS',
      payload: { filters },
    });
  }, []);

  const setSortOptions = useCallback((sortOptions: BillSortOptions) => {
    dispatch({
      type: 'SET_SORT',
      payload: { sortOptions },
    });
  }, []);

  // Create context value
  const contextValue: BillsContextType = {
    ...state,
    dispatch,
    fetchBills,
    calculatePriorities,
    updateBill,
    markBillPaid,
    markBillsPaid,
    selectBill,
    selectBills,
    clearSelection,
    setFilters,
    setSortOptions,
  };

  return (
    <BillsContext.Provider value={contextValue}>
      {children}
    </BillsContext.Provider>
  );
}

// Hook to use bills context
export function useBills(): BillsContextType {
  const context = useContext(BillsContext);
  
  if (!context) {
    throw new Error('useBills must be used within a BillsProvider');
  }
  
  return context;
}

// Hook for filtered and sorted bills
export function useFilteredBills(searchQuery?: string) {
  const { bills, filters, sortOptions } = useBills();
  
  return React.useMemo(() => {
    let filteredBills = [...bills];

    // Apply search filter
    if (searchQuery?.trim()) {
      const query = searchQuery.toLowerCase();
      filteredBills = filteredBills.filter(bill =>
        bill.name.toLowerCase().includes(query) ||
        bill.creditorName.toLowerCase().includes(query)
      );
    }

    // Apply priority filter
    if (filters.priorityLevels?.length) {
      filteredBills = filteredBills.filter(bill =>
        filters.priorityLevels!.includes(bill.priorityLevel)
      );
    }

    // Apply bill type filter
    if (filters.billTypes?.length) {
      filteredBills = filteredBills.filter(bill =>
        filters.billTypes!.includes(bill.billType)
      );
    }

    // Apply risk categories filter
    if (filters.riskCategories?.length) {
      filteredBills = filteredBills.filter(bill => {
        const hasShutoffRisk = bill.shutoffRisk && filters.riskCategories!.includes('shutoff');
        const hasRepoRisk = bill.repoRisk && filters.riskCategories!.includes('repo');
        const hasLateFees = bill.lateFeesAccruing && filters.riskCategories!.includes('late_fees');
        return hasShutoffRisk || hasRepoRisk || hasLateFees;
      });
    }

    // Apply amount range filter
    if (filters.amountRange) {
      filteredBills = filteredBills.filter(bill =>
        bill.amountOverdue >= filters.amountRange!.min &&
        bill.amountOverdue <= filters.amountRange!.max
      );
    }

    // Apply sorting
    filteredBills.sort((a, b) => {
      const field = sortOptions.field;
      const direction = sortOptions.direction === 'asc' ? 1 : -1;

      let aValue: any = a[field];
      let bValue: any = b[field];

      if (field === 'originalDueDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (typeof aValue === 'string') {
        return direction * aValue.localeCompare(bValue);
      }

      return direction * (aValue - bValue);
    });

    return filteredBills;
  }, [bills, filters, sortOptions, searchQuery]);
}

// Hook for bill statistics
export function useBillStats() {
  const { bills } = useBills();
  
  return React.useMemo(() => {
    const stats = {
      total: bills.length,
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0,
      totalAmount: 0,
      urgentAmount: 0,
      shutoffRisk: 0,
      repoRisk: 0,
      lateFeesAccruing: 0,
      overdue: 0,
    };

    bills.forEach(bill => {
      // Priority counts
      switch (bill.priorityLevel) {
        case 'urgent':
          stats.urgent++;
          stats.urgentAmount += bill.amountOverdue;
          break;
        case 'high':
          stats.high++;
          break;
        case 'medium':
          stats.medium++;
          break;
        case 'low':
          stats.low++;
          break;
      }

      // Total amount
      stats.totalAmount += bill.amountOverdue;

      // Risk indicators
      if (bill.shutoffRisk) stats.shutoffRisk++;
      if (bill.repoRisk) stats.repoRisk++;
      if (bill.lateFeesAccruing) stats.lateFeesAccruing++;

      // Overdue count
      if (bill.daysPastDue > 0) stats.overdue++;
    });

    return stats;
  }, [bills]);
}

// Hook for bill actions with error handling
export function useBillActions() {
  const { markBillPaid, markBillsPaid, updateBill, calculatePriorities } = useBills();
  
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const executeAction = useCallback(async <T,>(
    action: () => Promise<T>,
    successMessage?: string
  ): Promise<T | null> => {
    try {
      setIsProcessing(true);
      setActionError(null);
      
      const result = await action();
      
      if (successMessage && import.meta.env.DEV) {
        console.log(successMessage);
      }
      
      return result;
    } catch (error: any) {
      console.error('Bill action failed:', error);
      setActionError(error.userMessage || 'Action failed');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setActionError(null);
  }, []);

  return {
    isProcessing,
    actionError,
    clearError,
    executeAction,
    // Wrapped actions
    markPaid: (billId: string) => executeAction(() => markBillPaid(billId), 'Bill marked as paid'),
    markMultiplePaid: (billIds: string[]) => executeAction(() => markBillsPaid(billIds), `${billIds.length} bills marked as paid`),
    update: (billId: string, updates: Partial<Bill>) => executeAction(() => updateBill(billId, updates), 'Bill updated'),
    recalculate: (request?: PriorityCalculationRequest) => executeAction(() => calculatePriorities(request), 'Priorities recalculated'),
  };
}

export default BillsContext;