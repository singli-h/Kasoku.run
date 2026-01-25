# Individual User Launch Plan - Production Readiness

## Executive Summary

Launch the **Individual user role** to production with focus on:
1. ✅ Polished onboarding experience with role-specific guidance
2. ✅ Clear first-time user journey
3. ✅ Complete feature parity (Edit Training Block)
4. 🚧 **Phase 2: Mobile-first Individual Plan Page** (Section 5)

### Phase 2 Priority: Individual Plan Page

| What | Why |
|------|-----|
| Today-focused layout | Individual users care about "what's today", not week overview |
| Mobile-first design | Primary device for individual users |
| Inline workout editing | Quick edits at gym without page navigation |
| AI assistant integration | Reuse existing ChatDrawer for contextual help |

**New components:** 4 (~380 lines)
**Reused components:** 7+ (~2000+ lines)

---

## 1. Implementation Status ✅ COMPLETE

All planned tasks have been implemented.

| Feature | Status | File Changed |
|---------|--------|--------------|
| Role-specific completion step | ✅ | `completion-step.tsx` |
| Individual → /plans redirect | ✅ | `onboarding-wizard.tsx` |
| Edit Training Block (simple) | ✅ | `EditTrainingBlockDialog.tsx` (new) |
| Regenerate with AI option | ✅ | `IndividualWorkspace.tsx` |
| Sessions page role-aware | ✅ | `sessions/page.tsx` |

---

## 2. What Was Implemented

### 2.1 Role-Specific Completion Step
**File:** `apps/web/components/features/onboarding/steps/completion-step.tsx`

- Added `role` prop to show different content per role
- Role-specific "What happens next?" guidance:
  - **Individual**: Create Training Block → Set schedule → Review AI workouts → Start logging
  - **Athlete**: View coach's plans → Start logging → Track progress
  - **Coach**: Set up athletes → Create programs → Manage dashboard
- Role-specific button text ("Create Your First Plan" vs "Go to Dashboard")

### 2.2 Role-Specific Redirect
**File:** `apps/web/components/features/onboarding/onboarding-wizard.tsx`

- Individual users → `/plans` (to create first training block)
- Athletes and Coaches → `/dashboard`

### 2.3 Edit Training Block
**Files:**
- `apps/web/components/features/plans/workspace/components/EditTrainingBlockDialog.tsx` (NEW)
- `apps/web/components/features/plans/workspace/IndividualWorkspace.tsx`

- Created simplified `EditTrainingBlockDialog` for individuals (no periodization jargon)
- Enabled Edit button in IndividualWorkspace
- Wired up `updateMesocycleAction` for saving changes
- Simple edit allows: Block name, description, start/end dates

### 2.4 Regenerate with AI
**File:** `apps/web/components/features/plans/workspace/IndividualWorkspace.tsx`

- Added dropdown menu with "AI" button
- "Regenerate Workouts" option navigates to `/plans/new?regenerate={blockId}`
- Reuses existing QuickStart wizard infrastructure

### 2.5 Sessions Page Role-Aware Description
**File:** `apps/web/app/(protected)/sessions/page.tsx`

- Coach: "Manage sprint training sessions across your athletes and groups"
- Individual: "Manage your sprint training sessions"

---

## 3. Testing Checklist

### Onboarding Flow
- [ ] Individual completes onboarding → redirected to `/plans`
- [ ] Individual sees "Create your first Training Block with AI assistance"
- [ ] Individual sees button "Create Your First Plan"
- [ ] Athlete completes onboarding → redirected to `/dashboard`
- [ ] Coach completes onboarding → redirected to `/dashboard`

### Edit Training Block
- [ ] Edit button is clickable (not disabled)
- [ ] Click Edit → opens dialog with current block data
- [ ] Can modify name, dates, description
- [ ] Save updates the block successfully
- [ ] Toast shows "Block Updated" on success

