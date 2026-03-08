# Feature Specification: Individual User First Experience with AI Workout Planning

**Feature Branch**: `010-individual-first-experience`
**Created**: 2026-01-12
**Status**: Draft
**Parent Features**:
- 006-individual-user-role (Individual user onboarding)
- 002-ai-session-assistant (AI ChangeSet pattern)
- 005-ai-athlete-workout (AI workout assistant)

---

## Overview

A streamlined first-time experience for individual users that bridges the gap between onboarding completion and their first workout. The system uses AI to generate a personalized weekly training plan based on data collected during onboarding, getting users to their first actionable workout in under 60 seconds.

**Key Value Proposition**: "From sign-up to your first workout in under a minute"

**Core Design Principles**:
1. **Get to Value Fast**: First workout visible within 60 seconds of completing onboarding
2. **AI-Powered Personalization**: Leverage training goals, experience, and equipment to generate relevant plans
3. **Progressive Disclosure**: Don't overwhelm; reveal complexity as users engage
4. **Human-in-the-Loop**: AI proposes, user approves (ChangeSet pattern)
5. **Mobile-First**: Optimized for gym use on mobile devices

---

## Problem Statement

### Current Gap

After individual users complete onboarding:
1. They land on Dashboard showing "No workout scheduled"
2. They must discover `/plans` navigation
3. They see `EmptyTrainingState` - but still need to manually create a block
4. `QuickStartWizard` creates empty sessions - user still needs to add exercises
5. **Result**: Multiple steps before first workout = high drop-off risk

### Industry Data (from research)
- 25% of users abandon apps after first use
- Apps with good onboarding see 50% higher retention
- 81% of users prefer step-by-step guided tours
- Goal: < 60 seconds to first actionable workout

---

## Scope

**This Feature**: Individual user first-time experience (post-onboarding to first workout)

| In Scope | Out of Scope |
|----------|--------------|
| AI-generated weekly workout plan | Coach user flows |
| First Training Block creation wizard | Athlete user flows (assigned by coach) |
| AI exercise population based on goals | Conversation persistence |
| First workout quick-start | Voice input/output |
| Equipment-aware recommendations | Advanced periodization |
| Simple weekly schedule | Custom exercise creation |
| Template-based starting point | Social/sharing features |

---

## User Journey

### High-Level Flow

```
                    ONBOARDING COMPLETE
                           |
                           v
            +--------------------------------+
            |   First Experience Gateway     |
            |   (checks: hasTrainingBlocks?) |
            +--------------------------------+
                           |
              NO blocks    |     HAS blocks
                           |          |
                           v          v
            +--------------------------------+
            |     AI Plan Generator         |
            |   "Let me create your first   |
            |    weekly workout plan..."    |
            +--------------------------------+
                           |
                           v
            +--------------------------------+
            |    Quick Personalization      |
            |  - Training days (M/W/F)      |
            |  - Workout duration (45min)   |
            |  - Equipment (optional)       |
            +--------------------------------+
                           |
                           v
            +--------------------------------+
            |     AI Generates Plan         |
            |  (streaming, visible progress)|
            +--------------------------------+
                           |
                           v
            +--------------------------------+
            |   Review & Approve Plan       |
            |  (ChangeSet approval pattern) |
            +--------------------------------+
                           |
            Approve        |      Regenerate
                           |          |
                           v          v
            +--------------------------------+
            |    Training Block Created     |
            |    + Week 1 with sessions     |
            |    + Sessions with exercises  |
            +--------------------------------+
                           |
                           v
            +--------------------------------+
            |   "Start Your First Workout"  |
            |        [Primary CTA]          |
            +--------------------------------+
                           |
                           v
                    WORKOUT SESSION
```

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First Training Block Generation (Priority: P0)

A new individual user completes onboarding and is immediately presented with an AI-generated training plan tailored to their goals.

**Target Audience**: Individual users only (first time, no existing blocks)

**Target Database Tables**:
- `mesocycles` - CREATE (Training Block)
- `microcycles` - CREATE (Week)
- `session_plans` - CREATE (Workout sessions)
- `session_plan_exercises` - CREATE (Exercises per session)
- `session_plan_sets` - CREATE (Sets per exercise)

