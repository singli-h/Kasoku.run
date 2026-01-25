"use client"

/**
 * WeekSelectorSheet
 *
 * Responsive week navigation:
 * - Mobile/Tablet: Bottom sheet (Vaul drawer)
 * - Desktop: Dropdown popover
 *
 * @see INDIVIDUAL_LAUNCH_PLAN.md Section 5.4
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

interface WeekSelectorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  weeks: MicrocycleWithDetails[]
  selectedWeekId: number | null
  onSelectWeek: (weekId: number) => void
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
 * Check if a week is in the past
 */
function isPastWeek(week: MicrocycleWithDetails): boolean {
  if (!week.end_date) return false
  const today = new Date()
  const end = new Date(week.end_date)
  return today > end
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
 * Calculate week completion percentage
 */
function getWeekCompletion(week: MicrocycleWithDetails): { done: number; total: number } {
  const workouts = week.session_plans ?? []
  const total = workouts.length
  // For now, consider past weeks as "done" - TODO: integrate with actual completion data
  const done = isPastWeek(week) ? total : 0
  return { done, total }
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
  const isPast = isPastWeek(week)
  const { done, total } = getWeekCompletion(week)

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
        isSelected
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-muted/50",
      )}
    >
      {/* Status icon */}
      <div className="shrink-0">
        {isPast ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
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
            <span className="text-[10px] px-1.5 py-0.5 bg-primary text-primary-foreground rounded">
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
              <span>{done}/{total} workouts</span>
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
  selectedWeekId,
  onSelectWeek,
}: WeekSelectorSheetProps) {
  const isDesktop = useIsDesktop()

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
          <div className="h-6" />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
