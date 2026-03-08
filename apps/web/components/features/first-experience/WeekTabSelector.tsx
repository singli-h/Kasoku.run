'use client'

/**
 * WeekTabSelector
 *
 * Horizontal week tabs for navigating between weeks in the plan.
 * Inspired by the coach mobile view week navigation pattern.
 */

import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { ProposedWeek } from './types'

interface WeekTabSelectorProps {
  /** List of weeks to display */
  weeks: ProposedWeek[]
  /** Currently selected week ID */
  selectedWeekId: string
  /** Called when user selects a week */
  onSelectWeek: (weekId: string) => void
  /** Additional className */
  className?: string
}

export function WeekTabSelector({
  weeks,
  selectedWeekId,
  onSelectWeek,
  className,
}: WeekTabSelectorProps) {
  return (
    <div className={cn('border rounded-lg bg-card', className)}>
      <ScrollArea className="w-full">
        <div className="flex p-2 gap-2">
          {weeks.map((week) => {
            const isSelected = week.id === selectedWeekId
            const sessionCount = week.sessions.length

            return (
              <button
                key={week.id}
                onClick={() => onSelectWeek(week.id)}
                className={cn(
                  'flex-shrink-0 min-w-[100px] p-3 rounded-lg border-2 transition-all',
                  'text-left',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent hover:bg-muted/50'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">
                    {week.name}
                  </span>
                  {week.isDeload && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Deload
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {sessionCount} workout{sessionCount !== 1 ? 's' : ''}
                </div>
              </button>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
