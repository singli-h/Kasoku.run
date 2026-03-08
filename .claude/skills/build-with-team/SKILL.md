---
description: "Spawn an agent team to build a feature collaboratively. Consumes speckit artifacts (plan.md + tasks.md) and orchestrates teammates with contract-first development. Use when a feature spans multiple layers (frontend, backend, database) and benefits from parallel implementation with inter-agent coordination."
user_invocable: true
---

# Build with Agent Team

Orchestrate a team of specialized agents to implement a feature from speckit artifacts. Agents work in parallel across layers (frontend, backend, database) with **contract-first development** — upstream agents publish interface contracts, the lead verifies, then downstream agents build against verified contracts.

## When to Use This Skill

Use `/build-with-team` instead of `/speckit:implement` when:
- Feature spans 3+ layers (backend, frontend, database, tests)
- Tasks.md has 10+ tasks with cross-layer dependencies
- Multiple agents need to coordinate on shared interfaces (APIs, types, DB schema)
- You want agents to challenge and validate each other's work

Use `/speckit:implement` (subagents) when:
- Feature is single-layer or tasks are fully independent
- Tasks don't share interfaces or contracts
- Simple sequential execution is sufficient

## Input

```text
$ARGUMENTS
```

**Expected input**: Feature spec directory path or name (e.g., `028-imessage-experience`), optional agent count, optional model preference.

**Examples**:
- `/build-with-team 028-imessage-experience`
- `/build-with-team 028-imessage-experience 3 agents`
- `/build-with-team` (auto-detects from current branch)

## Execution Flow

### Phase 0: Context Loading & Team Design

1. **Locate feature directory**: Parse `$ARGUMENTS` for feature name. If empty, detect from current git branch (e.g., `028-imessage-experience` from branch `028-imessage-experience`). Feature dir is `specs/<feature-name>/`.

2. **Load speckit artifacts** (all paths relative to feature dir):
   - **REQUIRED**: `tasks.md` — task list with phases, IDs, dependencies, `[P]` markers
   - **REQUIRED**: `plan.md` — tech stack, architecture, project structure
   - **IF EXISTS**: `data-model.md` — entities, migrations, schema
   - **IF EXISTS**: `contracts/` — API contracts (channel-adapter.md, webhook specs, deep-links.md, etc.)
   - **IF EXISTS**: `spec.md` — user stories, acceptance criteria
   - **IF EXISTS**: `research.md` — technical decisions, constraints

3. **Parse tasks.md structure**:
   - Extract all phases and their tasks
   - Identify `[P]` (parallelizable) markers
   - Map task dependencies (which tasks block others)
   - Group tasks by layer: `backend/`, `frontend/`, `supabase/`, `tests/`
   - Identify **cross-layer boundaries** — tasks where one layer produces an interface another layer consumes

4. **Design team composition** based on task analysis:

   | Task Count | Team Size | Typical Roles |
   |-----------|-----------|---------------|
   | 5-10 tasks | 2 agents | Backend + Frontend |
   | 10-20 tasks | 3 agents | Backend + Frontend + Infrastructure/Tests |
   | 20+ tasks | 4 agents | Backend + Frontend + Infrastructure + Integration/Tests |

   **Role assignment rules**:
   - Group tasks by file path prefix (`apps/web/`, `supabase/`, `packages/`, etc.)
   - Each agent owns a distinct set of files — **NO file overlap between agents**
   - If contracts/ exist, identify upstream (producer) vs downstream (consumer) agents
   - Database migrations are always handled by the lead (via Supabase CLI or MCP if configured), never by teammates

5. **Identify contracts** — the critical interfaces between agents:
   - API endpoint shapes (request/response JSON, status codes, URL patterns)
   - TypeScript type definitions shared across layers
   - Database schema that multiple agents depend on
   - Event names and analytics properties
   - Deep link URL formats and token structures

   **Extract from**: `contracts/` directory, `data-model.md`, `plan.md` project structure, and `tasks.md` cross-references.

### Phase 1: Contract Verification (Sequential — DO NOT PARALLELIZE)

**This phase prevents the #1 agent team failure mode: interface divergence.**

1. **Database first** (Lead executes directly):
   - Apply all database migrations via Supabase CLI (`supabase db push` or `supabase migration up`)
   - Regenerate TypeScript types (`supabase gen types typescript`)
   - These are the foundational contracts — all agents depend on them

2. **Upstream agent publishes contracts**:
   - Spawn the upstream agent (usually Backend) with instructions to:
     - Implement type definitions, interfaces, and shared contracts ONLY
     - Produce exact API shapes: URLs (with/without trailing slashes), request/response JSON, status codes, error formats
     - Produce exact TypeScript types that downstream agents will import
     - **DO NOT implement business logic yet** — just the contract surface
   - Agent sends contract artifacts back to lead

3. **Lead verifies contracts**:
   - Cross-reference against `contracts/` directory specs
   - Verify TypeScript types match `data-model.md` entities
   - Check URL patterns, JSON shapes, status codes against spec
   - Verify event names match `eventTypes.ts` constants
   - **If discrepancy found**: Send feedback to upstream agent, wait for correction

4. **Lead relays verified contracts to downstream agents**:
   - Include exact file paths for type imports
   - Include exact API endpoint URLs and response shapes
   - Include exact event name constants to reference
   - **Be explicit**: "Import `PlanSession` from `apps/web/types/plans.ts`" — not "use the plan session type"

### Phase 2: Parallel Implementation

