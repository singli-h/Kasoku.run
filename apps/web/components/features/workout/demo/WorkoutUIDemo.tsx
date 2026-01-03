"use client"

/**
 * WorkoutUIDemo - Interactive demo of workout/session planning UI
 *
 * This demo uses the EXACT SAME components as the real session page:
 * - SessionExercisesProvider for shared exercises state
 * - ChangeSetProvider for AI changeset management
 * - ChatDrawer + ChatTrigger for AI chat interface
 * - InlineProposalSection for approval UI
 * - WorkoutView for the exercise list
 *
 * The only difference is we simulate AI tool calls instead of
 * calling the real API endpoint.
 *
 * @see /app/(protected)/plans/[id]/session/[sessionId]/page.tsx
 */

import { useState, useCallback, useEffect, useMemo } from "react"
import {
  Monitor, Tablet, Smartphone, Plus, Minus, Edit3, Trash2, ArrowLeftRight, RefreshCw, Bot
} from "lucide-react"
import { cn } from "@/lib/utils"

// Import actual training components and types
import { WorkoutView } from "@/components/features/training/views/WorkoutView"
import type { TrainingSet, ExerciseLibraryItem } from "@/components/features/training/types"
import { sessionExercisesToTraining } from "@/components/features/training/adapters/session-adapter"
import type { SessionPlannerExercise } from "@/components/features/training/adapters/session-adapter"
import { SessionExercisesProvider, useSessionExercises } from "@/components/features/training/context"

// Import REAL AI assistant components
import { ChangeSetProvider } from "@/lib/changeset/ChangeSetContext"
import { useChangeSet } from "@/lib/changeset/useChangeSet"
import { useAIExerciseChanges } from "@/components/features/ai-assistant/hooks"
import { ChatDrawer, ChatTrigger } from "@/components/features/ai-assistant/ChatDrawer"
import { InlineProposalSection } from "@/components/features/ai-assistant/inline/InlineProposalSection"
import type { ChangeRequest, OperationType } from "@/lib/changeset/types"
import type { UIMessage } from "@ai-sdk/react"

// =============================================================================
// Types
// =============================================================================

type DeviceView = "phone" | "tablet" | "desktop"
type UserMode = "athlete" | "coach"
type AIScenario = 'none' | 'add_sets' | 'update_set' | 'delete_set' | 'add_exercise' | 'swap_exercise' | 'delete_exercise' | 'mixed_changes' | 'superset_changes'

// =============================================================================
// Exercise Library (Demo Data)
// =============================================================================

const EXERCISE_LIBRARY: ExerciseLibraryItem[] = [
  { id: "1", name: "Flying 10m", category: "Speed", equipment: "", muscleGroups: ["Legs", "Core"], exerciseTypeId: 5 },
  { id: "2", name: "Flying 20m", category: "Speed", equipment: "", muscleGroups: ["Legs", "Core"], exerciseTypeId: 5 },
  { id: "3", name: "Block Start 30m", category: "Speed", equipment: "Blocks", muscleGroups: ["Legs", "Core"], exerciseTypeId: 5 },
  { id: "10", name: "Half Squat", category: "Strength", equipment: "Barbell", muscleGroups: ["Quads", "Glutes"], exerciseTypeId: 3 },
  { id: "11", name: "Power Clean", category: "Strength", equipment: "Barbell", muscleGroups: ["Full Body"], exerciseTypeId: 3 },
  { id: "12", name: "Deadlift", category: "Strength", equipment: "Barbell", muscleGroups: ["Back", "Hamstrings", "Glutes"], exerciseTypeId: 3 },
  { id: "13", name: "Romanian Deadlift", category: "Strength", equipment: "Barbell", muscleGroups: ["Hamstrings", "Glutes"], exerciseTypeId: 3 },
  { id: "14", name: "Bulgarian Split Squat", category: "Strength", equipment: "Dumbbells", muscleGroups: ["Quads", "Glutes"], exerciseTypeId: 3 },
  { id: "15", name: "Barbell Row", category: "Strength", equipment: "Barbell", muscleGroups: ["Back", "Biceps"], exerciseTypeId: 3 },
  { id: "20", name: "Drop Jumps", category: "Plyometric", equipment: "Box", muscleGroups: ["Legs"], exerciseTypeId: 4 },
  { id: "21", name: "Box Jumps", category: "Plyometric", equipment: "Box", muscleGroups: ["Legs"], exerciseTypeId: 4 },
  { id: "30", name: "Dynamic Stretches", category: "Warmup", equipment: "", muscleGroups: ["Full Body"], exerciseTypeId: 1 },
]

