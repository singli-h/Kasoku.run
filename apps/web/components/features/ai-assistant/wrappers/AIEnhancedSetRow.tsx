'use client'

/**
 * AIEnhancedSetRow Component
 *
 * Wrapper that adds AI change indicators to any SetRow component.
 * Uses composition pattern - wraps children without modifying them.
 *
 * @see specs/004-feature-pattern-standard/ai-ui-implementation-plan.md
 */

import type { ChangeRequest, UIDisplayType } from '@/lib/changeset/types'
import { useAIChangeForEntity } from '../hooks/useAIChangeForEntity'
import { PendingRowHighlight } from '../indicators/PendingRowHighlight'
import { AIBadge } from '../indicators/AIBadge'
import { cn } from '@/lib/utils'

interface AIEnhancedSetRowProps {
  /** Set ID for change detection */
  setId: number | string
  /** Entity type for change lookup */
  entityType?: 'preset_set' | 'training_set'
  /** Override: manually provide pending change (skips hook) */
  pendingChange?: ChangeRequest | null
  /** Override: manually provide change type */
  changeType?: UIDisplayType
  /** The SetRow component to wrap */
  children: React.ReactNode
  /** Additional wrapper classes */
  className?: string
  /** Show AI badge in corner */
  showBadge?: boolean
}

/**
 * Wraps a SetRow with AI change indicators.
 *
 * Can either:
 * 1. Auto-detect changes via useAIChangeForEntity hook
 * 2. Receive pendingChange prop directly (for manual control)
 *
 * @example Auto-detect mode
 * ```tsx
 * <AIEnhancedSetRow setId={set.id}>
 *   <SetRow set={set} onUpdate={handleUpdate} />
 * </AIEnhancedSetRow>
 * ```
 *
 * @example Manual mode (parent provides change info)
 * ```tsx
 * const { setChanges } = useAISetChanges(exerciseId)
 * const changeInfo = setChanges.get(set.id)
 *
 * <AIEnhancedSetRow
 *   setId={set.id}
 *   pendingChange={changeInfo?.change}
 *   changeType={changeInfo?.changeType}
 * >
 *   <SetRow set={set} />
 * </AIEnhancedSetRow>
 * ```
 */
export function AIEnhancedSetRow({
  setId,
  entityType = 'preset_set',
  pendingChange: pendingChangeProp,
  changeType: changeTypeProp,
  children,
  className,
  showBadge = true,
}: AIEnhancedSetRowProps) {
  // Use hook if no override provided
  const hookResult = useAIChangeForEntity({
    entityType,
    entityId: setId,
  })

  // Use props if provided, otherwise use hook result
  const hasPending = pendingChangeProp !== undefined
    ? !!pendingChangeProp
    : hookResult.hasPendingChange

  const changeType = changeTypeProp ?? hookResult.changeType ?? 'update'

  // No pending change - render children as-is
  if (!hasPending) {
    return <>{children}</>
  }

  // Wrap with highlight and badge
  return (
    <PendingRowHighlight
      isPending={true}
      changeType={changeType}
      className={className}
    >
      <div className="relative">
        {children}

        {/* AI badge in corner */}
        {showBadge && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
            <AIBadge size="xs" tooltip="AI proposed change" />
          </div>
        )}
      </div>
    </PendingRowHighlight>
  )
}

/**
 * Lightweight version that only adds background highlight, no badge.
 */
export function AIHighlightedRow({
  isPending,
  changeType = 'update',
  children,
  className,
}: {
  isPending: boolean
  changeType?: UIDisplayType
  children: React.ReactNode
  className?: string
}) {
  return (
    <PendingRowHighlight
      isPending={isPending}
      changeType={changeType}
      className={className}
    >
      {children}
    </PendingRowHighlight>
  )
}
