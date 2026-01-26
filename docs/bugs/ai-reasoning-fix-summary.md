# AI Reasoning Fix - Implementation Summary

**Date**: 2026-01-26
**Status**: ✅ Complete - Ready for Testing
**Build**: ✅ Compiles successfully with 0 TypeScript errors

## Problem Summary

AI assistant was showing "thinking" state but:
1. No reasoning/explanation shared with users
2. Messages disappeared after thinking completed
3. No visibility into what AI was doing

## Root Cause

**Missing AI SDK 6 reasoning configuration** in all assistant API routes:
- No `reasoningSummary` parameter → AI reasoning not streamed to client
- No `reasoningEffort` specification → Default reasoning level
- System prompt didn't explicitly ask AI to share thinking

## Changes Made

### 1. API Routes - Enable Reasoning Mode

All three assistant routes now have reasoning enabled:

#### [session-assistant/route.ts](../../apps/web/app/api/ai/session-assistant/route.ts)
```typescript
providerOptions: {
  openai: {
    reasoningEffort: 'high',      // Enable deep reasoning
    reasoningSummary: 'auto',     // Stream condensed reasoning
  },
},
onFinish: ({ text, toolCalls, usage, reasoning }) => {
  console.log('[session-assistant] Reasoning:', reasoning ? reasoning.substring(0, 200) : 'none')
  // ...
}
```

#### [workout-assistant/route.ts](../../apps/web/app/api/ai/workout-assistant/route.ts)
```typescript
providerOptions: {
  openai: {
    reasoningEffort: 'high',      // Enable deep reasoning
    reasoningSummary: 'auto',     // Stream condensed reasoning
  },
},
onFinish: ({ text, toolCalls, usage, reasoning }) => {
  console.log('[workout-assistant] Reasoning:', reasoning ? reasoning.substring(0, 200) : 'none')
  // ...
}
```

#### [plan-generator/route.ts](../../apps/web/app/api/ai/plan-generator/route.ts)
```typescript
providerOptions: {
  openai: {
    reasoningEffort: 'high',      // Enable deep reasoning
    reasoningSummary: 'auto',     // Stream condensed reasoning
  },
},
onFinish: ({ text, toolCalls, usage, reasoning }) => {
  console.log('[plan-generator] Reasoning:', reasoning ? reasoning.substring(0, 200) : 'none')
  // ...
}
```

### 2. System Prompts - Request Reasoning Sharing

Updated coach system prompt to explicitly ask AI to share reasoning:

#### [session-planner.ts](../../apps/web/lib/changeset/prompts/session-planner.ts)
```typescript
const PERSONA = `You are an expert strength and conditioning coach assistant.

// ... existing persona ...

**Communication Style:**
- Share your reasoning with the coach as you work through their request
- Explain your approach before making changes (e.g., "I'll search for plyometric exercises, then add them to the session")
- When using tools, explain what you're doing and why
- After proposing changes, briefly explain the rationale`
```

### 3. Frontend (Already Working)

No changes needed - frontend was already built to handle reasoning:

- **[ThinkingSection.tsx](../../apps/web/components/features/ai-assistant/ThinkingSection.tsx)**:
  - `extractThinkingContent()` extracts reasoning from message parts
  - `CompactThinkingSection` displays collapsible reasoning UI

- **[ChatMessage.tsx](../../apps/web/components/features/ai-assistant/shared/ChatMessage.tsx)**:
  - Extracts thinking content from AI messages
  - Renders `CompactThinkingSection` when reasoning exists
  - Separates reasoning from main message text

## How It Works Now

### AI SDK 6 Reasoning Flow

1. **User sends request** → `useChat` hook in frontend
2. **API receives request** → session-assistant/workout-assistant/plan-generator route
3. **streamText called with reasoning config**:
   ```typescript
   providerOptions: {
     openai: {
       reasoningEffort: 'high',      // AI thinks deeply
       reasoningSummary: 'auto',     // Reasoning sent to client
     }
   }
   ```
