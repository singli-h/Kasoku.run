# Init Pipeline - Engineering Tech Design

> Technical implementation design using Vercel AI SDK

---

## Overview

The Init Pipeline generates an initial training plan in 3 steps:
1. **Planning Agent** - Reasons about the plan structure (streamText)
2. **Structured Output Agent** - Outputs simple JSON (generateObject)
3. **Scaffolding** - Transforms simple JSON to full in-memory state (code)

This reduces API round-trips from 20+ to 2.

---

## Key Design Principle

**Init Pipeline does NOT use ChangeSet pattern.**

| Approach | When Used |
|----------|-----------|
| **Init Pipeline** | First-time plan creation (onboarding) |
| **ChangeSet Pattern** | Post-creation modifications via chat |

The Init Pipeline is simpler:
- Planning → Simple JSON → Scaffold → In-memory state
- No buffer, no change requests, no temp IDs
- Output ready for UI review

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT (React)                               │
├─────────────────────────────────────────────────────────────────┤
│  PlanGenerationReview.tsx                                       │
│    │                                                            │
│    ├── useInitPipeline()                                        │
│    │     │                                                      │
│    │     ├── Step 1: POST /api/ai/plan-generator/init-plan      │
│    │     │           → Returns planning summary (streaming)     │
│    │     │                                                      │
│    │     ├── Step 2: POST /api/ai/plan-generator/init-generate  │
│    │     │           → Returns simple JSON                      │
│    │     │                                                      │
│    │     └── Step 3: scaffoldPlan(simpleJson)                   │
│    │                 → Transforms to full in-memory state       │
│    │                                                            │
│    └── Display plan for user review                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 2 Schema (Simple, DB-Aligned)

The schema is intentionally simple - only fields that exist in database, flat structure.

```typescript
// /lib/init-pipeline/schemas.ts

import { z } from 'zod'

const ExerciseSchema = z.object({
  exercise_id: z.number().describe('Exercise ID from library'),
  sets: z.number().int().min(1).max(10).describe('Number of sets'),
  reps: z.number().int().min(1).max(50).describe('Reps per set'),
  weight: z.number().nullable().describe('Weight in kg, null for bodyweight'),
  rpe: z.number().min(1).max(10).describe('Target RPE'),
  rest_time: z.number().int().min(0).max(600).describe('Rest in seconds'),
})

const SessionSchema = z.object({
  day: z.number().int().min(0).max(6).describe('Day of week (0=Sun, 1=Mon, ...)'),
  name: z.string().describe('Session name (e.g., "Upper Body")'),
  description: z.string().describe('Why this session - agent reasoning'),
  exercises: z.array(ExerciseSchema).min(1),
})

const MicrocycleSchema = z.object({
  name: z.string().describe('Week name (e.g., "Week 1 - Foundation")'),
  sessions: z.array(SessionSchema).min(1),
})

export const SimpleGeneratedPlanSchema = z.object({
  plan_name: z.string(),
  plan_description: z.string(),
  microcycles: z.array(MicrocycleSchema).min(1).max(12),
})

export type SimpleGeneratedPlan = z.infer<typeof SimpleGeneratedPlanSchema>
```

### Why This Schema?

| Field | In Database? | Notes |
|-------|-------------|-------|
| `microcycle.name` | Yes | Week info embedded in name |
| `session.day` | Yes | `session_plans.day` (number) |
| `session.name` | Yes | `session_plans.name` |
| `session.description` | Yes | `session_plans.description` |
| `exercise.exercise_id` | Yes | `session_plan_exercises.exercise_id` |
| `exercise.sets` | No* | Scaffolding expands to set objects |
| `exercise.reps` | Yes | `session_plan_sets.reps` |
| `exercise.weight` | Yes | `session_plan_sets.weight` (nullable) |
| `exercise.rpe` | Yes | `session_plan_sets.rpe` |
| `exercise.rest_time` | Yes | `session_plan_sets.rest_time` |

*`sets` is a count that scaffolding expands into individual set records.

---

## Step 1: Planning Agent

### API Route

```typescript
// /api/ai/plan-generator/init-plan/route.ts

import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(req: Request) {
  const { context, exerciseLibrary } = await req.json()

  const result = streamText({
    model: openai('gpt-4o'),
    system: PLANNING_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildPlanningPrompt(context, exerciseLibrary),
      },
    ],
  })

  return result.toTextStreamResponse()
}
```

### Planning Prompt Should Include

Tell the planning agent to output:
- Specific exercise IDs from the library
- Sets, reps, weight (or null for bodyweight), RPE, rest time
- Session descriptions explaining the "why"
- Week structure with names

---

## Step 2: Structured Output Agent

### API Route

```typescript
// /api/ai/plan-generator/init-generate/route.ts

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { SimpleGeneratedPlanSchema } from '@/lib/init-pipeline/schemas'

export async function POST(req: Request) {
  const { planningSummary, context } = await req.json()

  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: SimpleGeneratedPlanSchema,
    system: GENERATION_SYSTEM_PROMPT,
    prompt: buildGenerationPrompt(planningSummary, context),
  })

  return Response.json({ plan: object })
}
```

