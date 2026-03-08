# Bug Report: AI Reasoning Not Showing

**Date**: 2026-01-26
**Severity**: High
**Status**: Identified, Fix in Progress

## Issue Description

User reports that when asking the AI assistant to do something:
1. AI shows "thinking" state with animated indicator
2. No reasoning is shared with the user during thinking
3. After a while, the AI thinking state disappears
4. Nothing is changed or updated in the UI

## Root Causes

### 1. Missing `reasoningSummary` Configuration

**File**: `apps/web/app/api/ai/session-assistant/route.ts` (line 91-101)

```typescript
// CURRENT (BROKEN):
const result = streamText({
  model: openai('gpt-5.2'),
  system: systemPrompt,
  messages: modelMessages,
  tools: coachDomainTools,
  // ❌ NO reasoningSummary configuration!
})
```

**Problem**: GPT-5.2 reasoning mode requires `reasoningSummary` to be explicitly set to `'auto'` or `'detailed'` in `providerOptions.openai`. Without this, the AI's internal reasoning process is NOT streamed to the client, even though the model is thinking.

**Same Issue In**:
- `apps/web/app/api/ai/workout-assistant/route.ts` (line 99-106)
- `apps/web/app/api/ai/plan-generator/route.ts` (line 53-60)

### 2. Missing `reasoningEffort` Configuration

**Current State**: The session-assistant and workout-assistant routes don't specify `reasoningEffort`, defaulting to `'medium'`.

**Better Practice**: Use `'high'` for complex planning tasks (as seen in `init-plan/route.ts`).

### 3. System Prompt Doesn't Request Reasoning Sharing

**File**: `apps/web/lib/changeset/prompts/session-planner.ts`

The system prompt doesn't explicitly ask the AI to share its thinking process with the user. While AI SDK 6 handles reasoning summaries automatically when configured, the prompt should reinforce this expectation.

## How It Should Work (AI SDK 6 + GPT-5.2)

### Correct Configuration

```typescript
const result = streamText({
  model: openai('gpt-5.2'),
  system: systemPrompt,
  messages: modelMessages,
  tools: coachDomainTools,
  providerOptions: {
    openai: {
      reasoningEffort: 'high',        // ✅ Enable deep reasoning
      reasoningSummary: 'auto',       // ✅ Stream condensed reasoning to client
    },
  },
})
```

### Reasoning Flow in AI SDK 6

1. **Streaming Mode** (our use case):
   - Reasoning content arrives as stream events with `part.type === 'reasoning'`
   - The `useChat` hook automatically includes reasoning parts in message.parts
   - Frontend extracts reasoning using `extractThinkingContent()` (already implemented)
   - `CompactThinkingSection` displays reasoning in collapsible UI (already implemented)

2. **Non-Streaming Mode**:
   - Reasoning available in `result.reasoning` field

### Frontend Integration (Already Built)

Our frontend is ALREADY ready to display reasoning:

**File**: `apps/web/components/features/ai-assistant/shared/ChatMessage.tsx`
- Lines 28-37: Extracts thinking content from message parts
- Lines 94-96: Renders `CompactThinkingSection` when reasoning exists

**File**: `apps/web/components/features/ai-assistant/ThinkingSection.tsx`
- `extractThinkingContent()`: Looks for `<thinking>`, `**Reasoning:**`, or thinking patterns
- `CompactThinkingSection`: Collapsible reasoning UI

**The frontend works!** The problem is the backend isn't sending reasoning content.

## Why Messages Disappear

When the AI completes tool calls but doesn't output text:

1. Tool calls execute (user sees "Processing X actions..." loading state)
2. Tools complete successfully
3. AI has no reasoning summary configured → no text content sent
4. Message has only tool parts, no text content
5. `ChatMessage` component (line 76) returns `null` for empty messages
6. User sees message disappear

## Verification Steps

### Check If Reasoning Is Being Sent

Add logging to session-assistant route:

```typescript
const result = streamText({
  // ... config
  onFinish: ({ text, toolCalls, usage, reasoning }) => {
    console.log('[session-assistant] Response text:', text?.substring(0, 200))
    console.log('[session-assistant] Reasoning:', reasoning)  // ← Add this
    console.log('[session-assistant] Tool calls:', toolCalls?.map(t => t.toolName))
  },
})
```

### Check Frontend Extraction

The `extractThinkingContent()` function looks for:
- `<thinking>...</thinking>` tags
- `**Reasoning:**` markdown blocks
- "Let me think..." patterns

If reasoning is sent but not displayed, check console for extraction failures.

## AI SDK 6 Best Practices (2026)

Per [AI SDK OpenAI Provider docs](https://ai-sdk.dev/providers/ai-sdk-providers/openai):

### Reasoning Configuration

```typescript
providerOptions: {
  openai: {
    reasoningEffort: 'high',           // Depth: none/minimal/low/medium/high/xhigh
    reasoningSummary: 'auto',          // Output: undefined/'auto'/'detailed'
  }
}
```

### When to Use Each Setting

- **reasoningEffort**:
  - `'none'`: Disable reasoning (fastest, cheapest)
  - `'low'`: Simple tasks
  - `'medium'`: Default, balanced
  - `'high'`: Complex planning, multi-step reasoning (our use case)
  - `'xhigh'`: Most complex tasks (GPT-5.1-Codex-Max only)

- **reasoningSummary**:
  - `undefined`: No reasoning output (current broken state)
  - `'auto'`: Condensed summary (recommended for UX)
  - `'detailed'`: Comprehensive breakdown (verbose, better for debugging)

## Related Files

### Backend (API Routes)
- ✅ `apps/web/app/api/ai/plan-generator/init-plan/route.ts` - Already uses `reasoningEffort: 'high'`
- ❌ `apps/web/app/api/ai/session-assistant/route.ts` - Missing reasoning config
- ❌ `apps/web/app/api/ai/workout-assistant/route.ts` - Missing reasoning config
- ❌ `apps/web/app/api/ai/plan-generator/route.ts` - Missing reasoning config

### Frontend (UI Components)
- ✅ `apps/web/components/features/ai-assistant/ThinkingSection.tsx` - Working
- ✅ `apps/web/components/features/ai-assistant/shared/ChatMessage.tsx` - Working

### Prompts
- ⚠️ `apps/web/lib/changeset/prompts/session-planner.ts` - Could add reasoning guidance

## Fix Plan

1. **Add reasoning configuration to all AI routes** (session-assistant, workout-assistant, plan-generator)
2. **Update system prompts** to encourage reasoning sharing (optional but recommended)
3. **Test reasoning display** in browser with various AI requests
4. **Verify tool call + reasoning flow** works correctly

## References

- [AI SDK OpenAI Provider - Reasoning Mode](https://ai-sdk.dev/providers/ai-sdk-providers/openai)
- [GPT-5.2 Prompting Guide 2026](https://www.atlabs.ai/blog/gpt-5.2-prompting-guide-the-2026-playbook-for-developers-agents)
- [OpenAI GPT-5.2 Documentation](https://platform.openai.com/docs/models/gpt-5.2)
