# Individual User Role Design Document

> **Status**: ✅ Decisions Confirmed - Ready for Implementation
> **Created**: 2026-01-01
> **Last Updated**: 2026-01-01
> **Author**: AI Assistant + Product Owner
> **Related**: [Database Schema](../database-schema.md), [Onboarding Flow](./onboarding/onboarding-refactor-documentation.md)

---

## Executive Summary

This document defines how to support **individual users** (self-coached athletes, gym enthusiasts, recreational trainers) in Kasoku.run with minimal UX changes while preserving the periodization-based planning that enables meaningful AI assistance.

### Confirmed Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Role Name | **Individual** | Clear, professional |
| Mesocycle Term | **Training Block** | User-friendly |
| Microcycle Term | **Week** | Universal |
| Active Blocks | **One at a time** | Simpler UX |
| AI Branding | **AI Assistant** | Helper, not authority |
| Athlete Record | **Created silently** | Enables upgrade path |
| Macrocycle | **Hidden for individuals** | Too advanced |

### Current State
- Binary role system: **Coach** (creates plans, manages athletes) vs **Athlete** (follows plans, logs workouts)
- Individual users who want to self-coach don't fit either role well
- Periodization hierarchy: Macrocycle → Mesocycle → Microcycle → Session Plan

### Goal
Enable individual users to:
- Create their own training plans
- Log their own workouts
- Benefit from AI-assisted planning with periodization context
- Experience a simplified, beginner-friendly interface

---

## 1. Role Definition

### Proposed Role: "Individual" (Working Name)

| Aspect | Coach | Individual | Athlete |
|--------|-------|------------|---------|
| Creates plans | ✓ | ✓ (for self only) | ✗ |
| Logs workouts | ✗ | ✓ | ✓ |
| Manages athletes | ✓ | ✗ | ✗ |
| Needs athlete_group | ✓ | ✗ | ✓ (assigned) |
| Has coach | ✗ | ✗ (AI is coach) | ✓ |
| Pricing (future) | Paid | Free | Free |

### Naming Options (Needs Decision)

| Option | Pros | Cons |
|--------|------|------|
| **Individual** | Clear, professional | Generic |
| **Self-Coached** | Descriptive, industry term | Technical |
| **Personal** | Friendly, approachable | Vague |
| **Solo Trainer** | Active, motivational | Implies expertise |
| **Free Athlete** | Indicates pricing | Confusing with "Athlete" role |

**Question 1**: What should we call this role in the UI?

---

## 2. Database Architecture

### Current Schema (Relevant Tables)

```
users
├── role: 'athlete' | 'coach' | 'admin'
├── Plans link via: user_id (direct) OR athlete_group_id (via group)
│
macrocycles
├── user_id (nullable) ← Can link directly to user
├── athlete_group_id (nullable) ← Can link to group
│
session_plans
├── user_id (nullable)
├── athlete_group_id (nullable)
├── microcycle_id (nullable)
│
workout_logs
├── athlete_id (required for current athletes)
├── session_plan_id (nullable)
```

### Proposed Changes (Minimal)

**Option A: Individual = User + Athlete record (Recommended)**
```sql
-- Add 'individual' to role
ALTER TYPE user_role ADD VALUE 'individual';

-- When user selects "Individual" in onboarding:
-- 1. Create user with role = 'individual'
-- 2. Create athlete record linked to user (for workout_logs FK)
-- 3. NO coach record, NO athlete_group

-- Plans link directly via user_id (athlete_group_id = NULL)
-- Workouts link via athlete_id (still requires athlete record)
```

**Why this works**:
- `macrocycles.user_id` already supports direct user linking
- `session_plans.user_id` already supports direct user linking
- `workout_logs.athlete_id` requires athlete record (we create one silently)
- No schema migration needed, just application logic

**Question 2**: Confirm - Individual users get an `athlete` record created automatically (for FK purposes) but never see "athlete" terminology in UI?

---

## 3. Periodization for Individual Users

### Industry Research Summary

