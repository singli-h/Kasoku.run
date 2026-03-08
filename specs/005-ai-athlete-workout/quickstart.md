# Quickstart: AI Athlete Workout Assistant

**Feature**: 005-ai-athlete-workout
**Date**: 2026-01-01

## Prerequisites

- Node.js 20.9+ (required by Next.js 16)
- Existing 002-ai-session-assistant implementation complete
- OpenAI API key configured in `.env.local`

## Quick Implementation Guide

### Step 1: Create Athlete Proposal Tools

Create `apps/web/lib/changeset/tools/athlete-proposal-tools.ts`:

```typescript
/**
 * Athlete Domain Proposal Tools
 *
 * Tools that create ChangeRequests for workout modifications.
 * Athletes can log sets, swap exercises, and add notes.
 */

import { z } from 'zod'
import { tool } from 'ai'

// Helper transforms (reuse from proposal-tools.ts)
const emptyToUndefined = (v: string | undefined) => (v === '' ? undefined : v)
const emptyNumToUndefined = (v: number | undefined) =>
  v === undefined || (typeof v === 'string' && v === '') ? undefined : v

// ============================================================================
// Set Tools (workout_log_set)
// ============================================================================

export const createTrainingSetChangeRequestSchema = z.object({
  workoutLogExerciseId: z.string().describe('Workout log exercise ID'),
  setIndex: z.number().int().min(1).describe('Which set (1-based)'),
  reps: z.number().int().min(0).optional().transform(emptyNumToUndefined)
    .describe('Actual reps (0 = skipped)'),
  weight: z.number().optional().transform(emptyNumToUndefined)
    .describe('Actual weight used (kg)'),
  rpe: z.number().int().min(1).max(10).optional().transform(emptyNumToUndefined)
    .describe('How hard it felt (1-10)'),
  completed: z.boolean().default(true),
  reasoning: z.string().describe('Why this performance is being logged'),
})

export const createTrainingSetChangeRequestTool = tool({
  description: "Log the athlete's actual performance for a set.",
  inputSchema: createTrainingSetChangeRequestSchema,
})

export const updateTrainingSetChangeRequestSchema = z.object({
  workoutLogSetId: z.string().describe('ID of the set to update'),
  reps: z.number().int().optional().transform(emptyNumToUndefined),
  weight: z.number().optional().transform(emptyNumToUndefined),
  rpe: z.number().int().min(1).max(10).optional().transform(emptyNumToUndefined),
  completed: z.boolean().optional(),
  reasoning: z.string().describe('Why this correction is being made'),
})

export const updateTrainingSetChangeRequestTool = tool({
  description: 'Update performance data that was already logged.',
  inputSchema: updateTrainingSetChangeRequestSchema,
})

// ============================================================================
// Exercise Tools (workout_log_exercise)
// ============================================================================

export const updateTrainingExerciseChangeRequestSchema = z.object({
  workoutLogExerciseId: z.string().describe('ID of the workout log exercise'),
  exerciseId: z.string().optional().transform(emptyToUndefined)
    .describe('New exercise ID (for swapping)'),
  exerciseName: z.string().optional().transform(emptyToUndefined)
    .describe('New exercise name (required when swapping)'),
  notes: z.string().optional().transform(emptyToUndefined),
  reasoning: z.string().describe('Why this change is being made'),
})

export const updateTrainingExerciseChangeRequestTool = tool({
  description: 'Update an exercise in the workout. To swap exercises, provide a new exerciseId.',
  inputSchema: updateTrainingExerciseChangeRequestSchema,
})

// ============================================================================
// Session Tools (workout_log)
// ============================================================================

export const updateTrainingSessionChangeRequestSchema = z.object({
  workoutLogId: z.string().describe('ID of the workout log'),
  notes: z.string().optional().transform(emptyToUndefined)
    .describe('Session notes'),
  reasoning: z.string().describe('Why this note is being added'),
})

export const updateTrainingSessionChangeRequestTool = tool({
  description: "Update the athlete's workout session notes.",
  inputSchema: updateTrainingSessionChangeRequestSchema,
})

// ============================================================================
// Export
// ============================================================================

export const athleteProposalTools = {
  createTrainingSetChangeRequest: createTrainingSetChangeRequestTool,
  updateTrainingSetChangeRequest: updateTrainingSetChangeRequestTool,
  updateTrainingExerciseChangeRequest: updateTrainingExerciseChangeRequestTool,
  updateTrainingSessionChangeRequest: updateTrainingSessionChangeRequestTool,
}
```

### Step 2: Update Tools Index

Add to `apps/web/lib/changeset/tools/index.ts`:

```typescript
import { athleteProposalTools } from './athlete-proposal-tools'

// ... existing exports ...

/**
 * All tools for the Athlete domain.
 */
export const athleteDomainTools = {
  ...readTools,  // getSessionContext, searchExercises
  ...athleteProposalTools,
  ...coordinationTools,
}

export type AthleteToolName = keyof typeof athleteDomainTools
```

### Step 3: Create Athlete System Prompt

Create `apps/web/lib/changeset/prompts/workout-athlete.ts`:

```typescript
export function buildAthletePrompt(workoutContext?: WorkoutContext): string {
  const contextSection = workoutContext ? `
## Current Workout

Session: ${workoutContext.session.name}
Status: ${workoutContext.session.sessionStatus}
Progress: ${workoutContext.progress.completedSets}/${workoutContext.progress.totalSets} sets completed

Exercises:
${workoutContext.exercises.map(e => `- ${e.exerciseName} (${e.sets.length} sets)`).join('\n')}
` : ''

  return `You are a workout assistant helping an athlete log and modify their training session.

