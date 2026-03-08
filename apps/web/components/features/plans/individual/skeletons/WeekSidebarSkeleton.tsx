'use client'

/**
 * WeekSidebarSkeleton
 *
 * Loading skeleton for the week sidebar on desktop.
 *
 * @see docs/features/plans/individual/tasks.md T071
 */

interface WeekSidebarSkeletonProps {
  /** Number of weeks to show */
  weekCount?: number
}

/**
 * Skeleton for the week sidebar during loading.
 */
export function WeekSidebarSkeleton({ weekCount = 4 }: WeekSidebarSkeletonProps) {
  return (
    <div className="animate-pulse">
      {/* Block header */}
      <div className="p-4 border-b border-border/40">
        <div className="space-y-2">
          <div className="h-5 w-40 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
        {/* Edit buttons */}
        <div className="mt-3 flex gap-2">
          <div className="flex-1 h-9 bg-muted rounded" />
          <div className="flex-1 h-9 bg-muted rounded" />
        </div>
      </div>

      {/* Week list */}
      <div className="p-2 space-y-1">
        {Array.from({ length: weekCount }).map((_, i) => (
          <div
            key={i}
            className="w-full flex items-start gap-3 p-3 rounded-lg"
          >
            {/* Status indicator */}
            <div className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-muted" />
            {/* Week info */}
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-4 w-16 bg-muted rounded" />
              <div className="h-3 w-28 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
