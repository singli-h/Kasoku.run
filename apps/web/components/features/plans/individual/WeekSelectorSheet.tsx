"use client"

/**
 * WeekSelectorSheet
 *
 * Responsive week navigation:
 * - Mobile/Tablet: Bottom sheet (Vaul drawer)
 * - Desktop: Dropdown popover
 *
 * Supports two modes:
 * - Standalone: Uses passed selectedWeekId/onSelectWeek props
 * - Integrated: Uses PlanContext for selection state when usePlanContext is true
 *
 * @see INDIVIDUAL_LAUNCH_PLAN.md Section 5.4
 * @see docs/features/plans/individual/IMPLEMENTATION_PLAN.md
 */

import { format } from "date-fns"
import { Drawer } from "vaul"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CheckCircle2, Circle, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsDesktop } from "@/components/features/ai-assistant/hooks/useAILayoutMode"
import type { MicrocycleWithDetails } from "@/types/training"
import { usePlanContextOptional } from "./context"

interface WeekSelectorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  weeks: MicrocycleWithDetails[]
  /** Selected week ID - used when not using PlanContext */
  selectedWeekId?: number | null
  /** Week selection handler - used when not using PlanContext */
  onSelectWeek?: (weekId: number) => void
  /**
   * When true, uses PlanContext for selection state instead of props.
   * @default false
   */
  usePlanContext?: boolean
}

/**
 * Check if a week is the current week based on dates
 */
function isCurrentWeek(week: MicrocycleWithDetails): boolean {
  if (!week.start_date || !week.end_date) return false
  const today = new Date()
  const start = new Date(week.start_date)
  const end = new Date(week.end_date)
  return today >= start && today <= end
}

/**
 * Format week date range
 */
function formatWeekDates(week: MicrocycleWithDetails): string {
  if (!week.start_date || !week.end_date) return ""
  const start = new Date(week.start_date)
  const end = new Date(week.end_date)
  return `${format(start, "MMM d")} - ${format(end, "MMM d")}`
}

/**
 * Calculate week completion from workout_logs data.
 *
 * A session is considered "done" if it has at least one workout_log with
 * session_status === "completed". This relies on the `workout_logs` field
 * being included in the SessionPlanWithDetails query (see getMesocycleByIdAction).
 */
function getWeekCompletion(week: MicrocycleWithDetails): { done: number; total: number; hasData: boolean } {
  const workouts = week.session_plans ?? []
  const total = workouts.length

  // Check if any session plan actually carries workout_logs data.
  // If the field is absent on every session, we cannot determine completion.
  const hasData = workouts.some(sp => Array.isArray(sp.workout_logs))

  if (!hasData) {
    return { done: 0, total, hasData: false }
  }

  const done = workouts.filter(sp =>
    sp.workout_logs?.some(log => log.session_status === 'completed')
  ).length

  return { done, total, hasData: true }
}

/**
 * Week list item component (shared between mobile and desktop)
 */
