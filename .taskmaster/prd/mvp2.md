<context>
# MVP 2 – AI Features: Plan Builder, Review & Suggest, Coach Knowledge Base

This PRD defines the first AI layer on top of MVP1 foundations. It focuses on two durable skills that directly help coaches and athletes without feature creep: (A) Plan Builder (draft or review/suggest) and (B) a private Coach Knowledge Base guiding AI outputs. It includes minimal memory scaffolding for conversations and preferences, and an embeddings pipeline to ensure correct exercise selection.

Constraints:
- Minimal, Apple‑like UI. Streaming, concise, preview-then-apply. No auto-changes without human review.
- Privacy and RLS: AI server actions call existing actions, never bypassing policies.

</context>

<PRD>
# Technical Architecture

## System Components (New)
- AI streaming endpoint: `apps/web/app/api/ai/chat/route.ts` (SSE)
- AI orchestration actions: `apps/web/actions/ai/chat-actions.ts`
- Provider abstraction: `apps/web/lib/ai/providers.ts` (model switch, rate limits)
- Prompts library: `apps/web/ai/prompts/*` (system, Plan Builder, Review & Suggest)
- Embeddings pipeline: background job for exercises & coach KB

## Data Models
### Embeddings (pgvector)
- `exercises.embedding vector(1536)` for `name + description + tags` (including coach custom exercises)
- `coach_kb(id, coach_user_id, title, content, tags text[], embedding vector(1536), created_at)`
- Indexes: `ivfflat` cosine for both embeddings tables

### Conversations & Memory
- `ai_conversations(id, user_id, title, created_at)`
- `ai_messages(id, conversation_id, role enum['user','assistant','tool'], content text, tokens int, cost numeric, created_at)`
- `ai_prefs(user_id, role enum['coach','athlete'], philosophy jsonb, constraints jsonb)`
- `ai_user_memory(id, user_id, type text, value jsonb, tags text[], weight numeric, last_seen_at timestamptz)`

RLS: own rows by `user_id`; `coach_kb` visible only to the owner and server actions acting for that coach.

## Retrieval & Tooling
- Exercise retrieval: hybrid (keyword filters + vector similarity top‑k) with re-ranking by tags/constraints; scope to coach’s group exercises.
- KB retrieval: vector top‑k over `coach_kb` conditioned on opt‑in.
- Tool interface from model:
  - `searchExercises({ groupId, filters, k })`
  - `getCoachPhilosophy({ coachUserId })`
  - `previewPlanDiff({ groupId, inputs })` → returns JSON diff against `training_presets`
  - `applyPlanDiff(diff)` → writes via existing plan/session actions (only on explicit user approval)

# Development Roadmap

## Phase 0 – Foundations (1 week)
- Add streaming chat route and provider abstraction; ensure token/cost logging.
- Create tables: `ai_conversations`, `ai_messages`, `ai_prefs`, `coach_kb` (+ embeddings); add RLS and indexes.
- Implement embeddings job for exercises and coach KB (retry/backfill).

## Phase 1 – Skills (2–3 weeks)
### A) Plan Builder (Draft)
- Prompt uses: cohort summary, date range, events, equipment limits, philosophy.
- Pipeline: retrieve exercises → construct meso/micro templates → return “Preview diff” JSON; coach can Apply → server actions persist.

### B) Review & Suggest
- Input existing preset(s) or sessions → AI returns annotated suggestions (swap X→Y, adjust volume, add rest), no writes until Apply.

## Phase 2 – Minimal Memory & Preferences (1 week)
- Short-term conversation summary per N turns; store structured “facts”.
- `ai_prefs` read by prompts to reflect coach style and constraints.

# Logical Dependency Chain
1) Streaming + provider + prompts → core interaction
2) Embeddings + KB → correctness & personalization
3) Review & Suggest → safe value first
4) Draft Plan + Preview diff → human-in-the-loop apply
5) Memory summaries + prefs → consistency across sessions

# AI UX Guidelines (2025 Minimal)
- Single column, streaming text; data-scope badge (“Using Group G‑12, 4 weeks”).
- Two primary actions: “Preview diff” / “Apply”. Secondary: “Why?”, “Cite source”.
- Tone: short, declarative; show assumptions explicitly.
- Safety: never expose PII unnecessarily; opt‑in to KB.

# Risks and Mitigations
- Wrong exercise picks → hybrid retrieval; top‑k constraints; coach review required.
- Cost overruns → token limits, early aborts, batch embeddings.
- Privacy → strict RLS; redact PII in prompts; user controls to disable KB/memory.

# Appendix
- Metrics: acceptance rate of diffs, helpfulness rating, average time to draft.
- Future: Performance Analyst, nudges, GraphRAG; out of scope in MVP2.

</PRD>

