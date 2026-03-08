'use client'

/**
 * ExerciseListSkeleton
 *
 * Loading skeleton for the exercise list within a workout.
 *
 * @see docs/features/plans/individual/tasks.md T071
 */

interface ExerciseListSkeletonProps {
  /** Number of exercise cards to show */
  count?: number
}

/**
 * Skeleton for the exercise list during loading.
 */
export function ExerciseListSkeleton({ count = 3 }: ExerciseListSkeletonProps) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-full text-left p-4 rounded-xl bg-muted/30 border border-transparent"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              {/* Set number circle */}
              <div className="shrink-0 w-6 h-6 rounded-full bg-muted" />
              <div className="min-w-0 space-y-2">
                {/* Exercise name */}
                <div className="h-5 w-28 bg-muted rounded" />
                {/* Set details */}
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <div className="h-4 w-14 bg-muted rounded" />
                  <div className="h-4 w-14 bg-muted rounded" />
                  <div className="h-4 w-14 bg-muted rounded" />
                </div>
              </div>
            </div>
            {/* Chevron */}
            <div className="h-4 w-4 bg-muted rounded shrink-0 mt-1" />
          </div>
        </div>
      ))}
    </div>
  )
}
