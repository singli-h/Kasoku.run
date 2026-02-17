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

  // Find today's workout from active block
  let todayWorkout: { id: string; name: string; exerciseCount: number } | null = null
  if (activeBlock) {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.

    // Find current microcycle (week)
    // P1 Fix: Handle nullable dates safely
    const currentMicrocycle = activeBlock.microcycles?.find(micro => {
      if (!micro.start_date || !micro.end_date) return false
      const startDate = new Date(micro.start_date)
      const endDate = new Date(micro.end_date)
      return today >= startDate && today <= endDate
    })

    if (currentMicrocycle) {
      // Find workout for today (day field stores day of week)
      const workoutsForToday = (currentMicrocycle.session_plans || []).filter(
        session => session.day === dayOfWeek
      )

      if (workoutsForToday.length > 0) {
        const workout = workoutsForToday[0]
        const exerciseCount = workout.session_plan_exercises?.length || 0
        if (workout.id) {
          todayWorkout = {
            id: workout.id,
            name: workout.name || 'Workout',
            exerciseCount
          }
        }
      }
    }
  }

  return (
    <IndividualPlansHomeClient
      activeBlock={activeBlock}
      completedBlocks={completedBlocks}
      upcomingBlocks={upcomingOrActiveBlocks.filter(b => b.id !== activeBlock?.id)}
      todayWorkout={todayWorkout}
      dataFetchFailed={dataFetchFailed}
    />
  )
}
