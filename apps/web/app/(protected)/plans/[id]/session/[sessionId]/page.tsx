/**
 * Session Planner Page
 *
 * Uses the new unified training components (SessionPlannerV2)
 * which provides a mobile-first, section-based exercise organization.
 */

import { notFound } from "next/navigation"
import { Suspense } from "react"
import { UnifiedPageSkeleton } from "@/components/layout"
import { SessionPlannerV2 } from "@/components/features/training"
import { SessionAssistantWrapper } from "./SessionAssistantWrapper"
import { getSessionPlanByIdAction, getExercisesAction } from "@/actions/library/exercise-actions"
import type { SessionExercise, ExerciseLibraryItem } from "@/components/features/plans/session-planner/types"

interface PageProps {
  params: Promise<{ id: string; sessionId: string }>
}

/**
 * Transform backend data to session planner format
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

  // Transform exercise presets to SessionExercise format
  const exercises: SessionExercise[] = (backendData.session_plan_exercises || []).map((preset: any) => ({
    id: `preset_${preset.id}`, // Use string ID for client-side
    session_plan_id: preset.session_plan_id,
    exercise_id: preset.exercise_id,
    exercise_order: preset.exercise_order,
    superset_id: preset.superset_id,
    notes: preset.notes,
    exercise: preset.exercise ? {
      id: preset.exercise.id,
      name: preset.exercise.name,
      description: preset.exercise.description,
      exercise_type_id: preset.exercise.exercise_type_id,
      video_url: preset.exercise.video_url,
    } : null,
    sets: (preset.session_plan_sets || []).map((detail: any) => ({
      id: detail.id,
      session_plan_exercise_id: detail.session_plan_exercise_id,
      set_index: detail.set_index,
      reps: detail.reps,
      weight: detail.weight,
      distance: detail.distance,
      performing_time: detail.performing_time,
      rest_time: detail.rest_time,
      tempo: detail.tempo,
      rpe: detail.rpe,
      resistance_unit_id: detail.resistance_unit_id,
      power: detail.power,
      velocity: detail.velocity,
      effort: detail.effort,
      height: detail.height,
      resistance: detail.resistance,
      completed: false, // Default for planning mode
      isEditing: false,
    })),
    isCollapsed: false,
    validationErrors: [],
    isEditing: false,
  }))

  return { session, exercises }
}

/**
 * Transform exercise library data to ExerciseLibraryItem format
 */
function transformExerciseLibrary(backendData: any[]): ExerciseLibraryItem[] {
  return backendData.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    description: exercise.description,
    exercise_type_id: exercise.exercise_type_id,
    type: getExerciseTypeFromId(exercise.exercise_type_id),
    category: exercise.exercise_type?.type || "other",
    isFavorite: false, // Default for now
  }))
}

/**
 * Map exercise type ID to type string
 */
function getExerciseTypeFromId(typeId: number | null): ExerciseLibraryItem["type"] {
  const typeMap: Record<number, ExerciseLibraryItem["type"]> = {
    1: "warmup",
    2: "gym",
    3: "circuit",
    4: "isometric",
    5: "plyometric",
    6: "sprint",
    7: "drill",
  }
  return typeMap[typeId || 0] || "other"
}

export default async function SessionPlannerRoute({ params }: PageProps) {
  const resolvedParams = await params
  const planId = resolvedParams.id
  const sessionId = Number(resolvedParams.sessionId)

  // Load session data and exercise library in parallel
  const [sessionResult, exercisesResult] = await Promise.all([
    getSessionPlanByIdAction(sessionId),
    getExercisesAction(),
  ])

  // Handle session not found
  if (!sessionResult.isSuccess || !sessionResult.data) {
    console.error('Failed to fetch session:', sessionResult.message)
    notFound()
  }

  // Handle exercise library errors gracefully
  const exerciseLibrary = exercisesResult.isSuccess
    ? transformExerciseLibrary(exercisesResult.data)
    : []

  // Transform session data to client format
  const { session, exercises } = transformSessionData(sessionResult.data)

  return (
    <>
      <Suspense fallback={<UnifiedPageSkeleton title="Session Planner" />}>
        <SessionPlannerV2
          planId={planId}
          sessionId={sessionId}
          initialSession={session}
          initialExercises={exercises as any}
          exerciseLibrary={exerciseLibrary}
        />
      </Suspense>

      {/* AI Session Assistant - provides chat drawer and approval banner */}
      <SessionAssistantWrapper
        sessionId={sessionId}
        planId={planId}
        exercises={exercises}
        exerciseLibrary={exerciseLibrary}
      />
    </>
  )
}