### Regenerate with AI
- [ ] AI dropdown button visible in IndividualWorkspace header
- [ ] Click "Regenerate Workouts" → navigates to `/plans/new?regenerate={id}`
- [ ] (Future: QuickStart wizard detects regenerate param and loads existing context)

### Sessions Page
- [ ] Individual sees "Manage your sprint training sessions"
- [ ] Coach sees "Manage sprint training sessions across your athletes and groups"

---

## 4. Files Changed Summary

| File | Change |
|------|--------|
| `completion-step.tsx` | Added role prop, role-specific content |
| `onboarding-wizard.tsx` | Pass role to completion, role-based redirect |
| `EditTrainingBlockDialog.tsx` | NEW - Simplified edit dialog for individuals |
| `IndividualWorkspace.tsx` | Enabled Edit, added AI dropdown menu |
| `sessions/page.tsx` | Role-aware description |

---

## 5. Phase 2: Individual Plan Page (Mobile-First)

### 5.1 Context & Problem

The current `IndividualWorkspace` is coach-oriented:
- 2-column desktop layout (weeks | workouts)
- Click workout → navigates to full `/plans/[id]/session/[sessionId]` page
- Not optimized for mobile (individual users are primarily mobile)

**Individual users need:**
- Today-focused view ("What am I doing today?")
- Quick inline editing (at gym, between sets)
- Mobile-first single column layout
- AI assistance accessible via floating button

### 5.2 Components to CREATE (New)

| Component | Location | Purpose | Est. Lines |
|-----------|----------|---------|------------|
| `IndividualPlanPage` | `apps/web/components/features/plans/individual/IndividualPlanPage.tsx` | Main layout: today-focused, responsive | ~150 |
| `TodayWorkoutCard` | `apps/web/components/features/plans/individual/TodayWorkoutCard.tsx` | Expandable card that embeds WorkoutView inline | ~100 |
| `WeekWorkoutList` | `apps/web/components/features/plans/individual/WeekWorkoutList.tsx` | Compact list of this week's workouts | ~50 |
| `WeekSelectorSheet` | `apps/web/components/features/plans/individual/WeekSelectorSheet.tsx` | Bottom sheet for week navigation | ~80 |

**Total new code: ~380 lines**

### 5.3 Components to REUSE (Existing)

| Component | Location | What We Get |
|-----------|----------|-------------|
| `WorkoutView` | `components/features/training/views/WorkoutView.tsx` | Full exercise list with inline set editing |
| `ExerciseCard` | `components/features/training/components/ExerciseCard.tsx` | Exercise with expandable sets, all field editing |
| `SessionAssistant` | `components/features/ai-assistant/SessionAssistant.tsx` | AI orchestration (auto desktop/mobile) |
| `ChatDrawer` | `components/features/ai-assistant/ChatDrawer.tsx` | 85vh mobile drawer with voice input |
| `ExercisePickerSheet` | `components/features/training/components/ExercisePickerSheet.tsx` | Search & add exercises |
| `SessionExercisesContext` | `components/features/training/context/SessionExercisesContext.tsx` | State management + undo/redo |
| `saveSessionWithExercisesAction` | `actions/plans/session-planner-actions.ts` | Save exercises to DB |

**Reused code: ~2000+ lines**

### 5.4 Architecture: Before vs After

**BEFORE (Current - Coach-oriented):**
```
┌──────────────────────────────────────┐
│  [Weeks]          │  [Workouts]      │  ← 2-column, desktop
│  Week 1           │  Workout A  →────┼──→ Navigate to /session/[id]
│  Week 2 ●         │  Workout B  →    │    (full page load)
│  Week 3           │  Workout C  →    │
└──────────────────────────────────────┘
```