1. **Spawn all teammates** with rich context. Each teammate spawn prompt MUST include:

   ```
   ## Your Role
   [Agent role: e.g., "Backend Implementation Agent"]

   ## Project Context
   - Feature: [feature name from plan.md]
   - Tech stack: [from plan.md]
   - Branch: [current git branch]

   ## Your Tasks (from tasks.md)
   [List exact task IDs and descriptions assigned to this agent]

   ## Files You Own
   [Exact file paths this agent is responsible for — NO overlap with other agents]

   ## Verified Contracts (from Phase 1)
   [Paste the exact type definitions, API shapes, and import paths]
   [Include any shared constants, event names, URL patterns]

   ## Codebase Conventions
   - Follow existing patterns in the codebase (search before creating new patterns)
   - TypeScript strict mode, no `any` types
   - Use existing utilities from apps/web/lib/, apps/web/utils/
   - Error handling: use `catch (error: unknown)` with instanceof guards
   - [Any project-specific conventions from CLAUDE.md]

   ## Dependencies
   [Which tasks from other agents must complete before yours can start]
   [Which of your outputs other agents are waiting for]

   ## Validation
   After completing your tasks:
   1. Run `tsc --noEmit` in your layer directory
   2. Verify all imports resolve correctly
   3. Check that your code matches the verified contracts exactly
   4. Report: files changed, any deviations from contracts, any blockers
   ```

2. **Model selection for teammates**:
   - Default: Use **Opus** for all teammates (consistency and quality)
   - Override with user preference if specified in `$ARGUMENTS` (e.g., `sonnet` for cost savings)

3. **Require plan approval** for teammates working on:
   - Security-sensitive code (webhook HMAC, auth middleware, token generation)
   - AI/LLM integration (prompt engineering, model calls)
   - Database operations beyond simple CRUD

4. **Lead coordination during parallel phase**:
   - Monitor teammate progress via task list
   - If a teammate discovers a contract deviation: **HALT that teammate**, verify the deviation, update contracts, relay to affected agents
   - If a teammate is blocked: unblock by providing missing context or reassigning work
   - **DO NOT implement tasks yourself** — stay in delegate mode (coordination only)

### Phase 3: Per-Agent Validation

After all teammates report completion:

1. **Run quality gate**:
   ```bash
   .claude/scripts/task-quality-gate.sh
   ```
   This runs TypeScript compilation (`tsc --noEmit`) and Next.js lint checks.

2. **Contract alignment verification**:
   - Compare server action exports vs client component imports
   - Check API route URLs match between `app/api/` handlers and client fetch calls
   - Verify event name constants are used consistently
   - Check database column names match TypeScript types

3. **If validation fails**:
   - Identify which agent's code deviates
   - Send specific fix instructions to that agent
   - Re-validate after fix

### Phase 4: Integration & Code Review

1. **Spawn `code-reviewer` agent** with:
   - All files changed across all teammates
   - The verified contracts for reference
   - Focus areas: security (HMAC, auth, injection), type safety, error handling, CLAUDE.md compliance

2. **Address review findings**:
   - Critical issues: Send fix instructions to the responsible teammate
   - Warnings: Log for manual review, don't block
   - Suggestions: Skip unless trivial

3. **Final build verification**:
   ```bash
   npm run build:web
   ```

4. **Update tasks.md**: Mark all completed tasks as `[x]`

### Phase 5: Team Cleanup

1. Send shutdown requests to all teammates
2. Wait for all teammates to acknowledge shutdown
3. Clean up team resources (`TeamDelete`)
4. Report final summary to user

## Anti-Patterns (MUST AVOID)

| Anti-Pattern | Why It Fails | Do This Instead |
|-------------|--------------|-----------------|
| **Spawn all agents simultaneously** | Agents guess at interfaces, diverge on types/URLs/shapes | Sequential contracts (Phase 1) → parallel implementation (Phase 2) |
| **Tell agents to communicate directly** | Messages get lost, contracts aren't verified | Lead mediates ALL contract exchanges |
| **Late contract sharing** | Downstream agent builds against wrong assumptions, requires rework | Contracts verified BEFORE implementation starts |
| **Overlapping file ownership** | Git conflicts, overwritten work | Each agent owns distinct files, zero overlap |
| **Lead implements tasks itself** | Defeats purpose of team, loses parallel benefit | Use delegate mode, only coordinate |
| **Skipping per-agent validation** | Integration failures discovered too late | Each agent validates independently before integration |
| **Generic spawn prompts** | Agents waste tokens exploring codebase for context | Rich prompts with exact file paths, types, and contracts |

## Cross-Cutting Concerns Checklist

Before spawning agents, explicitly assign ownership for:

- [ ] **Shared TypeScript types**: Which agent creates them? Where do they live? Who imports them?
- [ ] **Environment variables**: Which agent adds new env vars? To which config file?
- [ ] **Route registration**: Which agent creates new API routes in `app/api/` or server actions?
- [ ] **Analytics event names**: Which agent defines constants? Which agents fire events?
- [ ] **Error handling patterns**: Consistent error classes and HTTP status codes across agents
- [ ] **Import path conventions**: Relative vs absolute imports, barrel exports

## Output

When the team completes, provide:

1. **Summary**: What was built, which tasks completed
2. **Team composition**: Which agents worked on what
3. **Files changed**: Complete list grouped by agent
4. **Contract deviations**: Any adjustments made during implementation
5. **Validation results**: TypeScript compilation, build status
6. **Review findings**: Critical issues addressed, remaining warnings
7. **Remaining work**: Any tasks that couldn't be completed (with blockers)