function WeekItem({
  week,
  weekNumber,
  isSelected,
  onClick,
}: {
  week: MicrocycleWithDetails
  weekNumber: number
  isSelected: boolean
  onClick: () => void
}) {
  const isCurrent = isCurrentWeek(week)
  const { done, total, hasData } = getWeekCompletion(week)
  const dateRange = formatWeekDates(week)
  const allDone = hasData && total > 0 && done === total

  // Build accessible completion description
  const completionLabel = hasData && total > 0
    ? `, ${done} of ${total} workout${total !== 1 ? 's' : ''} completed`
    : total > 0
      ? `, ${total} workout${total !== 1 ? 's' : ''}`
      : ''

  return (
    <button
      onClick={onClick}
      aria-label={`Week ${weekNumber}${dateRange ? `, ${dateRange}` : ''}${completionLabel}${isCurrent ? ', current week' : ''}${allDone ? ', all completed' : ''}`}
      aria-current={isCurrent ? "true" : undefined}
      aria-pressed={isSelected}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none",
        isSelected
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-muted/50",
      )}
    >
      {/* Status icon - reflects real completion, not just date */}
      <div className="shrink-0">
        {allDone ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : hasData && done > 0 ? (
          <CheckCircle2 className="h-5 w-5 text-amber-500" />
        ) : (
          <Circle className={cn(
            "h-5 w-5",
            isCurrent ? "text-primary fill-primary/20" : "text-muted-foreground"
          )} />
        )}
      </div>

      {/* Week info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            Week {weekNumber}
          </span>
          {isCurrent && (
            <span className="text-2xs px-1.5 py-0.5 bg-primary text-primary-foreground rounded">
              Current
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{formatWeekDates(week)}</span>
          {total > 0 && (
            <>
              <span>•</span>
              {hasData ? (
                <span>{done}/{total} workouts</span>
              ) : (
                <span>{total} workout{total !== 1 ? 's' : ''}</span>
              )}
            </>
          )}
        </div>
      </div>
    </button>
  )
}

/**
 * Week selector content (shared between sheet and popover)
 */
function WeekSelectorContent({
  weeks,
  selectedWeekId,
  onSelectWeek,
}: {
  weeks: MicrocycleWithDetails[]
  selectedWeekId: number | null
  onSelectWeek: (weekId: number) => void
}) {
  return (
    <div className="space-y-1 py-2">
      {weeks.map((week, index) => (
        <WeekItem
          key={week.id}
          week={week}
          weekNumber={index + 1}
          isSelected={week.id === selectedWeekId}
          onClick={() => onSelectWeek(week.id)}
        />
      ))}
    </div>
  )
}

export function WeekSelectorSheet({
  open,
  onOpenChange,
  weeks,
  selectedWeekId: selectedWeekIdProp,
  onSelectWeek: onSelectWeekProp,
  usePlanContext: usePlanContextFlag = false,
}: WeekSelectorSheetProps) {
  const isDesktop = useIsDesktop()

  // Get PlanContext if available (T012)
  const planContext = usePlanContextOptional()

  // Use PlanContext values when usePlanContext flag is true and context is available
  const selectedWeekId = (usePlanContextFlag && planContext)
    ? planContext.selectedWeekId
    : selectedWeekIdProp ?? null

  const onSelectWeek = (weekId: number) => {
    if (usePlanContextFlag && planContext) {
      planContext.selectWeek(weekId)
    } else if (onSelectWeekProp) {
      onSelectWeekProp(weekId)
    }
    // Close the sheet after selection
    onOpenChange(false)
  }

  // Desktop: Use popover (controlled externally via open state)
  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        {/* Invisible trigger - the actual trigger is in IndividualPlanPage header */}
        <PopoverTrigger asChild>
          <span className="sr-only">Open week selector</span>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 p-2"
          align="start"
          sideOffset={8}
        >
          <div className="mb-2 px-2">
            <h3 className="font-medium text-sm">Select Week</h3>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <WeekSelectorContent
              weeks={weeks}
              selectedWeekId={selectedWeekId}
              onSelectWeek={onSelectWeek}
            />
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  // Mobile/Tablet: Use bottom sheet
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-background border-t">
          <VisuallyHidden.Root asChild>
            <Drawer.Title>Select Week</Drawer.Title>
          </VisuallyHidden.Root>
          <VisuallyHidden.Root asChild>
            <Drawer.Description>Choose a week to view its workouts</Drawer.Description>
          </VisuallyHidden.Root>

          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="h-1.5 w-12 rounded-full bg-muted-foreground/20" />
          </div>

          {/* Header */}
          <div className="px-4 pb-2 border-b">
            <h3 className="font-semibold">Select Week</h3>
          </div>

          {/* Week list */}
          <div className="flex-1 overflow-y-auto px-2">
            <WeekSelectorContent
              weeks={weeks}
              selectedWeekId={selectedWeekId}
              onSelectWeek={onSelectWeek}
            />
          </div>

          {/* Bottom padding for safe area */}
          <div style={{ paddingBottom: "env(safe-area-inset-bottom, 24px)" }} />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