**AFTER (New - Mobile View):**
```
┌─────────────────────────┐
│ ← Block Name            │
│ [Week 2 of 6 ▼]         │  ← Tap opens WeekSelectorSheet
├─────────────────────────┤
│ TODAY                   │
│ ┌─────────────────────┐ │
│ │ Upper Body Push     │ │
│ │ [▶ Start] [↓ View]  │ │  ← Tap to expand
│ │                     │ │
│ │ ═══ EXPANDED ═════  │ │
│ │ WorkoutView inline  │ │  ← Edit sets here
│ │ (no page nav)       │ │
│ └─────────────────────┘ │
│                         │
│ THIS WEEK               │
│ ○ Wed - Lower Body      │  ← Tap to switch
│ ○ Fri - Upper Pull      │
│ ✓ Mon - Done            │
│                         │
│           [💬 AI]       │  ← ChatDrawer (existing)
└─────────────────────────┘
```

**AFTER (New - Desktop View, ≥1024px):**
```
┌────────────────────────────────────────────────────────────────┐
│ ← Block Name                                      [Edit] [AI]  │
│ [Week 2 of 6 ▼]                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─ TODAY ──────────────────────┐  ┌─ THIS WEEK ────────────┐  │
│  │                              │  │                        │  │
│  │  Upper Body Push             │  │  ○ Wed - Lower Body    │  │
│  │  [▶ Start]                   │  │  ○ Fri - Upper Pull    │  │
│  │                              │  │  ✓ Mon - Done          │  │
│  │  ┌────────────────────────┐  │  │                        │  │
│  │  │ WorkoutView            │  │  └────────────────────────┘  │
│  │  │ (expanded by default)  │  │                              │
│  │  │                        │  │                              │
│  │  └────────────────────────┘  │                              │
│  │                              │                              │
│  └──────────────────────────────┘                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                                                   ↑ ChatSidebar
```

**Week Selector Sheet (Mobile):**
```
┌─────────────────────────┐
│ ━━━━━ (drag handle)     │
│                         │
│ Select Week             │
│                         │
│ ┌─────────────────────┐ │
│ │ ✓ Week 1            │ │  3/3 workouts done
│ │   Jan 6-12          │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ ● Week 2 (Current)  │ │  1/3 workouts done
│ │   Jan 13-19         │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ ○ Week 3            │ │  Upcoming
│ │   Jan 20-26         │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### 5.5 User Stories Supported

| Story | Solution |
|-------|----------|
| "What's my workout today?" | Today section expanded by default |
| "Change reps from 8 to 10" | Inline editing via WorkoutView (no navigation) |
| "Bench is taken, what else?" | AI button → ChatDrawer → swap suggestion |
| "Make this lighter (tired)" | AI button → "Make lighter" → approve changes |
| "Add a finisher exercise" | ExercisePickerSheet (existing) |
| "What's coming this week?" | WeekWorkoutList shows all days |
| "What did I do last week?" | WeekSelectorSheet → tap Week 1 → view switches |
| "Preview next week" | WeekSelectorSheet → tap future week |

### 5.6 Responsive Design Requirements

All new components must be responsive (mobile-first, desktop-enhanced):

| Component | Mobile (<1024px) | Desktop (≥1024px) |
|-----------|------------------|-------------------|
| `IndividualPlanPage` | Single column, stacked sections | 2-column: Today (left) + Week (right) |
| `TodayWorkoutCard` | Full width, tap to expand | Full width in left column, auto-expanded |
| `WeekWorkoutList` | Below today's workout | Right sidebar column |
| `WeekSelectorSheet` | Bottom sheet (Vaul drawer) | Dropdown popover (Radix) |

**Breakpoint:** Use `lg:` (1024px) consistent with existing `useIsDesktop()` hook.

**Key Tailwind Classes:**
```tsx
// Layout switching
<div className="flex flex-col lg:flex-row lg:gap-6">
  <div className="flex-1">Today section</div>
  <div className="lg:w-80">Week section</div>
</div>

