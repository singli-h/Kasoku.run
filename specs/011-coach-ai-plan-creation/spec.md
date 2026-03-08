# Feature: Coach AI Plan Creation

- **Branch**: `feat/011-coach-ai-plan-creation`
- **Created**: 2026-02-25
- **Status**: Draft
- **Parent Feature**: Plans (Coach Domain)
- **Related**: `specs/010-individual-first-experience/` (individual AI pipeline)

## Overview

Coaches currently build training plans entirely by hand through the MesoWizard — a 4-step form wizard that requires manual configuration of every session, exercise, and set. For a 16-week macrocycle with 4 sessions/week, that's ~320 individual set configurations.

This feature adds AI-powered plan generation for coaches. The AI generates a full periodized macrocycle (phases, weeks, sessions, exercises, sets) from a brief configuration step. The coach reviews the output at macro, phase, and session levels before approving.

### Key Differentiators from Individual AI (spec 010)

| Dimension | Individual (010) | Coach (011) |
|-----------|-----------------|-------------|
| Scope | 1 mesocycle (4-8 weeks) | Full macrocycle (12-52 weeks, multiple phases) |
| Target | Self | Athlete group |
| Structure | Flat: block → weeks | Hierarchical: macro → phases → weeks → sessions |
| Periodization | None | GPP → SPP → Taper → Competition |
| Templates | N/A | Save and reuse across seasons |

## Scope

| In Scope | Out of Scope |
|----------|-------------|
| AI macrocycle generation from coach inputs | Auto-progression within sets (volume/intensity curves) |
| Phase-aware periodization (GPP, SPP, Taper, Competition) | Real-time collaboration between coaches |
| Coach review UI with macro/phase/session drill-down | Individual session AI editing (already in session-assistant) |
| Atomic save of full hierarchy (macro → meso → micro → session → exercise → set) | Athlete-specific plan customization per individual |
| Athlete group assignment during creation | Plan import/export (CSV, TrainingPeaks) |
| Save as template | Workout log generation from plan |
| Regeneration with coach feedback | RLS policy changes (tracked as dependency) |

## User Scenarios & Testing

### US-001: Generate Plan from Configuration

**Target Audience**: Coach
**Target DB Tables**: macrocycles, mesocycles, microcycles, session_plans, session_plan_exercises, session_plan_sets
**Priority**: P0
**Independent Test**: Yes

**Description**: Coach configures high-level plan parameters and AI generates a full periodized macrocycle.

#### Acceptance Scenarios

**SC-001.1: Basic plan generation**
- **Given** coach is on `/plans/new` and selects "Create with AI"
- **When** coach fills in: sport (Track & Field), group (U18 Sprinters), competition date (2026-06-15), duration (16 weeks), sessions/week (4), equipment (barbell, dumbbell, cable machine)
- **Then** AI generates a macrocycle with 3-4 periodization phases (GPP → SPP → Taper), each phase as a mesocycle with appropriate microcycles, sessions populated with exercises and sets

**SC-001.2: Generation respects equipment constraints**
- **Given** coach selects equipment: "bodyweight, resistance bands, dumbbells"
- **When** plan is generated
- **Then** no exercise in any session requires equipment outside the selected list

**SC-001.3: Generation respects training days**
- **Given** coach selects training days: Mon, Wed, Fri
- **When** plan is generated
- **Then** each microcycle has exactly 3 sessions on days 1, 3, 5

### US-002: Review Generated Plan

**Target Audience**: Coach
**Target DB Tables**: (read-only during review — in-memory state)
**Priority**: P0
**Independent Test**: Yes

**Description**: Coach reviews the AI-generated macrocycle at multiple levels before approving.

#### Acceptance Scenarios

**SC-002.1: Macro-level review**
- **Given** plan has been generated
- **When** coach sees the review screen
- **Then** a timeline shows all phases (e.g., "GPP: Weeks 1-6", "SPP: Weeks 7-12", "Taper: Weeks 13-15", "Competition: Week 16") with color coding

**SC-002.2: Phase drill-down**
- **Given** coach clicks on "GPP: Weeks 1-6"
- **When** phase detail opens
- **Then** coach sees week-by-week session names and exercise counts

**SC-002.3: Session drill-down**
- **Given** coach clicks on "Week 1 - Monday: Upper Body Power"
- **When** session detail opens
- **Then** coach sees full exercise list with sets, reps, weight, RPE, rest time

### US-003: Save Generated Plan

**Target Audience**: Coach
**Target DB Tables**: macrocycles, mesocycles, microcycles, session_plans, session_plan_exercises, session_plan_sets
**Priority**: P0
**Independent Test**: Yes

**Description**: Coach approves the plan and it is atomically saved to the database.

#### Acceptance Scenarios

**SC-003.1: Atomic save**
- **Given** coach has reviewed the plan and clicks "Apply Plan"
- **When** save completes
- **Then** all entities (macrocycle, mesocycles, microcycles, session_plans, exercises, sets) are created in the database in a single transaction

