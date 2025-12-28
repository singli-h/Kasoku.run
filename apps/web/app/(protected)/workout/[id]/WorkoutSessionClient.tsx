'use client'

/**
 * WorkoutSessionClient - Client wrapper for workout session with React Query
 *
 * Uses React Query with initialData pattern for seamless data refresh:
 * - Instant render with server-fetched data (no loading flash)
 * - Auto-refresh when tab regains focus (refetchOnWindowFocus)
 * - Auto-refresh on network reconnect (refetchOnReconnect)
 * - Automatic cache invalidation after mutations
 *
 * AI Assistant Integration:
 * - Uses SessionAssistant with domain='workout' for athlete workout modifications
 * - Overlay mode (not inline) since workout view has its own approval flow
 */

import { useWorkoutSessionDetails } from '@/components/features/workout/hooks/use-workout-queries'
import { WorkoutSessionDashboardV2 } from '@/components/features/training'
import { SessionAssistant } from '@/components/features/ai-assistant'
import { WorkoutLogWithDetails, SessionPlanWithDetails } from '@/types/training'

interface WorkoutSessionClientProps {
  initialSession: WorkoutLogWithDetails
  sessionId: number
}

export function WorkoutSessionClient({
  initialSession,
  sessionId
}: WorkoutSessionClientProps) {
  // Use React Query with server-fetched initial data
  // This enables seamless background refresh without loading states
  const { data: session } = useWorkoutSessionDetails(sessionId, {
    initialData: initialSession,
  })

  // Use latest data from React Query, fallback to initial server data
  const currentSession = session ?? initialSession
  const sessionPlan = currentSession.session_plan as SessionPlanWithDetails

  return (
    <SessionAssistant
      sessionId={sessionId}
      domain="workout"
      useInlineMode={false}
    >
      <WorkoutSessionDashboardV2
        presetGroup={sessionPlan}
        existingSession={currentSession}
      />
    </SessionAssistant>
  )
}