// Component visibility
<WeekSelectorSheet className="lg:hidden" />      // Mobile only
<WeekSelectorDropdown className="hidden lg:block" /> // Desktop only
```

### 5.7 Implementation Tasks

- [ ] Create `apps/web/components/features/plans/individual/` directory
- [ ] Create `IndividualPlanPage.tsx` - main layout (responsive)
- [ ] Create `TodayWorkoutCard.tsx` - expandable workout card
- [ ] Create `WeekWorkoutList.tsx` - week workouts list
- [ ] Create `WeekSelectorSheet.tsx` - week navigation (mobile: sheet, desktop: dropdown)
- [ ] Update route to use new component for individual users
- [ ] Wire up `SessionAssistant` for AI functionality
- [ ] Wire up `SessionExercisesContext` for state management
- [ ] Test on mobile viewport sizes (375px, 414px)
- [ ] Test on desktop viewport sizes (1024px, 1440px)

---

## 6. Legacy Code to REMOVE (Cleanup)

### 6.1 Files to Remove Completely

| File | Reason |
|------|--------|
| None identified yet | IndividualWorkspace may still be used during transition |

### 6.2 Code to Deprecate (Mark for Future Removal)

| Location | What | Reason |
|----------|------|--------|
| `IndividualWorkspace.tsx` | Entire component | Replaced by `IndividualPlanPage` for individual users |
| `IndividualWorkspace.tsx` | `WorkoutCard` sub-component | Replaced by `TodayWorkoutCard` with expand functionality |

### 6.3 Recommended Migration Strategy

**Phase 1: Build Parallel (No Breaking Changes)**
1. Create new `IndividualPlanPage` in separate directory
2. Keep `IndividualWorkspace` unchanged
3. Test new component thoroughly

**Phase 2: Route Switch**
1. Update page route to detect user type
2. Individual users → `IndividualPlanPage`
3. Coach users → Keep using `IndividualWorkspace` (or `TrainingPlanWorkspace`)

**Phase 3: Cleanup (After Validation)**
1. Remove `IndividualWorkspace` if no longer needed
2. Or rename to `CoachPlanOverview` if coach-specific

### 6.4 Files to Keep (Shared Infrastructure)

These files are used by BOTH coach and individual flows - DO NOT REMOVE:

| File | Used By |
|------|---------|
| `SessionPlannerV2.tsx` | Full session editor (both roles can access) |
| `WorkoutView.tsx` | Exercise display (reused in new IndividualPlanPage) |
| `ExerciseCard.tsx` | Exercise editing (reused) |
| `SessionAssistant.tsx` | AI functionality (reused) |
| `ChatDrawer.tsx` | Mobile AI drawer (reused) |
| `session-planner-actions.ts` | Save logic (reused) |
| `SessionExercisesContext.tsx` | State management (reused) |

---

## 7. Technical Notes

### 7.1 Key Patterns to Follow

**ID Convention (for new exercises/sets):**
```typescript
// Existing database record
exercise.id = "123"  // numeric string

// New client-side item
exercise.id = "new_1735123456789"  // "new_" prefix
```

**Effort Conversion:**
```typescript
// UI → Database: 0-100 → 0-1
effort: set.effort != null ? set.effort / 100 : null

// Database → UI: 0-1 → 0-100
effort: dbSet.effort != null ? dbSet.effort * 100 : null
```

### 7.2 Mobile Breakpoints

- `ChatDrawer` activates when `!isDesktop` (< 1024px)
- New `IndividualPlanPage` should be mobile-first (single column always)
- Use Tailwind responsive classes if desktop enhancement needed later

### 7.3 AI Integration

`SessionAssistant` auto-detects device:
- Desktop: `ChatSidebar` (400px right panel)
- Mobile: `ChatDrawer` (85vh bottom drawer)

Just wrap content with `<SessionAssistant>` - it handles the rest.

---

## 8. Future Enhancements (Out of Scope for Launch)

- QuickStart wizard handling `regenerate` param to load existing block context
- Individual-specific dashboard layout
- Welcome step text changes (role not yet determined at that step)
- Combining onboarding steps to reduce count
- Offline support for gym use (PWA caching)
- Swipe gestures between days
