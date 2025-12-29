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
  variant?: 'default' | 'dashboard' | 'list' | 'grid' | 'form' | 'athletes' | 'plans' | 'library'
  className?: string
}

interface ContentSkeletonProps {
  variant: 'default' | 'dashboard' | 'list' | 'grid' | 'form' | 'athletes' | 'plans' | 'library'
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
    case 'library':
      return <LibrarySkeleton className={className} />
    case 'athletes':
      return <AthletesSkeleton className={className} />
    case 'plans':
      return <PlansSkeleton className={className} />
    case 'form':
      return <FormSkeleton className={className} />
    default:
      return <DefaultSkeleton className={className} />
  }
}

/**
 * Dashboard-style skeleton matching the lean dashboard layout
 * Structure: Today's Workout → Inline Stats → Quick Actions → Activity List
 */
function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col divide-y divide-border", className)}>
      {/* Today's Workout Card */}
      <section className="pb-6">
        <div className="p-6 -mx-4 sm:mx-0 sm:rounded-lg border border-border">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="size-12 rounded-full shrink-0" />
          </div>
          <div className="mt-4 flex items-center gap-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-4" />
          </div>
        </div>
      </section>

      {/* Inline Stats Row */}
      <section className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="py-4">
        <div className="space-y-1">
          <Skeleton className="h-3 w-24 mb-3" />
          <div className="space-y-0.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 px-1 -mx-1 rounded-md">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-4" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Activity List Section */}
      <section className="pt-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0 -mx-1 px-1">
                <div className="flex items-center gap-3 min-w-0">
                  <Skeleton className="size-2 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-3 w-16 shrink-0 ml-2" />
              </div>
            ))}
          </div>
        </div>
      </section>
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
 * Grid-style skeleton for card grids (generic)
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
 * Exercise Library skeleton - search/filter card + grid of exercise cards
 */
function LibrarySkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Search and Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            {/* Search */}
            <div className="flex-1 relative min-w-0">
              <Skeleton className="h-10 w-full" />
            </div>
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 shrink-0">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results summary and action */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-32 w-full rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-20" />
                  <div className="flex gap-2 flex-wrap">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
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
 * Athletes page skeleton - coach badge + invite form + roster + groups
 */
function AthletesSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Coach Badge and Invite Form */}
      <div className="flex flex-col md:flex-row md:items-start gap-4 p-6 bg-muted/30 rounded-lg">
        <div className="flex-1">
          <Skeleton className="h-5 w-20 mb-2" />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Skeleton className="h-10 w-full sm:w-64" />
          <Skeleton className="h-10 w-full sm:w-32" />
          <Skeleton className="h-10 w-full sm:w-24" />
        </div>
      </div>

      {/* Roster Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Table Header */}
          <div className="flex items-center gap-4 pb-3 border-b">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12 ml-auto" />
          </div>
          {/* Table Rows */}
          <div className="space-y-2 mt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-8 ml-auto rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Group Directory Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-9 w-28" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Plans page skeleton - action header + filters + macrocycle cards
 */
function PlansSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full sm:w-[180px]" />
        <Skeleton className="h-10 w-full sm:w-[180px]" />
      </div>

      {/* Macrocycle Cards */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-48" />
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Timeline */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-16 w-full rounded" />
              </div>
              {/* Chart */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-48 w-full rounded" />
              </div>
              {/* Stats */}
              <div className="flex items-center gap-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

/**
 * Form-style skeleton for settings page - bento grid layout
 */
function FormSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative max-w-5xl mx-auto pb-32 space-y-12", className)}>
      {/* Section 1: Account & Identity */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <div className="space-y-1">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-10 w-24" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section 2: Profile Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <div className="space-y-1">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Section 3: Role-specific */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <div className="space-y-1">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
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
