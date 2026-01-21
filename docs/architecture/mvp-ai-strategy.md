# AI-Native MVP Strategy: "Fast & Focused"

## 1. Executive Summary
You are absolutely right. We do **NOT** need a heavy "Agent" architecture (containers, long-running threads) for 90% of user actions. That is over-engineering.

We will focus on **Stateless, Single-Turn AI** (using Vercel AI SDK Core `generateText` or `streamText`) for our MVP. This is fast (sub-2s), cheap, and infinitely scalable because there is no "memory state" to maintain on the server.

**The MVP Pivot:**
*   **Drop**: `architect_plan` (Complex 12-week generation). Too risky and slow for now.
*   **Keep**: "Quick Actions" for the daily workflow.
*   **Target Users**: Athlete logging a session & Coach tweaking a session.

---

## 2. The 3 MVP Tools (Refined & Simplified)

We strip down from 6 abstract capabilities to **3 Concrete Tools** that handle 80% of daily traffic.

### Tool A: `modify_session_content` (The Tweaker)
*   **User Intent**: "Swap squats for leg press", "Add 2 sets", "Delete the cardio".
*   **Target Table**: `exercise_training_sessions` (and its details).
*   **Mechanism**:
    *   Input: `session_id`, `modifications: [{ action: "add"|"remove"|"update", target: "exercise", details: ... }]`
    *   **Polymorphic?**: No. MVP focuses only on **Active/Assigned Sessions** (`exercise_training_sessions`). We ignore Templates for now to reduce complexity.
*   **Safety**: Uses strict Zod schema. AI outputs JSON, Backend executes DB update.

### Tool B: `log_session_performance` (The Logger)
*   **User Intent**: "I did 100kg for 5 reps, RPE 8", "Logged my run, felt good".
*   **Target Table**: `exercise_training_details`.
*   **Mechanism**:
    *   Input: `session_id`, `logs: [{ exercise_name: "Squat", sets: [{ weight: 100, reps: 5, rpe: 8 }] }]`
    *   **AI Value**: Unstructured text -> Structured Data. This is the "Killer Feature."
    *   **Feedback**: Updates `memories` table with "Session Summary" for future context.

### Tool C: `search_exercise_library` (The Helper)
*   **User Intent**: "Find a substitute for Back Squat", "What's a good chest exercise?".
*   **Target Table**: `exercises` (Vector Search).
*   **Mechanism**:
    *   Read-only. Returns top 5 matches.
    *   Used internally by Tool A to validate "Leg Press" exists before adding it.

---

## 3. Architecture: "Stateless Function Calling"

We will use **Vercel AI SDK (Core)** directly. No specialized "Agent Framework" overhead.

### The Flow (Chat Interface)
1.  **User**: "Change today's squat to leg press."
2.  **Client**: Sends message + `current_session_context` (JSON) to `/api/chat`.
3.  **Server (Stateless)**:
    *   Calls LLM (GPT-4o-mini or Claude Haiku for speed).
    *   Tools available: `modify_session_content`.
    *   LLM picks tool -> Server executes SQL -> Returns Result.
4.  **Client**: Updates UI optimistically or refetches session.

**Why this is Scalable:**
*   **No Containers**: It's just a serverless function execution.
*   **No Memory Bloat**: We pass the *relevant* session context (1 session = ~2KB) in the prompt. We don't load the whole 12-week history.
*   **Speed**: Expect <2s response time.

---

## 4. Implementation Steps (MVP)

1.  **Backend**: Create `apps/web/lib/ai/tools/session-tools.ts`.
    *   Implement `modifySessionContent` (Zod schema + DB Transaction).
    *   Implement `logSessionPerformance` (Zod schema + DB Insert).
2.  **API**: Create `apps/web/app/api/ai/session-assistant/route.ts`.
    *   Use `streamText` from `ai`.
    *   Bind the tools.
3.  **Frontend**: Build the "Chat Overlay".
    *   Re-use `SessionPlannerClient` components for rendering the "Preview".

This approach is **Surgical**. We fix the specific problem (Logging & Tweaking) without building a massive "General Intelligence" system.

