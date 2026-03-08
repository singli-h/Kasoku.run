'use client'

/**
 * AdvancedFieldsToggle
 *
 * Toggle component for showing/hiding advanced training fields (RPE, tempo, velocity, etc.)
 * Used in both desktop header and mobile settings sheet.
 *
 * Implements T050 from tasks.md (Phase 10: User Story 8)
 *
 * @see docs/features/plans/individual/tasks.md
 */

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { SlidersHorizontal } from 'lucide-react'

interface AdvancedFieldsToggleProps {
  /** Whether advanced fields are currently visible */
  checked: boolean
  /** Callback when toggle state changes */
  onCheckedChange: (checked: boolean) => void
  /** Visual variant - inline for compact, card for mobile sheet */
  variant?: 'inline' | 'card'
  /** Additional className for the container */
  className?: string
  /** Whether the component is still loading (for hydration) */
  isLoading?: boolean
}

/**
 * Toggle for showing/hiding advanced training fields.
 *
 * @example Desktop header (inline variant):
 * ```tsx
 * <AdvancedFieldsToggle
 *   checked={showAdvancedFields}
 *   onCheckedChange={toggleAdvancedFields}
 *   variant="inline"
 * />
 * ```
 *
 * @example Mobile settings sheet (card variant):
 * ```tsx
 * <AdvancedFieldsToggle
 *   checked={showAdvancedFields}
 *   onCheckedChange={toggleAdvancedFields}
 *   variant="card"
 * />
 * ```
 */
export function AdvancedFieldsToggle({
  checked,
  onCheckedChange,
  variant = 'inline',
  className,
  isLoading = false,
}: AdvancedFieldsToggleProps) {
  if (variant === 'card') {
    return (
      <div
        className={cn(
          'flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/40',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
          </div>
          <div>
            <Label
              htmlFor="advanced-fields-toggle-card"
              className="text-sm font-medium cursor-pointer"
            >
              Advanced Fields
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Show RPE, tempo, velocity, and more
            </p>
          </div>
        </div>
        <Switch
          id="advanced-fields-toggle-card"
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={isLoading}
          aria-label="Toggle advanced training fields visibility"
        />
      </div>
    )
  }

  // Inline variant (for desktop header)
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Switch
        id="advanced-fields-toggle-inline"
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={isLoading}
        className="data-[state=checked]:bg-primary"
        aria-label="Toggle advanced training fields visibility"
      />
      <Label
        htmlFor="advanced-fields-toggle-inline"
        className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap"
      >
        Advanced
      </Label>
    </div>
  )
}
