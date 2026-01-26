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
├── Yes → Is it a self-contained feature/component?
│         ├── Yes → Use `parallel-implementer`
│         └── No (debugging) → Use `debugger`
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

# Browser Testing (agent-browser MCP)

## Overview

MCP server for headless Chromium testing. Uses accessibility tree snapshots (90% smaller than HTML) with stable element refs.

## Self-Verification Workflow

**Pattern (no scripts needed - use MCP tools directly):**
1. Open page → `mcp__agent-browser__open`
2. Get snapshot → `mcp__agent-browser__snapshot -i -c`
3. Parse refs → Elements show as `@e1`, `@e2`, `@e3`
4. Interact → `mcp__agent-browser__click @e2`, `fill @e3 "text"`
5. Verify → Re-snapshot, check state
6. Evidence → `mcp__agent-browser__screenshot`

## Key MCP Tools

- `open` - Navigate to URL
- `snapshot` - Get accessibility tree with refs (`-i` interactive, `-c` compact)
- `click` - Click element by ref
- `fill` - Fill input by ref
- `find` - Semantic locator (role, label, placeholder)
- `screenshot` - Capture viewport
- `network route` - Mock API responses

## Session Isolation

Use `--session` flag for parallel/multi-user tests (separate cookies/storage).

## When to Use

- Test critical flows (login, plan creation, workout logging)
- Verify UI changes didn't break functionality
- Screenshot evidence for visual regression
- Multi-user session testing

## Subagent

`browser-tester` agent available for dedicated testing tasks.

---

# Skills Reference

## Available Skills

| Skill | Purpose | Used By |
|-------|---------|---------|
| `vercel-react-best-practices` | 57 React/Next.js performance rules | code-reviewer, parallel-implementer |
| `web-design-guidelines` | UI/UX/accessibility audit rules | code-reviewer |
| `frontend-design` | Creative design guidelines | parallel-implementer |

## Invoking Skills Manually

Use slash commands for skill invocation:
- `/web-design-guidelines <file>` - Audit UI code
- `/vercel-react-best-practices` - Check React patterns

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

# Review Checklist

Before completing any implementation:

- [ ] TypeScript compiles without errors
- [ ] React hooks dependencies are correct
- [ ] Accessibility basics (semantic HTML, aria labels)
- [ ] Error states handled
- [ ] Loading states implemented
- [ ] Mobile responsive