| App | Target User | Structure | Terminology |
|-----|-------------|-----------|-------------|
| **Apple Fitness+** | General fitness | 3-week cycles, repeat | "Program" → "Week" |
| **Hevy** | Gym enthusiasts | Routines + Programs (5-6 weeks) | "Program" → "Workout" |
| **Alpha Progression** | Intermediate lifters | Cycles with deloads | "Training Cycle" → "Week" |
| **JEFIT** | All levels | 4-8 week programs | "Program" → "Week" → "Day" |
| **Ladder** | General fitness | 5-6 week progressions | "Program" → "Day" |
| **TrainingPeaks** | Serious athletes | Full periodization | Macro/Meso/Micro |

### Key Insights

1. **Most consumer apps hide periodization complexity** - They use friendly terms like "Program", "Block", "Phase", "Week"

2. **Typical structure for regular users**:
   - **Program** (4-12 weeks) → **Week** → **Day/Session**
   - This maps roughly to: Mesocycle → Microcycle → Session

3. **Macrocycle is rarely exposed** to regular users - It's a coaching concept for annual planning

4. **3-6 week blocks are standard** for consumer fitness apps

5. **AI/Coach apps emphasize weekly progression** with auto-adjusted intensity

### Proposed Hierarchy for Individuals

```
Coach View (Full):           Individual View (Simplified):
─────────────────           ─────────────────────────────
Macrocycle (Annual Plan)    [Hidden - not needed]
    │
    └── Mesocycle (Block)   → "Training Block" or "Program Phase"
            │                   (3-6 weeks, e.g., "Strength Phase")
            │
            └── Microcycle  → "Week" (Week 1, Week 2, etc.)
                    │
                    └── Session → "Workout" (Monday Legs, etc.)
```

### Terminology Mapping

| Technical Term | Individual-Friendly Term | Description |
|----------------|-------------------------|-------------|
| Mesocycle | **Training Block** or **Phase** | 3-6 weeks focused on a goal |
| Microcycle | **Week** | A single training week |
| Session Plan | **Workout** | A single training session |
| Macrocycle | *(Hidden)* | Not exposed to individuals |

**Question 3**: Do you agree with hiding Macrocycle and using "Training Block" for Mesocycle?

**Question 4**: Should individuals have access to multiple "Training Blocks" at once, or just one active block?

---

## 4. User Experience Flow

### Onboarding (Modified Role Selection)

```
┌─────────────────────────────────────────────────────────────────┐
│                    What brings you here?                        │
├───────────────────┬───────────────────┬─────────────────────────┤
│                   │                   │                         │
│   🏃 Train with   │  🎯 Train Myself  │   👥 Coach Athletes     │
│      a Coach      │                   │                         │
│                   │                   │                         │
│   Follow plans    │  AI-powered       │   Create programs       │
│   from your coach │  self-coaching    │   for your team         │
│                   │                   │                         │
│   [Athlete]       │  [Individual]     │   [Coach]               │
└───────────────────┴───────────────────┴─────────────────────────┘
```

### Individual Onboarding Steps

1. **Welcome** - Same as current
2. **Role Selection** - "Train Myself" selected
3. **Profile Details** - Simplified (no coach-specific or athlete-group fields)
   - Name, birthdate, timezone
   - Training goals (strength, endurance, weight loss, etc.)
   - Experience level (beginner, intermediate, advanced)
   - Available equipment
4. **First Block Setup** (Optional, can skip)
   - "What's your focus for the next few weeks?"
   - Duration: 4 weeks (default), 6 weeks, 8 weeks
   - AI suggests initial structure
5. **Dashboard Tour** - Tailored to individual features

### Individual Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│  📊 My Training                                    [AI ✨]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Current Block: Strength Foundation (Week 2 of 4)           │
│  ═══════════════════════════════════════════ 50%            │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ Today       │  │ Tomorrow    │  │ Wed         │          │
│  │ Upper Body  │  │ Rest        │  │ Lower Body  │          │
│  │ 6 exercises │  │             │  │ 5 exercises │          │
│  │ [Start] ▶   │  │ ─────       │  │ Scheduled   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                              │
│  This Week's Progress                                        │
│  ┌────┬────┬────┬────┬────┬────┬────┐                       │
│  │ M  │ T  │ W  │ T  │ F  │ S  │ S  │                       │
│  │ ✓  │ 📍 │    │    │    │    │    │                       │
│  └────┴────┴────┴────┴────┴────┴────┘                       │
│                                                              │
│  [+ Create Workout]  [📋 Browse Templates]  [🤖 Ask AI]     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Navigation (Sidebar) - Individual vs Coach

