# Quickstart: Template & UX Polish

**Feature**: 014-template-ux-polish | **Date**: 2026-03-14

## What This Feature Does

1. **Template Unification** — Replace custom `TemplateExerciseBlock` with the same `ExerciseCard` used in plan/workout views. Adds exercise/set DnD reorder, expand/collapse, and all field types.
2. **Template AI Parser** — Add `PasteProgramDialog` to the template page with a gradient AI button so coaches can paste workout text and have AI parse it into structured exercises.
3. **Toast Consolidation** — Fix the dual toast state store bug, set reasonable auto-dismiss timers, replace `alert()` calls, standardize title casing.
4. **Field Toggle** — Add `showAdvancedFields` toggle to template edit mode so coaches can show/hide advanced fields (tempo, velocity, power, etc.).

## Key Files

| File | What Changes |
|------|-------------|
| `apps/web/components/features/plans/components/templates-page.tsx` | Major refactor: replace `SelectedExercise` with `TrainingExercise`, replace `TemplateExerciseBlock` with `ExerciseCard`, add DnD, add AI parser button, add field toggle |
| `apps/web/actions/plans/session-plan-actions.ts` | Expand `CreateTemplateInput` and action inserts to accept all TrainingSet fields |
| `apps/web/components/ui/toaster.tsx` | Fix import to `@/hooks/use-toast` |
| `apps/web/hooks/use-toast.ts` | Set `TOAST_REMOVE_DELAY = 5000`, add success variant |
| `apps/web/components/ui/use-toast.ts` | DELETE (duplicate) |
| `apps/web/components/ui/sonner.tsx` | DELETE (unused) |
| `apps/web/components/features/plans/home/PlansHomeClient.tsx` | Replace `alert()` with toast |

## Key Types

```typescript
// USE THIS for template exercise state (from training/types.ts)
import type { TrainingExercise, TrainingSet } from '../training/types'

// USE THESE for DB ↔ UI conversion (from training/types.ts)
import { dbPlanSetToTrainingSet, trainingSetToDbPlanSet } from '../training/types'

// USE THIS for field visibility (from training/utils/field-visibility.ts)
import { getVisibleFields } from '../training/utils/field-visibility'

// USE THIS for AI parser output
import type { ResolvedExercise } from '../training/components/PasteProgramDialog'

// USE THIS for field toggle (from lib/hooks/useAdvancedFieldsToggle.ts)
import { useAdvancedFieldsToggle } from '@/lib/hooks/useAdvancedFieldsToggle'
```

## ExerciseCard Usage in Templates

```tsx
<ExerciseCard
  exercise={trainingExercise}   // TrainingExercise with all fields
  isAthlete={false}             // Always false for templates
  showAllFields={showAdvancedFields}  // From useAdvancedFieldsToggle
  onToggleExpand={() => handleToggleExpand(exercise.id)}
  onUpdateSet={(setId, field, value) => handleUpdateSet(exercise.id, setId, field, value)}
  onAddSet={() => handleAddSet(exercise.id)}
  onRemoveSet={(setId) => handleRemoveSet(exercise.id, setId)}
  onRemoveExercise={() => handleRemoveExercise(exercise.id)}
  onReorderSets={(fromIndex, toIndex) => handleReorderSets(exercise.id, fromIndex, toIndex)}
  // DnD props
  isDragging={draggingExerciseId === exercise.id}
  onDragStart={() => setDraggingExerciseId(exercise.id)}
  onDragOver={(e) => handleExerciseDragOver(e, exercise.id)}
  onDragEnd={() => setDraggingExerciseId(null)}
  onDrop={() => handleExerciseDrop(exercise.id)}
/>
```

## AI Parser Button

```tsx
import { AnimatedGradientText } from '@/components/composed/animated-gradient-text'
import { PasteProgramDialog } from '@/components/features/training/components/PasteProgramDialog'

<Button onClick={() => setPasteProgramOpen(true)} variant="outline">
  <AnimatedGradientText>
    <Sparkles className="h-4 w-4 mr-1" />
    AI Parse
  </AnimatedGradientText>
</Button>

<PasteProgramDialog
  open={pasteProgramOpen}
  onOpenChange={setPasteProgramOpen}
  onExercisesResolved={handleAIParsedExercises}
/>
```

## ResolvedExercise → TrainingExercise Mapper

```typescript
function resolvedToTrainingExercise(
  resolved: ResolvedExercise,
  order: number
): TrainingExercise {
  return {
    id: `template-new-${resolved.resolvedExerciseId}-${Date.now()}`,
    exerciseId: resolved.resolvedExerciseId,
    name: resolved.resolvedExerciseName,
    section: resolved.resolvedExerciseType || 'Gym',
    exerciseOrder: order,
    exerciseTypeId: resolved.resolvedExerciseTypeId ?? undefined,
    expanded: true,
    sets: resolved.sets.map((s, idx) => ({
      id: `new-set-${Date.now()}-${idx}`,
      setIndex: idx + 1,
      reps: s.reps ?? null,
      weight: s.weight ?? null,
      distance: s.distance ?? null,
      performingTime: s.performing_time ?? null,
      restTime: s.rest_time ?? null,
      rpe: s.rpe ?? null,
      tempo: null,
      effort: null,
      power: null,
      velocity: null,
      height: null,
      resistance: null,
      resistanceUnitId: null,
      completed: false,
      metadata: null,
    })),
  }
}
```

## Toast Pattern (after consolidation)

```typescript
import { useToast } from '@/hooks/use-toast'

const { toast } = useToast()

// Success
toast({ title: "Template saved", description: "Your changes have been saved" })

// Error (uses destructive variant — persists longer)
toast({ title: "Save failed", description: "Please try again", variant: "destructive" })
```
