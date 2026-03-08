# Individual Plan UX Design

> Unified experience for individual users viewing and editing their training plans with AI assistance.

## Quick Links

| Document | Description |
|----------|-------------|
| [Design Philosophy](./01-design-philosophy.md) | Core principles and key decisions |
| [Information Architecture](./02-information-architecture.md) | Page structure and navigation |
| [AI Context & Scope](./03-ai-context-scope.md) | How AI understands user context |
| [User Stories](./04-user-stories.md) | Workflows and scenarios |
| [Changeset Display](./05-changeset-display.md) | How to show AI proposals (hybrid diff approach) |
| [Wireframes](./06-wireframes.md) | Lo-fi designs (desktop & mobile) |
| [User Personas](./07-user-personas.md) | Target users and reactions |
| [Key Decisions (Jan 2025)](./08-decisions-jan2025.md) | Latest design decisions |
| [Implementation Plan](./IMPLEMENTATION_PLAN.md) | Technical implementation guide |

## Problem Statement

Currently, individual users face three different UI/UX patterns:
- `/plans/[id]` - View-only, no AI
- `/plans/[id]/edit` - Broken AI ("coming soon")
- `/plans/[id]/session/[id]` - Working AI for sessions

This creates confusion and inconsistent experiences.

## Solution

**ONE page (`/plans/[id]`) with contextual AI always available.**

```
┌─────────────────────────────────────────────────────────────────┐
│                         /plans/[id]                              │
│  ┌────────────┐  ┌──────────────────────────┐  ┌─────────────┐  │
│  │   WEEKS    │  │     SELECTED CONTENT     │  │   AI CHAT   │  │
│  │   (nav)    │  │   (days → exercises)     │  │  (drawer)   │  │
│  └────────────┘  └──────────────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Priority Summary (P0/P1)

**P0 - Must Have:**
- Basic browse without AI (single page, week sidebar)
- Single-session AI proposals (hybrid diff: inline for low-density, summary+highlight for high-density)
- Week-level AI proposals (schedule, fatigue adjustments)
- Mobile-first layout
- Unified AI entry point (context-aware prompts, NOT full tool merge)

**P1 - Should Have:**
- Compact AI reasoning (collapsible, ChatGPT-style)
- Block-wide changes (text summary in chat)
- Advanced Fields toggle (show/hide RPE, tempo, etc.)

## Key Technical Decisions

| Decision | Approach |
|----------|----------|
| AI Architecture | Unified entry point with context-aware prompts (not full merge of 25 tools) |
| Diff Display | Hybrid: density-based (low = inline diff, high = summary + highlight + [View Details]) |
| Field Visibility | Default fields + Advanced toggle (RPE, tempo hidden by default) |

See [Key Decisions](./08-decisions-jan2025.md) for full details.

## Status

- [x] Initial design complete
- [x] Wireframes (desktop + mobile)
- [x] User persona analysis
- [x] Key decisions finalized (Jan 2025)
- [ ] Implementation started
