# Contract: Template Exercise Data Flow

**Feature**: 014-template-ux-polish | **Date**: 2026-03-14

## Overview

This contract defines how exercise data flows between the template UI, the unified `ExerciseCard` component, and the server actions for save/load. The key change is replacing the template-local `SelectedExercise` type with the shared `TrainingExercise` type.

## Contract 1: Template State ↔ ExerciseCard

### Provider: `templates-page.tsx` (template edit state)
### Consumer: `ExerciseCard` component

```typescript
// Template state provides TrainingExercise[] to ExerciseCard
// ExerciseCard calls back with set-level updates

interface TemplateExerciseCallbacks {
  onToggleExpand: (exerciseId: string | number) => void
  onUpdateSet: (exerciseId: string | number, setId: string | number, field: keyof TrainingSet, value: number | string | null) => void
  onAddSet: (exerciseId: string | number) => void
  onRemoveSet: (exerciseId: string | number, setId: string | number) => void
  onRemoveExercise: (exerciseId: string | number) => void
  onReorderSets: (exerciseId: string | number, fromIndex: number, toIndex: number) => void
  // DnD handled at parent level via drag state
}
```

**Invariants:**
- `exercise.id` must be stable across re-renders (string or number, not array index)
- `exercise.sets[].id` must be stable (not `template-${idx}`)
- `exercise.section` must be a non-empty string (default to exercise type name)
- `exercise.completed` is always `false` for template exercises
- `isAthlete` is always `false`

## Contract 2: Template State ↔ Server Actions

### Provider: `templates-page.tsx` (on save)
### Consumer: `createTemplateAction` / `updateTemplateAction`

```typescript
// Template converts TrainingExercise[] back to DB format for save

interface TemplateExercisePayload {
  exercise_id: number
  exercise_order: number
  sets: Array<{
    set_index: number
    reps: number | null
    weight: number | null
    distance: number | null
    performing_time: number | null
    rest_time: number | null
    rpe: number | null
    tempo: string | null
    effort: number | null
    power: number | null
    velocity: number | null
    height: number | null
    resistance: number | null
    resistance_unit_id: number | null
    metadata: Record<string, unknown> | null
  }>
}
```

**Conversion**: Use `trainingSetToDbPlanSet()` from `training/types.ts` for each set.

**Invariants:**
- All fields must be present (use `null` for unset values)
- `set_index` is 1-based, sequential
- `exercise_order` is 0-based, sequential
- Field names are snake_case (DB format)

## Contract 3: PasteProgramDialog ↔ Template State

### Provider: `PasteProgramDialog` (on resolve)
### Consumer: `templates-page.tsx` (exercise insertion handler)

```typescript
// PasteProgramDialog outputs ResolvedExercise[]
// Template page converts to TrainingExercise[] and appends to state

interface ResolvedExercise {
  exerciseName: string
  exerciseType: string          // 'gym' | 'sprint' | 'drill' | ...
  sets: ParsedSet[]             // { reps, weight, distance, performing_time, rest_time, rpe }
  resolvedExerciseId: number
  resolvedExerciseName: string
  resolvedExerciseTypeId?: number | null
  resolvedExerciseType?: string | null
  resolutionType: "matched" | "created"
  targetEventGroups?: string[] | null
  notes?: string | null
  sectionName?: string | null
}
```

**Conversion**: Use `resolvedToTrainingExercise()` mapper (defined in quickstart.md).

**Invariants:**
- `resolvedExerciseId` is always a valid library exercise ID (matched or created)
- New exercises get unique `id` strings (e.g., `template-new-${exerciseId}-${timestamp}`)
- `exerciseOrder` continues from the last existing exercise's order
- Missing set fields default to `null`

## Contract 4: Toast API

### Provider: `@/hooks/use-toast` (canonical hook)
### Consumer: All feature files

```typescript
// Single hook, single state store, single Toaster reader
import { useToast } from '@/hooks/use-toast'

const { toast } = useToast()

// API shape (unchanged)
toast({
  title: string,              // Sentence case: "Template saved"
  description?: string,       // Optional detail
  variant?: 'default' | 'destructive'  // destructive = error styling
})
```

**Invariants:**
- All files import from `@/hooks/use-toast` (not `@/components/ui/use-toast`)
- `<Toaster>` in layout reads from the same store
- Titles use sentence case (not Title Case)
- No `alert()` or `toast()` from `"sonner"` anywhere