**Why this priority**: Core value proposition - this is the critical path from signup to engagement.

**Independent Test**: Complete onboarding as individual user, verify training block with populated sessions is created.

**Acceptance Scenarios**:

1. **Given** an individual user completes onboarding with goal "Build Strength" and experience "Intermediate", **When** they reach the first experience screen, **Then** AI proposes a strength-focused training block with appropriate exercises (compound movements, lower rep ranges).

2. **Given** an individual user selects training days Mon/Wed/Fri, **When** AI generates the plan, **Then** 3 sessions are created for Week 1 on those specific days.

3. **Given** an individual user indicates they have "Dumbbells only", **When** AI generates exercises, **Then** only dumbbell-compatible exercises are included.

4. **Given** AI generates a plan, **When** user views the proposal, **Then** they see a summary: block name, duration, sessions per week, and sample exercises per session.

5. **Given** user approves the AI-generated plan, **When** execution completes, **Then** they are redirected to their first workout session with a "Start Workout" CTA.

---

### User Story 2 - Quick Personalization Before Generation (Priority: P0)

User provides minimal additional context (training days, duration, equipment) before AI generates the plan.

**Target Audience**: Individual users only

**Why this priority**: Personalization increases plan relevance without adding friction (3 quick choices).

**Acceptance Scenarios**:

1. **Given** user reaches personalization step, **When** they see training day options, **Then** days are shown as clickable chips with smart defaults (Mon/Wed/Fri pre-selected).

2. **Given** user has experience level "Beginner", **When** workout duration options appear, **Then** "30 min" is pre-selected (vs 45-60 for intermediate/advanced).

3. **Given** user skips equipment selection, **When** AI generates plan, **Then** full gym equipment is assumed.

4. **Given** user selects "Bodyweight only", **When** AI generates plan, **Then** exercises require no equipment.

---

### User Story 3 - Plan Review and Approval (Priority: P0)

User reviews AI-generated plan and can approve, regenerate, or modify before creation.

**Target Audience**: Individual users only

**Why this priority**: Human-in-the-loop is essential for trust and correctness.

**Acceptance Scenarios**:

1. **Given** AI generates a plan, **When** user views proposal, **Then** they see:
   - Training Block summary (name, weeks, focus)
   - Week overview (which days have workouts)
   - Per-session breakdown (exercise list, sets/reps)

2. **Given** user clicks "Approve", **When** plan is saved, **Then** all entities are created atomically (block, week, sessions, exercises, sets).

3. **Given** user clicks "Regenerate", **When** AI regenerates, **Then** a new variation is proposed (different exercises, same structure).

4. **Given** user provides feedback like "More arm exercises please", **When** AI regenerates, **Then** the new plan includes additional arm exercises.

---

### User Story 4 - First Workout Entry Point (Priority: P1)

After plan approval, user is guided directly to their first workout session.

**Target Audience**: Individual users only

**Why this priority**: Completing the journey from signup to workout execution.

**Acceptance Scenarios**:

1. **Given** plan is approved, **When** user lands on success screen, **Then** they see "Start Your First Workout" as the primary CTA.

2. **Given** user clicks "Start Workout", **When** they enter workout mode, **Then** the session shows all prescribed exercises with sets ready to log.

3. **Given** user is on success screen, **When** they choose "View Training Block" instead, **Then** they see the full week/block workspace.

---

### User Story 5 - Returning User Empty State (Priority: P2)

A returning user who somehow has no training blocks sees the AI generator option.

**Target Audience**: Individual users with deleted/expired blocks

**Acceptance Scenarios**:

1. **Given** an individual user with 0 active blocks visits `/plans`, **When** page loads, **Then** they see `EmptyTrainingState` with "Create with AI" as primary CTA.

2. **Given** user clicks "Create with AI", **When** wizard opens, **Then** onboarding data (goals, experience) is pre-populated.

---

### Edge Cases

- What if AI generation fails mid-stream?
  - **Solution**: Show error with retry button, preserve personalization choices
- What if user closes browser during generation?
  - **Solution**: No partial data saved; user starts fresh on return
- What if exercise library lacks equipment-appropriate exercises?
  - **Solution**: AI falls back to closest alternatives with note to user
