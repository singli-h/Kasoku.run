'use client'

/**
 * AdvancedFieldsToggle
 *
 * Toggle component for showing/hiding advanced training fields (RPE, tempo, velocity, etc.)
 * Used in both desktop header and mobile settings sheet.
 * Includes a field reference guide when toggled on.
 *
 * Implements T050 from tasks.md (Phase 10: User Story 8)
 *
 * @see docs/features/plans/individual/tasks.md
 */

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { HelpCircle, SlidersHorizontal } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

/** Compact field reference definitions */
const FIELD_GUIDE = [
  { abbr: 'RPE', desc: 'Rate of Perceived Exertion (1-10). How hard a set felt: 6 = moderate, 8 = hard, 10 = max.' },
  { abbr: 'Tempo', desc: 'Lift timing in 4 numbers: down-pause-up-pause. E.g. 3-1-2-0 = 3s down, 1s hold, 2s up.' },
  { abbr: 'Velocity', desc: 'Bar speed in m/s for velocity-based training (VBT).' },
  { abbr: 'Power', desc: 'Output in watts — from force plates, Keiser, or VBT devices.' },
  { abbr: 'Effort', desc: 'Percentage of your personal best for that exercise or distance.' },
  { abbr: 'Resistance', desc: 'Machine-specific load (e.g. Keiser air pressure, band tension).' },
] as const

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
      <div className={cn('space-y-0', className)}>
        <div
          className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/40"
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
        {checked && (
          <div className="px-4 pt-3 pb-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Field reference</p>
            <dl className="space-y-1.5">
              {FIELD_GUIDE.map(({ abbr, desc }) => (
                <div key={abbr} className="flex gap-2 text-xs">
                  <dt className="font-medium text-foreground shrink-0 w-16">{abbr}</dt>
                  <dd className="text-muted-foreground">{desc}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
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
      {checked && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              aria-label="Field reference guide"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="end" className="w-72 p-3">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Field reference</p>
            <dl className="space-y-1.5">
              {FIELD_GUIDE.map(({ abbr, desc }) => (
                <div key={abbr} className="flex gap-2 text-xs">
                  <dt className="font-medium text-foreground shrink-0 w-16">{abbr}</dt>
                  <dd className="text-muted-foreground">{desc}</dd>
                </div>
              ))}
            </dl>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
