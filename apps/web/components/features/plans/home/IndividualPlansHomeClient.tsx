'use client'

/**
 * IndividualPlansHomeClient
 *
 * Streamlined training home for individual users.
 * When there's an active block, directly embeds IndividualPlanPage content.
 * No extra navigation needed - one screen does it all.
 *
 * Race condition fix: accepts `dataFetchFailed` to distinguish between
 * "data loaded and is genuinely empty" vs "data fetch failed (transient)".
 * When a fetch failed, shows a retry state instead of the create flow,
 * preventing the brief flash of EmptyTrainingState on fresh auth.
 */

import { Button } from "@/components/ui/button"
import { Plus, Calendar, ChevronRight, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { EmptyTrainingState } from "./EmptyTrainingState"
import { IndividualPlanPage } from "../individual/IndividualPlanPage"
import type { MesocycleWithDetails } from "@/types/training"

interface IndividualPlansHomeClientProps {
  activeBlock: MesocycleWithDetails | null
  completedBlocks: MesocycleWithDetails[]
  upcomingBlocks: MesocycleWithDetails[]
  todayWorkout: {
    id: string
    name: string
    exerciseCount: number
  } | null
  /** True when one or both server-side data fetches failed (transient error) */
  dataFetchFailed?: boolean
}

/**
 * Format date range for display
 */
function formatDateRange(startDate: string | null, endDate: string | null): string {
  if (!startDate || !endDate) return ''
  const start = new Date(startDate)
  const end = new Date(endDate)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`
}

export function IndividualPlansHomeClient({
  activeBlock,
  completedBlocks,
  upcomingBlocks,
  dataFetchFailed = false,
}: IndividualPlansHomeClientProps) {
  const router = useRouter()
  const hasAnyBlocks = activeBlock || completedBlocks.length > 0 || upcomingBlocks.length > 0

  // If no blocks found BUT a data fetch failed, show retry state instead of
  // the create flow. This prevents the race condition where transient auth
  // issues on fresh login cause EmptyTrainingState to flash briefly.
  if (!hasAnyBlocks && dataFetchFailed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <Calendar className="h-10 w-10 mx-auto text-muted-foreground/40" />
        <h2 className="text-lg font-semibold">Loading Training Data</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          We had trouble loading your training blocks. This can happen right after signing in.
        </p>
        <Button
          variant="outline"
          onClick={() => router.refresh()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  // If no blocks at all and data loaded successfully, show empty state
  if (!hasAnyBlocks) {
    return <EmptyTrainingState />
  }

  // If there's an active block, show it directly (no extra navigation)
  if (activeBlock) {
    return (
      <div>
        {/* Active block - directly embedded with block switcher */}
        <IndividualPlanPage
          trainingBlock={activeBlock}
          otherBlocks={{
            upcoming: upcomingBlocks,
            completed: completedBlocks
          }}
        />
      </div>
    )
  }

  // No active block - show upcoming/completed with prominent CTA
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* No active block CTA */}
      <section className="text-center py-12 border border-dashed border-border/60 rounded-2xl bg-muted/20">
        <Calendar className="h-10 w-10 mx-auto text-muted-foreground/40 mb-4" />
        <h2 className="text-lg font-semibold mb-2">No Active Training</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
          Create a new training block to get started with your personalized workout plan.
        </p>
        <Button asChild>
          <Link href="/plans/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Training Block
          </Link>
        </Button>
      </section>

      {/* Upcoming Blocks */}
      {upcomingBlocks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Upcoming</h2>
          <div className="space-y-2">
            {upcomingBlocks.map(block => (
              <CompactBlockRow key={block.id} block={block} />
            ))}
          </div>
        </section>
      )}

      {/* Completed Blocks */}
      {completedBlocks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Completed</h2>
          <div className="space-y-2">
            {completedBlocks.slice(0, 3).map(block => (
              <CompactBlockRow key={block.id} block={block} />
            ))}
            {completedBlocks.length > 3 && (
              <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                <Link href="/plans?filter=completed">
                  View all {completedBlocks.length} completed
                </Link>
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

/**
 * Compact block row for listing non-active blocks
 */
function CompactBlockRow({
  block,
  label,
}: {
  block: MesocycleWithDetails
  label?: string
}) {
  return (
    <Link
      href={`/plans/${block.id}`}
      className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{block.name || 'Training Block'}</span>
          {label && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {label}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDateRange(block.start_date, block.end_date)}
        </span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
    </Link>
  )
}