- What if user has conflicting goals (e.g., "Build Muscle" + "Lose Weight")?
  - **Solution**: AI creates balanced plan, mentions trade-offs in description
- What if user selects 7 training days?
  - **Solution**: AI includes rest day recommendations in session notes

---

## Requirements *(mandatory)*

### Functional Requirements

#### First Experience Gateway
- **FR-001**: System MUST detect first-time individual users (0 training blocks)
- **FR-002**: System MUST redirect first-time users to AI plan generator after onboarding
- **FR-003**: System MUST allow users to skip AI generation and use manual wizard

#### Quick Personalization
- **FR-004**: System MUST collect training days preference (1-7 days/week)
- **FR-005**: System MUST collect workout duration preference (15/30/45/60 min)
- **FR-006**: System MUST collect equipment availability via category-based selection (presets: Bodyweight Only, Home Gym, Full Gym; categories: bodyweight, dumbbells, barbell, kettlebells, cables, machines, bench)
- **FR-007**: System MUST use onboarding data (goals, experience) as AI context
- **FR-008**: System MUST pre-fill smart defaults based on experience level

#### AI Plan Generation
- **FR-009**: System MUST use streaming responses for perceived performance
- **FR-010**: System MUST generate: 1 Training Block, 1 Week, N Sessions (per training days), Exercises per session, Sets per exercise
- **FR-011**: System MUST respect equipment constraints when selecting exercises
- **FR-012**: System MUST match exercise complexity to experience level
- **FR-013**: System MUST match rep ranges/volume to training goals
- **FR-014**: System MUST use ChangeSet pattern for all modifications

#### Plan Review
- **FR-015**: System MUST show before/after summary for approval
- **FR-016**: System MUST support "Approve" action (creates all entities)
- **FR-017**: System MUST support "Regenerate" action (new proposal)
- **FR-018**: System MUST support feedback input before regeneration
- **FR-019**: System MUST execute creation atomically (all or nothing)

#### Post-Creation Navigation
- **FR-020**: System MUST show "Start First Workout" CTA after approval
- **FR-021**: System MUST navigate to workout session when CTA clicked
- **FR-022**: System MUST offer alternative to view Training Block workspace

### Non-Functional Requirements

- **NFR-001**: Time from personalization submit to plan visible: < 5 seconds
- **NFR-002**: Time from "Approve" click to workout ready: < 2 seconds
- **NFR-003**: Mobile-first responsive design (primary use case: gym)
- **NFR-004**: Offline-resilient (show error, retry when online)

---

## AI Plan Generation Details

### Input Context (from onboarding + personalization)

```typescript
// Equipment category types
type EquipmentCategory =
  | "bodyweight"   // No equipment needed (pull-up bar, dip station, resistance bands)
  | "dumbbells"    // Fixed or adjustable dumbbells
  | "barbell"      // Olympic bar, weight plates, squat rack
  | "kettlebells"  // Various kettlebell weights
  | "cables"       // Cable machine, functional trainer
  | "machines"     // Leg press, chest press, lat pulldown, etc.
  | "bench"        // Flat/incline/adjustable weight bench

// Quick preset mappings
const EQUIPMENT_PRESETS = {
  "bodyweight-only": ["bodyweight"],
  "home-gym": ["bodyweight", "dumbbells", "bench", "kettlebells"],
  "full-gym": ["bodyweight", "dumbbells", "barbell", "kettlebells", "cables", "machines", "bench"],
}

interface PlanGenerationContext {
  // From onboarding
  trainingGoals: string[] // e.g., ["Build Strength", "Improve Endurance"]
  experienceLevel: "beginner" | "intermediate" | "advanced"
  birthdate?: string // For age-appropriate recommendations

  // From personalization step
  trainingDays: number[] // e.g., [1, 3, 5] for Mon/Wed/Fri
  workoutDuration: 15 | 30 | 45 | 60 // minutes
  equipment: EquipmentCategory[] // Selected equipment categories
}
```

### Equipment Selection Design

The equipment selection uses a 3-tier approach inspired by fitness apps like Fitbod:

**1. Quick Presets (1-click selection)**
- Bodyweight Only: No equipment needed
- Home Gym: Dumbbells, bench, kettlebells + bodyweight
- Full Gym: Complete gym access with all equipment types