**Note**: Individual = Athlete + self-planning. Knowledge Base is available to all roles.

| Nav Item | Athlete | Individual | Coach | Notes |
|----------|---------|------------|-------|-------|
| Dashboard | ✓ | ✓ | ✓ | All roles |
| Workout | ✓ | ✓ | ✓ | All roles (coaches have athlete record) |
| My Training | ✗ | ✓ | ✓ | Individual + Coach can create plans |
| Athletes | ✗ | ✗ | ✓ | Coach-only |
| Sessions | ✗ | ✗ | ✓ | Coach-only |
| Library | ✓ | ✓ | ✓ | All roles |
| Knowledge Base | ✓ | ✓ | ✓ | All roles |
| Performance | ✓ | ✓ | ✓ | All roles |
| Settings | ✓ | ✓ | ✓ | All roles |

**Clarification (2026-01-02)**: Individual = Athlete + self-planning capabilities. Knowledge Base is available to all roles, not coach-only.

---

## 5. AI Integration Points

### Why Periodization Matters for AI

The AI assistant needs context to provide meaningful suggestions:

```
Without Periodization:
AI: "Here's a random workout for today"
→ No progression, no recovery planning, no goal alignment

With Periodization (even simplified):
AI: "You're in Week 3 of your Strength Block. Based on your progress,
    let's increase the weight on squats by 5kg this week. I've also
    noticed you mentioned knee discomfort - let's swap box jumps for
    step-ups."
→ Progressive overload, injury awareness, goal-aligned
```

### AI Features for Individuals

1. **Block Planning**: "I want to get stronger in the next 6 weeks" → AI creates Training Block
2. **Weekly Adjustments**: AI suggests modifications based on logged performance
3. **Workout Generation**: "Create a leg workout for today" → Context-aware suggestion
4. **Recovery Insights**: "You've trained 5 days straight, consider a rest day"
5. **Progress Analysis**: "Your squat has increased 15% this block"

### Memory Context for AI

```typescript
// What AI knows about an individual user
interface IndividualContext {
  currentBlock: {
    name: string           // "Strength Foundation"
    goal: string           // "Build strength"
    weekNumber: number     // 2
    totalWeeks: number     // 4
  }
  recentWorkouts: WorkoutLog[]
  personalBests: PersonalBest[]
  preferences: Memory[]    // From ai_memories table
  injuries: Memory[]       // Contraindications
  equipment: string[]      // Available equipment
}
```

**Question 6**: Should the AI be positioned as "Your AI Coach" for individuals?

---

## 6. Implementation Plan (Detailed)

### Analysis Summary

**Good News**: The existing infrastructure already supports most individual user features:
- `session_plans.athlete_group_id` is **nullable** ✅
- `macrocycles.athlete_group_id` is **nullable** ✅
- `session_mode` already supports `'individual'` value ✅
- Plans can link directly to `user_id` without group ✅

**Changes Required**:

### Phase 1: Core Role Support (MVP)

#### 1.1 Database/Types Changes

| File | Change | Priority |
|------|--------|----------|
| `contexts/user-role-context.tsx` | Add `'individual'` to `UserRole` type, add `isIndividual` computed property | HIGH |
| `actions/onboarding/onboarding-actions.ts` | Handle `role: 'individual'` - create athlete record (like coach does) | HIGH |
| `components/features/onboarding/onboarding-wizard.tsx` | Add `'individual'` to `OnboardingData.role` type | HIGH |

```typescript
// contexts/user-role-context.tsx - BEFORE
export type UserRole = 'athlete' | 'coach' | 'admin'

// AFTER
export type UserRole = 'athlete' | 'coach' | 'admin' | 'individual'

// Add to context value:
isIndividual: role === 'individual',
```

#### 1.2 Onboarding Changes

| File | Change | Priority |
|------|--------|----------|
| `components/features/onboarding/steps/role-selection-step.tsx` | Add third card for "Individual" | HIGH |
| `components/features/onboarding/steps/individual-details-step.tsx` | **NEW FILE** - Simplified profile (goals, experience, equipment) | HIGH |
| `components/features/onboarding/onboarding-wizard.tsx` | Route to individual details step when role = 'individual' | HIGH |

