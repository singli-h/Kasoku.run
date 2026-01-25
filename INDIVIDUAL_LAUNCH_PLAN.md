# Individual User Launch Plan - Production Readiness

## Executive Summary

Launch the **Individual user role** to production with focus on:
1. Polished onboarding experience with role-specific guidance
2. Clear first-time user journey
3. Complete feature parity (Edit Training Block)

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

## 5. Future Enhancements (Out of Scope)

- QuickStart wizard handling `regenerate` param to load existing block context
- Individual-specific dashboard layout
- Welcome step text changes (role not yet determined at that step)
- Combining onboarding steps to reduce count
