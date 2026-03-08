import { getUserMesocyclesAction, getActiveMesocycleForUserAction } from "@/actions/plans/plan-actions"
import { IndividualPlansHomeClient } from "./IndividualPlansHomeClient"
import type { MesocycleWithDetails } from "@/types/training"

/**
 * Server component for Individual user's "My Training" home page
 * Fetches training blocks (mesocycles) and passes to client component
 *
 * Race condition fix: When either data fetch fails (e.g. transient auth issue
 * on fresh login), we pass dataFetchFailed=true so the client shows a retry
 * state instead of the empty "Create Training Block" flow. This prevents
 * the brief flash of the create flow before data loads on subsequent navigation.
 */
export async function IndividualPlansHome() {
  // Fetch data in parallel
  const [blocksResult, activeBlockResult] = await Promise.all([
    getUserMesocyclesAction(),
    getActiveMesocycleForUserAction()
  ])

  // Handle complete failure - both queries failed
  if (!blocksResult.isSuccess && !activeBlockResult.isSuccess) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-destructive">Error Loading Training</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {blocksResult.message || "Failed to fetch training blocks"}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Track if any fetch failed - the data picture may be incomplete
  const dataFetchFailed = !blocksResult.isSuccess || !activeBlockResult.isSuccess

  const blocks = blocksResult.isSuccess ? (blocksResult.data || []) : []
  const activeBlock = activeBlockResult.isSuccess ? activeBlockResult.data : null

  // Separate completed blocks from active/upcoming
  // P1 Fix: Handle nullable end_date safely
  const completedBlocks = blocks.filter(block => {
    if (!block.end_date) return false
    const endDate = new Date(block.end_date)
    return endDate < new Date()
  })

  const upcomingOrActiveBlocks = blocks.filter(block => {
    if (!block.end_date) return true // No end date means ongoing
    const endDate = new Date(block.end_date)
    return endDate >= new Date()
  })

  return (
    <IndividualPlansHomeClient
      activeBlock={activeBlock}
      completedBlocks={completedBlocks}
      upcomingBlocks={upcomingOrActiveBlocks.filter(b => b.id !== activeBlock?.id)}
      dataFetchFailed={dataFetchFailed}
    />
  )
}