```tsx
// role-selection-step.tsx - Add third option
<Card onClick={() => handleRoleSelect("individual")}>
  <CardTitle>Train Myself</CardTitle>
  <CardDescription>
    AI-powered self-coaching for personal training
  </CardDescription>
  {/* Features: Create personal plans, Log workouts, AI assistance */}
</Card>
```

#### 1.3 Navigation Changes

| File | Change | Priority |
|------|--------|----------|
| `components/layout/sidebar/app-sidebar.tsx` | Update visibility logic for individuals | HIGH |

```typescript
// app-sidebar.tsx - IMPLEMENTED (2026-01-02)
// Old coachOnly pattern has been replaced with visibleTo array
interface NavItem {
  title: string
  url: string
  icon: any
  visibleTo?: ('coach' | 'individual' | 'athlete' | 'admin')[]  // If undefined, visible to all
}

const navItems: NavItem[] = [
  { title: "Athletes", url: "/athletes", icon: Users, visibleTo: ['coach', 'admin'] },
  { title: "My Training", url: "/plans", icon: Calendar, visibleTo: ['coach', 'individual', 'admin'] },
  { title: "Workout", url: "/workout", icon: Dumbbell, visibleTo: ['athlete', 'individual'] },
  // ...
]
```

#### 1.4 Plans Page Adaptation

| File | Change | Priority |
|------|--------|----------|
| `components/features/plans/` | Conditionally hide group selector for individuals | MEDIUM |
| `components/features/plans/workspace/` | Hide macrocycle creation, show only mesocycle ("Training Block") | MEDIUM |

**Key Behavior**:
- Individual sees: "Training Block" → "Week" → "Workout"
- No athlete group selector (auto-filtered to their user_id)
- Single active Training Block at a time

### Phase 2: Simplified Individual UI

| Task | Description | Priority |
|------|-------------|----------|
| Terminology layer | Add role-based terminology mapping | MEDIUM |
| Plans workspace simplification | Hide macro level for individuals | MEDIUM |
| Dashboard adaptation | Show personal training summary | LOW |

```typescript
// lib/terminology.ts - NEW FILE
export function getTerminology(role: UserRole) {
  if (role === 'individual') {
    return {
      mesocycle: 'Training Block',
      microcycle: 'Week',
      sessionPlan: 'Workout',
      macrocycle: null, // Hidden
    }
  }
  return {
    mesocycle: 'Mesocycle',
    microcycle: 'Microcycle',
    sessionPlan: 'Session Plan',
    macrocycle: 'Macrocycle',
  }
}
```

### Phase 3: AI Integration (Future)

| Task | Description |
|------|-------------|
| Block planning AI | "Create a 4-week strength block" |
| Weekly adjustments | AI suggests modifications based on logged data |
| Progress insights | "Your squat increased 15% this block" |

---

## 7. Resolved Questions

All major questions have been resolved:

| # | Question | Answer |
|---|----------|--------|
| 1 | Role Name | **Individual** |
| 2 | Mesocycle term | **Training Block** |
| 3 | Microcycle term | **Week** |
| 4 | Athlete Record | **Create silently** (enables upgrade path) |
| 5 | Multiple Blocks | **One active at a time** |
| 6 | Macrocycle | **Hidden for individuals** |
| 7 | AI Positioning | **AI Assistant** |
| 8 | Upgrade Path | **Supported** (Individual → Coach or → Athlete with coach) |

What?
## 8. Research Sources

