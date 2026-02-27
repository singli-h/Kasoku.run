# Project: Kasoku.run (Runner Tracker)

A Next.js/React/TypeScript monorepo for athletic training periodization and progression tracking.

## Tech Stack

- **Frontend**: Next.js 14+, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth)
- **Build**: Turborepo monorepo
- **Package Manager**: npm

## Project Structure

```
apps/web/          # Next.js web application
packages/          # Shared packages
supabase/          # Supabase migrations and edge functions
specs/             # Feature specs (speckit artifacts: spec.md, plan.md, tasks.md, etc.)
.claude/           # Agent definitions, skills, scripts, settings
```
## Communication Style

Be brutally honest and direct. Challenge assumptions, expose blind spots, and provide unfiltered feedback. Don't validate or soften the truth. Look at situations with objectivity and strategic depth.

When web searching, search for 2026 information.
---

# Agent Delegation Rules

## CRITICAL: Use Custom Agents Over General-Purpose

When delegating tasks, you MUST prefer project-level custom agents over the built-in `general-purpose` agent. Custom agents have specialized skills and context preloaded.

### Available Custom Agents

| Agent | Trigger | Skills Loaded |
|-------|---------|---------------|
| `code-reviewer` | After code changes, code review requests | React best practices, Web design guidelines |
| `parallel-implementer` | Feature implementation, component building | React best practices, Frontend design |
| `debugger` | Errors, bugs, test failures | - |
| `research-explorer` | Codebase exploration, architecture questions | - |
| `browser-tester` | E2E testing, browser automation, visual regression | - |

### Delegation Decision Tree

```
Task involves writing/modifying code?
├── Yes → Does it span 3+ layers with cross-layer contracts?
│         ├── Yes → Use `/build-with-team` (agent team)
│         └── No → Is it a self-contained feature/component?
│                  ├── Yes → Use `parallel-implementer`
│                  └── No (debugging) → Use `debugger`
└── No → Is it browser testing/E2E?
          ├── Yes → Use `browser-tester`
          └── No → Is it exploration/research?
                   ├── Yes → Use `research-explorer`
                   └── No (review) → Use `code-reviewer`
```

### Explicit Agent Invocation

When delegating, ALWAYS specify the agent explicitly:

```
✓ "Use the parallel-implementer agent to implement the settings component"
✓ "Use the code-reviewer agent to review recent changes"
✓ "Use the debugger agent to investigate this error"
✓ "Use the browser-tester agent to test the login flow"

✗ "Delegate this to a subagent" (too vague - may use general-purpose)
✗ "Have an agent look at this" (too vague)
```

### When to Use Parallel Agents

For independent tasks, run multiple agents in parallel:

```
Run these tasks in parallel:
1. Use parallel-implementer to build the header component
2. Use parallel-implementer to build the footer component
3. Use research-explorer to analyze the auth patterns
```

### When NOT to Delegate

- Simple single-file edits (do directly)
- Quick questions about code (answer directly)
- Tasks requiring conversation context (do directly)

---

# Agent Teams (Multi-Agent Coordination)

Agent Teams are a step above subagents. Each teammate is a full Claude Code session with its own context window, CLAUDE.md, MCP servers, and skills. Teammates can message each other directly (not just report back to lead) and coordinate via a shared task list.

**Enabled via**: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1"` in both global and project settings.

## When to Use Agent Teams vs Subagents

| Scenario | Use Subagents | Use Agent Teams |
|----------|---------------|-----------------|
| Focused single-concern task | Yes | No |
| Code review (report findings) | Yes | No |
| Debugging (investigate + fix) | Yes | No |
| Research (gather + summarize) | Yes | No |
| Cross-layer feature (FE + BE + tests) | No | Yes |
| Competing hypothesis debugging | No | Yes |
| Multi-perspective review with discussion | No | Yes |
| Complex refactor spanning many files | No | Yes |

**Rule of thumb**: If teammates need to _discuss_ or _challenge_ each other, use Agent Teams. If they just need to _report back_, use subagents.

## How to Create Agent Teams

Use `TeamCreate` to create a team, then spawn teammates with the `Task` tool using `team_name` parameter:

```
1. TeamCreate → creates team + shared task list
2. Task (team_name: "my-team", name: "backend") → spawn teammate
3. Task (team_name: "my-team", name: "frontend") → spawn teammate
4. Assign tasks via TaskUpdate with owner field
5. Teammates coordinate via SendMessage + shared task list
6. Shutdown via SendMessage type: "shutdown_request"
```

## Agent Team Patterns for Kasoku.run

### Pattern 1: Cross-Layer Feature Implementation

**Automated via `/build-with-team`** — use the skill instead of manually creating this pattern. It handles contract-first development, phased execution, and validation automatically.