4. **AI generates reasoning** → Streamed as `part.type === 'reasoning'` events
5. **Frontend receives reasoning** → `useChat` hook includes in message.parts
6. **ChatMessage extracts reasoning** → `extractThinkingContent()` function
7. **User sees collapsible "Show reasoning" section** → `CompactThinkingSection` UI

### Example User Experience

**Before Fix:**
```
User: "Add 3 sets of squats"
AI: [thinking indicator shows]
AI: [thinking disappears]
User: "Nothing happened?"
```

**After Fix:**
```
User: "Add 3 sets of squats"
AI: [collapsible "Show reasoning" section]
    ↓ Click to expand
    "I'll search for squat exercises in the library,
     then add them to the session with 3 sets of
     appropriate reps based on the workout type..."
AI: "I've added 3 sets of Back Squats to your session"
```

## Testing Instructions

### Prerequisites

1. Dev server running: `npm run dev`
2. Logged into the app
3. Access to individual plan page with AI assistant

### Test Case 1: Session Planning with Reasoning

**Steps:**
1. Navigate to an individual plan page
2. Open AI chat assistant
3. Request: "Add plyometric exercises for power development"
4. **Expected behavior**:
   - ✅ AI shows "Thinking..." indicator initially
   - ✅ Collapsible "Show reasoning" section appears
   - ✅ Click to expand shows AI's thought process (e.g., "I'll search for plyometric exercises, considering...")
   - ✅ AI makes tool calls (searchExercises, createSessionPlanExerciseChangeRequest)
   - ✅ AI explains what it did after making changes
   - ✅ Proposal appears with clear description

### Test Case 2: Workout Logging with Reasoning

**Steps:**
1. Navigate to workout log page
2. Open AI chat assistant
3. Request: "I completed the squats but they felt too heavy, suggest adjustments"
4. **Expected behavior**:
   - ✅ AI shows reasoning about current workout state
   - ✅ Explains analysis of RPE/difficulty
   - ✅ Shows thought process for adjustment recommendations
   - ✅ Proposes specific changes with rationale

### Test Case 3: Plan Generation with Reasoning

**Steps:**
1. Navigate to plan generator
2. Start new plan generation
3. Request: "Create a 4-week strength block for sprinters"
4. **Expected behavior**:
   - ✅ AI shares reasoning about periodization approach
   - ✅ Explains exercise selection rationale
   - ✅ Shows thought process for programming decisions
   - ✅ Generates plan with clear explanations

### Test Case 4: Multi-Step Reasoning

**Steps:**
1. Open session planner AI
2. Request: "Replace the upper body exercises with Olympic lifting variations"
3. **Expected behavior**:
   - ✅ AI breaks down task into steps in reasoning
   - ✅ Shows search strategy for Olympic lifts
   - ✅ Explains replacement logic (which exercises match requirements)
   - ✅ Multiple reasoning sections if AI thinks in phases

### Verification Checklist

Check browser console logs:
```bash
# Should see reasoning output in API logs:
[session-assistant] Reasoning: I'll first search the exercise library for...
[session-assistant] Tool calls: ['searchExercises', 'createSessionPlanExerciseChangeRequest']
[session-assistant] Response text: I've added the following exercises...
```

Check UI:
- [ ] "Show reasoning" toggle appears in chat messages
- [ ] Clicking toggle expands/collapses reasoning content
- [ ] Reasoning is separate from main AI response text
- [ ] Icon shows lightbulb for completed thinking, sparkles for active
- [ ] Smooth animation for expand/collapse

Check functionality:
- [ ] AI proposals still work correctly
- [ ] Tool calls execute successfully
- [ ] ChangeSet approval flow unchanged
- [ ] No regression in existing features

## Troubleshooting

### Reasoning Not Showing

**Check 1: Is reasoning being sent?**
```bash
# Look for console logs:
[session-assistant] Reasoning: ...
```
- ✅ If present → Backend working, check frontend
- ❌ If "none" → OpenAI API issue or model doesn't support reasoning

**Check 2: Is frontend extracting it?**
```typescript
// In ChatMessage.tsx, add debug log:
console.log('Message parts:', message.parts)
console.log('Extracted thinking:', thinkingContent)
```
- Should see `type: 'reasoning'` or `type: 'text'` with thinking content

