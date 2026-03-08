# Research: Individual User First Experience

**Feature Branch**: `010-individual-first-experience`
**Created**: 2026-01-12

---

## Executive Summary

This research documents findings on fitness app onboarding best practices, existing AI capabilities in the codebase, and the current gap in the individual user journey. The goal is to inform the design of an AI-powered first experience that gets users to their first workout in under 60 seconds.

---

## 1. Industry Best Practices (Web Research)

### Key Statistics

| Metric | Value | Source |
|--------|-------|--------|
| Users who abandon after first use | 25% | UXCam |
| Retention increase with good onboarding | 50% | CleverTap |
| Users preferring step-by-step tours | 81% | UserGuiding |
| Users preferring walkthrough videos | 54% | UserGuiding |
| Users finding checklists helpful | 43% | UserGuiding |
| Users annoyed by pushy feedback prompts | 86% | UserGuiding |

### Best Practice Summary

1. **Get to Value Fast**
   - First workout should be visible within 60 seconds
   - Minimize steps: goal → plan → start workout
   - Offer guest mode or smart defaults to reduce friction

2. **Personalization from Start**
   - MyFitnessPal: asks goals, collects metrics, creates personalized calorie plan immediately
   - "Build your plan" quiz helps tailor journey
   - Simple questions: "How often do you work out?" "What motivates you?"

3. **Progressive Disclosure**
   - Don't dump every feature up front
   - Reveal options gradually as relevant
   - 5-7 essential steps max for onboarding tour

4. **Interactive > Static**
   - Guide users to complete tasks (not just read)
   - Tooltips and prompts over static instructions
   - Let users learn by doing

5. **Cross-Device Consistency**
   - Sync preferences, progress, profiles
   - Important for gym use (phone) vs home planning (desktop)

### Sources

