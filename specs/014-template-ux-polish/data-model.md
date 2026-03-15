# Data Model: Template & UX Polish

**Feature**: 014-template-ux-polish | **Date**: 2026-03-14

## Overview

No database schema changes. All changes are to TypeScript interfaces and server action input types. The goal is to align the template system's data types with the existing unified `TrainingExercise` / `TrainingSet` types used by plan and workout views.

## Type Changes

### 1. Remove: `SelectedExercise` (local to templates-page.tsx)

**Current definition** (lines 79–92 of `templates-page.tsx`):

```typescript
// DELETE THIS — replaced by TrainingExercise from training/types.ts
interface SelectedExercise {
  exerciseId: number
  exerciseName: string
  exerciseTypeId?: number
  sets: Array<{
    reps: number | null
    weight: number | null
    distance: number | null
    performing_time: number | null
    rest_time: number | null
    rpe: number | null
  }>
}
```

**Replaced by**: `TrainingExercise` from `@/components/features/training/types`

### 2. Existing: `TrainingExercise` (no changes needed)

```typescript
// From training/types.ts — used as-is for template state
interface TrainingExercise {
  id: string | number
  exerciseId: number
  name: string
  section: string              // Derive from exerciseTypeId for templates
  exerciseOrder: number
  exerciseTypeId?: number
  targetEventGroups?: string[]
  notes?: string
  expanded: boolean
  sets: TrainingSet[]
}
```

### 3. Existing: `TrainingSet` (no changes needed)

```typescript
// From training/types.ts — all fields already supported
interface TrainingSet {
  id: string | number
  setIndex: number
  reps: number | null
  weight: number | null
  distance: number | null
  performingTime: number | null  // camelCase UI format
  restTime: number | null        // camelCase UI format
  rpe: number | null
  tempo: string | null
  effort: number | null
  power: number | null
  velocity: number | null
  height: number | null
  resistance: number | null
  resistanceUnitId: number | null
  completed: boolean             // Always false for templates
  metadata?: Record<string, unknown> | null
}
```

### 4. Update: `CreateTemplateInput` (in session-plan-actions.ts)

**Current** (lines 1641–1656):
```typescript
// Only 6 fields — truncates data
sets: Array<{
  reps: number | null
  weight: number | null
  distance: number | null
  performing_time: number | null
  rest_time: number | null
  rpe: number | null
}>
```

**Updated**:
```typescript
// All TrainingSet fields in DB format
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
```

### 5. Existing Mappers (use as-is)

```typescript
// training/types.ts — already handles all field conversions
function dbPlanSetToTrainingSet(dbSet: any): TrainingSet
function trainingSetToDbPlanSet(set: TrainingSet, sessionPlanExerciseId: number): any
```

## Data Flow

```
Template Load:
  DB session_plan_sets → dbPlanSetToTrainingSet() → TrainingSet[] → TrainingExercise.sets

Template Save:
  TrainingExercise.sets → trainingSetToDbPlanSet() → DB session_plan_sets

AI Parse:
  ResolvedExercise[] → custom mapper → TrainingExercise[] → append to state
```

## Backward Compatibility

- Existing saved templates with only 6 fields load fine — `dbPlanSetToTrainingSet` fills missing fields with `null`
- New templates with all fields save fine — `trainingSetToDbPlanSet` maps all fields to DB columns
- No migration needed for existing data