### Fitness App Structures
- [Apple Fitness+ 2025 Programs](https://www.apple.com/newsroom/2025/01/apple-fitness-plus-unveils-an-exciting-lineup-of-new-ways-to-stay-active-in-2025/) - 3-week progressive cycles
- [Hevy Workout Routines](https://www.hevyapp.com/features/gym-workout-routines/) - 26 programs, 5-6 week structure
- [Alpha Progression](https://alphaprogression.com/en) - Periodization with deloads
- [JEFIT Periodization](https://www.jefit.com/wp/general-fitness/designing-a-periodized-strength-training-plan/) - Macro/Meso/Micro approach

### UX Best Practices
- [Fitness App UX Design](https://stormotion.io/blog/fitness-app-ux/) - Onboarding under 60 seconds
- [SaaS Onboarding Patterns](https://www.eleken.co/blog-posts/user-onboarding-ux-patterns-a-guide-for-saas-companies) - 2-5 role options
- [Onboarding UX Patterns](https://userpilot.com/blog/onboarding-ux-patterns/) - 74% prefer adaptive onboarding

### Self-Coaching Insights
- [TrainingPeaks Self-Coaching Limitation](https://peaksware.uservoice.com/forums/106657-trainingpeaks-customer-feedback/suggestions/42393586-self-coached-athletes-can-create-plans-for-themsel) - User feedback on feature gap
- [Evolve Training Block Guide](https://www.evolvetrainingapp.com/post/what-is-a-training-block) - Beginner-friendly periodization explanation

---

## 9. Decision Log

| Date | Decision | Rationale | Decided By |
|------|----------|-----------|------------|
| 2026-01-01 | No personal athlete_group for individuals | Plans link directly to user_id - simpler | Product Owner |
| 2026-01-01 | Keep role selection in onboarding | Beta phase, free for now | Product Owner |
| 2026-01-01 | Individuals need some periodization | AI needs context for better suggestions | Product Owner |
| 2026-01-01 | Role name: "Individual" | Clear, professional terminology | Product Owner |
| 2026-01-01 | Use "Training Block" for Mesocycle | User-friendly term from industry | Product Owner |
| 2026-01-01 | Use "Week" for Microcycle | Universal understanding | Product Owner |
| 2026-01-01 | One active Training Block at a time | Simpler UX for individuals | Product Owner |
| 2026-01-01 | AI Assistant (not AI Coach) | Helper positioning, not authority | Product Owner |
| 2026-01-01 | Create athlete record silently | Enables smooth upgrade to Coach/Athlete role | Product Owner |
| 2026-01-01 | Hide Macrocycle for individuals | Too advanced, not needed for personal training | Product Owner |
| 2026-01-01 | Upgrade path supported | Individual → Coach or Individual → Athlete (with coach) | Product Owner |

---

## 10. Next Steps

### Ready for Implementation

1. **✅ Decisions finalized** - All major decisions documented in Section 7
2. **✅ Technical design complete** - See Section 6 for detailed implementation plan

### Implementation Order (Phase 1 MVP)

```
Priority HIGH (Do First):
├── 1. contexts/user-role-context.tsx - Add 'individual' role
├── 2. actions/onboarding/onboarding-actions.ts - Handle individual onboarding
├── 3. components/features/onboarding/steps/role-selection-step.tsx - Add third card
├── 4. components/features/onboarding/steps/individual-details-step.tsx - NEW FILE
├── 5. components/features/onboarding/onboarding-wizard.tsx - Route individual flow
└── 6. components/layout/sidebar/app-sidebar.tsx - Update nav visibility

Priority MEDIUM (Do Second):
├── 7. components/features/plans/ - Hide group selector for individuals
├── 8. lib/terminology.ts - NEW FILE for role-based terms
└── 9. plans/workspace/ - Hide macrocycle, show Training Block

Priority LOW (Future):
└── 10. Dashboard adaptation, AI integration
```

### Upgrade Path Implementation Notes

When an individual upgrades to Coach:
1. Create `coaches` record linked to their `user_id`
2. Keep existing `athletes` record (for personal training)
3. Update `users.role` to 'coach'
4. Their existing personal Training Blocks remain accessible

When an individual joins a Coach (becomes Athlete):
1. Already has `athletes` record - just update `athlete_group_id`
2. Update `users.role` to 'athlete'
3. Their personal Training Blocks become read-only history

---

## 11. File Change Summary

| File | Action | Lines (Est.) |
|------|--------|--------------|
| `contexts/user-role-context.tsx` | Modify | +5 |
| `actions/onboarding/onboarding-actions.ts` | Modify | +30 |
| `components/features/onboarding/steps/role-selection-step.tsx` | Modify | +40 |
| `components/features/onboarding/steps/individual-details-step.tsx` | **NEW** | ~100 |
| `components/features/onboarding/onboarding-wizard.tsx` | Modify | +15 |
| `components/layout/sidebar/app-sidebar.tsx` | Modify | +20 |
| `lib/terminology.ts` | **NEW** | ~30 |
| **Total estimated changes** | | ~240 lines |

---

*Document finalized on 2026-01-01. Ready for implementation.*
