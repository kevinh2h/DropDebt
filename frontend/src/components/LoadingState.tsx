import React from 'react';
import { Loader2, Wifi, Shield } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  type?: 'dashboard' | 'component' | 'inline';
  showSecurityNote?: boolean;
}

export function LoadingState({ 
  message = "Loading your financial information...", 
  type = 'dashboard',
  showSecurityNote = true 
}: LoadingStateProps) {
  
  // Skeleton component for content placeholders
  const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`bg-gray-200 animate-gentle-pulse rounded ${className}`} />
  );

  // Render inline loading (for small components)
  if (type === 'inline') {
    return (
      <div className="flex items-center space-x-2 text-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">{message}</span>
      </div>
    );
  }

  // Render component-level loading
  if (type === 'component') {
    return (
      <div className="bg-white rounded-lg p-6 shadow-card">
        <div className="space-y-4">
          {/* Header skeleton */}
          <div className="flex items-center space-x-3">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          
          {/* Content skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          
          {/* Button skeleton */}
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>
    );
  }

  // Render full dashboard loading
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="safe-top">
        {/* Header skeleton */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </div>

        {/* Main content skeleton */}
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-6">
            {/* Status header skeleton */}
            <div className="bg-white rounded-lg p-6 shadow-card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                ))}
              </div>
            </div>

            {/* Next action skeleton */}
            <div className="bg-white rounded-lg p-6 shadow-card">
              <div className="bg-gray-50 px-6 py-3 -mx-6 -mt-6 mb-6">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <div className="bg-gray-50 rounded-lg p-4">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            </div>

            {/* Two-column layout skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Progress skeleton */}
              <div className="bg-white rounded-lg p-6 shadow-card">
                <div className="flex items-center space-x-3 mb-6">
                  <Skeleton className="w-6 h-6 rounded-full" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="space-y-4">
                  <div className="text-center">
                    <Skeleton className="h-8 w-32 mx-auto mb-2" />
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Skeleton className="h-6 w-8 mx-auto mb-1" />
                      <Skeleton className="h-3 w-12 mx-auto" />
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Skeleton className="h-6 w-8 mx-auto mb-1" />
                      <Skeleton className="h-3 w-12 mx-auto" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Deadlines skeleton */}
              <div className="bg-white rounded-lg p-6 shadow-card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-12 mb-1" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3 flex-1">
                          <Skeleton className="w-5 h-5 mt-0.5" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Loading status */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-white border border-gray-200 rounded-full px-6 py-3 shadow-lg flex items-center space-x-3">
            <Loader2 className="w-4 h-4 animate-spin text-stable-600" />
            <span className="text-sm font-medium text-gray-700">{message}</span>
          </div>
        </div>

        {/* Security and loading information */}
        {showSecurityNote && (
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-10 max-w-md mx-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-card text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Shield className="w-4 h-4 text-stable-600" />
                <span className="text-sm font-medium text-gray-700">Secure Connection</span>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Your financial data is encrypted and protected. We never store sensitive information.
              </p>
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                <Wifi className="w-3 h-3" />
                <span>Connected securely</span>
              </div>
            </div>
          </div>
        )}

        {/* Accessibility loading announcement */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {message} Please wait while we securely load your information.
        </div>
      </div>
    </div>
  );
}

// Export specific loading components for reuse
export const ComponentLoadingState = (props: Omit<LoadingStateProps, 'type'>) => 
  <LoadingState {...props} type="component" />;

export const InlineLoadingState = (props: Omit<LoadingStateProps, 'type'>) => 
  <LoadingState {...props} type="inline" />;

// Skeleton component for custom use
export const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`bg-gray-200 animate-gentle-pulse rounded ${className}`} />
);