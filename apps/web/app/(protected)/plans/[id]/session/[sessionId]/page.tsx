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
 *
 * NOTE: Exercise library is now loaded on-demand via server-side search
 * in ExercisePickerSheet for better performance with large libraries.
 */

import { notFound } from "next/navigation"
import { Suspense } from "react"
import { UnifiedPageSkeleton } from "@/components/layout"
import { SessionPlannerV2 } from "@/components/features/training"
import { SessionAssistantWrapper, InlineProposalSlot } from "./SessionAssistantWrapper"
import { getSessionPlanByIdAction } from "@/actions/library/exercise-actions"
import type { SessionExercise } from "@/components/features/plans/session-planner/types"

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
  session: any
  exercises: SessionExercise[]
} {
  const session = {
    id: backendData.id,
    name: backendData.name || `Session ${backendData.id}`,
    description: backendData.description,
    date: backendData.date,
    microcycle_id: backendData.microcycle_id,
    user_id: backendData.user_id,
    athlete_group_id: backendData.athlete_group_id,
    session_mode: backendData.session_mode,
    week: backendData.week,
    day: backendData.day,
    is_template: backendData.is_template,
    estimatedDuration: null, // Will be calculated client-side
    notes: null,
  }

  // Transform session_plan_exercises to SessionExercise format
  const exercises: SessionExercise[] = (backendData.session_plan_exercises || []).map((exerciseRecord: any) => ({
    // Use numeric ID as string for existing records (allows save action to identify as existing)
    id: String(exerciseRecord.id),
    session_plan_id: exerciseRecord.session_plan_id,
    exercise_id: exerciseRecord.exercise_id,
    exercise_order: exerciseRecord.exercise_order,
    superset_id: exerciseRecord.superset_id,
    notes: exerciseRecord.notes,
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
      effort: setRecord.effort,
      height: setRecord.height,
      resistance: setRecord.resistance,
      completed: false, // Default for planning mode
      isEditing: false,
    })),
    isCollapsed: false,
    validationErrors: [],
    isEditing: false,
  }))

  return { session, exercises }
}

export default async function SessionPlannerRoute({ params }: PageProps) {
  const resolvedParams = await params
  const planId = resolvedParams.id
  const sessionId = Number(resolvedParams.sessionId)

  // Load session data only - exercise library is loaded on-demand via server-side search
  const sessionResult = await getSessionPlanByIdAction(sessionId)

  // Handle session not found
  if (!sessionResult.isSuccess || !sessionResult.data) {
    console.error('Failed to fetch session:', sessionResult.message)
    notFound()
  }

  // Transform session data to client format
  const { session, exercises } = transformSessionData(sessionResult.data)

  return (
    <SessionAssistantWrapper
      sessionId={sessionId}
      planId={planId}
      exercises={exercises}
      exerciseLibrary={[]} // Empty - uses server-side search in picker
      useInlineMode={true}
    >
      {/* Inline AI Proposals - shown when AI has pending changes */}
      <InlineProposalSlot className="mb-4" />

      {/* Session Planner */}
      <Suspense fallback={<UnifiedPageSkeleton title="Session Planner" />}>
        <SessionPlannerV2
          planId={planId}
          sessionId={sessionId}
          initialSession={session}
          initialExercises={exercises as any}
          exerciseLibrary={[]} // Empty - uses server-side search in picker
        />
      </Suspense>
    </SessionAssistantWrapper>
  )
}
