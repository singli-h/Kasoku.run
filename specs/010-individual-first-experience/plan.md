# Implementation Plan: Individual User First Experience

**Feature Branch**: `010-individual-first-experience`
**Created**: 2026-01-12
**Status**: Draft

---

## Overview

This plan outlines the implementation phases for the AI-powered first experience for individual users. The goal is to bridge the gap between onboarding completion and the user's first workout in under 60 seconds.

---

## Phase 1: Foundation & Gateway

**Goal**: Route first-time individual users to the AI plan generator

### Tasks

#### 1.1 First Experience Detection
- [ ] Create `hasTrainingBlocks` check in user-actions.ts
- [ ] Add first-time detection to dashboard page
- [ ] Implement redirect logic for first-time users

**Files to modify**:
- `apps/web/actions/auth/user-actions.ts`
- `apps/web/app/(protected)/dashboard/page.tsx`

#### 1.2 First Experience Page Structure
- [ ] Create `/app/(protected)/first-experience/page.tsx`
- [ ] Create layout with clean onboarding-style UI
- [ ] Add exit route to manual creation (QuickStartWizard)

**Files to create**:
- `apps/web/app/(protected)/first-experience/page.tsx`
- `apps/web/app/(protected)/first-experience/layout.tsx`

#### 1.3 Component Scaffolding
- [ ] Create `components/features/first-experience/` folder
- [ ] Create `FirstExperienceGateway.tsx`
- [ ] Create `index.ts` exports

**Files to create**:
- `apps/web/components/features/first-experience/FirstExperienceGateway.tsx`
- `apps/web/components/features/first-experience/index.ts`

---

## Phase 2: Personalization Step

**Goal**: Collect training preferences (days, duration, equipment)

### Tasks

#### 2.1 Personalization UI Component
- [ ] Create `AIPersonalizationStep.tsx`
- [ ] Day selection (7-day chips, multi-select)
- [ ] Duration selection (30/45/60/90 min, single-select)
- [ ] Equipment dropdown (full-gym, home, bodyweight, dumbbells)
- [ ] Smart defaults based on experience level

**Files to create**:
- `apps/web/components/features/first-experience/AIPersonalizationStep.tsx`

#### 2.2 Personalization State Hook
- [ ] Create `useFirstExperience.ts` hook
- [ ] Manage step navigation
- [ ] Store personalization data
- [ ] Read onboarding data (goals, experience)

**Files to create**:
- `apps/web/components/features/first-experience/hooks/useFirstExperience.ts`

#### 2.3 Smart Defaults Logic
- [ ] Create `usePersonalizationDefaults.ts`
- [ ] Beginner: 30 min default, 3 days
- [ ] Intermediate: 45 min default, 4 days
- [ ] Advanced: 60 min default, 5+ days

**Files to create**:
- `apps/web/components/features/first-experience/hooks/usePersonalizationDefaults.ts`

---

## Phase 3: AI Plan Generation

**Goal**: Generate training block with populated sessions using AI

### Tasks

#### 3.1 AI Route Creation
- [ ] Create `/api/ai/plan-generator/route.ts`
- [ ] Implement streaming response
- [ ] Define tool schemas
- [ ] Create system prompt

**Files to create**:
- `apps/web/app/api/ai/plan-generator/route.ts`

#### 3.2 Plan Generation System Prompt
- [ ] Create `lib/changeset/prompts/plan-generator.ts`
- [ ] Goal-based rep range mapping
- [ ] Experience-based exercise selection
- [ ] Equipment constraints

**Files to create**:
- `apps/web/lib/changeset/prompts/plan-generator.ts`

#### 3.3 Plan Generation Tools
- [ ] Create `getPlanGenerationContext` read tool
- [ ] Create `searchExercisesForPlan` read tool (extends existing)
- [ ] Create `createTrainingBlockProposal` proposal tool
- [ ] Create `confirmPlanGeneration` coordination tool

**Files to modify**:
- `apps/web/lib/changeset/tools/read-tools.ts`
- `apps/web/lib/changeset/tools/proposal-tools.ts`

**Files to create**:
- `apps/web/lib/changeset/tools/plan-generator-tools.ts`

#### 3.4 Generation UI Component
- [ ] Create `AIPlanGenerator.tsx`
- [ ] Streaming progress indicator
- [ ] Cancel button
- [ ] Error state with retry

**Files to create**:
- `apps/web/components/features/first-experience/AIPlanGenerator.tsx`

#### 3.5 Generation Hook
- [ ] Create `usePlanGeneration.ts`
- [ ] Integrate Vercel AI SDK `useChat`
- [ ] Handle streaming state
- [ ] Parse tool calls

**Files to create**:
- `apps/web/components/features/first-experience/hooks/usePlanGeneration.ts`

---

## Phase 4: Review & Approval

**Goal**: Display generated plan for user approval

### Tasks

#### 4.1 Plan Review UI
- [ ] Create `PlanReviewApproval.tsx`
- [ ] Block summary section
- [ ] Week overview with session cards
- [ ] Expandable exercise lists per session
- [ ] Reuse `ApprovalBanner` pattern

**Files to create**:
- `apps/web/components/features/first-experience/PlanReviewApproval.tsx`

#### 4.2 Regeneration with Feedback
- [ ] Add feedback input field
- [ ] Pass feedback to AI on regenerate
- [ ] Show "regenerating" state

**Integration with**:
- `apps/web/components/features/ai-assistant/ApprovalBanner.tsx`

#### 4.3 Atomic Plan Creation Action
- [ ] Create `createGeneratedPlanAction` server action
- [ ] Transaction: block → week → sessions → exercises → sets
- [ ] Return block ID and first session ID

