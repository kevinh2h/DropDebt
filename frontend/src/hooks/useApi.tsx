import React, { createContext, useContext, ReactNode } from 'react';
import axios from 'axios';
import type { 
  DashboardResponse, 
  NextActionResponse, 
  ProgressResponse, 
  AlertsResponse,
  DashboardData,
  NextAction,
  ProgressMilestone,
  CrisisAlert
} from '@/types/dashboard';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const MOCK_API = import.meta.env.VITE_MOCK_API === 'true';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout - users may have slow connections
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth and logging
apiClient.interceptors.request.use(
  (config) => {
    // Add user ID header (in production, this would come from authentication)
    config.headers['userId'] = 'demo-user-1';
    
    if (import.meta.env.DEV) {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error(`API Error: ${error.response?.status} ${error.config?.url}`, error);
    }
    
    // Transform axios errors into user-friendly messages
    if (error.code === 'ECONNABORTED') {
      error.userMessage = 'Request timed out. Please check your connection and try again.';
    } else if (!error.response) {
      error.userMessage = 'Unable to connect. Please check your internet connection.';
    } else if (error.response.status >= 500) {
      error.userMessage = 'Server error. Please try again in a few moments.';
    } else if (error.response.status === 401) {
      error.userMessage = 'Authentication required. Please log in again.';
    } else {
      error.userMessage = 'Something went wrong. Please try again.';
    }
    
    return Promise.reject(error);
  }
);

// Mock data for development and testing
const mockDashboardData: DashboardData = {
  userId: 'demo-user-1',
  lastUpdated: new Date().toISOString(),
  financialStatus: 'CAUTION',
  statusExplanation: 'Tight budget requires careful management. Focus on critical bills only.',
  nextAction: {
    action: 'Pay Electric Bill',
    amount: 183,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    daysUntil: 5,
    consequence: 'Power shutoff',
    priority: 'HIGH'
  },
  progressMilestone: {
    description: '3 of 7 bills current',
    currentCount: 3,
    totalCount: 7,
    nextMilestone: 'All utilities current after next payment',
    timelineToStability: 'All bills current in 8 weeks',
    category: 'SURVIVAL_SECURED'
  },
  availableMoney: {
    totalIncome: 2800,
    essentialNeeds: 2100,
    availableForBills: 700,
    nextPaycheckDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    nextPaycheckAmount: 700
  },
  crisisAlerts: [],
  upcomingDeadlines: [
    {
      billName: 'Electric Bill',
      amount: 183,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntil: 5,
      consequence: 'Power shutoff',
      paymentPossible: true
    },
    {
      billName: 'Car Payment',
      amount: 289,
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntil: 12,
      consequence: 'Vehicle repossession',
      paymentPossible: true
    }
  ]
};

const mockCrisisData: DashboardData = {
  ...mockDashboardData,
  financialStatus: 'CRISIS',
  statusExplanation: 'Essential needs exceed income. Emergency assistance needed immediately.',
  nextAction: {
    action: 'Call 2-1-1',
    amount: 0,
    deadline: new Date().toISOString(),
    daysUntil: 0,
    consequence: 'Get emergency assistance',
    priority: 'IMMEDIATE'
  },
  availableMoney: {
    ...mockDashboardData.availableMoney,
    totalIncome: 1800,
    essentialNeeds: 2100,
    availableForBills: -300
  },
  crisisAlerts: [{
    alertType: 'BUDGET_CRISIS',
    severity: 'EMERGENCY',
    description: 'Essential needs exceed income by $300/month',
    immediateAction: 'Call 2-1-1 for emergency assistance today',
    emergencyResources: [
      {
        name: '2-1-1',
        description: 'Free, confidential 24/7 helpline for emergency assistance',
        contactMethod: 'Dial 2-1-1',
        resourceType: 'HOTLINE',
        urgency: 'IMMEDIATE'
      },
      {
        name: 'Local Food Bank',
        description: 'Free food assistance to reduce grocery costs',
        contactMethod: 'Search "food bank near me" or call 2-1-1',
        resourceType: 'LOCAL_OFFICE',
        urgency: 'TODAY'
      }
    ]
  }]
};

// API service interface
interface ApiService {
  getDashboard: () => Promise<DashboardData>;
  getNextAction: () => Promise<NextAction>;
  getProgress: () => Promise<ProgressMilestone>;
  getAlerts: () => Promise<CrisisAlert[]>;
  refreshDashboard: () => Promise<DashboardData>;
}

// API service implementation
class DashboardApiService implements ApiService {
  async getDashboard(): Promise<DashboardData> {
    if (MOCK_API) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Return crisis data 30% of the time for testing
      return Math.random() < 0.3 ? mockCrisisData : mockDashboardData;
    }
    
    const response = await apiClient.get<DashboardResponse>('/dashboard');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to load dashboard');
    }
    return response.data.data;
  }

  async getNextAction(): Promise<NextAction> {
    if (MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 400));
      return mockDashboardData.nextAction;
    }
    
    const response = await apiClient.get<NextActionResponse>('/dashboard/next-action');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to load next action');
    }
    return response.data.data.nextAction;
  }

  async getProgress(): Promise<ProgressMilestone> {
    if (MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockDashboardData.progressMilestone;
    }
    
    const response = await apiClient.get<ProgressResponse>('/dashboard/progress');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to load progress');
    }
    return response.data.data.progress;
  }

  async getAlerts(): Promise<CrisisAlert[]> {
    if (MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return mockCrisisData.crisisAlerts;
    }
    
    const response = await apiClient.get<AlertsResponse>('/dashboard/alerts');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to load alerts');
    }
    return response.data.data.alerts;
  }

  async refreshDashboard(): Promise<DashboardData> {
    // Force refresh by adding timestamp to prevent caching
    const timestamp = Date.now();
    
    if (MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ...mockDashboardData, lastUpdated: new Date().toISOString() };
    }
    
    const response = await apiClient.get<DashboardResponse>(`/dashboard?refresh=${timestamp}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to refresh dashboard');
    }
    return response.data.data;
  }
}

// Create API service instance
const apiService = new DashboardApiService();

// API Context
const ApiContext = createContext<ApiService>(apiService);

// API Provider component
interface ApiProviderProps {
  children: ReactNode;
}

export function ApiProvider({ children }: ApiProviderProps) {
  return (
    <ApiContext.Provider value={apiService}>
      {children}
    </ApiContext.Provider>
  );
}

// Hook to use API service
export function useApi(): ApiService {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}

// Utility hook for handling API errors
export function useApiError() {
  const formatError = (error: any): string => {
    return error.userMessage || error.message || 'An unexpected error occurred';
  };

  const isNetworkError = (error: any): boolean => {
    return !error.response || error.code === 'ECONNABORTED';
  };

  const canRetry = (error: any): boolean => {
    return isNetworkError(error) || (error.response?.status >= 500);
  };

  return {
    formatError,
    isNetworkError,
    canRetry
  };
}