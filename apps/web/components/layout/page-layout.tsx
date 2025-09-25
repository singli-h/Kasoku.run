/*
<ai_context>
Unified page layout component that eliminates header redundancy and provides consistent
loading states, error handling, and responsive design across all protected pages.
Follows Apple-inspired design principles with clean, minimalist layout.
</ai_context>
*/

"use client"

import { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { PageSkeleton as UnifiedPageSkeleton } from "./page-skeleton"

interface PageLayoutProps {
  title: string
  description?: string
  children: ReactNode
  headerActions?: ReactNode
  loading?: boolean
  error?: string
  onRetry?: () => void
  className?: string
}

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

interface PageContentProps {
  children: ReactNode
  className?: string
}

interface PageErrorProps {
  title: string
  error: string
  onRetry?: () => void
}

/**
 * Unified page header component with consistent styling
 */
function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header-content">
        <div className="page-header-text">
          <h1 className="page-title">{title}</h1>
          {description && (
            <p className="page-description">{description}</p>
          )}
        </div>
        {actions && (
          <div className="page-header-actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Page content wrapper with consistent spacing
 */
function PageContent({ children, className }: PageContentProps) {
  return (
    <div className={cn("page-content", className)}>
      {children}
    </div>
  )
}

/**
 * Consistent error state with retry functionality
 */
function PageError({ title, error, onRetry }: PageErrorProps) {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-text">
            <h1 className="page-title">{title}</h1>
            <p className="page-description">Something went wrong</p>
          </div>
        </div>
      </div>
      <div className="page-content">
        <div className="page-error-content">
          <Card className="border-destructive/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h3 className="font-semibold text-destructive">Error Loading Content</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <div className="flex gap-2">
                {onRetry && (
                  <Button 
                    onClick={onRetry}
                    variant="default"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                )}
                <Button 
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  <Home className="h-4 w-4" />
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

/**
 * Main page layout component that handles all states consistently
 */
export function PageLayout({ 
  title, 
  description, 
  children, 
  headerActions, 
  loading = false, 
  error, 
  onRetry,
  className 
}: PageLayoutProps) {
  // Loading state
  if (loading) {
    return (
      <UnifiedPageSkeleton
        title={title}
        showActions={!!headerActions}
        className={className}
      />
    )
  }

  // Error state
  if (error) {
    return <PageError title={title} error={error} onRetry={onRetry} />
  }

  // Normal state
  return (
    <div className={cn("page-container", className)}>
      <PageHeader 
        title={title} 
        description={description} 
        actions={headerActions} 
      />
      <PageContent>{children}</PageContent>
    </div>
  )
}

// Export individual components for advanced usage
const PageSkeleton = UnifiedPageSkeleton

export { PageHeader, PageContent, PageSkeleton, PageError }