**Files to modify**:
- `apps/web/actions/plans/plan-actions.ts`

**OR create**:
- `apps/web/actions/plans/generated-plan-actions.ts`

#### 4.4 Database RPC Function (Optional)
- [ ] Create `create_generated_plan` RPC for atomic creation
- [ ] Handle all entity creation in single transaction

**Files to create**:
- `supabase/migrations/XXXXXX_create_generated_plan_rpc.sql`

---

## Phase 5: Post-Creation Flow

**Goal**: Guide user to their first workout

### Tasks

#### 5.1 Success Screen
- [ ] Create `FirstWorkoutSuccess.tsx`
- [ ] Show completion message
- [ ] "Start First Workout" primary CTA
- [ ] "View Training Block" secondary link

**Files to create**:
- `apps/web/components/features/first-experience/FirstWorkoutSuccess.tsx`

#### 5.2 Navigation Logic
- [ ] Navigate to workout session on CTA click
- [ ] Navigate to block workspace on secondary
- [ ] Set localStorage flag for returning users

---

## Phase 6: Integration & Polish

**Goal**: Connect all pieces, handle edge cases

### Tasks

#### 6.1 Empty State Enhancement
- [ ] Update `EmptyTrainingState.tsx` with "Create with AI" option
- [ ] Link to first experience flow
- [ ] Pre-fill from stored onboarding data

**Files to modify**:
- `apps/web/components/features/plans/home/EmptyTrainingState.tsx`

#### 6.2 Error Handling
- [ ] Handle AI generation failures
- [ ] Handle network errors
- [ ] Show retry options
- [ ] Graceful fallback to manual

#### 6.3 Mobile Optimization
- [ ] Test on mobile viewport
- [ ] Ensure touch-friendly targets
- [ ] Bottom-anchored CTAs
- [ ] Swipe gestures where applicable

#### 6.4 Analytics (Optional)
- [ ] Track first experience start
- [ ] Track personalization completion
- [ ] Track generation success/failure
- [ ] Track approval/regenerate/skip

---

## File Summary

### New Files to Create

```
apps/web/
├── app/(protected)/first-experience/
│   ├── page.tsx
│   └── layout.tsx
├── app/api/ai/plan-generator/
│   └── route.ts
├── components/features/first-experience/
│   ├── FirstExperienceGateway.tsx
│   ├── AIPersonalizationStep.tsx
│   ├── AIPlanGenerator.tsx
│   ├── PlanReviewApproval.tsx
│   ├── FirstWorkoutSuccess.tsx
│   ├── hooks/
│   │   ├── useFirstExperience.ts
│   │   ├── usePlanGeneration.ts
│   │   └── usePersonalizationDefaults.ts
│   └── index.ts
├── lib/changeset/
│   ├── prompts/plan-generator.ts
│   └── tools/plan-generator-tools.ts
└── actions/plans/
    └── generated-plan-actions.ts (or modify plan-actions.ts)

supabase/migrations/
└── XXXXXX_create_generated_plan_rpc.sql (optional)
```

### Existing Files to Modify

```
apps/web/
├── actions/auth/user-actions.ts
├── app/(protected)/dashboard/page.tsx
├── components/features/plans/home/EmptyTrainingState.tsx
├── lib/changeset/tools/read-tools.ts
└── lib/changeset/tools/proposal-tools.ts
```

---

## Dependencies & Prerequisites

### Before Starting

1. **Verify onboarding data persistence**
   - Confirm `individualTrainingGoals` and `individualExperienceLevel` are stored
   - Confirm they can be retrieved via `getCurrentUserAction`

2. **Exercise library audit**
   - Verify exercises have equipment tags
   - Identify gaps for common equipment types

3. **Review existing ChangeSet pattern**
   - Understand `building` → `pending_approval` → `executing` flow
   - Review how `confirmChangeSet` pauses AI stream

### Technical Dependencies

- Vercel AI SDK (`ai`, `@ai-sdk/react`)
- OpenAI (`@ai-sdk/openai`)
- Existing ChangeSet infrastructure
- Existing server actions pattern

---

## Testing Strategy

### Unit Tests

- [ ] `usePersonalizationDefaults` returns correct defaults per experience
- [ ] `createGeneratedPlanAction` creates all entities atomically
- [ ] Plan generation prompt produces valid exercise IDs

### Integration Tests

- [ ] First-time user redirected to first experience
- [ ] Returning user with blocks goes to dashboard
- [ ] AI generation produces valid plan structure
- [ ] Approval creates block with correct sessions

### E2E Tests

- [ ] Complete flow: onboarding → personalize → generate → approve → workout
- [ ] Regenerate flow works
- [ ] Skip to manual flow works
- [ ] Mobile viewport works

---

## Rollout Plan

### Phase A: Internal Testing
- Deploy to staging
- Test with internal users
- Gather feedback

### Phase B: Soft Launch
- Enable for 10% of new individual users
- Monitor metrics (time to first workout, approval rate)
- Fix critical issues

### Phase C: Full Launch
- Enable for all new individual users
- Add to documentation
- Monitor long-term retention

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first workout | < 60 seconds | Analytics: onboarding complete → workout start |
| AI plan approval rate | > 70% | Approve clicks / total generations |
| First workout start (24h) | > 50% | Users starting workout within 24h |
| Regeneration rate | < 20% | Regenerate clicks / total generations |
| Skip to manual rate | < 15% | Skip clicks / total starts |

---

*Plan created: 2026-01-12*
*Status: Ready for Review*