**2. Category Toggles (fine-tuning)**
Users can customize their selection by toggling individual equipment categories:
- Each category shows icon + label + example equipment
- Checkbox-style selection for clear selected state
- Preset auto-detects when selection matches

**3. Implementation**
- Component: `EquipmentSelector` at `/components/features/equipment/`
- Integrated in QuickStartWizard Step 2 (Week Setup)
- Equipment categories stored in Training Block metadata
- Used by AI for exercise filtering during plan generation

### Output Structure

```typescript
interface GeneratedPlan {
  block: {
    name: string // e.g., "Strength Foundation - 4 Weeks"
    description: string
    durationWeeks: 4 | 6 | 8
    focus: string
  }
  week: {
    name: string // e.g., "Week 1"
  }
  sessions: Array<{
    name: string // e.g., "Upper Body Push"
    dayOfWeek: number // 0-6
    exercises: Array<{
      exerciseId: number // Must exist in exercise library
      exerciseName: string // For display
      sets: Array<{
        reps: number
        weight?: number // null for bodyweight
        restSeconds: number
        rpe?: number
      }>
      notes?: string
    }>
  }>
}
```

### AI Tool Definitions

Extends existing ChangeSet pattern with new "bulk creation" tools:

| Tool | Purpose | Notes |
|------|---------|-------|
| `getPlanGenerationContext` | Read user context | Goals, experience, preferences |
| `searchExercisesForPlan` | Find exercises | Filtered by equipment, muscle group |
| `createTrainingBlockProposal` | Propose full block | Block + week + sessions + exercises |
| `confirmPlanGeneration` | Submit for approval | Pauses stream, shows review UI |

### System Prompt (Draft)

```markdown
You are an expert personal trainer creating a beginner-friendly training plan.

## User Context
- Goals: {trainingGoals}
- Experience: {experienceLevel}
- Training Days: {trainingDays}
- Workout Duration: {workoutDuration} minutes
- Equipment: {equipment}

## Instructions
1. Create a {durationWeeks}-week Training Block
2. Design {trainingDays.length} workouts per week
3. Each workout should be completable in {workoutDuration} minutes
4. Select exercises from the library that match equipment constraints
5. Use appropriate rep ranges for the user's goals:
   - Build Strength: 3-6 reps, heavier weight
   - Build Muscle: 8-12 reps, moderate weight
   - Endurance: 15-20 reps, lighter weight
   - General Fitness: 8-15 reps, varied

## Exercise Selection Rules
- {experienceLevel === 'beginner' ? 'Prefer machine and isolation exercises' : ''}
- {experienceLevel === 'intermediate' ? 'Include compound movements with some isolation' : ''}
- {experienceLevel === 'advanced' ? 'Emphasize compound movements and advanced variations' : ''}
- Always include warmup notes
- Balance push/pull/legs across the week

## Output
Call `createTrainingBlockProposal` with the complete plan, then call `confirmPlanGeneration`.
```

---

## UI/UX Design

### Flow Screens

