"use client";

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development, send to error service in production
    console.error('Error caught by boundary:', error, errorInfo);
    
    // In production, you would send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendErrorToService(error, errorInfo);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} reset={this.reset} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, reset }: { error?: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Terjadi Kesalahan</h2>
        <p className="text-gray-600 mb-6">
          Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi atau hubungi tim support kami.
        </p>
        <button
          onClick={reset}
          className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Coba Lagi
        </button>
        <div className="mt-4 text-sm text-gray-500">
          <p>Jika masalah berlanjut, hubungi:</p>
          <p className="font-medium">+62 812-3456-7890</p>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;
