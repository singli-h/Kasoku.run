/*
<ai_context>
Standardized skeleton loading components for consistent loading states across all pages.
Provides different skeleton variants for different content types while maintaining
Apple-inspired clean design principles.
</ai_context>
*/

"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface PageSkeletonProps {
  title: string
  showActions?: boolean
  variant?: 'default' | 'dashboard' | 'list' | 'grid' | 'form'
  className?: string
}

interface ContentSkeletonProps {
  variant: 'default' | 'dashboard' | 'list' | 'grid' | 'form'
  className?: string
}

/**
 * Main page skeleton component with consistent header structure
 */
export function PageSkeleton({ 
  title, 
  showActions = false, 
  variant = 'default',
  className 
}: PageSkeletonProps) {
  return (
    <div className={cn("page-container", className)}>
      {/* Consistent page header skeleton */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-text">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          {showActions && (
            <div className="page-header-actions">
              <Skeleton className="h-10 w-32" />
            </div>
          )}
        </div>
      </div>
      
      {/* Content skeleton based on variant */}
      <div className="page-content">
        <ContentSkeleton variant={variant} />
      </div>
    </div>
  )
}

/**
 * Content-specific skeleton variants
 */
function ContentSkeleton({ variant, className }: ContentSkeletonProps) {
  switch (variant) {
    case 'dashboard':
      return <DashboardSkeleton className={className} />
    case 'list':
      return <ListSkeleton className={className} />
    case 'grid':
      return <GridSkeleton className={className} />
    case 'form':
      return <FormSkeleton className={className} />
    default:
      return <DefaultSkeleton className={className} />
  }
}

/**
 * Dashboard-style skeleton with cards and metrics
 */
function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Action cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * List-style skeleton for table/list views
 */
function ListSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* List items */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

/**
 * Grid-style skeleton for card grids
 */
function GridSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-12 w-full" />
                <div className="flex gap-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

/**
 * Form-style skeleton for settings and forms
 */
function FormSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Default skeleton for general content
 */
function DefaultSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <Skeleton className="h-64 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}

/**
 * Specialized skeleton for specific components
 */
export function ComponentSkeleton({ 
  type, 
  className 
}: { 
  type: 'card' | 'table' | 'chart' | 'button' | 'input'
  className?: string 
}) {
  switch (type) {
    case 'card':
      return (
        <Card className={className}>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      )
    case 'table':
      return (
        <div className={cn("space-y-2", className)}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      )
    case 'chart':
      return <Skeleton className={cn("h-64 w-full", className)} />
    case 'button':
      return <Skeleton className={cn("h-10 w-24", className)} />
    case 'input':
      return <Skeleton className={cn("h-10 w-full", className)} />
    default:
      return <Skeleton className={cn("h-20 w-full", className)} />
  }
}