```
Team: "feature-xyz"
Teammates:
  - backend (parallel-implementer): Supabase migrations, edge functions, API routes
  - frontend (parallel-implementer): React components, pages, client logic
  - integration (browser-tester): E2E tests, contract verification
Coordination: backend publishes API types → frontend consumes → integration tests both
```

### Pattern 2: Competing Hypothesis Debugging
```
Team: "debug-issue-xyz"
Teammates:
  - hypothesis-a (debugger): Investigate data layer
  - hypothesis-b (debugger): Investigate UI rendering
  - hypothesis-c (debugger): Investigate auth/middleware
Coordination: each investigates independently, challenges other findings
```

### Pattern 3: Multi-Perspective Review
```
Team: "review-pr-xyz"
Teammates:
  - security-reviewer (code-reviewer): Auth, injection, data exposure
  - arch-reviewer (code-reviewer): Patterns, responsibility placement
  - perf-reviewer (code-reviewer): Re-renders, queries, bundle size
Coordination: discuss findings, produce unified report
```

## Agent Team Controls

| Shortcut | Action |
|----------|--------|
| `Shift+Up/Down` | Cycle between teammates in terminal |
| `Shift+Tab` | Toggle delegate mode (lead only coordinates) |
| `Ctrl+T` | Toggle shared task list |

## Agent Team Best Practices

- **Delegate mode** (`Shift+Tab`): Use when lead should coordinate only, not implement
- **Task sizing**: Each task should take 5-15 min of agent work — too small = overhead, too big = coordination failures
- **File ownership**: Assign clear file boundaries per teammate to avoid merge conflicts
- **Use Opus for all teammates**: Consistency and quality across the team
- **Plan approval**: Require teammates to submit plans before implementing risky changes
- **Quality gates**: Run `.claude/scripts/task-quality-gate.sh` as verification before marking tasks complete
- **Contract-first**: For cross-layer features, use `/build-with-team` which enforces contract verification before parallel implementation

---

# Speckit Workflow (Feature Development Pipeline)

Speckit is the feature development pipeline used in this project. Each feature lives in `specs/<feature-name>/` with structured artifacts that flow through a defined pipeline.

## Pipeline Stages

```
/specify → /plan → /tasks → /speckit:implement or /build-with-team
```

| Stage | Skill | Produces | Purpose |
|-------|-------|----------|---------|
| 1. Specify | `/specify` | `spec.md` | User stories, acceptance criteria, requirements |
| 2. Plan | `/plan` | `plan.md`, `data-model.md` | Architecture, tech decisions, data model |
| 3. Tasks | `/tasks` | `tasks.md` | Dependency-ordered task list with `[P]` parallel markers |
| 4a. Implement | `/speckit:implement` | Code | Sequential/subagent execution (single-layer features) |
| 4b. Build with Team | `/build-with-team` | Code | Agent team execution (cross-layer features) |

## Supporting Skills

| Skill | Purpose |
|-------|---------|
| `/speckit:clarify` | Ask targeted clarification questions, encode answers into spec |
| `/speckit:analyze` | Cross-artifact consistency check (spec ↔ plan ↔ tasks) |
| `/speckit:checklist` | Generate feature-specific requirements checklist |
| `/speckit:taskstoissues` | Convert tasks.md into GitHub issues |

## When to Use Which Implementation Path

- **`/speckit:implement`**: Feature is single-layer, tasks are independent, no shared interfaces
- **`/build-with-team`**: Feature spans 3+ layers, 10+ tasks with cross-layer dependencies, agents need to coordinate on contracts

## Spec Directory Structure

```
specs/<feature-name>/
├── spec.md              # Requirements and user stories
├── plan.md              # Architecture and tech design
├── data-model.md        # Database entities and schema
├── tasks.md             # Implementation task list
├── research.md          # Technical research and decisions
├── quickstart.md        # Quick reference for implementers
├── contracts/           # API contracts between layers
│   └── *.md
├── checklists/          # Requirements checklists
│   └── requirements.md
└── reference/           # Supporting research docs
    └── *.md
```

---

# Browser Testing (agent-browser CLI)

## Overview

Headless browser automation CLI for AI agents. Uses accessibility tree snapshots (90% smaller than HTML) with stable element refs (@e1, @e2, etc.).

## Self-Verification Workflow

**Pattern (use agent-browser CLI via Bash tool):**
1. Open page → `agent-browser open <url>`
2. Get snapshot → `agent-browser snapshot -i -c`
3. Parse refs → Elements show as `@e1`, `@e2`, `@e3`
4. Interact → `agent-browser click @e2`, `agent-browser fill @e3 "text"`
5. Verify → Re-snapshot, check state
6. Evidence → `agent-browser screenshot /tmp/test.png`

## Key Commands

