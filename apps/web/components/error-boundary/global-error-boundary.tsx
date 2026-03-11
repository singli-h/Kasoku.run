/*
<ai_context>
Global error boundary component using react-error-boundary library.
Provides app-wide error catching with consistent UI and error logging.
</ai_context>
*/

"use client"

import { ErrorBoundary } from "react-error-boundary"
import { ErrorFallback } from "@/components/layout/error-fallback"

interface GlobalErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: unknown; resetErrorBoundary: () => void }>
  onError?: (error: unknown, errorInfo: { componentStack?: string | null }) => void
}

/**
 * Global error boundary component for app-wide error catching
 * 
 * Uses react-error-boundary library for consistent error handling.
 * Provides error logging and recovery functionality.
 * 
 * @example
 * ```tsx
 * <GlobalErrorBoundary>
 *   <App />
 * </GlobalErrorBoundary>
 * ```
 */
export function GlobalErrorBoundary({
  children,
  fallback = ErrorFallback,
  onError
}: GlobalErrorBoundaryProps) {
  const handleError = (error: unknown, errorInfo: { componentStack?: string | null }) => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[GlobalErrorBoundary] Caught error:', error)
      console.error('[GlobalErrorBoundary] Error info:', errorInfo)
    }

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo)
    }

    // TODO: Integrate with error tracking service (e.g. Sentry)
  }

  return (
    <ErrorBoundary
      FallbackComponent={fallback}
      onError={handleError}
      onReset={() => {
        // Reset app state if needed
        // Could clear caches, reset forms, etc.
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

export default GlobalErrorBoundary