${contextSection}

## Your Capabilities

1. **Log Set Performance**: When the athlete tells you their reps, weight, or RPE, use createTrainingSetChangeRequest
2. **Update Logged Data**: If they made a mistake, use updateTrainingSetChangeRequest
3. **Swap Exercises**: If equipment is unavailable or they have discomfort, use updateTrainingExerciseChangeRequest
4. **Add Notes**: Capture session feedback with updateTrainingSessionChangeRequest
5. **Search Exercises**: Find alternatives using searchExercises

## Rules

1. ALWAYS use tools - never just describe what you would do
2. After proposing changes, call confirmChangeSet to submit for approval
3. Athletes CANNOT delete exercises - only swap or mark sets as skipped
4. If a set is skipped, log it with reps=0 and completed=false
5. Be concise - athletes are mid-workout

## Example Interactions

User: "I did 8 reps at 100kg"
→ Use createTrainingSetChangeRequest with reps=8, weight=100

User: "Actually that was 10 reps"
→ Use updateTrainingSetChangeRequest to correct

User: "Skip the last set, I'm done"
→ Use createTrainingSetChangeRequest with reps=0, completed=false

User: "My knee hurts, what can I do instead of squats?"
→ Use searchExercises with injuryConsiderations=["knee"]
`
}
```

### Step 4: Create API Route

Create `apps/web/app/api/ai/workout-assistant/route.ts`:

```typescript
import { streamText, convertToModelMessages } from 'ai'
import { openai } from '@ai-sdk/openai'
import { auth } from '@clerk/nextjs/server'
import supabase from '@/lib/supabase-server'
import { getDbUserId } from '@/lib/user-cache'
import { athleteDomainTools } from '@/lib/changeset/tools'
import { buildAthletePrompt } from '@/lib/changeset/prompts/workout-athlete'

export const maxDuration = 30

export async function POST(req: Request) {
  // 1. Authenticate
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return new Response('User not found', { status: 404 })

  // 2. Parse request
  const { messages, workoutLogId } = await req.json()
  if (!workoutLogId) return new Response('Workout ID required', { status: 400 })

  // 3. Verify athlete owns this workout
  const { data: workout } = await supabase
    .from('workout_logs')
    .select('id, athletes!inner(user_id)')
    .eq('id', workoutLogId)
    .single()

  if (!workout || workout.athletes.user_id !== dbUserId) {
    return new Response('Forbidden', { status: 403 })
  }

  // 4. Get workout context
  const workoutContext = await getWorkoutContext(workoutLogId)

  // 5. Stream response
  const result = streamText({
    model: openai('gpt-4o'),
    system: buildAthletePrompt(workoutContext),
    messages: await convertToModelMessages(messages),
    tools: athleteDomainTools,
  })

  return result.toUIMessageStreamResponse()
}
```

### Step 5: Create Wrapper Component

Create `apps/web/app/(protected)/workout/[id]/WorkoutAssistantWrapper.tsx`:

```typescript
'use client'

import { ChangeSetProvider } from '@/lib/changeset/ChangeSetContext'
import { ChatDrawer } from '@/components/features/ai-assistant/ChatDrawer'
import { ApprovalBanner } from '@/components/features/ai-assistant/ApprovalBanner'
import { useChat } from '@ai-sdk/react'

export function WorkoutAssistantWrapper({
  workoutLogId,
  children,
}: {
  workoutLogId: number
  children: React.ReactNode
}) {
  const { messages, append, isLoading } = useChat({
    api: '/api/ai/workout-assistant',
    body: { workoutLogId },
  })

  return (
    <ChangeSetProvider>
      {children}
      <ChatDrawer
        messages={messages}
        onSend={(text) => append({ role: 'user', content: text })}
        isLoading={isLoading}
      />
      <ApprovalBanner />
    </ChangeSetProvider>
  )
}
```

### Step 6: Integrate with Workout Page

Update `apps/web/app/(protected)/workout/[id]/page.tsx`:

```typescript
import { WorkoutAssistantWrapper } from './WorkoutAssistantWrapper'

export default async function WorkoutPage({ params }: { params: { id: string } }) {
  const workoutLogId = parseInt(params.id)

  return (
    <WorkoutAssistantWrapper workoutLogId={workoutLogId}>
      {/* Existing workout page content */}
    </WorkoutAssistantWrapper>
  )
}
```

## Verification Steps

1. **Tools load correctly**:
   ```bash
   npm run type-check
   ```

2. **API route responds**:
   ```bash
   curl -X POST http://localhost:3000/api/ai/workout-assistant \
     -H "Content-Type: application/json" \
     -d '{"workoutLogId": 1, "messages": []}'
   # Should return 401 (need auth) or 403 (not owner)
   ```

3. **E2E test**:
   - Open a workout session as an athlete
   - Open the AI assistant drawer
   - Type "I did 8 reps at 100kg"
   - Verify a change request appears
   - Click Approve
   - Verify data saved to database

## Common Issues

### Issue: Tools not recognized
**Solution**: Ensure `athleteDomainTools` is exported from index.ts

### Issue: 403 Forbidden
**Solution**: Verify athlete owns the workout (check `athletes.user_id`)

### Issue: Changes not saving
**Solution**: Verify `execute-workout.ts` handles the entity type

## Next Steps

After basic flow works:

1. Add `getExerciseHistory` tool (P2)
2. Add permission checking for coach restrictions (P2)
3. Add E2E tests
4. Polish system prompt for better natural language understanding