### Generation System Prompt

```typescript
const GENERATION_SYSTEM_PROMPT = `You are a training plan data generator.

Output a structured training plan based on the planning summary.

## Field Requirements

- day: 0-6 (Sunday=0, Monday=1, etc.)
- sets: number of sets (1-10)
- reps: reps per set (1-50)
- weight: kg or null for bodyweight exercises
- rpe: 1-10
- rest_time: seconds (0-600)

## Rules

1. Use exercise_id from the planning summary
2. All exercises need sets, reps, rpe, rest_time
3. weight is null for bodyweight exercises
4. Include session description explaining the purpose

Output valid JSON matching the schema exactly.`
```

---

## Step 3: Scaffolding (Code)

### Transform Function

```typescript
// /lib/init-pipeline/scaffold.ts

import { v4 as uuidv4 } from 'uuid'
import type { SimpleGeneratedPlan } from './schemas'
import type { CurrentPlanState, MicrocycleData } from '@/lib/changeset/plan-generator/types'

export function scaffoldPlan(
  simplePlan: SimpleGeneratedPlan,
  mesocycleId: string
): CurrentPlanState {
  const microcycles: MicrocycleData[] = simplePlan.microcycles.map(
    (mc, mcIndex) => ({
      id: uuidv4(),
      mesocycle_id: mesocycleId,
      week_number: mcIndex + 1,
      name: mc.name,
      focus: null,
      is_deload: mc.name.toLowerCase().includes('deload'),
      session_plans: mc.sessions.map((session) => ({
        id: uuidv4(),
        name: session.name,
        day_of_week: DAY_NUMBER_TO_NAME[session.day],
        session_type: 'strength', // Default, could be inferred
        estimated_duration: 45,   // Default
        notes: session.description,
        session_plan_exercises: session.exercises.map((ex, exIndex) => ({
          id: uuidv4(),
          exercise_id: String(ex.exercise_id),
          exercise_name: '', // Will be populated from exercise library
          exercise_order: exIndex,
          superset_group: null,
          notes: null,
          // EXPAND sets count into individual set objects
          session_plan_sets: Array.from({ length: ex.sets }, (_, setIndex) => ({
            id: uuidv4(),
            set_number: setIndex + 1,
            reps: ex.reps,
            rpe: ex.rpe,
            rest_seconds: ex.rest_time,
            tempo: null,
            notes: null,
          })),
        })),
      })),
    })
  )

  return {
    mesocycle: { /* from context */ },
    microcycles,
  }
}

const DAY_NUMBER_TO_NAME: Record<number, string> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}
```

### What Scaffolding Does

| Input | Output |
|-------|--------|
| `sets: 4, reps: 6` | Array of 4 set objects with `set_number: 1-4` |
| `exercises[0]` | `exercise_order: 0` added |
| `microcycles[0]` | `week_number: 1` added |
| No IDs | UUIDs generated for all entities |
| `day: 1` | `day_of_week: 'monday'` |

---

## Hook: useInitPipeline

```typescript
// /lib/init-pipeline/useInitPipeline.ts

export function useInitPipeline(options: UseInitPipelineOptions): UseInitPipelineReturn {
  const [status, setStatus] = useState<InitPipelineStatus>('idle')
  const [generatedPlan, setGeneratedPlan] = useState<CurrentPlanState | null>(null)

  const startPipeline = useCallback(async () => {
    try {
      // Step 1: Planning (streaming)
      setStatus('planning')
      const summary = await runPlanningStep(context)

      // Step 2: Generation (structured output)
      setStatus('generating')
      const simplePlan = await runGenerationStep(summary, context)

      // Step 3: Scaffolding (code)
      setStatus('scaffolding')
      const fullPlan = scaffoldPlan(simplePlan, mesocycleId)
      setGeneratedPlan(fullPlan)

      setStatus('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pipeline failed')
      setStatus('error')
    }
  }, [context, mesocycleId])

  return { status, generatedPlan, error, startPipeline, reset }
}
```

---

## File Structure

```
apps/web/
├── app/api/ai/plan-generator/
│   ├── init-plan/
│   │   └── route.ts                # Planning step (streamText)
│   └── init-generate/
│       └── route.ts                # Structured output step (generateObject)
│
├── lib/init-pipeline/
│   ├── schemas.ts                  # Simple Zod schema for Step 2
│   ├── scaffold.ts                 # Step 3: Transform to full state
│   ├── prompts.ts                  # System prompts
│   ├── useInitPipeline.ts          # Pipeline orchestration hook
│   └── index.ts                    # Exports
│
└── components/features/first-experience/
    └── PlanGenerationReview.tsx    # Uses useInitPipeline
```

---

## Summary: 3-Step Pipeline

| Step | Tool | Input | Output |
|------|------|-------|--------|
| 1. Planning | `streamText` | User context, exercise library | Natural language plan |
| 2. Generation | `generateObject` | Planning summary | Simple JSON (flat) |
| 3. Scaffolding | Code | Simple JSON | Full in-memory state |

---

*Created: 2026-01-18*
*Updated: 2026-01-19*
*Status: Revised - Added Step 3 Scaffolding*
