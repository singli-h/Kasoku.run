'use client'

/**
 * WorkoutEditorSkeleton
 *
 * Loading skeleton for the SessionPlannerV2 component when it's lazy-loaded.
 *
 * @see docs/features/plans/individual/tasks.md T071
 */

import { Loader2 } from 'lucide-react'

/**
 * Skeleton for the workout editor during lazy load.
 */
export function WorkoutEditorSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-48 bg-muted rounded" />
        <div className="h-8 w-24 bg-muted rounded" />
      </div>

      {/* Exercise cards skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-muted/50 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 bg-muted rounded" />
                <div className="flex gap-2">
                  <div className="h-4 w-16 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading editor...</span>
      </div>
    </div>
  )
}
