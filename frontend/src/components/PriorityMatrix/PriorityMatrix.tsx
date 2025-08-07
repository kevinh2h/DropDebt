import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  RefreshCw,
  Filter,
  SortDesc,
  SortAsc,
  CheckSquare,
  Square,
  Trash2,
  DollarSign,
  MessageCircle,
  Search,
  BarChart3,
  AlertCircle,
  Plus,
  X,
} from 'lucide-react';
import type {
  PriorityMatrixProps,
  Bill,
  BillAction,
  BillFilters,
  BillSortOptions,
  PriorityLevel,
  BillType,
} from '@/types/bills';
import { BillPriorityCard, BillPriorityCardSkeleton } from './BillPriorityCard';
import { PriorityChip, PriorityLegend } from './PriorityBadge';
import { billsService } from '@/services/billsService';
import { formatCurrency } from '@/types/bills';

export function PriorityMatrix({
  className = '',
  showFilters = true,
  showBulkActions = true,
  onBillAction,
  refreshInterval = 0,
}: PriorityMatrixProps) {
  // State management
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showEmptyState, setShowEmptyState] = useState(false);

  // Filter and sort state
  const [filters, setFilters] = useState<BillFilters>({
    priorityLevels: [],
    billTypes: [],
    riskCategories: [],
  });

  const [sortOptions, setSortOptions] = useState<BillSortOptions>({
    field: 'priorityScore',
    direction: 'desc',
  });

  // Load bills on component mount and set up refresh interval
  useEffect(() => {
    loadBills();

    if (refreshInterval > 0) {
      const interval = setInterval(loadBills, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  // Load bills function
  const loadBills = useCallback(async () => {
    try {
      setError(null);
      const response = await billsService.fetchBills(filters, sortOptions);
      setBills(response.data.bills);
      setShowEmptyState(response.data.bills.length === 0);
    } catch (err: any) {
      console.error('Failed to load bills:', err);
      setError(err.userMessage || 'Failed to load bills');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, sortOptions]);

  // Refresh bills
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadBills();
  }, [loadBills]);

  // Calculate priorities
  const handleCalculatePriorities = useCallback(async () => {
    try {
      setIsCalculating(true);
      setError(null);
      
      const response = await billsService.calculatePriorities({
        recalculateAll: true,
      });
      
      setBills(response.data.updatedBills);
      
      // Show success message
      // You could add a toast notification here
      console.log(`Updated ${response.data.totalProcessed} bill priorities`);
      
    } catch (err: any) {
      console.error('Failed to calculate priorities:', err);
      setError(err.userMessage || 'Failed to calculate priorities');
    } finally {
      setIsCalculating(false);
    }
  }, []);

  // Filter and search bills
  const filteredBills = useMemo(() => {
    let result = [...bills];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(bill => 
        bill.name.toLowerCase().includes(query) ||
        bill.creditorName.toLowerCase().includes(query)
      );
    }

    // Apply priority filter
    if (filters.priorityLevels?.length) {
      result = result.filter(bill => 
        filters.priorityLevels!.includes(bill.priorityLevel)
      );
    }

    // Apply bill type filter
    if (filters.billTypes?.length) {
      result = result.filter(bill => 
        filters.billTypes!.includes(bill.billType)
      );
    }

    // Apply risk categories filter
    if (filters.riskCategories?.length) {
      result = result.filter(bill => {
        const hasShutoffRisk = bill.shutoffRisk && filters.riskCategories!.includes('shutoff');
        const hasRepoRisk = bill.repoRisk && filters.riskCategories!.includes('repo');
        const hasLateFees = bill.lateFeesAccruing && filters.riskCategories!.includes('late_fees');
        return hasShutoffRisk || hasRepoRisk || hasLateFees;
      });
    }

    // Apply amount range filter
    if (filters.amountRange) {
      result = result.filter(bill => 
        bill.amountOverdue >= filters.amountRange!.min && 
        bill.amountOverdue <= filters.amountRange!.max
      );
    }

    return result;
  }, [bills, searchQuery, filters]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    return {
      total: bills.length,
      urgent: bills.filter(b => b.priorityLevel === 'urgent').length,
      high: bills.filter(b => b.priorityLevel === 'high').length,
      totalAmount: bills.reduce((sum, b) => sum + b.amountOverdue, 0),
      selected: selectedBills.length,
    };
  }, [bills, selectedBills]);

  // Bill action handlers
  const handleBillAction = useCallback((action: BillAction, billId: string) => {
    if (onBillAction) {
      onBillAction(action, billId);
    }
  }, [onBillAction]);

  const handlePayNow = useCallback((billId: string) => {
    handleBillAction('pay', billId);
  }, [handleBillAction]);

  const handleSplitPayment = useCallback((billId: string) => {
    handleBillAction('split', billId);
  }, [handleBillAction]);

  const handleNegotiate = useCallback((billId: string) => {
    handleBillAction('negotiate', billId);
  }, [handleBillAction]);

  const handleMarkPaid = useCallback(async (billId: string) => {
    try {
      setError(null);
      await billsService.markBillPaid(billId);
      
      // Update local state
      setBills(prev => prev.map(bill => 
        bill.billId === billId 
          ? { ...bill, status: 'paid' }
          : bill
      ));
      
      // Remove from selection if selected
      setSelectedBills(prev => prev.filter(id => id !== billId));
      
    } catch (err: any) {
      console.error('Failed to mark bill as paid:', err);
      setError(err.userMessage || 'Failed to mark bill as paid');
    }
  }, []);

  // Selection handlers
  const handleSelectBill = useCallback((billId: string) => {
    setSelectedBills(prev => {
      const isSelected = prev.includes(billId);
      return isSelected 
        ? prev.filter(id => id !== billId)
        : [...prev, billId];
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const allVisible = filteredBills.map(b => b.billId);
    const allSelected = allVisible.every(id => selectedBills.includes(id));
    
    if (allSelected) {
      setSelectedBills([]);
    } else {
      setSelectedBills(allVisible);
    }
  }, [filteredBills, selectedBills]);

  const handleBulkMarkPaid = useCallback(async () => {
    if (selectedBills.length === 0) return;
    
    try {
      setError(null);
      await billsService.markBillsPaid(selectedBills);
      
      // Update local state
      setBills(prev => prev.map(bill => 
        selectedBills.includes(bill.billId)
          ? { ...bill, status: 'paid' }
          : bill
      ));
      
      setSelectedBills([]);
      
    } catch (err: any) {
      console.error('Failed to mark bills as paid:', err);
      setError(err.userMessage || 'Failed to mark bills as paid');
    }
  }, [selectedBills]);

  // Filter handlers
  const handlePriorityFilter = useCallback((level: PriorityLevel) => {
    setFilters(prev => ({
      ...prev,
      priorityLevels: prev.priorityLevels?.includes(level)
        ? prev.priorityLevels.filter(l => l !== level)
        : [...(prev.priorityLevels || []), level],
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      priorityLevels: [],
      billTypes: [],
      riskCategories: [],
    });
    setSearchQuery('');
  }, []);

  // Sort handler
  const handleSort = useCallback((field: BillSortOptions['field']) => {
    setSortOptions(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-gentle-pulse" />
          <div className="flex space-x-2">
            <div className="h-9 w-24 bg-gray-200 rounded animate-gentle-pulse" />
            <div className="h-9 w-24 bg-gray-200 rounded animate-gentle-pulse" />
          </div>
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <BillPriorityCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (showEmptyState && !searchQuery && !filters.priorityLevels?.length) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Bills to Prioritize
          </h3>
          <p className="text-gray-600 mb-6">
            Add your bills to see priority recommendations and payment guidance.
          </p>
          <button
            type="button"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-stable-500 text-white rounded-lg hover:bg-stable-600 transition-colors"
            onClick={() => handleBillAction('edit', '')}
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Bill</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Priority Matrix</h2>
          <p className="text-gray-600 mt-1">
            Bills ranked by urgency and impact • {summaryStats.total} total • {formatCurrency(summaryStats.totalAmount)}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Refresh button */}
          <button
            type="button"
            className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors ${
              isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Calculate priorities button */}
          <button
            type="button"
            className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-stable-500 rounded-md hover:bg-stable-600 transition-colors ${
              isCalculating ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={handleCalculatePriorities}
            disabled={isCalculating}
          >
            <BarChart3 className={`w-4 h-4 ${isCalculating ? 'animate-pulse' : ''}`} />
            <span>{isCalculating ? 'Calculating...' : 'Recalculate'}</span>
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-crisis-50 border border-crisis-200 rounded-md p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-crisis-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-crisis-800">{error}</p>
            </div>
            <button
              type="button"
              className="text-crisis-600 hover:text-crisis-800"
              onClick={() => setError(null)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      {showFilters && (
        <div className="space-y-4">
          {/* Search and filter toggle */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search bills..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-stable-500 focus:border-stable-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <button
              type="button"
              className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium border rounded-md transition-colors ${
                showFiltersPanel
                  ? 'bg-stable-50 border-stable-300 text-stable-800'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>

          {/* Priority filter chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Priority:</span>
            {(['urgent', 'high', 'medium', 'low'] as const).map((level) => (
              <PriorityChip
                key={level}
                level={level}
                onClick={() => handlePriorityFilter(level)}
                isActive={filters.priorityLevels?.includes(level)}
              />
            ))}
            
            {(filters.priorityLevels?.length || searchQuery) && (
              <button
                type="button"
                className="text-xs text-gray-500 hover:text-gray-700 underline"
                onClick={handleClearFilters}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {showBulkActions && selectedBills.length > 0 && (
        <div className="bg-stable-50 border border-stable-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-stable-800">
                {selectedBills.length} bill{selectedBills.length !== 1 ? 's' : ''} selected
              </span>
              <button
                type="button"
                className="text-xs text-stable-600 hover:text-stable-800 underline"
                onClick={() => setSelectedBills([])}
              >
                Clear selection
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                type="button"
                className="flex items-center space-x-2 px-3 py-1 text-sm font-medium text-stable-700 bg-white border border-stable-300 rounded hover:bg-stable-50 transition-colors"
                onClick={handleBulkMarkPaid}
              >
                <DollarSign className="w-4 h-4" />
                <span>Mark Paid</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bills Grid */}
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{summaryStats.total}</div>
            <div className="text-sm text-gray-600">Total Bills</div>
          </div>
          
          <div className="bg-crisis-50 border border-crisis-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-crisis-700">{summaryStats.urgent}</div>
            <div className="text-sm text-crisis-600">Urgent</div>
          </div>
          
          <div className="bg-urgent-50 border border-urgent-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-urgent-700">{summaryStats.high}</div>
            <div className="text-sm text-urgent-600">High Priority</div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(summaryStats.totalAmount)}</div>
            <div className="text-sm text-gray-600">Total Amount</div>
          </div>
        </div>

        {/* Bills Cards */}
        {filteredBills.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No bills match your current filters.</p>
            <button
              type="button"
              className="mt-2 text-stable-600 hover:text-stable-800 underline"
              onClick={handleClearFilters}
            >
              Clear filters to see all bills
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBills.map((bill) => (
              <div key={bill.billId} className="relative">
                {/* Selection checkbox */}
                {showBulkActions && (
                  <div className="absolute top-2 left-2 z-10">
                    <button
                      type="button"
                      className="p-1 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50"
                      onClick={() => handleSelectBill(bill.billId)}
                    >
                      {selectedBills.includes(bill.billId) ? (
                        <CheckSquare className="w-4 h-4 text-stable-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                )}
                
                <BillPriorityCard
                  bill={bill}
                  onPayNow={handlePayNow}
                  onSplitPayment={handleSplitPayment}
                  onNegotiate={handleNegotiate}
                  onMarkPaid={handleMarkPaid}
                  showActions={true}
                  className={showBulkActions ? 'pt-6' : ''}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Priority Legend */}
      <div className="max-w-md">
        <PriorityLegend />
      </div>
    </div>
  );
}

export default PriorityMatrix;