/*
<ai_context>
Feature-specific error boundary wrapper for consistent error handling across features.
Allows custom error messages and recovery actions per feature.
</ai_context>
*/

"use client"

import { ErrorBoundary, type FallbackProps } from "react-error-boundary"
import { ErrorFallback } from "@/components/layout/error-fallback"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

interface FeatureErrorBoundaryProps {
  children: React.ReactNode
  featureName?: string
  customMessage?: string
  onReset?: () => void
  fallback?: React.ComponentType<FallbackProps>
}

/**
 * Feature-specific error boundary wrapper
 * 
 * Provides consistent error handling for individual features with optional
 * custom messages and recovery actions.
 * 
 * @example
 * ```tsx
 * <FeatureErrorBoundary featureName="Workout" customMessage="Something went wrong with your workout">
 *   <WorkoutComponent />
 * </FeatureErrorBoundary>
 * ```
 */
export function FeatureErrorBoundary({
  children,
  featureName,
  customMessage,
  onReset,
  fallback
}: FeatureErrorBoundaryProps) {
  const defaultFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
    const handleReset = () => {
      if (onReset) {
        onReset()
      }
      resetErrorBoundary()
    }

    const errorMessage = error instanceof Error ? error.message : String(error)

    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-lg">
              {featureName ? `${featureName} Error` : "Something went wrong"}
            </CardTitle>
            <CardDescription>
              {customMessage || "An unexpected error occurred. Please try again or contact support if the problem persists."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {process.env.NODE_ENV === 'development' && (
              <details className="rounded-md bg-muted p-3 text-sm">
                <summary className="cursor-pointer font-medium">Error Details</summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                  {errorMessage}
                </pre>
              </details>
            )}
            <Button
              onClick={handleReset}
              className="w-full"
              variant="default"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleError = (error: Error, errorInfo: { componentStack?: string | null }) => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[FeatureErrorBoundary${featureName ? `:${featureName}` : ''}] Caught error:`, error)
      console.error(`[FeatureErrorBoundary${featureName ? `:${featureName}` : ''}] Error info:`, errorInfo)
    }

    // TODO: Integrate with error tracking service
    // Feature-specific error tracking can be added here
  }

  return (
    <ErrorBoundary
      FallbackComponent={fallback || defaultFallback}
      onError={handleError}
      onReset={() => {
        if (onReset) {
          onReset()
        }
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

export default FeatureErrorBoundary