**SC-003.2: Group assignment**
- **Given** coach selected athlete group "U18 Sprinters" during configuration
- **When** plan is saved
- **Then** `macrocycles.athlete_group_id` is set to the selected group

**SC-003.3: Redirect to workspace**
- **Given** plan save succeeds
- **When** confirmation shows
- **Then** coach is redirected to `TrainingPlanWorkspace` for the new macrocycle

### US-004: Regenerate with Feedback

**Target Audience**: Coach
**Target DB Tables**: (none — regeneration replaces in-memory state)
**Priority**: P1
**Independent Test**: Yes

**Description**: Coach can reject the generated plan and provide feedback for regeneration.

#### Acceptance Scenarios

**SC-004.1: Full regeneration**
- **Given** coach is reviewing a generated plan
- **When** coach clicks "Regenerate" and types "More plyometric work in SPP phase, reduce session duration to 45 minutes"
- **Then** AI generates a new plan incorporating the feedback

**SC-004.2: Phase-specific regeneration**
- **Given** coach is viewing the GPP phase detail
- **When** coach clicks "Regenerate this phase" and types "Add more core work"
- **Then** only the GPP mesocycle is regenerated; other phases are preserved

### US-005: Save as Template

**Target Audience**: Coach
**Target DB Tables**: macrocycles (with `is_template: true` or equivalent)
**Priority**: P1
**Independent Test**: Yes

**Description**: Coach saves the generated plan as a reusable template.

#### Acceptance Scenarios

**SC-005.1: Template save**
- **Given** coach is on the review screen
- **When** coach toggles "Save as Template" and clicks "Apply Plan"
- **Then** the macrocycle is saved with a template flag, accessible from future "Create from Template" flows

## Edge Cases

- **Competition date in the past**: Reject with validation error
- **Duration < 4 weeks**: Warn that periodization is limited; generate single-phase plan
- **Duration > 52 weeks**: Cap at 52 weeks
- **No exercises match equipment**: AI should note the limitation and suggest the closest alternatives
- **Empty athlete group**: Allow creation without group assignment (unassigned plan)

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | System shall generate a macrocycle with 2-4 mesocycles based on competition date and duration | P0 |
| FR-002 | Each mesocycle shall have phase metadata (GPP, SPP, Taper, Competition) | P0 |
| FR-003 | Each microcycle shall have session plans with exercises and sets | P0 |
| FR-004 | Generation shall respect equipment constraints from coach input | P0 |
| FR-005 | Generation shall respect training day selection | P0 |
| FR-006 | Review UI shall support macro → phase → session drill-down | P0 |
| FR-007 | Save shall be atomic (all-or-nothing transaction) | P0 |
| FR-008 | Coach shall be able to assign athlete group during creation | P0 |
| FR-009 | Coach shall be able to regenerate with text feedback | P1 |
| FR-010 | Coach shall be able to save as template | P1 |
| FR-011 | Generation time for TTFT shall be under 5 seconds | P1 |
| FR-012 | Dates must satisfy `validateDateBoundaries` and `validateNoSiblingOverlap` | P0 |

### Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-001 | Rate limit: 5 requests per minute per user on generation routes |
| NFR-002 | No production console.log (dev-only logging) |
| NFR-003 | Input validation via Zod on all API routes |
| NFR-004 | Exercise library capped at 100 items (with relevance sorting) |

## Key Entities

```
macrocycles
  ├── id, name, description, start_date, end_date
  ├── user_id (FK → users), athlete_group_id (FK → athlete_groups)
  └── mesocycles[]
        ├── id, name, macrocycle_id, start_date, end_date
        ├── metadata: { phase, color, deload }
        └── microcycles[]
              ├── id, name, mesocycle_id, start_date, end_date
              └── session_plans[]
                    ├── id, name, description, day, week
                    ├── athlete_group_id, microcycle_id
                    └── session_plan_exercises[]
                          ├── exercise_id, exercise_order, superset_id
                          └── session_plan_sets[]
                                ├── set_index, reps, weight, rpe, rest_time
                                └── distance, performing_time, power, velocity, tempo
```

## Architecture

### Reuse Init Pipeline Pattern

The individual AI pipeline (`specs/010`) is proven and can be extended:

```
Coach Setup Form
    ↓
Step 0: Fetch exercise library (GET /api/exercises/search with equipment tags)
    ↓
Step 1: Planning (POST /api/ai/plan-generator/coach-plan)
         GPT-5.2 with reasoningEffort: 'high'
         Input: CoachPlanningContext (sport, group, competition date, phases)
         Output: Streaming text plan narrative
    ↓
Step 2: Generation (POST /api/ai/plan-generator/coach-generate)
         GPT-5.2 with generateObject
         Input: Planning narrative + context
         Output: CoachGeneratedPlanSchema (macro with phases, weeks, sessions, exercises)
    ↓
Step 3: Scaffold (client-side)
         Expand flat AI output → full nested state with UUIDs
         Compute dates from competition date backward
         Validate date constraints
    ↓
Coach Review UI (macro → phase → session drill-down)
    ↓
Save (saveGeneratedMacrocycleAction — atomic transaction)
```

### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/ai/plan-generator/coach-plan` | POST | Streaming planning step for coach macrocycle |
| `/api/ai/plan-generator/coach-generate` | POST | Structured JSON generation for coach macrocycle |

### New Server Actions

| Action | Purpose |
|--------|---------|
| `saveGeneratedMacrocycleAction` | Atomic save of full hierarchy: macro → meso → micro → session → exercise → set |

### New Components

| Component | Purpose |
|-----------|---------|
| `CoachPlanSetupForm` | Configuration form (sport, group, dates, equipment, sessions/week) |
| `CoachPlanGenerationReview` | Review UI with macro timeline + phase/session drill-down |

### New Schemas

```typescript
// AI output schema for coach plan
const CoachGeneratedPlanSchema = z.object({
  plan_name: z.string(),
  plan_description: z.string(),
  phases: z.array(z.object({
    name: z.string(),        // e.g., "General Preparation"
    phase_type: z.enum(['GPP', 'SPP', 'Taper', 'Competition', 'Recovery']),
    duration_weeks: z.number().int().min(1),
    microcycles: z.array(z.object({
      name: z.string(),
      sessions: z.array(z.object({
        day: z.number().int().min(0).max(6),
        name: z.string(),
        description: z.string(),
        exercises: z.array(z.object({
          exercise_id: z.number(),
          sets: z.number().int().min(1).max(10),
          reps: z.number().int().min(1).max(50),
          weight: z.number().nullable(),
          rpe: z.number().int().min(1).max(10),
          rest_time: z.number().int().min(0).max(600),
        })),
      })),
    })),
  })),
})
```

## UI/UX Design

### Entry Point

Add "Create with AI" button alongside existing "Create Plan" on `/plans`:

```
┌─────────────────────────────────────────┐
│  My Plans                               │
│                                         │
│  [+ Create Plan]  [✨ Create with AI]   │
│                                         │
│  ... existing plan list ...             │
└─────────────────────────────────────────┘
```

### Setup Form

```
┌─────────────────────────────────────────┐
│  Create Plan with AI                    │
│                                         │
│  Sport:        [Track & Field     ▾]    │
│  Athlete Group:[U18 Sprinters    ▾]    │
│  Competition:  [2026-06-15       📅]    │
│  Duration:     [16 weeks         ▾]    │
│  Sessions/Week:[4                ▾]    │
│  Training Days:[Mon][Wed][Fri][Sat]     │
│  Equipment:    [✓ Barbell] [✓ DB] ...   │
│                                         │
│  Notes: [                          ]    │
│         [Add more plyometrics      ]    │
│                                         │
│            [Generate Plan →]            │
└─────────────────────────────────────────┘
```

### Review Screen — Macro Level

```
┌─────────────────────────────────────────┐
│  Sprint Season 2026                     │
│  16 weeks · 4 sessions/week · 64 total  │
│                                         │
│  ┌──────────┬────────┬───────┬────┐     │
│  │   GPP    │  SPP   │ Taper │Comp│     │
│  │ Wk 1-6  │ Wk 7-12│Wk13-15│W16 │     │
│  └──────────┴────────┴───────┴────┘     │
│                                         │
│  ▸ GPP: General Preparation (6 weeks)   │
│    24 sessions · Focus: base strength   │
│                                         │
│  ▸ SPP: Specific Preparation (6 weeks)  │
│    24 sessions · Focus: power/speed     │
│                                         │
│  ▸ Taper (3 weeks)                      │
│    12 sessions · Focus: neural priming  │
│                                         │
│  ▸ Competition (1 week)                 │
│    4 sessions · Focus: activation       │
│                                         │
│  [Regenerate]  [Save as Template ☐]     │
│                     [Apply Plan →]      │
└─────────────────────────────────────────┘
```

## Success Criteria

| ID | Criterion |
|----|-----------|
| SC-001 | Coach can generate a 16-week macrocycle in under 30 seconds total |
| SC-002 | Generated plan respects all equipment and day constraints |
| SC-003 | Atomic save creates all entities correctly (verified by querying back) |
| SC-004 | Review UI allows drill-down from macro → phase → week → session |
| SC-005 | Group assignment persists correctly on the macrocycle |
| SC-006 | TTFT under 5 seconds on generation step |

## Assumptions

- Coach has at least one athlete group created
- Exercise library has sufficient exercises for the sport type
- Competition date is in the future
- RLS on macrocycles/mesocycles will be enabled as a prerequisite or parallel task

## Dependencies

- `specs/010-individual-first-experience/` — init pipeline infrastructure (reusable)
- `checkServerRateLimit` — already implemented in `@/lib/rate-limit-server`
- `validateDateBoundaries`, `validateNoSiblingOverlap` — already in `plan-actions.ts`
- `copyMacrocycleAsTemplateAction` — template deep-copy already implemented
- RLS policies on macrocycles/mesocycles (flagged in plans-prd.md as missing)

## Implementation Status

| Task | Status |
|------|--------|
| Spec | Draft |
| Plan | Not started |
| Tasks | Not started |
| Implementation | Not started |
