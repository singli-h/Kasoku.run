import { getUserMesocyclesAction, getActiveMesocycleForUserAction } from "@/actions/plans/plan-actions"
import { IndividualPlansHomeClient } from "./IndividualPlansHomeClient"
import type { MesocycleWithDetails } from "@/types/training"

/**
 * Server component for Individual user's "My Training" home page
 * Fetches training blocks (mesocycles) and passes to client component
 */
export async function IndividualPlansHome() {
  // Fetch data in parallel
  const [blocksResult, activeBlockResult] = await Promise.all([
    getUserMesocyclesAction(),
    getActiveMesocycleForUserAction()
  ])

  // Handle error case
  if (!blocksResult.isSuccess) {
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

  const blocks = blocksResult.data || []
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
    />
  )
}