- [UXCam - App Onboarding Guide](https://uxcam.com/blog/10-apps-with-great-user-onboarding/)
- [CleverTap - App Onboarding](https://clevertap.com/blog/app-onboarding/)
- [UserGuiding - Onboarding Best Practices 2025](https://userguiding.com/blog/user-onboarding-best-practices)
- [Virtuagym - Fitness Onboarding](https://business.virtuagym.com/blog/fitness-onboarding/)
- [VWO - Mobile App Onboarding Guide](https://vwo.com/blog/mobile-app-onboarding-guide/)

---

## 2. Current State Analysis

### Onboarding Data Collected

From `individual-details-step.tsx`:

```typescript
// Training Goals (multi-select)
const TRAINING_GOALS = [
  "Build Strength", "Lose Weight", "Improve Endurance",
  "Build Muscle", "Improve Flexibility", "General Fitness",
  "Train for an Event", "Improve Speed", "Recover from Injury",
  "Maintain Fitness"
]

// Experience Levels
const EXPERIENCE_LEVELS = [
  { id: "beginner", description: "New to structured training (0-1 years)" },
  { id: "intermediate", description: "Consistent training experience (1-3 years)" },
  { id: "advanced", description: "Extensive training background (3+ years)" }
]
```

This data is stored but NOT currently used post-onboarding.

### Current Post-Onboarding Flow

1. **Onboarding Complete** → Redirect to `/dashboard`
2. **Dashboard** → Shows "No workout scheduled" empty state
3. **User must navigate** → `/plans` (via sidebar)
4. **Plans page** → Shows `EmptyTrainingState` with "Create Training Block" CTA
5. **QuickStartWizard** → 2-step wizard (settings → week setup)
6. **Block Created** → Empty sessions (no exercises)
7. **Session Editor** → User must manually add exercises
8. **Finally** → Ready for first workout

**Gap Analysis**: Steps 3-7 represent significant friction. User collected goals/experience but system doesn't use it.

### Existing AI Infrastructure

From codebase exploration:

| Component | Purpose | Reusable? |
|-----------|---------|-----------|
| ChangeSet Pattern | Human-in-the-loop approval | Yes |
| `SessionAssistant.tsx` | Chat + proposal UI | Partially |
| `ApprovalBanner.tsx` | Approve/Regenerate UI | Yes |
| `ChatDrawer.tsx` | Mobile chat interface | Yes |
| `searchExercises` tool | Exercise library search | Yes |
| `session-planner.ts` prompt | Coach persona | Adapt |
| Vercel AI SDK | Streaming, tools | Yes |
| OpenAI GPT-4o | LLM model | Yes |

### Existing Plan Creation Flow

From `QuickStartWizard.tsx`:

```typescript
// Step 1: Block Settings
const blockSettingsSchema = z.object({
  name: z.string().min(3),
  durationWeeks: z.number().min(1).max(12),
  focus: z.enum(["strength", "endurance", "general"]),
})

// Step 2: Week Setup
const weekSetupSchema = z.object({
  trainingDays: z.array(z.number()).min(1),
})

// Creates block with empty sessions
const result = await createQuickTrainingBlockAction({
  name, startDate, endDate, focus, trainingDays
})
```

**Key Finding**: `QuickStartWizard` creates sessions but doesn't populate exercises. This is the gap AI can fill.

---

## 3. AI Prompt Engineering Considerations

### Goal-Based Rep Range Mapping

| Goal | Rep Range | Rest Period | Volume |
|------|-----------|-------------|--------|
| Build Strength | 3-6 | 3-5 min | Lower |
| Build Muscle | 8-12 | 60-90 sec | Higher |
| Improve Endurance | 15-25 | 30-45 sec | Higher |
| Lose Weight | 12-20 | 30-60 sec | Moderate |
| General Fitness | 8-15 | 60-90 sec | Moderate |

### Experience-Based Exercise Selection

| Level | Exercise Types | Complexity |
|-------|---------------|------------|
| Beginner | Machines, isolation, bodyweight | Low technique demand |
| Intermediate | Compound + isolation mix | Moderate technique |
| Advanced | Compound focus, variations | High technique ok |

### Equipment Categories

```typescript
const EQUIPMENT_PRESETS = {
  "full-gym": ["barbell", "dumbbell", "cable", "machine", "bodyweight"],
  "home": ["dumbbell", "resistance-band", "bodyweight", "kettlebell"],
  "bodyweight": ["bodyweight"],
  "dumbbells": ["dumbbell", "bodyweight"],
}
```

---

## 4. Competitive Analysis (Conceptual)

### MyFitnessPal
- Asks goals immediately
- Calculates personalized daily targets
- Makes app relevant from first use

### Fitbod
- AI-generated workouts based on goals
- Adapts to available equipment
- Progressive overload built-in

### JEFIT
- Extensive exercise library
- Templates for quick start
- Less AI, more manual

### Key Differentiator for Kasoku

Combine:
1. **MyFitnessPal's goal personalization**
2. **Fitbod's AI workout generation**
3. **Our ChangeSet approval pattern** (human-in-the-loop)

---

## 5. Technical Feasibility

### What Already Works

- [x] Onboarding collects goals + experience
- [x] ChangeSet pattern for proposals
- [x] Approval UI components
- [x] Exercise library with search
- [x] Session creation actions
- [x] Streaming AI responses

### What Needs Building

- [ ] AI plan generation endpoint
- [ ] Personalization step UI
- [ ] Equipment-tagged exercise filtering
- [ ] First experience gateway
- [ ] Atomic multi-entity creation action

### Effort Estimate

| Component | Complexity | Estimate |
|-----------|------------|----------|
| Gateway/routing | Low | 2 hours |
| Personalization UI | Low | 3 hours |
| AI route + prompt | Medium | 4 hours |
| Plan generation streaming | Medium | 4 hours |
| Review/approval UI | Low (reuse) | 2 hours |
| Atomic creation action | Medium | 4 hours |
| Success screen | Low | 1 hour |
| Testing | Medium | 4 hours |
| **Total** | | **~24 hours** |

---

## 6. Recommendations

### MVP Scope

1. **Personalization**: Training days, duration, equipment (3 inputs)
2. **AI Generation**: One block, one week, N sessions with exercises
3. **Approval**: Simple approve/regenerate (no inline editing)
4. **Post-Creation**: Direct link to first workout

### V2 Enhancements

1. Progressive overload across weeks
2. Exercise alternatives per movement
3. Equipment audit (ensure all exercises tagged)
4. Feedback-driven regeneration
5. Template save for sharing

### Key Success Metrics

1. Time to first workout (target: <60s)
2. AI plan approval rate (target: >70%)
3. First workout start rate within 24h (target: >50%)
4. Regeneration rate (target: <20%)

---

## 7. Audit Issues Status (from spec_v2.md)

Relevant issues that have been addressed:

| Issue | Status |
|-------|--------|
| API Route rejects "individual" | Fixed |
| Equipment data discarded | Fixed |
| Session page missing role protection | Fixed |
| Individual data validation | Fixed |

Remaining architecture items (Phase 2):
- RLS policies
- Ownership validation in session actions
- Database-level security

---

*Research completed: 2026-01-12*