// =============================================================================
// Demo Data (SessionPlannerExercise format)
// =============================================================================

const createInitialExercises = (): SessionPlannerExercise[] => [
  {
    id: '137',
    session_plan_id: '1',
    exercise_id: 13,
    exercise_order: 1,
    notes: "Posterior chain development",
    isCollapsed: false,
    isEditing: false,
    validationErrors: [],
    exercise: {
      id: 13,
      name: "Romanian Deadlift",
      exercise_type_id: 3,
      exercise_type: { type: "Gym" }
    },
    sets: [
      { id: '301', session_plan_exercise_id: '137', set_index: 1, reps: 8, weight: 100, rest_time: 180, tempo: "2-1-1-0", rpe: 7, completed: false, isEditing: false },
      { id: '302', session_plan_exercise_id: '137', set_index: 2, reps: 8, weight: 100, rest_time: 180, tempo: "2-1-1-0", rpe: 8, completed: false, isEditing: false },
    ],
  },
  {
    id: '138',
    session_plan_id: '1',
    exercise_id: 14,
    exercise_order: 2,
    notes: "Unilateral strength - superset A",
    isCollapsed: false,
    isEditing: false,
    validationErrors: [],
    superset_id: "ss1",
    exercise: {
      id: 14,
      name: "Bulgarian Split Squat",
      exercise_type_id: 3,
      exercise_type: { type: "Gym" }
    },
    sets: [
      { id: '303', session_plan_exercise_id: '138', set_index: 1, reps: 10, weight: 40, rest_time: 120, rpe: 7, completed: false, isEditing: false },
      { id: '304', session_plan_exercise_id: '138', set_index: 2, reps: 10, weight: 45, rest_time: 120, rpe: 8, completed: false, isEditing: false },
    ],
  },
  {
    id: '139',
    session_plan_id: '1',
    exercise_id: 15,
    exercise_order: 3,
    notes: "Superset pair A",
    isCollapsed: false,
    isEditing: false,
    validationErrors: [],
    superset_id: "ss1",
    exercise: {
      id: 15,
      name: "Barbell Row",
      exercise_type_id: 3,
      exercise_type: { type: "Gym" }
    },
    sets: [
      { id: '305', session_plan_exercise_id: '139', set_index: 1, reps: 12, weight: 60, rest_time: 60, completed: false, isEditing: false },
    ],
  },
  {
    id: '140',
    session_plan_id: '1',
    exercise_id: 20,
    exercise_order: 4,
    notes: "Reactive strength",
    isCollapsed: true,
    isEditing: false,
    validationErrors: [],
    exercise: {
      id: 20,
      name: "Drop Jumps",
      exercise_type_id: 4,
      exercise_type: { type: "Plyometric" }
    },
    sets: [
      { id: '306', session_plan_exercise_id: '140', set_index: 1, reps: 6, height: 45, rest_time: 120, completed: false, isEditing: false },
    ],
  },
]

// =============================================================================
// AI Scenario Descriptions
// =============================================================================

const SCENARIO_DESCRIPTIONS: Record<AIScenario, string> = {
  none: "No pending AI changes",
  add_sets: "Add 3 new sets to Romanian Deadlift (8 reps @ 100kg)",
  update_set: "Update set 1: reps 8->12, weight 100kg->110kg",
  delete_set: "Remove set 2 from Romanian Deadlift",
  add_exercise: "Add new exercise: Power Clean with 3 sets",
  swap_exercise: "Swap Bulgarian Split Squat -> Step Ups",
  delete_exercise: "Remove Barbell Row from session",
  mixed_changes: "Add sets + Update set + Delete set across exercises",
  superset_changes: "Modify both exercises in superset A",
}

// =============================================================================
// Device Frames
// =============================================================================

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[375px]">
      <div className="bg-card rounded-[2.5rem] border-4 border-border overflow-hidden shadow-2xl">
        <div className="h-8 bg-background flex items-center justify-center">
          <div className="w-20 h-5 bg-border rounded-full" />
        </div>
        <div className="max-h-[600px] overflow-y-auto">{children}</div>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-4">Phone View (375px)</p>
    </div>
  )
}

function TabletFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[768px]">
      <div className="bg-card rounded-2xl border-2 border-border overflow-hidden shadow-xl">
        <div className="max-h-[700px] overflow-y-auto">{children}</div>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-4">Tablet View (768px)</p>
    </div>
  )
}

function DesktopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1024px]">
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-lg">
        <div className="max-h-[700px] overflow-y-auto">{children}</div>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-4">Desktop View (1024px)</p>
    </div>
  )
}

// =============================================================================
// AI Control Panel - for simulating AI changes (Demo-specific)
// =============================================================================

interface AIControlPanelProps {
  scenario: AIScenario
  onScenarioChange: (scenario: AIScenario) => void
  onApplyScenario: (scenario: AIScenario) => void
}

function AIControlPanel({ scenario, onScenarioChange, onApplyScenario }: AIControlPanelProps) {
  const handleClick = (newScenario: AIScenario) => {
    onScenarioChange(newScenario)
    onApplyScenario(newScenario)
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Bot className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold">AI Change Scenarios (Demo Controls)</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Click a scenario to simulate AI-proposed changes. In production, these come from the AI chat.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <button
          onClick={() => handleClick('none')}
          className={cn(
            "px-3 py-2 text-sm rounded-lg border transition-colors",
            scenario === 'none' ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
          )}
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Reset
        </button>
        <button
          onClick={() => handleClick('add_sets')}
          className={cn(
            "px-3 py-2 text-sm rounded-lg border transition-colors",
            scenario === 'add_sets' ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
          )}
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Add Sets
        </button>
        <button
          onClick={() => handleClick('update_set')}
          className={cn(
            "px-3 py-2 text-sm rounded-lg border transition-colors",
            scenario === 'update_set' ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
          )}
        >
          <Edit3 className="w-4 h-4 inline mr-2" />
          Update Set
        </button>
        <button
          onClick={() => handleClick('delete_set')}
          className={cn(
            "px-3 py-2 text-sm rounded-lg border transition-colors",
            scenario === 'delete_set' ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
          )}
        >
          <Minus className="w-4 h-4 inline mr-2" />
          Delete Set
        </button>
        <button
          onClick={() => handleClick('add_exercise')}
          className={cn(
            "px-3 py-2 text-sm rounded-lg border transition-colors",
            scenario === 'add_exercise' ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
          )}
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Add Exercise
        </button>
        <button
          onClick={() => handleClick('swap_exercise')}
          className={cn(
            "px-3 py-2 text-sm rounded-lg border transition-colors",
            scenario === 'swap_exercise' ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
          )}
        >
          <ArrowLeftRight className="w-4 h-4 inline mr-2" />
          Swap Exercise
        </button>
        <button
          onClick={() => handleClick('delete_exercise')}
          className={cn(
            "px-3 py-2 text-sm rounded-lg border transition-colors",
            scenario === 'delete_exercise' ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
          )}
        >
          <Trash2 className="w-4 h-4 inline mr-2" />
          Delete Exercise
        </button>
        <button
          onClick={() => handleClick('mixed_changes')}
          className={cn(
            "px-3 py-2 text-sm rounded-lg border transition-colors",
            scenario === 'mixed_changes' ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
          )}
        >
          Mixed Changes
        </button>
        <button
          onClick={() => handleClick('superset_changes')}
          className={cn(
            "px-3 py-2 text-sm rounded-lg border transition-colors",
            scenario === 'superset_changes' ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
          )}
        >
          Superset Changes
        </button>
      </div>
      {scenario !== 'none' && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium">Active Scenario:</p>
          <p className="text-sm text-muted-foreground">{SCENARIO_DESCRIPTIONS[scenario]}</p>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Demo Content with REAL AI Components
// =============================================================================

/** Counter for generating unique IDs */
let tempIdCounter = 0
const generateTempId = () => `temp_${++tempIdCounter}_${Date.now()}`
const generateRequestId = () => `cr_demo_${++tempIdCounter}_${Date.now()}`

interface DemoContentProps {
  deviceView: DeviceView
  userMode: UserMode
  elapsedSeconds: number
  isTimerRunning: boolean
  onToggleTimer: () => void
  scenario: AIScenario
  onScenarioChange: (scenario: AIScenario) => void
}

function DemoContent({
  deviceView,
  userMode,
  elapsedSeconds,
  isTimerRunning,
  onToggleTimer,
  scenario,
  onScenarioChange,
}: DemoContentProps) {
  // Get exercises from REAL shared context (same as production)
  const { exercises, setExercises } = useSessionExercises()

  // Get changeset from REAL context (same as production)
  const changeSet = useChangeSet()

  // Get AI changes map using REAL hook (same as production)
  const aiChangesByExercise = useAIExerciseChanges()

  // State for REAL ChatDrawer
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<UIMessage[]>([])
  const [isExecuting, setIsExecuting] = useState(false)

  // Convert exercises to training format for WorkoutView
  const trainingExercises = useMemo(() => sessionExercisesToTraining(exercises), [exercises])

  // Helper to create a ChangeRequest
  const createChangeRequest = useCallback((
    operationType: OperationType,
    entityType: string,
    entityId: string | null,
    proposedData: Record<string, unknown> | null,
    currentData: Record<string, unknown> | null = null
  ): Omit<ChangeRequest, 'changesetId'> => ({
    id: generateRequestId(),
    operationType,
    entityType,
    entityId: entityId ?? generateTempId(),
    proposedData,
    currentData,
    executionOrder: Date.now(),
    aiReasoning: `Demo: ${operationType} ${entityType}`,
    createdAt: new Date(),
  }), [])

  // Apply scenario to changeset (simulating AI tool calls)
  const applyScenario = useCallback((newScenario: AIScenario) => {
    changeSet.clear()

    if (newScenario === 'none') return

    changeSet.getOrCreateChangesetId()

    switch (newScenario) {
      case 'add_sets':
        // Add 3 sets to exercise 137
        for (let i = 0; i < 3; i++) {
          changeSet.upsert(createChangeRequest(
            'create',
            'preset_set',
            null,
            {
              session_plan_exercise_id: 137,
              reps: 8,
              weight: 100,
              rest_time: 180,
              tempo: '2-1-1-0',
              rpe: 7,
            }
          ))
        }
        changeSet.setMetadata("Add 3 sets", "Adding 3 sets to Romanian Deadlift with 8 reps @ 100kg")
        changeSet.setStatus('pending_approval')

        // Add simulated AI message
        setChatMessages([
          { id: '1', role: 'user', parts: [{ type: 'text', text: 'Add 3 more sets to Romanian Deadlift' }] },
          { id: '2', role: 'assistant', parts: [{ type: 'text', text: "I'll add 3 sets to the Romanian Deadlift exercise, matching the existing set parameters (8 reps @ 100kg). Please review and approve the changes." }] },
        ])
        break

      case 'update_set':
        changeSet.upsert(createChangeRequest(
          'update',
          'preset_set',
          '301',
          {
            session_plan_exercise_id: 137,
            reps: 12,
            weight: 110,
          },
          {
            id: 301,
            session_plan_exercise_id: 137,
            reps: 8,
            weight: 100,
          }
        ))
        changeSet.setMetadata("Update set", "Updating set 1: reps 8->12, weight 100kg->110kg")
        changeSet.setStatus('pending_approval')

        setChatMessages([
          { id: '1', role: 'user', parts: [{ type: 'text', text: 'Increase reps and weight on the first set of RDL' }] },
          { id: '2', role: 'assistant', parts: [{ type: 'text', text: "I'll increase the first set from 8 reps @ 100kg to 12 reps @ 110kg. This is a significant increase - please confirm." }] },
        ])
        break

      case 'delete_set':
        changeSet.upsert(createChangeRequest(
          'delete',
          'preset_set',
          '302',
          null,
          {
            id: 302,
            session_plan_exercise_id: 137,
            set_index: 2,
            reps: 8,
            weight: 100,
          }
        ))
        changeSet.setMetadata("Remove set", "Removing set 2 from Romanian Deadlift")
        changeSet.setStatus('pending_approval')

        setChatMessages([
          { id: '1', role: 'user', parts: [{ type: 'text', text: 'Remove the second set from Romanian Deadlift' }] },
          { id: '2', role: 'assistant', parts: [{ type: 'text', text: "I'll remove set 2 from the Romanian Deadlift. This will reduce the total volume for this exercise." }] },
        ])
        break

      case 'add_exercise':
        const newExerciseId = generateTempId()
        changeSet.upsert(createChangeRequest(
          'create',
          'preset_exercise',
          newExerciseId,
          {
            exercise_id: 11,
            exercise_name: 'Power Clean',
            exercise_order: 5,
            notes: 'Olympic lift for power development',
          }
        ))
        for (let i = 0; i < 3; i++) {
          changeSet.upsert(createChangeRequest(
            'create',
            'preset_set',
            null,
            {
              session_plan_exercise_id: newExerciseId,
              reps: 3,
              weight: 70,
              rest_time: 180,
            }
          ))
        }
        changeSet.setMetadata("Add exercise", "Adding Power Clean with 3 sets of 3 @ 70kg")
        changeSet.setStatus('pending_approval')

        setChatMessages([
          { id: '1', role: 'user', parts: [{ type: 'text', text: 'Add power cleans to the session' }] },
          { id: '2', role: 'assistant', parts: [{ type: 'text', text: "I'll add Power Clean as a new exercise at the end with 3 sets of 3 reps @ 70kg. This is a great Olympic lift for explosive power." }] },
        ])
        break

      case 'swap_exercise':
        changeSet.upsert(createChangeRequest(
          'update',
          'preset_exercise',
          '138',
          {
            exercise_id: 999,
            exercise_name: 'Step Ups',
          },
          {
            id: 138,
            exercise_id: 14,
            exercise_name: 'Bulgarian Split Squat',
          }
        ))
        changeSet.setMetadata("Swap exercise", "Swapping Bulgarian Split Squat for Step Ups")
        changeSet.setStatus('pending_approval')

        setChatMessages([
          { id: '1', role: 'user', parts: [{ type: 'text', text: 'Replace Bulgarian split squats with step ups' }] },
          { id: '2', role: 'assistant', parts: [{ type: 'text', text: "I'll swap out Bulgarian Split Squats for Step Ups. Both are unilateral exercises but Step Ups may be easier on balance." }] },
        ])
        break

      case 'delete_exercise':
        changeSet.upsert(createChangeRequest(
          'delete',
          'preset_exercise',
          '139',
          null,
          {
            id: 139,
            exercise_name: 'Barbell Row',
          }
        ))
        changeSet.setMetadata("Remove exercise", "Removing Barbell Row from the session")
        changeSet.setStatus('pending_approval')

        setChatMessages([
          { id: '1', role: 'user', parts: [{ type: 'text', text: 'Remove barbell row from the session' }] },
          { id: '2', role: 'assistant', parts: [{ type: 'text', text: "I'll remove Barbell Row from the session. Note: this will also remove it from superset A." }] },
        ])
        break

      case 'mixed_changes':
        // Add sets to 137
        for (let i = 0; i < 2; i++) {
          changeSet.upsert(createChangeRequest(
            'create',
            'preset_set',
            null,
            {
              session_plan_exercise_id: 137,
              reps: 6,
              weight: 120,
              rest_time: 240,
            }
          ))
        }
        // Update set in 138
        changeSet.upsert(createChangeRequest(
          'update',
          'preset_set',
          '303',
          {
            session_plan_exercise_id: 138,
            reps: 12,
            weight: 50,
          },
          {
            id: 303,
            session_plan_exercise_id: 138,
            reps: 10,
            weight: 40,
          }
        ))
        // Delete set from 139
        changeSet.upsert(createChangeRequest(
          'delete',
          'preset_set',
          '305',
          null,
          {
            id: 305,
            session_plan_exercise_id: 139,
            set_index: 1,
          }
        ))
        changeSet.setMetadata("Mixed changes", "Add 2 sets + Update 1 set + Delete 1 set")
        changeSet.setStatus('pending_approval')

        setChatMessages([
          { id: '1', role: 'user', parts: [{ type: 'text', text: 'Make the session more strength-focused' }] },
          { id: '2', role: 'assistant', parts: [{ type: 'text', text: "I've made several adjustments:\n• Added 2 heavy sets to RDL (6 reps @ 120kg)\n• Increased BSS set 1 to 12 reps @ 50kg\n• Removed the Barbell Row set to reduce volume" }] },
        ])
        break

      case 'superset_changes':
        // Update set in 138
        changeSet.upsert(createChangeRequest(
          'update',
          'preset_set',
          '303',
          {
            session_plan_exercise_id: 138,
            reps: 8,
            weight: 50,
          },
          {
            id: 303,
            session_plan_exercise_id: 138,
            reps: 10,
            weight: 40,
          }
        ))
        // Add set to 139
        changeSet.upsert(createChangeRequest(
          'create',
          'preset_set',
          null,
          {
            session_plan_exercise_id: 139,
            reps: 12,
            weight: 65,
            rest_time: 60,
          }
        ))
        changeSet.setMetadata("Superset changes", "Updating superset: modify reps/weight + add set")
        changeSet.setStatus('pending_approval')

        setChatMessages([
          { id: '1', role: 'user', parts: [{ type: 'text', text: 'Balance the superset A exercises' }] },
          { id: '2', role: 'assistant', parts: [{ type: 'text', text: "I've balanced superset A:\n• Increased BSS weight to 50kg with 8 reps\n• Added an extra set to Barbell Row to match" }] },
        ])
        break
    }
  }, [changeSet, createChangeRequest])

  // Apply scenario when user clicks a button (not in useEffect to avoid loops)

  // Handlers for approval (simulated execution)
  const handleApprove = useCallback(async () => {
    setIsExecuting(true)

    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Add success message to chat
    setChatMessages(prev => [
      ...prev,
      { id: `${Date.now()}`, role: 'assistant', parts: [{ type: 'text', text: '✅ Changes applied successfully!' }] },
    ])

    setIsExecuting(false)
    changeSet.clear()
    onScenarioChange('none')
  }, [changeSet, onScenarioChange])

  const handleRegenerate = useCallback((feedback?: string) => {
    setChatMessages(prev => [
      ...prev,
      { id: `${Date.now()}-user`, role: 'user', parts: [{ type: 'text', text: feedback || 'Try a different approach' }] },
      { id: `${Date.now()}-assistant`, role: 'assistant', parts: [{ type: 'text', text: "I'll revise my suggestions based on your feedback. What would you like me to change?" }] },
    ])
    changeSet.clear()
    onScenarioChange('none')
  }, [changeSet, onScenarioChange])

  const handleDismiss = useCallback(() => {
    setChatMessages(prev => [
      ...prev,
      { id: `${Date.now()}`, role: 'assistant', parts: [{ type: 'text', text: 'Changes dismissed. Let me know if you need anything else!' }] },
    ])
    changeSet.clear()
    onScenarioChange('none')
  }, [changeSet, onScenarioChange])

  // Handle demo chat submit (simulated)
  const handleChatSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    setChatMessages(prev => [
      ...prev,
      { id: `${Date.now()}-user`, role: 'user', parts: [{ type: 'text', text: chatInput }] },
      { id: `${Date.now()}-assistant`, role: 'assistant', parts: [{ type: 'text', text: "This is a demo. Use the scenario buttons above to simulate AI changes." }] },
    ])
    setChatInput('')
  }, [chatInput])

  // Exercise handlers using REAL shared context
  const handleToggleExpand = useCallback((exerciseId: number | string) => {
    setExercises((prev) =>
      prev.map((e) => (String(e.id) === String(exerciseId) ? { ...e, isCollapsed: !e.isCollapsed } : e))
    )
  }, [setExercises])

  const handleCompleteSet = useCallback((exerciseId: number | string, setId: number | string) => {
    setExercises((prev) =>
      prev.map((e) =>
        String(e.id) === String(exerciseId)
          ? {
              ...e,
              sets: e.sets.map((s) => (String(s.id) === String(setId) ? { ...s, completed: !s.completed } : s)),
            }
          : e
      )
    )
  }, [setExercises])

  const handleUpdateSet = useCallback((
    exerciseId: number | string,
    setId: number | string,
    field: keyof TrainingSet,
    value: number | string | null
  ) => {
    setExercises((prev) =>
      prev.map((e) =>
        String(e.id) === String(exerciseId)
          ? { ...e, sets: e.sets.map((s) => (String(s.id) === String(setId) ? { ...s, [field]: value } : s)) }
          : e
      )
    )
  }, [setExercises])

  const handleAddSet = useCallback((exerciseId: number | string) => {
    setExercises((prev) =>
      prev.map((e) => {
        if (String(e.id) !== String(exerciseId)) return e
        const lastSet = e.sets[e.sets.length - 1]
        const newSetIndex = e.sets.length + 1
        return {
          ...e,
          sets: [...e.sets, {
            id: `new_set_${Date.now()}`,
            session_plan_exercise_id: String(e.id),
            set_index: newSetIndex,
            reps: lastSet?.reps ?? null,
            weight: lastSet?.weight ?? null,
            completed: false,
            isEditing: false,
          }],
        }
      })
    )
  }, [setExercises])

  const handleRemoveSet = useCallback((exerciseId: number | string, setId: number | string) => {
    setExercises((prev) =>
      prev.map((e) => {
        if (String(e.id) !== String(exerciseId)) return e
        const newSets = e.sets.filter((s) => String(s.id) !== String(setId)).map((s, i) => ({ ...s, set_index: i + 1 }))
        return { ...e, sets: newSets }
      })
    )
  }, [setExercises])

  const handleAddExercise = useCallback((exercise: ExerciseLibraryItem, section: string) => {
    const exerciseId = parseInt(exercise.id, 10)
    if (isNaN(exerciseId)) return

    setExercises((prev) => {
      const maxOrder = Math.max(0, ...prev.map(e => e.exercise_order))
      const timestamp = Date.now()
      const newExercise: SessionPlannerExercise = {
        id: `new_${timestamp}`,
        session_plan_id: '1',
        exercise_id: exerciseId,
        exercise_order: maxOrder + 1,
        notes: null,
        isCollapsed: false,
        isEditing: false,
        validationErrors: [],
        exercise: {
          id: exerciseId,
          name: exercise.name,
          exercise_type_id: exercise.exerciseTypeId,
          exercise_type: { type: section || exercise.category || 'other' }
        },
        sets: [{
          id: `new_set_${timestamp}`,
          session_plan_exercise_id: '',
          set_index: 1,
          reps: null,
          weight: null,
          completed: false,
          isEditing: false,
        }]
      }
      return [...prev, newExercise]
    })
  }, [setExercises])

  const handleRemoveExercise = useCallback((exerciseId: number | string) => {
    setExercises((prev) => {
      const newExercises = prev.filter(e => String(e.id) !== String(exerciseId))
      return newExercises.map((ex, i) => ({ ...ex, exercise_order: i + 1 }))
    })
  }, [setExercises])

  const handleReorderSets = useCallback((exerciseId: number | string, fromIndex: number, toIndex: number) => {
    setExercises((prev) =>
      prev.map((e) => {
        if (String(e.id) !== String(exerciseId)) return e
        const newSets = [...e.sets]
        const [moved] = newSets.splice(fromIndex, 1)
        newSets.splice(toIndex, 0, moved)
        return { ...e, sets: newSets.map((s, i) => ({ ...s, set_index: i + 1 })) }
      })
    )
  }, [setExercises])

  const handleReorderExercises = useCallback((fromId: number | string, toId: number | string) => {
    setExercises((prev) => {
      const fromIndex = prev.findIndex((e) => String(e.id) === String(fromId))
      const toIndex = prev.findIndex((e) => String(e.id) === String(toId))
      if (fromIndex === -1 || toIndex === -1) return prev
      const newExercises = [...prev]
      const [movedExercise] = newExercises.splice(fromIndex, 1)
      newExercises.splice(toIndex, 0, movedExercise)
      return newExercises.map((ex, i) => ({ ...ex, exercise_order: i + 1 }))
    })
  }, [setExercises])

  const DeviceFrame = deviceView === "phone" ? PhoneFrame : deviceView === "tablet" ? TabletFrame : DesktopFrame
  const isAthlete = userMode === "athlete"

  return (
    <div className="space-y-6">
      {/* AI Control Panel (Demo-specific) */}
      <AIControlPanel
        scenario={scenario}
        onScenarioChange={onScenarioChange}
        onApplyScenario={applyScenario}
      />

      {/* REAL Inline Proposal Section (same as production) */}
      {changeSet.changeset && changeSet.status === 'pending_approval' && (
        <InlineProposalSection
          changeset={changeSet.changeset}
          onApprove={handleApprove}
          onRegenerate={handleRegenerate}
          onDismiss={handleDismiss}
          isExecuting={isExecuting}
        />
      )}

      {/* Debug Info */}
      <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
        <div className="flex gap-4 flex-wrap">
          <span>Status: <strong>{changeSet.status ?? 'null'}</strong></span>
          <span>Changes: <strong>{changeSet.changeset?.changeRequests.length ?? 0}</strong></span>
          <span>AI Map Size: <strong>{aiChangesByExercise.size}</strong></span>
        </div>
        {changeSet.changeset && changeSet.changeset.changeRequests.length > 0 && (
          <details>
            <summary className="cursor-pointer text-muted-foreground">View ChangeRequests</summary>
            <pre className="mt-2 p-2 bg-background rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(changeSet.changeset.changeRequests, null, 2)}
            </pre>
          </details>
        )}
      </div>

      {/* Device Frame with REAL WorkoutView */}
      <DeviceFrame>
        <WorkoutView
          title={isAthlete ? "Sprint Power Development" : "Week 3 Day 2"}
          description={isAthlete ? undefined : "Lower body power session"}
          exercises={trainingExercises}
          isAthlete={isAthlete}
          elapsedSeconds={elapsedSeconds}
          isTimerRunning={isTimerRunning}
          sessionStatus="ongoing"
          exerciseLibrary={EXERCISE_LIBRARY}
          onToggleTimer={onToggleTimer}
          onToggleExpand={handleToggleExpand}
          onCompleteSet={handleCompleteSet}
          onUpdateSet={handleUpdateSet}
          onAddSet={handleAddSet}
          onRemoveSet={handleRemoveSet}
          onAddExercise={handleAddExercise}
          onRemoveExercise={handleRemoveExercise}
          onReorderSets={handleReorderSets}
          onReorderExercises={handleReorderExercises}
          onFinishSession={() => alert('Session finished!')}
          aiChangesByExercise={aiChangesByExercise}
        />
      </DeviceFrame>

      {/* REAL ChatTrigger (same as production) */}
      <ChatTrigger
        onClick={() => setDrawerOpen(true)}
        hasChanges={changeSet.hasPendingChanges()}
        changeCount={changeSet.getPendingCount()}
      />

      {/* REAL ChatDrawer (same as production) */}
      <ChatDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        messages={chatMessages}
        input={chatInput}
        onInputChange={setChatInput}
        onSubmit={handleChatSubmit}
        isLoading={false}
      />
    </div>
  )
}

// =============================================================================
// Main Component with REAL Providers (same hierarchy as production)
// =============================================================================

export function WorkoutUIDemo() {
  const [deviceView, setDeviceView] = useState<DeviceView>("phone")
  const [userMode, setUserMode] = useState<UserMode>("coach")
  const [elapsedSeconds, setElapsedSeconds] = useState(1122)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [scenario, setScenario] = useState<AIScenario>('none')

  // Timer effect
  useEffect(() => {
    if (!isTimerRunning || userMode !== "athlete") return

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerRunning, userMode])

  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Workout UI Demo</h1>

            <div className="flex items-center gap-4">
              {/* Device tabs */}
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setDeviceView("phone")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    deviceView === "phone" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Smartphone className="w-4 h-4" />
                  Phone
                </button>
                <button
                  onClick={() => setDeviceView("tablet")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    deviceView === "tablet" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Tablet className="w-4 h-4" />
                  Tablet
                </button>
                <button
                  onClick={() => setDeviceView("desktop")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    deviceView === "desktop" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Monitor className="w-4 h-4" />
                  Desktop
                </button>
              </div>

              {/* User mode tabs */}
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setUserMode("athlete")}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    userMode === "athlete" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Athlete
                </button>
                <button
                  onClick={() => setUserMode("coach")}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    userMode === "coach" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Coach
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo content wrapped with REAL providers (same as production) */}
      <div className="py-8 px-4 max-w-6xl mx-auto">
        {/*
          Architecture matches production:
          SessionExercisesProvider ← Shared exercises state
            └── ChangeSetProvider ← AI changeset management
                  └── DemoContent (WorkoutView + ChatDrawer + InlineProposalSection)
        */}
        <SessionExercisesProvider initialExercises={createInitialExercises()}>
          <ChangeSetProvider>
            <DemoContent
              deviceView={deviceView}
              userMode={userMode}
              elapsedSeconds={elapsedSeconds}
              isTimerRunning={isTimerRunning}
              onToggleTimer={() => setIsTimerRunning((prev) => !prev)}
              scenario={scenario}
              onScenarioChange={setScenario}
            />
          </ChangeSetProvider>
        </SessionExercisesProvider>
      </div>
    </div>
  )
}