#### Screen 1: Personalization (Post-Onboarding)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    Let's Build Your First Plan                  │
│                                                                 │
│      We'll use AI to create a personalized training block       │
│              based on your goals and preferences.               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Which days can you train?                                     │
│   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐     │
│   │ Mon │ │ Tue │ │ Wed │ │ Thu │ │ Fri │ │ Sat │ │ Sun │     │
│   │  ●  │ │     │ │  ●  │ │     │ │  ●  │ │     │ │     │     │
│   └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘     │
│                                                                 │
│   How long per workout?                                         │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│   │  30 min  │ │  45 min  │ │  60 min  │ │  90 min  │          │
│   │          │ │    ●     │ │          │ │          │          │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│   What equipment do you have?                                   │
│   ┌────────────────────────────────────────────────────────┐   │
│   │  ▼  Full Gym (barbells, dumbbells, machines, cables)   │   │
│   └────────────────────────────────────────────────────────┘   │
│                                                                 │
│                                                                 │
│           [Skip & Create Manually]    [Generate My Plan →]      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Screen 2: AI Generation (Streaming)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    Creating Your Training Plan                  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                          │  │
│   │   🤖 AI is designing your workouts...                   │  │
│   │                                                          │  │
│   │   ████████████████████░░░░░░░░░░░░  65%                 │  │
│   │                                                          │  │
│   │   ✓ Analyzed your goals: Build Strength                 │  │
│   │   ✓ Selected exercises for your equipment               │  │
│   │   ⟳ Creating Monday's workout...                        │  │
│   │   ○ Creating Wednesday's workout                        │  │
│   │   ○ Creating Friday's workout                           │  │
│   │                                                          │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│                                                                 │
│                          [Cancel]                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Screen 3: Plan Review (Approval)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  🎉 Your Plan is Ready!                                  │  │
│   │                                                          │  │
│   │  [Approve Plan]    [Regenerate]    [Edit]               │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   STRENGTH FOUNDATION                                          │
│   4 weeks • Build Strength focus • 3 workouts/week             │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  WEEK 1 OVERVIEW                                         │  │
│   ├─────────────────────────────────────────────────────────┤  │
│   │                                                          │  │
│   │  MONDAY - Upper Body Push                                │  │
│   │  • Bench Press (4×6)                                     │  │
│   │  • Overhead Press (3×8)                                  │  │
│   │  • Incline Dumbbell Press (3×10)                        │  │
│   │  • Tricep Pushdowns (3×12)                              │  │
│   │  ≈ 45 minutes                                           │  │
│   │                                                          │  │
│   │  WEDNESDAY - Lower Body                                  │  │
│   │  • Barbell Squat (4×6)                                  │  │
│   │  • Romanian Deadlift (3×8)                              │  │
│   │  • Leg Press (3×10)                                     │  │
│   │  • Leg Curls (3×12)                                     │  │
│   │  ≈ 45 minutes                                           │  │
│   │                                                          │  │
│   │  FRIDAY - Upper Body Pull                                │  │
│   │  • Barbell Row (4×6)                                    │  │
│   │  • Pull-ups (3×8)                                       │  │
│   │  • Face Pulls (3×12)                                    │  │
│   │  • Bicep Curls (3×12)                                   │  │
│   │  ≈ 45 minutes                                           │  │
│   │                                                          │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   Want changes? Tell me what to adjust:                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  e.g., "Add more core exercises" or "No deadlifts"      │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Screen 4: Success & First Workout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                          ✓                                      │
│                                                                 │
│                  Your Training Plan is Ready!                   │
│                                                                 │
│              "Strength Foundation" has been created             │
│                with 3 workouts ready for this week.             │
│                                                                 │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                          │  │
│   │              ┌─────────────────────────┐                │  │
│   │              │   Start First Workout   │                │  │
│   │              │       (Monday)          │                │  │
│   │              │    Upper Body Push      │                │  │
│   │              └─────────────────────────┘                │  │
│   │                                                          │  │
│   │              or                                          │  │
│   │                                                          │  │
│   │              [View Training Block →]                     │  │
│   │                                                          │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile Optimization

All screens designed for mobile-first:
- Large touch targets (48px minimum)
- Single-column layouts
- Bottom-anchored primary CTAs
- Swipe gestures for day selection
- Collapsible session details

---

## Technical Architecture

### Component Structure

```
components/features/first-experience/
├── FirstExperienceGateway.tsx      # Route guard, checks for blocks
├── AIPersonalizationStep.tsx       # Training days, duration, equipment
├── AIPlanGenerator.tsx             # Streaming generation UI
├── PlanReviewApproval.tsx          # ChangeSet approval UI
├── FirstWorkoutSuccess.tsx         # Success state with CTA
├── hooks/
│   ├── useFirstExperience.ts       # State management
│   ├── usePlanGeneration.ts        # AI streaming hook
│   └── usePersonalizationDefaults.ts # Smart defaults
└── index.ts
```

### API Routes

```
app/api/ai/plan-generator/route.ts   # New AI route for plan generation
```

### Database Operations

Uses existing server actions with new orchestration:

```typescript
// Atomic plan creation (all or nothing)
async function createGeneratedPlan(plan: GeneratedPlan): Promise<ActionState<{blockId: string, firstSessionId: string}>> {
  // 1. Create mesocycle (Training Block)
  // 2. Create microcycle (Week 1)
  // 3. Create session_plans for each day
  // 4. Create session_plan_exercises for each exercise
  // 5. Create session_plan_sets for each set
  // All in single transaction via RPC function
}
```

