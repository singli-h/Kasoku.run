/**
 * Session Planner Page
 *
 * Uses the new unified training components (SessionPlannerV2)
 * which provides a mobile-first, section-based exercise organization.
 *
 * AI Assistant Integration:
 * - Uses inline mode for proposals (displayed on page, not overlay)
 * - Chat drawer auto-collapses when proposals are pending
 * - InlineProposalSlot renders the proposal section above exercise list
 * - SessionExercisesProvider manages shared state so AI updates sync with planner
 *
 * NOTE: Exercise library is now loaded on-demand via server-side search
 * in ExercisePickerSheet for better performance with large libraries.
 */

import { notFound } from "next/navigation"
import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { UnifiedPageSkeleton } from "@/components/layout"
import { SessionPlannerV2 } from "@/components/features/training"
import { SessionAssistantWrapper, InlineProposalSlot } from "./SessionAssistantWrapper"
import { getSessionPlanByIdAction } from "@/actions/library/exercise-actions"
import { serverProtectRoute } from "@/components/auth/server-protect-route"
import { getDbUserId } from "@/lib/user-cache"
import type { SessionPlannerExercise } from "@/components/features/training/adapters/session-adapter"

interface PageProps {
  params: Promise<{ id: string; sessionId: string }>
}

/**
 * Transform backend data to session planner format
 *
 * ID Format Convention:
 * - Existing database records: Use numeric ID as string (e.g., "123")
 * - New client-side items: Use "new_" prefix (e.g., "new_1735123456789")
 *
 * This allows the save action to distinguish between updates and inserts.
 */
function transformSessionData(backendData: any): {
  session: {
    id: string
    name: string
    description?: string | null
    date?: string | null
    week?: number | null
    day?: number | null
    session_mode?: string | null
  }
  exercises: SessionPlannerExercise[]
  groupId: number | null
} {
  const session = {
    id: String(backendData.id),
    name: backendData.name || `Session ${backendData.id}`,
    description: backendData.description,
    date: backendData.date,
    session_mode: backendData.session_mode,
    week: backendData.week,
    day: backendData.day,
  }

  // Transform session_plan_exercises to SessionPlannerExercise format
  const exercises: SessionPlannerExercise[] = (backendData.session_plan_exercises || []).map((exerciseRecord: any) => ({
    // Use numeric ID as string for existing records (allows save action to identify as existing)
    id: String(exerciseRecord.id),
    session_plan_id: exerciseRecord.session_plan_id,
    exercise_id: exerciseRecord.exercise_id,
    exercise_order: exerciseRecord.exercise_order,
    superset_id: exerciseRecord.superset_id,
    notes: exerciseRecord.notes,
    target_event_groups: exerciseRecord.target_event_groups ?? null,
    exercise: exerciseRecord.exercise ? {
      id: exerciseRecord.exercise.id,
      name: exerciseRecord.exercise.name,
      description: exerciseRecord.exercise.description,
      exercise_type_id: exerciseRecord.exercise.exercise_type_id,
      video_url: exerciseRecord.exercise.video_url,
    } : null,
    sets: (exerciseRecord.session_plan_sets || []).map((setRecord: any) => ({
      id: setRecord.id,
      session_plan_exercise_id: setRecord.session_plan_exercise_id,
      set_index: setRecord.set_index,
      reps: setRecord.reps,
      weight: setRecord.weight,
      distance: setRecord.distance,
      performing_time: setRecord.performing_time,
      rest_time: setRecord.rest_time,
      tempo: setRecord.tempo,
      rpe: setRecord.rpe,
      resistance_unit_id: setRecord.resistance_unit_id,
      power: setRecord.power,
      velocity: setRecord.velocity,
      // Convert effort from 0-1 (database) to 0-100 (UI percentage)
      // SessionPlannerExercise uses UI format so user edits don't cause double conversion
      effort: setRecord.effort != null ? setRecord.effort * 100 : null,
      height: setRecord.height,
      resistance: setRecord.resistance,
      completed: false, // Default for planning mode
      isEditing: false,
    })),
    isCollapsed: false,
    validationErrors: [],
    isEditing: false,
  }))

  const groupId: number | null = backendData.microcycle?.athlete_group_id ?? null

  return { session, exercises, groupId }
}

export default async function SessionPlannerRoute({ params }: PageProps) {
  // Protect this page - only authenticated users with valid roles can access
  await serverProtectRoute({ allowedRoles: ['coach', 'individual', 'athlete'] })

  const resolvedParams = await params
  const planId = resolvedParams.id
  const sessionId = resolvedParams.sessionId

  // Get user ID for exercise search visibility filtering
  const { userId: clerkUserId } = await auth()
  const dbUserId = clerkUserId ? await getDbUserId(clerkUserId) : undefined

  // Load session data only - exercise library is loaded on-demand via server-side search
  const sessionResult = await getSessionPlanByIdAction(sessionId)

  // Handle session not found
  if (!sessionResult.isSuccess || !sessionResult.data) {
    console.error('Failed to fetch session:', sessionResult.message)
    notFound()
  }

  // Transform session data to client format
  const { session, exercises, groupId } = transformSessionData(sessionResult.data)

  return (
    <SessionAssistantWrapper
      sessionId={sessionId}
      planId={planId}
      initialExercises={exercises}
      dbUserId={dbUserId ? String(dbUserId) : undefined}
      useInlineMode={true}
    >
      {/* Inline AI Proposals - shown when AI has pending changes */}
      <InlineProposalSlot className="mb-4" />

      {/* Session Planner - uses shared exercises context */}
      <Suspense fallback={<UnifiedPageSkeleton title="Session Planner" />}>
        <SessionPlannerV2
          planId={planId}
          sessionId={sessionId}
          initialSession={session}
          exerciseLibrary={[]} // Empty - uses server-side search in picker
          groupId={groupId}
        />
      </Suspense>
    </SessionAssistantWrapper>
  )
}