**Check 3: Is UI rendering it?**
- Inspect DOM for `CompactThinkingSection` component
- Check if `content` prop is populated

### Messages Still Disappearing

**Scenario**: AI completes tool calls but message vanishes

**Cause**: No text content and only tool parts

**Fix**: Verify `reasoningSummary: 'auto'` is configured - this ensures AI outputs text along with tool calls

### Performance Impact

**Cost**: GPT-5.2 with `reasoningEffort: 'high'` costs more tokens than default

**Monitoring**:
```typescript
onFinish: ({ usage }) => {
  console.log('Tokens:', usage)
  // Compare to baseline
}
```

**Optimization**: If cost is prohibitive, consider:
- `reasoningEffort: 'medium'` for simple tasks
- `reasoningSummary: 'detailed'` only for debugging
- Keep `'auto'` for production UX

## Architecture Notes

### AI SDK 6 Reasoning Parameters

**reasoningEffort** (OpenAI models only):
- Controls depth of internal reasoning processing
- Values: `'none'` | `'minimal'` | `'low'` | `'medium'` | `'high'` | `'xhigh'`
- Higher = better quality but slower + more expensive
- Default: `'medium'`

**reasoningSummary** (OpenAI models only):
- Controls whether reasoning is returned to client
- Values: `undefined` | `'auto'` | `'detailed'`
- `'auto'`: Condensed summary (recommended for UX)
- `'detailed'`: Comprehensive breakdown (debugging)
- `undefined`: No reasoning output (old broken behavior)
- **Critical**: Must be set to get reasoning in stream

### Stream Events

Reasoning arrives as separate stream events:
```typescript
// In streaming mode:
{ type: 'reasoning', content: "I'll search for..." }
{ type: 'tool-invocation', toolName: 'searchExercises', ... }
{ type: 'tool-result', result: [...] }
{ type: 'text', text: "I've added the exercises..." }
```

`useChat` hook automatically collects all parts into `message.parts[]`

### Frontend Extraction

`extractThinkingContent()` looks for reasoning in multiple formats:
1. AI SDK reasoning parts: `part.type === 'reasoning'`
2. XML-style tags: `<thinking>...</thinking>`
3. Markdown headers: `**Reasoning:**`
4. Natural patterns: "Let me think..."

This multi-format approach ensures compatibility even if AI formats reasoning differently.

## Related Files

### Backend
- ✅ `apps/web/app/api/ai/session-assistant/route.ts`
- ✅ `apps/web/app/api/ai/workout-assistant/route.ts`
- ✅ `apps/web/app/api/ai/plan-generator/route.ts`
- ✅ `apps/web/lib/changeset/prompts/session-planner.ts`
- ✅ `apps/web/app/api/ai/plan-generator/init-plan/route.ts` (already had reasoning)

### Frontend
- ℹ️ `apps/web/components/features/ai-assistant/ThinkingSection.tsx` (no changes needed)
- ℹ️ `apps/web/components/features/ai-assistant/shared/ChatMessage.tsx` (no changes needed)
- ℹ️ `apps/web/components/features/ai-assistant/SessionAssistant.tsx` (no changes needed)

### Documentation
- 📝 `docs/bugs/ai-reasoning-not-showing.md` (diagnostic)
- 📝 `docs/bugs/ai-reasoning-fix-summary.md` (this file)

## Next Steps

1. **Manual Testing**: Follow test cases above to verify reasoning displays correctly
2. **User Acceptance**: Have users try the AI assistant and report if reasoning is helpful
3. **Performance Monitoring**: Track token usage to ensure costs are acceptable
4. **Iterate on Prompts**: Refine "Communication Style" section based on user feedback

## References

- [AI SDK 6 OpenAI Provider](https://ai-sdk.dev/providers/ai-sdk-providers/openai)
- [GPT-5.2 Prompting Guide 2026](https://www.atlabs.ai/blog/gpt-5.2-prompting-guide-the-2026-playbook-for-developers-agents)
- [OpenAI GPT-5.2 Documentation](https://platform.openai.com/docs/models/gpt-5.2)
- [AI SDK Core: Generating Structured Data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)
