"use client"

import React, { Component, ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Error Boundary component for Plan pages
 * Catches rendering errors and displays user-friendly error message
 */
export class PlanErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('[PlanErrorBoundary] Caught error:', error)
    console.error('[PlanErrorBoundary] Error info:', errorInfo)

    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })

    // Reload the page to reset state
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                We encountered an error while displaying this training plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="rounded-lg bg-muted p-4 font-mono text-xs overflow-auto max-h-48">
                  <div className="font-semibold text-destructive mb-2">Error Details:</div>
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </div>
                  {this.state.errorInfo && (
                    <div className="mt-2 text-muted-foreground whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  This might be a temporary issue. Try refreshing the page or contact support if the problem persists.
                </p>

                <div className="flex gap-2">
                  <Button onClick={this.handleReset} className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Reload Page
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.history.back()}
                  >
                    Go Back
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
