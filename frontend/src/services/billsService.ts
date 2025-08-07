// Bills API service with comprehensive error handling and caching

import axios, { AxiosResponse, AxiosError } from 'axios';
import type {
  Bill,
  BillPayload,
  BillsResponse,
  BillActionResponse,
  PriorityCalculationRequest,
  PriorityCalculationResponse,
  BillFilters,
  BillSortOptions
} from '@/types/bills';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const MOCK_API = import.meta.env.VITE_MOCK_API !== 'false';
const API_TIMEOUT = 15000; // 15 seconds for priority calculations

// Create axios instance
const billsApiClient = axios.create({
  baseURL: `${API_BASE_URL}/bills`,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
billsApiClient.interceptors.request.use(
  (config) => {
    // Add user authentication (replace with actual auth)
    config.headers['userId'] = 'demo-user-1';
    
    if (import.meta.env.DEV) {
      console.log(`Bills API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
billsApiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`Bills API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error: AxiosError) => {
    if (import.meta.env.DEV) {
      console.error(`Bills API Error: ${error.response?.status} ${error.config?.url}`, error);
    }
    
    // Transform axios errors into user-friendly messages
    const enhancedError = {
      ...error,
      userMessage: getErrorMessage(error),
      isRetryable: isRetryableError(error),
      statusCode: error.response?.status,
    };
    
    return Promise.reject(enhancedError);
  }
);

// Error handling utilities
function getErrorMessage(error: AxiosError): string {
  if (error.code === 'ECONNABORTED') {
    return 'Request timed out. Priority calculations may take a moment.';
  }
  
  if (!error.response) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  
  switch (error.response.status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Authentication required. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please wait a moment before trying again.';
    case 500:
      return 'Server error. Our team has been notified.';
    case 503:
      return 'Service temporarily unavailable. Please try again in a few moments.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

function isRetryableError(error: AxiosError): boolean {
  if (error.code === 'ECONNABORTED') return true;
  if (!error.response) return true;
  
  const status = error.response.status;
  return status >= 500 || status === 429;
}

// Retry logic for failed requests
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      if (attempt === maxRetries || !error.isRetryable) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      if (import.meta.env.DEV) {
        console.log(`Bills API retry attempt ${attempt + 1} after ${delay}ms`);
      }
    }
  }
  
  throw lastError!;
}

// Mock data for development
const mockBills: Bill[] = [
  {
    billId: 'bill-001',
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
    updatedAt: '2025-08-06T17:00:00Z',
  },
  {
    billId: 'bill-002',
    name: 'Car Payment',
    creditorName: 'Auto Finance Corp',
    amountOverdue: 289,
    totalAmount: 289,
    originalDueDate: '2025-07-28',
    daysPastDue: 9,
    billType: 'vehicle',
    shutoffRisk: false,
    repoRisk: true,
    lateFeesAccruing: true,
    lateFeeAmount: 35,
    priorityScore: 88,
    priorityLevel: 'urgent',
    priorityReason: 'Vehicle repossession risk - transportation needed for work',
    status: 'active',
    createdAt: '2025-07-15T09:00:00Z',
    updatedAt: '2025-08-06T16:30:00Z',
  },
  {
    billId: 'bill-003',
    name: 'Rent',
    creditorName: 'Sunset Apartments',
    amountOverdue: 800,
    totalAmount: 800,
    originalDueDate: '2025-08-01',
    daysPastDue: 5,
    billType: 'housing',
    shutoffRisk: false,
    repoRisk: false,
    lateFeesAccruing: true,
    lateFeeAmount: 50,
    priorityScore: 92,
    priorityLevel: 'urgent',
    priorityReason: 'Housing payment critical - eviction proceedings possible',
    status: 'active',
    createdAt: '2025-07-25T12:00:00Z',
    updatedAt: '2025-08-06T15:45:00Z',
  },
  {
    billId: 'bill-004',
    name: 'Credit Card',
    creditorName: 'First National Bank',
    amountOverdue: 150,
    totalAmount: 2400,
    originalDueDate: '2025-07-20',
    daysPastDue: 17,
    billType: 'credit',
    shutoffRisk: false,
    repoRisk: false,
    lateFeesAccruing: true,
    lateFeeAmount: 29,
    priorityScore: 65,
    priorityLevel: 'high',
    priorityReason: 'Credit impact significant but not essential service',
    status: 'active',
    createdAt: '2025-07-10T14:00:00Z',
    updatedAt: '2025-08-06T14:20:00Z',
  }
];

// Bills Service Class
export class BillsService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  // Cache utilities
  private setCacheItem(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }
  
  private getCacheItem<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }
  
  private clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
  
  // Fetch all bills with optional filtering and sorting
  async fetchBills(filters?: BillFilters, sortOptions?: BillSortOptions): Promise<BillsResponse> {
    const cacheKey = `bills_${JSON.stringify(filters)}_${JSON.stringify(sortOptions)}`;
    
    // Check cache first
    const cachedData = this.getCacheItem<BillsResponse>(cacheKey);
    if (cachedData) {
      if (import.meta.env.DEV) {
        console.log('Bills data served from cache');
      }
      return cachedData;
    }
    
    if (MOCK_API) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      let filteredBills = [...mockBills];
      
      // Apply filters
      if (filters) {
        if (filters.priorityLevels?.length) {
          filteredBills = filteredBills.filter(bill => 
            filters.priorityLevels!.includes(bill.priorityLevel)
          );
        }
        
        if (filters.billTypes?.length) {
          filteredBills = filteredBills.filter(bill => 
            filters.billTypes!.includes(bill.billType)
          );
        }
        
        if (filters.riskCategories?.length) {
          filteredBills = filteredBills.filter(bill => {
            const hasShutoffRisk = bill.shutoffRisk && filters.riskCategories!.includes('shutoff');
            const hasRepoRisk = bill.repoRisk && filters.riskCategories!.includes('repo');
            const hasLateFees = bill.lateFeesAccruing && filters.riskCategories!.includes('late_fees');
            return hasShutoffRisk || hasRepoRisk || hasLateFees;
          });
        }
        
        if (filters.amountRange) {
          filteredBills = filteredBills.filter(bill => 
            bill.amountOverdue >= filters.amountRange!.min && 
            bill.amountOverdue <= filters.amountRange!.max
          );
        }
      }
      
      // Apply sorting
      if (sortOptions) {
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
      }
      
      const response: BillsResponse = {
        success: true,
        data: {
          bills: filteredBills,
          totalCount: filteredBills.length,
          lastUpdated: new Date().toISOString(),
        }
      };
      
      // Cache the response
      this.setCacheItem(cacheKey, response);
      
      return response;
    }
    
    // Real API call with retry logic
    return withRetry(async () => {
      const params = new URLSearchParams();
      
      if (filters) {
        if (filters.priorityLevels?.length) {
          params.append('priority_levels', filters.priorityLevels.join(','));
        }
        if (filters.billTypes?.length) {
          params.append('bill_types', filters.billTypes.join(','));
        }
        if (filters.riskCategories?.length) {
          params.append('risk_categories', filters.riskCategories.join(','));
        }
        if (filters.amountRange) {
          params.append('amount_min', filters.amountRange.min.toString());
          params.append('amount_max', filters.amountRange.max.toString());
        }
      }
      
      if (sortOptions) {
        params.append('sort_field', sortOptions.field);
        params.append('sort_direction', sortOptions.direction);
      }
      
      const response: AxiosResponse<BillsResponse> = await billsApiClient.get('/', {
        params: Object.fromEntries(params),
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch bills');
      }
      
      // Cache successful response
      this.setCacheItem(cacheKey, response.data);
      
      return response.data;
    });
  }
  
  // Calculate or recalculate bill priorities
  async calculatePriorities(request: PriorityCalculationRequest = {}): Promise<PriorityCalculationResponse> {
    if (MOCK_API) {
      // Simulate longer calculation time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate some priority changes
      const updatedBills = mockBills.map(bill => ({
        ...bill,
        priorityScore: bill.priorityScore + Math.floor(Math.random() * 10 - 5),
        updatedAt: new Date().toISOString(),
      }));
      
      const response: PriorityCalculationResponse = {
        success: true,
        data: {
          updatedBills,
          calculationTimestamp: new Date().toISOString(),
          totalProcessed: updatedBills.length,
        }
      };
      
      // Clear cache to force fresh data
      this.clearCache('bills_');
      
      return response;
    }
    
    return withRetry(async () => {
      const response: AxiosResponse<PriorityCalculationResponse> = await billsApiClient.post('/calculate-priorities', request);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to calculate priorities');
      }
      
      // Clear bills cache to force fresh data
      this.clearCache('bills_');
      
      return response.data;
    }, 2, 2000); // Longer delays for calculation endpoint
  }
  
  // Get a single bill by ID
  async getBill(billId: string): Promise<Bill> {
    const cacheKey = `bill_${billId}`;
    const cachedBill = this.getCacheItem<Bill>(cacheKey);
    
    if (cachedBill) {
      return cachedBill;
    }
    
    if (MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const bill = mockBills.find(b => b.billId === billId);
      if (!bill) {
        throw new Error('Bill not found');
      }
      
      this.setCacheItem(cacheKey, bill);
      return bill;
    }
    
    return withRetry(async () => {
      const response: AxiosResponse<BillActionResponse> = await billsApiClient.get(`/${billId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch bill');
      }
      
      this.setCacheItem(cacheKey, response.data.data.bill);
      return response.data.data.bill;
    });
  }
  
  // Create a new bill
  async createBill(billData: BillPayload): Promise<Bill> {
    if (MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const newBill: Bill = {
        billId: `bill-${Date.now()}`,
        ...billData,
        shutoffRisk: billData.shutoffRisk || false,
        repoRisk: billData.repoRisk || false,
        lateFeesAccruing: billData.lateFeesAccruing || false,
        daysPastDue: Math.floor((Date.now() - new Date(billData.originalDueDate).getTime()) / (1000 * 60 * 60 * 24)),
        priorityScore: Math.floor(Math.random() * 40) + 50,
        priorityLevel: 'medium',
        priorityReason: 'Initial priority assessment - will be refined with more data',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      this.clearCache('bills_');
      return newBill;
    }
    
    return withRetry(async () => {
      const response: AxiosResponse<BillActionResponse> = await billsApiClient.post('/', billData);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create bill');
      }
      
      this.clearCache('bills_');
      return response.data.data.bill;
    });
  }
  
  // Update an existing bill
  async updateBill(billId: string, updates: Partial<BillPayload>): Promise<Bill> {
    if (MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const existingBill = mockBills.find(b => b.billId === billId);
      if (!existingBill) {
        throw new Error('Bill not found');
      }
      
      const updatedBill: Bill = {
        ...existingBill,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      this.clearCache();
      return updatedBill;
    }
    
    return withRetry(async () => {
      const response: AxiosResponse<BillActionResponse> = await billsApiClient.put(`/${billId}`, updates);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update bill');
      }
      
      this.clearCache();
      return response.data.data.bill;
    });
  }
  
  // Mark a bill as paid
  async markBillPaid(billId: string): Promise<Bill> {
    if (MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const existingBill = mockBills.find(b => b.billId === billId);
      if (!existingBill) {
        throw new Error('Bill not found');
      }
      
      const paidBill: Bill = {
        ...existingBill,
        status: 'paid',
        updatedAt: new Date().toISOString(),
      };
      
      this.clearCache();
      return paidBill;
    }
    
    return withRetry(async () => {
      const response: AxiosResponse<BillActionResponse> = await billsApiClient.post(`/${billId}/mark-paid`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to mark bill as paid');
      }
      
      this.clearCache();
      return response.data.data.bill;
    });
  }
  
  // Mark multiple bills as paid
  async markBillsPaid(billIds: string[]): Promise<Bill[]> {
    if (MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const paidBills = mockBills
        .filter(b => billIds.includes(b.billId))
        .map(bill => ({
          ...bill,
          status: 'paid' as const,
          updatedAt: new Date().toISOString(),
        }));
      
      this.clearCache();
      return paidBills;
    }
    
    return withRetry(async () => {
      const response: AxiosResponse<{ success: boolean; data: { bills: Bill[] }; error?: string }> = 
        await billsApiClient.post('/mark-paid-bulk', { billIds });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to mark bills as paid');
      }
      
      this.clearCache();
      return response.data.data.bills;
    });
  }
  
  // Delete a bill
  async deleteBill(billId: string): Promise<void> {
    if (MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 300));
      this.clearCache();
      return;
    }
    
    return withRetry(async () => {
      const response: AxiosResponse<{ success: boolean; error?: string }> = 
        await billsApiClient.delete(`/${billId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete bill');
      }
      
      this.clearCache();
    });
  }
  
  // Get cache statistics (for debugging)
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
  
  // Clear all cache
  clearAllCache(): void {
    this.clearCache();
  }
}

// Create and export service instance
export const billsService = new BillsService();

// Export utility functions
export { getErrorMessage, isRetryableError, withRetry };