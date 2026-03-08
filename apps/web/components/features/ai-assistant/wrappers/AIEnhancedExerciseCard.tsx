'use client'

/**
 * AIEnhancedExerciseCard Component
 *
 * Wrapper that adds AI change indicators to exercise cards.
 * Handles exercise-level changes (swap, add, remove) and set-level badges.
 *
 * @see specs/004-feature-pattern-standard/ai-ui-implementation-plan.md
 */

import type { UIDisplayType } from '@/lib/changeset/types'
import { useAIExerciseChange, useAISetChanges } from '../hooks/useAISetChanges'
import {
  NewItemHighlight,
  RemovedItemHighlight,
  SwapItemHighlight,
  PendingRowHighlight,
} from '../indicators/PendingRowHighlight'
import { ChangeTypeBadge } from '../indicators/ChangeTypeBadge'
import { AIBadgeWithCount } from '../indicators/AIBadge'
import { cn } from '@/lib/utils'

interface AIEnhancedExerciseCardProps {
  /** Exercise ID for change detection */
  exerciseId: number | string
  /** Entity type for exercise lookup */
  exerciseEntityType?: 'session_plan_exercise' | 'workout_log_exercise'
  /** Entity type for set lookup */
  setEntityType?: 'session_plan_set' | 'workout_log_set'
  /** The ExerciseCard component to wrap */
  children: React.ReactNode
  /** Additional wrapper classes */
  className?: string
  /** Render function for header badge area */
  renderBadge?: (props: {
    changeType: UIDisplayType | null
    pendingSetCount: number
  }) => React.ReactNode
}

/**
 * Wraps an ExerciseCard with AI change indicators.
 *
 * Automatically detects:
 * - Exercise-level changes (swap, add, remove)
 * - Set-level pending changes (shows count badge)
 *
 * @example
 * ```tsx
 * <AIEnhancedExerciseCard exerciseId={exercise.id}>
 *   <ExerciseCard exercise={exercise}>
 *     {sets.map(set => (
 *       <AIEnhancedSetRow setId={set.id}>
 *         <SetRow set={set} />
 *       </AIEnhancedSetRow>
 *     ))}
 *   </ExerciseCard>
 * </AIEnhancedExerciseCard>
 * ```
 */
export function AIEnhancedExerciseCard({
  exerciseId,
  exerciseEntityType = 'session_plan_exercise',
  setEntityType = 'session_plan_set',
  children,
  className,
  renderBadge,
}: AIEnhancedExerciseCardProps) {
  // Get exercise-level change
  const { hasChange: hasExerciseChange, changeType: exerciseChangeType } =
    useAIExerciseChange(exerciseId, exerciseEntityType)

  // Get set-level changes for this exercise
  const { pendingCount: pendingSetCount } = useAISetChanges(exerciseId, setEntityType)

  // No changes at all
  if (!hasExerciseChange && pendingSetCount === 0) {
    return <>{children}</>
  }

  // Determine wrapper based on exercise change type
  const Wrapper = getExerciseWrapper(exerciseChangeType)

  return (
    <div className={cn('relative', className)}>
      {/* Badge area - can be customized via renderBadge */}
      {renderBadge ? (
        renderBadge({ changeType: exerciseChangeType, pendingSetCount })
      ) : (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
          {exerciseChangeType && (
            <ChangeTypeBadge type={exerciseChangeType} size="sm" />
          )}
          {pendingSetCount > 0 && !exerciseChangeType && (
            <AIBadgeWithCount count={pendingSetCount} />
          )}
        </div>
      )}

      {/* Wrapped content */}
      <Wrapper>{children}</Wrapper>
    </div>
  )
}

/**
 * Get the appropriate wrapper component for an exercise change type.
 */
function getExerciseWrapper(
  changeType: UIDisplayType | null
): React.FC<{ children: React.ReactNode }> {
  switch (changeType) {
    case 'add':
      return NewItemHighlight
    case 'remove':
      return RemovedItemHighlight
    case 'swap':
      return SwapItemHighlight
    case 'update':
      return ({ children }) => (
        <PendingRowHighlight isPending={true} changeType="update">
          {children}
        </PendingRowHighlight>
      )
    default:
      return ({ children }) => <>{children}</>
  }
}

/**
 * Header component for exercise cards with pending changes.
 * Shows the swap arrow or change type badge.
 */
interface AIExerciseHeaderProps {
  /** Original exercise name (for swap) */
  originalName?: string
  /** New exercise name (for swap) */
  newName?: string
  /** Change type */
  changeType: UIDisplayType
  /** AI reasoning */
  reasoning?: string
  /** Children (exercise title area) */
  children?: React.ReactNode
}

export function AIExerciseHeader({
  originalName,
  newName,
  changeType,
  reasoning,
  children,
}: AIExerciseHeaderProps) {
  if (changeType === 'swap' && originalName && newName) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <ChangeTypeBadge type="swap" size="md" iconOnly />
          <span className="text-gray-500 line-through">{originalName}</span>
          <span className="text-gray-400">→</span>
          <span className="font-medium text-blue-700">{newName}</span>
        </div>
        {reasoning && (
          <p className="text-xs text-gray-500 italic">&quot;{reasoning}&quot;</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <ChangeTypeBadge type={changeType} size="md" />
      {children}
      {reasoning && (
        <p className="text-xs text-gray-500 italic ml-2">&quot;{reasoning}&quot;</p>
      )}
    </div>
  )
}