### Integration with Existing Patterns

| Component | Reuse Strategy |
|-----------|----------------|
| ChangeSet Context | Wrap generator in `ChangeSetProvider` |
| Approval Banner | Reuse `ApprovalBanner` component |
| Exercise Search | Reuse `searchExercises` read tool |
| Block Creation | Extend `createQuickTrainingBlockAction` |
| Session Creation | Reuse `session-planner-actions.ts` patterns |

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 80% of first-time individual users complete AI plan generation
- **SC-002**: Time from onboarding complete to first workout < 60 seconds
- **SC-003**: AI generation time (personalization submit → plan visible) < 5 seconds
- **SC-004**: 70% of users start their first workout within 24 hours
- **SC-005**: < 20% of users use "Regenerate" (indicates good first attempt)
- **SC-006**: Zero data corruption (atomic transactions for all creations)
- **SC-007**: 90% approval rate on first AI-generated plan

---

## Implementation Phases

### Phase 1: Foundation (P0)
- [ ] First experience gateway/redirect logic
- [ ] Personalization step UI
- [ ] Basic AI plan generation (streaming)
- [ ] Plan review UI
- [ ] Atomic plan creation action

### Phase 2: AI Enhancement (P0)
- [ ] Equipment-aware exercise selection
- [ ] Goal-based rep range mapping
- [ ] Experience-based exercise complexity
- [ ] Regenerate with feedback

### Phase 3: Polish (P1)
- [ ] Smart defaults based on experience
- [ ] Progress indicators during generation
- [ ] First workout success screen
- [ ] Mobile optimization
- [ ] Error handling & retry

### Phase 4: Iteration (P2)
- [ ] Analytics tracking
- [ ] A/B test different flows
- [ ] Template library integration
- [ ] "Create with AI" from empty state

---

## Dependencies

- **006-individual-user-role**: Onboarding data (goals, experience)
- **002-ai-session-assistant**: ChangeSet pattern, approval UI
- **005-ai-athlete-workout**: Shared AI infrastructure
- **Exercise Library**: Populated with equipment tags
- Vercel AI SDK for streaming
- OpenAI GPT-4o for plan generation

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI generates poor exercise selection | Medium | High | Fallback to curated templates |
| Exercise library missing equipment tags | Medium | Medium | Audit & backfill before launch |
| Streaming errors mid-generation | Low | Medium | Graceful error with retry |
| Users skip AI, use manual (low adoption) | Low | Medium | A/B test, optimize copy |
| Generation too slow (>5s) | Medium | Medium | Pre-warm model, optimize prompt |

---

## Open Questions

1. **Block Duration**: Should AI decide block duration (4/6/8 weeks) or user choose?
   - Recommendation: AI decides based on goals, show in review

2. **Week Repetition**: Should Week 1 template repeat for all weeks, or progressive overload?
   - Recommendation: MVP = same template, V2 = progressive overload

3. **Exercise Alternatives**: Should each exercise have AI-suggested alternatives?
   - Recommendation: V2 feature, not MVP

4. **Regeneration Limits**: Should we limit regeneration attempts?
   - Recommendation: No limit, but track analytics

5. **Skip to Manual**: Should "Skip" go to QuickStartWizard or EmptyTrainingState?
   - Recommendation: QuickStartWizard (keep momentum)

---

## Appendix: Research Sources

- [UXCam - App Onboarding Guide](https://uxcam.com/blog/10-apps-with-great-user-onboarding/)
- [CleverTap - App Onboarding Best Practices](https://clevertap.com/blog/app-onboarding/)
- [UserGuiding - User Onboarding Best Practices 2025](https://userguiding.com/blog/user-onboarding-best-practices)
- [Virtuagym - Fitness Onboarding Strategies](https://business.virtuagym.com/blog/fitness-onboarding/)

Key findings:
- 81% of users prefer step-by-step tours
- Get users to value in <60 seconds
- Progressive disclosure > feature dump
- Personalization from the start increases engagement
- Interactive > static instructions

---

*Document created: 2026-01-12*
*Status: Draft - Awaiting Review*
