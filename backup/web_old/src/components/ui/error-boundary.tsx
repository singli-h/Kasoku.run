"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (_error: Error, _errorInfo: ErrorInfo, _resetError: () => void) => ReactNode;
  onError?: (_error: Error, _errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  resetKeys?: string[];
  resetOnPropsChange?: boolean;
}

/**
 * React Error Boundary component for graceful error handling
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console and external service
    console.error("Error Boundary caught an error:", error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call the onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Here you could also log to an external error reporting service
    // e.g., Sentry.captureException(error, { extra: errorInfo });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }

    if (hasError && resetKeys && resetKeys.length > 0) {
      const prevResetKeys = prevProps.resetKeys || [];
      if (resetKeys.some((key, index) => key !== prevResetKeys[index])) {
        this.resetErrorBoundary();
      }
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }, 100);
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails = false } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, errorInfo!, this.resetErrorBoundary);
      }

      // Default error UI
      return (
        <DefaultErrorFallback
          error={error}
          errorInfo={errorInfo}
          resetError={this.resetErrorBoundary}
          showDetails={showDetails}
        />
      );
    }

    return children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
  showDetails?: boolean;
}

/**
 * Default error fallback component
 * Provides a user-friendly error display with options to retry or navigate away
 */
const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  showDetails = false,
}) => {
  const [showErrorDetails, setShowErrorDetails] = React.useState(false);

  const handleRefresh = () => {
    resetError();
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            We encountered an unexpected error. Don&apos;t worry, your data is safe.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={handleRefresh} className="flex-1" variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={handleReload} className="flex-1" variant="outline">
              Reload Page
            </Button>
          </div>

          <Button onClick={handleGoHome} className="w-full" variant="ghost">
            <Home className="mr-2 h-4 w-4" />
            Go to Homepage
          </Button>

          {(showDetails || process.env.NODE_ENV === "development") && (
            <div className="space-y-2">
              <Button
                onClick={() => setShowErrorDetails(!showErrorDetails)}
                variant="ghost"
                size="sm"
                className="text-xs text-gray-500"
              >
                {showErrorDetails ? "Hide" : "Show"} Error Details
              </Button>

              {showErrorDetails && (
                <div className="rounded-md bg-gray-50 p-3 text-xs">
                  <div className="font-medium text-red-600 mb-2">
                    {error.name}: {error.message}
                  </div>
                  {error.stack && (
                    <pre className="whitespace-pre-wrap text-gray-600 text-xs overflow-auto max-h-32">
                      {error.stack}
                    </pre>
                  )}
                  {errorInfo?.componentStack && (
                    <div className="mt-2">
                      <div className="font-medium text-gray-700 mb-1">Component Stack:</div>
                      <pre className="whitespace-pre-wrap text-gray-600 text-xs overflow-auto max-h-32">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return ComponentWithErrorBoundary;
}

/**
 * Hook for manually triggering error boundary (useful for async errors)
 */
export function useErrorBoundary() {
  return React.useCallback((error: Error) => {
    throw error;
  }, []);
}

export default ErrorBoundary; 