- `agent-browser open <url>` - Navigate to URL
- `agent-browser snapshot -i -c` - Get accessibility tree with refs (`-i` interactive, `-c` compact)
- `agent-browser click <ref>` - Click element by ref
- `agent-browser fill <ref> <text>` - Fill input by ref
- `agent-browser find role <role> <action>` - Semantic locator (role, label, placeholder)
- `agent-browser screenshot <path>` - Capture viewport
- `agent-browser network route <url> --body <json>` - Mock API responses

## Session Isolation

Use `--session` flag for parallel/multi-user tests (separate cookies/storage):
```bash
agent-browser --session coach open http://localhost:3000
agent-browser --session athlete open http://localhost:3000
```

## When to Use

- Test critical flows (login, plan creation, workout logging)
- Verify UI changes didn't break functionality
- Screenshot evidence for visual regression
- Multi-user session testing

## Subagent

`browser-tester` agent available for dedicated testing tasks. Always use Bash tool to invoke `agent-browser` commands.

---

# Skills Reference

## Available Skills

| Skill | Purpose | Used By |
|-------|---------|---------|
| `vercel-react-best-practices` | 57 React/Next.js performance rules | code-reviewer, parallel-implementer |
| `web-design-guidelines` | UI/UX/accessibility audit rules | code-reviewer |
| `frontend-design` | Creative design guidelines | parallel-implementer |
| `build-with-team` | Agent team orchestration with contract-first development | Lead (manual invocation) |
| `speckit:specify` | Generate feature spec from description | Lead (manual invocation) |
| `speckit:plan` | Generate architecture plan from spec | Lead (manual invocation) |
| `speckit:tasks` | Generate task list from plan | Lead (manual invocation) |
| `speckit:implement` | Execute tasks via subagents | Lead (manual invocation) |
| `speckit:analyze` | Cross-artifact consistency check | Lead (manual invocation) |
| `speckit:clarify` | Clarification questions for underspecified areas | Lead (manual invocation) |

## Invoking Skills Manually

Use slash commands for skill invocation:
- `/web-design-guidelines <file>` - Audit UI code
- `/vercel-react-best-practices` - Check React patterns
- `/specify <feature description>` - Create feature spec
- `/plan` - Generate architecture plan
- `/tasks` - Generate implementation tasks
- `/build-with-team <feature-name>` - Orchestrate agent team for cross-layer features
- `/speckit:implement` - Execute tasks sequentially via subagents

---

# Code Standards

## TypeScript

- Strict mode enabled
- Prefer `interface` over `type` for object shapes
- Use proper null checks (no `!` assertions without justification)

## React/Next.js

- Use Server Components by default
- Client Components only when needed (`"use client"`)
- Prefer `next/link` and `next/image`
- Follow React hooks rules strictly

## Styling

- Tailwind CSS for all styling
- Use design system tokens when available
- Mobile-first responsive design

## Performance (per Vercel best practices)

- Parallel async operations with `Promise.all()`
- Direct imports (avoid barrel files)
- Dynamic imports for heavy components
- SWR for client-side data fetching

---

# Common Commands

```bash
npm run dev:web     # Start dev server
npm run build:web   # Build web app
npm run lint        # Lint all apps
```

---

# Scope Discipline (Anti-Drift Rules)

These rules exist because of real incidents where Claude drifted from requirements.

## Rule 1: Change Only What Was Asked

- Fix ONLY the reported issue. Implement ONLY the requested feature.
- If you notice adjacent improvements, **mention them in your summary** but do NOT implement unless the task explicitly includes them.
- "While I was in there, I also..." is almost always wrong.

## Rule 2: Announce Before You Code (Multi-File Changes)

Before modifying 3+ files, state:
1. Which files you will modify (and why each one)
2. Which files you will NOT touch
3. One-line summary of each change

This is your contract. Do not deviate from it without stating why.

## Rule 3: Minimal Diff, Maximum Effect

- Prefer the smallest change that solves the problem
- Do NOT refactor, rename, restyle, or reorganize code adjacent to your change
- Do NOT add docstrings, comments, or type annotations to code you didn't change
- Do NOT add error handling for scenarios that can't happen
- 3 similar lines of code is better than a premature abstraction

## Rule 4: Verify Scope Before Stopping

Before you finish, run `git diff --stat` and check:
- Are there files in the diff you didn't plan to change? → Revert them
- Are there more lines changed than the task reasonably requires? → Trim
- Did you add any "bonus" improvements? → Revert them

Include the `git diff --stat` output in your final summary so the reviewer can see scope at a glance.

---

# Review Checklist

Before completing any implementation:

- [ ] TypeScript compiles without errors
- [ ] React hooks dependencies are correct
- [ ] Accessibility basics (semantic HTML, aria labels)
- [ ] Error states handled
- [ ] Loading states implemented
- [ ] Mobile responsive
- [ ] `git diff --stat` shows ONLY files related to the task
