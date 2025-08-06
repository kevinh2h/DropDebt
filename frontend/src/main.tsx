import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { register as registerServiceWorker } from './utils/serviceWorker'

// Error boundary for production
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard error:', error, errorInfo)
    // In production, send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-card p-6 text-center">
            <div className="text-crisis-500 text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              We're having trouble loading your dashboard. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-stable-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-stable-600 transition-colors touch-target"
            >
              Refresh Dashboard
            </button>
            <p className="text-sm text-gray-500 mt-4">
              If the problem continues, you can still access emergency resources by calling 2-1-1
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

// Register service worker for offline capability
if (import.meta.env.PROD) {
  registerServiceWorker({
    onSuccess: () => {
      console.log('Dashboard available offline');
    },
    onUpdate: (registration) => {
      console.log('New dashboard version available');
      // Could show update notification to user
    },
    onOffline: () => {
      console.log('Dashboard running offline');
    },
    onOnline: () => {
      console.log('Dashboard back online');
    }
  });
}