# Individual User Path — E2E Browser Test Plan

**Feature**: Individual User Role (006)
**Tool**: `agent-browser` CLI (headless accessibility-tree testing)
**Auth Method**: Clerk Sign-In Token API (programmatic, no manual login)
**Persona Reference**: `sprint_diary/ATHLETE_PROFILE.md` — 26yo male competitive sprinter, Toronto

---

## Authentication Setup (Clerk Sign-In Token Trick)

Instead of `--headed` manual login, the browser-tester can authenticate programmatically using Clerk's Backend API to create a one-time sign-in token, then open the magic URL in headless mode.

```bash
# Step 1: Create a sign-in token for the test user
SIGN_IN_RESPONSE=$(curl -s -X POST https://api.clerk.com/v1/sign_in_tokens \
  -H "Authorization: Bearer $CLERK_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user_39fGg3ukH1F2ss0AEONCIEmiPGe"}')

# Step 2: Extract the sign-in token URL
SIGN_IN_URL=$(echo "$SIGN_IN_RESPONSE" | jq -r '.url')

# Step 3: Open the URL in agent-browser (sets auth cookies automatically)
agent-browser open "$SIGN_IN_URL"

# Step 4: Wait for redirect, then verify auth
agent-browser get url  # Should be /dashboard or /plans
agent-browser snapshot -i -c  # Verify authenticated state
```

**Known test users**:
| User | Clerk ID | DB ID | Email | Role |
|------|----------|-------|-------|------|
| Primary | `user_39fGg3ukH1F2ss0AEONCIEmiPGe` | 1 | `ms.kimmy.bear@gmail.com` | individual |

**For fresh-user tests** (onboarding): Create a new Clerk user via API, or use an existing user that hasn't completed onboarding.

---

## Test Suite Overview

| Suite | Tests | Priority | Estimated Time |
|-------|-------|----------|----------------|
| A. Auth & Session | 12 | P0 | 15 min |
| B. Onboarding | 18 | P0 | 25 min |
| C. Navigation & Access Control | 14 | P1 | 15 min |
| D. Plans Home (Empty + Active State) | 16 | P1 | 20 min |
| E. Training Block Creation (QuickStartWizard) | 22 | P0 | 30 min |
| F. Plan Detail View | 20 | P1 | 25 min |
| G. Session Planner | 14 | P2 | 20 min |
| H. Workout Flow | 18 | P1 | 25 min |
| I. Performance Analytics | 12 | P2 | 15 min |
| J. Settings | 16 | P2 | 20 min |
| K. AI Integration | 10 | P2 | 15 min |
| L. Mobile / Responsive | 14 | P1 | 20 min |
| M. Error & Edge Cases | 16 | P1 | 20 min |
| N. Cross-Feature Flows | 8 | P1 | 15 min |
| **TOTAL** | **210** | | **~4.5 hours** |

---

## Suite A: Authentication & Session Management

### A.1 — Programmatic Sign-In via Token
**Steps**: Create sign-in token → open URL → verify redirect
**Verify**: Lands on `/plans` (individual post-auth redirect) or `/dashboard`
**Deep**: Check that Clerk session cookie is set, user role context loads correctly

### A.2 — Session Persistence Across Navigation
**Steps**: Auth → navigate to `/plans` → `/workout` → `/performance` → `/settings`
**Verify**: Never redirected to sign-in, sidebar stays consistent, user avatar persists
**Deep**: Check no 401 errors in console, no flash of unauthenticated state

### A.3 — Session Expiry Handling
**Steps**: Auth → wait or manually expire token → attempt navigation
**Verify**: Graceful redirect to `/sign-in`, no white screen, no data leaks
**Deep**: Check localStorage isn't left with stale user data

### A.4 — Unauthorized Direct URL Access (Unauthenticated)
**Steps**: Without auth, navigate to `/plans`, `/workout`, `/settings`, `/plans/new`
**Verify**: Each redirects to `/sign-in` with return URL preserved
**Deep**: After signing in, should return to the original requested URL

### A.5 — Multiple Tab Session Sync
**Steps**: Auth in one session → open second session with same cookies
**Verify**: Both tabs show authenticated state, actions in one reflect in other (eventual consistency)
**Note**: Can combine with A.2

### A.6 — Sign Out Flow
**Steps**: Auth → click user menu → sign out
**Verify**: Redirected to landing page or `/sign-in`, all protected routes now blocked
**Deep**: Verify Clerk cookies cleared, localStorage cleaned

### A.7 — Post-Auth Redirect (New User → Onboarding)
**Steps**: Auth with a user who hasn't completed onboarding
**Verify**: Redirected to `/onboarding` instead of `/dashboard`
**Deep**: Verify `checkUserNeedsOnboardingAction` fires correctly

### A.8 — Post-Auth Redirect (Existing User → Plans)
**Steps**: Auth with individual user who has completed onboarding
**Verify**: Lands on `/plans` (not `/dashboard` — individual-specific redirect)
**Deep**: Check the auth/session page redirect logic

### A.9 — Clerk Development Mode Warnings
**Steps**: Auth → open browser console
**Verify**: Only expected dev warnings (Clerk development keys, React DevTools suggestion)
**Deep**: No actual errors, no failed API calls, no CORS issues

### A.10 — API Route Auth Enforcement
**Steps**: Without auth, `curl` each protected API endpoint
**Verify**: All return 401 with `{"error": "Not authenticated"}`
**Routes**: `/api/user/role`, `/api/ai/plan-generator`, `/api/exercises/search`, `/api/push/subscribe`

### A.11 — Role API Returns Correct Role
**Steps**: Auth as individual → `GET /api/user/role`
**Verify**: Response contains `role: "individual"`
**Deep**: Check `UserRoleProvider` client context matches

### A.12 — Auth State During AI Streaming
**Steps**: Start an AI plan generation → while streaming, check auth state
**Verify**: Long-running streaming request maintains auth, doesn't timeout mid-generation
**Deep**: Monitor for 401s or connection drops during 30+ second AI responses

---

## Suite B: Onboarding Flow

### B.1 — Welcome Step Renders
**Steps**: Navigate to `/onboarding` as new user
**Verify**: Welcome screen displays with greeting, continue button present
**Deep**: Check no premature API calls, clean initial state

### B.2 — Role Selection — Three Options Visible
**Steps**: Progress to role selection step
**Verify**: See exactly 3 cards: "Train with a Coach" (Trophy icon), "Train Myself" (User icon), "Coach Athletes" (Users icon)
**Deep**: Cards are visually distinct, each has title + description

### B.3 — Select "Train Myself" (Individual)
**Steps**: Click "Train Myself" card → proceed
**Verify**: Card highlights as selected, next button enabled, progresses to Individual Details step
**Deep**: Other two cards deselect if previously selected

### B.4 — Individual Details — Training Goals Multi-Select
**Steps**: On Individual Details step, view training goals
**Verify**: See all 10 goal tags: Build Strength, Lose Weight, Improve Endurance, Build Muscle, Improve Flexibility, General Fitness, Train for Event, Improve Speed, Recover from Injury, Maintain Fitness
**Deep**: Can select multiple, visual toggle feedback on each, can deselect

### B.5 — Individual Details — Select Zero Goals
**Steps**: Try to proceed without selecting any goals
**Verify**: Validation prevents proceeding, or goals are optional (verify which)
**Deep**: If required, error message shown. If optional, should still proceed.

### B.6 — Individual Details — Experience Level
**Steps**: Select each experience level one by one
**Verify**: Beginner / Intermediate / Advanced — radio-style single select, visual feedback
**Deep**: Default state (none selected or pre-selected?)

### B.7 — Individual Details — Date of Birth Input
**Steps**: Enter DOB via date picker
**Verify**: Calendar picker opens, can select date, date displays correctly
**Edge**: Enter future date, enter date making user <13 years old, enter date making user 100+
**Deep**: What validation exists? Any age restrictions?

### B.8 — Individual Details — Form Completeness
**Steps**: Fill all fields with realistic data (persona: DOB=1999, goals=Improve Speed+Train for Event, experience=Advanced)
**Verify**: All fields populated, next button enabled
**Deep**: Data persists if navigating back and forward between steps

### B.9 — Subscription Step
**Steps**: Progress to subscription selection
**Verify**: Free tier option visible and selectable (Beta = free, per spec assumptions)
**Deep**: Any paid tiers shown? Are they disabled or hidden?

### B.10 — Dashboard Tour Step (Individual-Specific)
**Steps**: Progress to tour step
**Verify**: Tour content is individual-specific (mentions "Training Blocks", not "Mesocycles")
**Deep**: Tour highlights match individual navigation items

### B.11 — Completion Step — Fires `complete_onboarding` RPC
**Steps**: Complete all steps → click finish
**Verify**: Loading state shown during API call, success confirmation displayed
**Deep**: Monitor network tab — `complete_onboarding` RPC called with correct params (role=individual, training goals, experience level). Verify DB record created.

### B.12 — Post-Onboarding Redirect
**Steps**: Complete onboarding
**Verify**: Redirected to `/plans` (NOT `/dashboard` — individual-specific)
**Deep**: Sidebar visible with individual-specific navigation items

### B.13 — Onboarding State Persistence (localStorage)
**Steps**: Complete steps 1-3 → close browser → reopen `/onboarding`
**Verify**: Resumes from step 4 (not step 1), data preserved
**Deep**: Check `kasoku_onboarding_data_v2` and `kasoku_onboarding_step_v2` in localStorage

### B.14 — Onboarding Step Navigation (Back Button)
**Steps**: Progress to step 4 → click back → back → back
**Verify**: Can navigate backward through all steps, data preserved at each step
**Deep**: Role selection preserved, individual details preserved

### B.15 — Onboarding — Switch Role Mid-Flow
**Steps**: Select "Train Myself" → proceed to details → go back → select "Coach Athletes" → proceed
**Verify**: Coach details form shown (NOT individual details), previous individual data cleared
**Deep**: No ghost state from previous role selection

### B.16 — Re-Onboarding Prevention
**Steps**: Complete onboarding → navigate directly to `/onboarding`
**Verify**: Redirected away (to `/plans` or `/dashboard`), cannot re-onboard
**Deep**: `checkUserNeedsOnboardingAction` returns false

### B.17 — Onboarding with Slow Network
**Steps**: Throttle network → complete onboarding
**Verify**: Loading indicators visible, no double-submit, graceful timeout handling
**Deep**: What happens if `complete_onboarding` RPC fails? Is there retry logic?

### B.18 — Onboarding — Rapid Click Through
**Steps**: Click next as fast as possible through all steps without filling anything
**Verify**: Validation stops progress at required fields, doesn't crash
**Deep**: No console errors, no blank screens, proper validation gates

---

## Suite C: Navigation & Access Control

### C.1 — Individual Sidebar Items (Desktop)
**Steps**: Auth as individual → check sidebar
**Verify**: See exactly: Workout, Plans (labeled "Plans"), Performance, Exercise Library, Knowledge Base, Settings
**Absent**: Athletes, Sessions, Overview/Dashboard link
**Deep**: Order matches spec, icons correct, active state on current page

### C.2 — Individual Sidebar Items (Mobile)
**Steps**: Resize to 375px width → open mobile menu
**Verify**: Same items as desktop, hamburger menu works, items are tappable
**Deep**: Menu closes after selection, no overflow issues

### C.3 — Direct URL Access — `/athletes` (Forbidden)
**Steps**: Navigate to `/athletes` as individual
**Verify**: Redirected to dashboard/plans with message, NOT a 404 or blank page
**Deep**: `serverProtectRoute` fires, no flash of coach content

### C.4 — Direct URL Access — `/athletes/[id]` (Forbidden)
**Steps**: Navigate to `/athletes/1` as individual
**Verify**: Redirected, no athlete data exposed
**Deep**: No network request that returns athlete data leaks

### C.5 — Direct URL Access — `/sessions` (Edge Case)
**Steps**: Navigate to `/sessions` as individual
**Verify**: Per research, this route allows `['coach', 'individual']` in serverProtectRoute but is hidden from individual sidebar. Verify: page loads but is functionally useful or confusing
**Deep**: This is a known gap — document whether it should be blocked or exposed

### C.6 — Direct URL Access — `/knowledge-base/new` (Coach-Only Create)
**Steps**: Navigate to `/knowledge-base/new` as individual
**Verify**: Either blocked or shows read-only state, cannot create articles
**Deep**: Individual should only read articles, not author them

### C.7 — Sidebar Active State Tracking
**Steps**: Navigate to each sidebar item sequentially
**Verify**: Active item highlights correctly, previous deactivates
**Deep**: Nested routes (e.g., `/plans/123`) still highlight "Plans" parent

### C.8 — Sidebar Collapse/Expand (Desktop)
**Steps**: Toggle sidebar collapse
**Verify**: Icons remain visible when collapsed, tooltips on hover, content area expands
**Deep**: State persists across page navigation

### C.9 — URL Manipulation — Coach Routes
**Steps**: Try `/plans?role=coach`, append query params attempting role override
**Verify**: Query params don't override server-side role check
**Deep**: Role comes from server (Clerk + Supabase), not client-side

### C.10 — Navigation During Loading State
**Steps**: Click sidebar item while current page is still loading
**Verify**: Navigation occurs without crash, no stuck loading state
**Deep**: React transitions handle concurrent navigation

### C.11 — Deep Link to Plan That Doesn't Exist
**Steps**: Navigate to `/plans/99999`
**Verify**: Proper 404 or "plan not found" message, not a crash
**Deep**: No unhandled promise rejection in console

### C.12 — Deep Link to Another User's Plan
**Steps**: Navigate to `/plans/[id]` where ID belongs to a different user
**Verify**: Access denied or 404, no data leakage
**Deep**: RLS enforces user_id filtering, no other user's exercises shown

### C.13 — Browser Back/Forward Navigation
**Steps**: Navigate `/plans` → `/workout` → `/performance` → back → back → forward
**Verify**: Each page loads correctly, no stale data, scroll position preserved
**Deep**: React Query cache doesn't serve wrong page's data

### C.14 — Terminology Verification Across All Pages
**Steps**: Visit every page as individual, search for forbidden terminology
**Verify**: NEVER see "Mesocycle", "Microcycle", "Session Plan", "Macrocycle"
**Always see**: "Training Block", "Week", "Workout"
**Deep**: Check page titles, breadcrumbs, headings, buttons, tooltips, empty states, error messages

---

## Suite D: Plans Home (Empty + Active State)

### D.1 — Empty State (No Training Blocks)
**Steps**: Auth as individual with zero blocks → `/plans`
**Verify**: `EmptyTrainingState` component shown with "Create Training Block" CTA
**Deep**: 3 template cards visible (Strength Foundation, PPL Split, Upper/Lower)

### D.2 — Empty State — CTA Click
**Steps**: Click "Create Training Block" button
**Verify**: Navigates to `/plans/new` (QuickStartWizard)
**Deep**: No query params, clean wizard state

### D.3 — Empty State — Template Card Click
**Steps**: Click "Strength Foundation" template card
**Verify**: Navigates to `/plans/new?template=strength-foundation`
**Deep**: QuickStartWizard pre-fills with template data

### D.4 — Active Block Display
**Steps**: Auth with user who has an active block → `/plans`
**Verify**: `IndividualPlansHomeClient` shows active block card with name, duration, current week, progress
**Deep**: Block dates are correct, week calculation matches current date

### D.5 — Active Block — Click to Open
**Steps**: Click on active block card
**Verify**: Navigates to `/plans/[blockId]`
**Deep**: Correct block ID in URL, page loads with block data

### D.6 — Multiple Blocks (Active + Completed)
**Steps**: Auth with user who has 1 active + completed blocks
**Verify**: Active block prominently displayed, completed blocks in separate section or accessible
**Deep**: Can't have 2 active blocks simultaneously (FR-007)

### D.7 — Block Status Indicators
**Steps**: View plans home with blocks in various states
**Verify**: Active block shows "Active" badge, completed shows "Completed", upcoming shows dates
**Deep**: Status derived from date range, not just a flag

### D.8 — Plans Home Loading State
**Steps**: Navigate to `/plans` with slow network
**Verify**: Loading skeleton or spinner shown, not blank page
**Deep**: No layout shift when data loads

### D.9 — Plans Home Error State
**Steps**: Mock `/api` failure → navigate to `/plans`
**Verify**: Error message shown, retry option available
**Deep**: Error boundary catches, doesn't crash entire app

### D.10 — Plans Home — Pull to Refresh (Mobile)
**Steps**: On mobile viewport, pull down on plans page
**Verify**: Data refreshes (or native scroll behavior, document which)
**Deep**: Stale data doesn't persist after refresh

### D.11 — Attempt Second Active Block
**Steps**: With active block, navigate to `/plans/new`
**Verify**: Either blocked with message ("Only one active Training Block allowed") or allowed to create (check spec compliance)
**Deep**: FR-007 says restricted to one active at a time — verify enforcement point

### D.12 — Completed Block — No Active Block State
**Steps**: Complete/archive all blocks → view `/plans`
**Verify**: Shows empty state or "Create New Block" prompt, completed blocks still accessible in history
**Deep**: Transition from "has blocks" to "no active block" is smooth

### D.13 — Block Duration Display
**Steps**: View block with 4-week, 6-week, 8-week durations
**Verify**: Duration shown correctly, week progress bar accurate
**Deep**: Edge: What if current date is past block end date? Auto-complete?

### D.14 — Plans Home — Rapid Navigation
**Steps**: Click plans → immediately click workout → immediately click plans
**Verify**: No race conditions, correct page renders
**Deep**: React Query doesn't show stale data from wrong page

### D.15 — Plans Home — Data Freshness
**Steps**: Load plans → modify data via another tab/direct DB → return to plans
**Verify**: Shows updated data on next navigation (or on manual refresh)
**Deep**: React Query stale time / refetch behavior

### D.16 — Individual vs Coach Plans Home
**Steps**: Compare what individual sees vs what coach sees at `/plans`
**Verify**: Individual sees `IndividualPlansHome`, Coach sees `TrainingPlanWorkspace`
**Deep**: Role-based component routing in `/plans/page.tsx` is correct

---

## Suite E: Training Block Creation (QuickStartWizard)

### E.1 — Wizard Step 1: Block Settings — Default State
**Steps**: Navigate to `/plans/new`
**Verify**: Block Name input empty, Duration presets visible (4/6/8 weeks), Training Focus options visible (Strength/Endurance/General Fitness), Training Notes textarea empty
**Deep**: No pre-selected defaults, all fields interactive

### E.2 — Block Name — Minimum Length Validation
**Steps**: Enter "AB" (2 chars) → try to proceed
**Verify**: Validation error shown ("minimum 3 characters"), can't proceed
**Deep**: Enter exactly 3 chars → validation passes

### E.3 — Block Name — Maximum Length
**Steps**: Enter very long name (200+ chars)
**Verify**: Input truncated or validated, doesn't break UI layout
**Deep**: Check if there's a max-length constraint

### E.4 — Block Name — Special Characters
**Steps**: Enter `<script>alert('xss')</script>` as block name
**Verify**: Escaped/sanitized, no XSS execution
**Deep**: Try emoji, unicode, HTML entities in block name

### E.5 — Duration Selection — Button Toggle
**Steps**: Click "4 weeks" → "6 weeks" → "8 weeks"
**Verify**: Only one selected at a time, visual toggle feedback
**Deep**: Can deselect? Or always one selected?

### E.6 — Training Focus Selection
**Steps**: Select each focus option
**Verify**: Single select (radio behavior), visual feedback, affects AI generation context
**Deep**: Selection persists when navigating between wizard steps

### E.7 — Training Notes — Optional Context
**Steps**: Enter "I have a knee injury and can only do upper body" → proceed
**Verify**: Text saved, passed to AI generation as context
**Deep**: Empty notes also allows proceeding (optional field)

### E.8 — Wizard Step 2: Week Setup — Training Days
**Steps**: Progress to step 2, view 7-day toggle grid
**Verify**: Mon-Sun grid, each day toggleable, visual feedback for selected/unselected
**Deep**: Default state (all unselected? Common defaults like Mon/Wed/Fri?)

### E.9 — Training Days — Select Zero Days
**Steps**: Deselect all days → try to proceed
**Verify**: Validation requires at least 1 training day
**Deep**: Error message clear: "Select at least one training day"

### E.10 — Training Days — Select All 7 Days
**Steps**: Select every day
**Verify**: Allowed (no max limit), or shows warning about recovery
**Deep**: AI generation should handle 7-day programs

### E.11 — Equipment Selection
**Steps**: View EquipmentSelector component
**Verify**: Presets available (Home gym, Full gym, Minimal, etc.), individual equipment items toggleable by category
**Deep**: Can select preset then customize individual items? Visual state consistent?

### E.12 — Equipment — Preset Selection
**Steps**: Click "Full Gym" preset
**Verify**: All gym equipment auto-selected, can still toggle individual items
**Deep**: Clicking "Minimal" after "Full Gym" deselects appropriate items

### E.13 — Equipment — No Equipment Selected
**Steps**: Deselect everything
**Verify**: Allowed (bodyweight program) or requires minimum selection
**Deep**: AI generation handles "no equipment" gracefully

### E.14 — Template Pre-Fill — `?template=strength-foundation`
**Steps**: Navigate to `/plans/new?template=strength-foundation`
**Verify**: Block name, focus, and potentially other fields pre-filled from template
**Deep**: Can still modify pre-filled values, template just sets defaults

### E.15 — Template Pre-Fill — `?template=ppl-split`
**Steps**: Navigate with PPL template
**Verify**: Different pre-fill than strength-foundation
**Deep**: Training days might pre-fill to 6 days for PPL

### E.16 — Template Pre-Fill — `?template=upper/lower`
**Steps**: Navigate with upper/lower template
**Verify**: Appropriate pre-fill for upper/lower split
**Deep**: Training days might pre-fill to 4 days

### E.17 — Wizard State Persistence (localStorage)
**Steps**: Fill step 1 + step 2 → close tab → reopen `/plans/new`
**Verify**: Data restored from `kasoku:quick-start-wizard` localStorage key
**Deep**: 24-hour expiry — test that expired data is cleared

### E.18 — Wizard Step 3: Review — AI Generation Trigger
**Steps**: Complete steps 1+2 → proceed to step 3 (Review)
**Verify**: `PlanGenerationReview` component renders, AI generation starts (streaming), loading/progress indicator visible
**Deep**: Monitor `POST /api/ai/plan-generator` request, verify streaming response

### E.19 — AI Generation — Streaming Progress
**Steps**: Watch generation progress
**Verify**: Exercises/workouts appear incrementally as they stream, not all-at-once
**Deep**: UI doesn't freeze during streaming, can scroll to see generated content

### E.20 — AI Generation — Approval/Reject
**Steps**: After generation completes, interact with `PlanApprovalBar`
**Verify**: Can approve (saves plan, redirects to `/plans/[id]`) or reject/regenerate
**Deep**: Rejection triggers new generation? Or goes back to editing?

### E.21 — AI Generation — Network Failure Mid-Stream
**Steps**: Start generation → kill network mid-stream
**Verify**: Error message shown, can retry, partial data handled gracefully
**Deep**: No zombie streaming state, clean error recovery

### E.22 — AI Generation — Abort and Modify
**Steps**: Start generation → go back to modify settings
**Verify**: Generation cancels cleanly, can modify and re-generate
**Deep**: No stale generation running in background

---

## Suite F: Plan Detail View (`/plans/[id]`)

### F.1 — Page Load with Valid Block
**Steps**: Navigate to `/plans/[id]` for active block
**Verify**: `IndividualPlanPageWithAI` renders — left sidebar with weeks, main content with day tabs, workout details
**Deep**: Week sidebar scrollable, current week auto-selected

### F.2 — Week Sidebar — Selection
**Steps**: Click different weeks in sidebar
**Verify**: Content updates to show selected week's workouts, visual indicator on selected week
**Deep**: Status dots: past (completed), current (active), future (upcoming)

### F.3 — Week Sidebar — All Weeks Visible
**Steps**: For 8-week block, scroll sidebar
**Verify**: All 8 weeks listed, scrollable if overflow
**Deep**: Week numbers and date ranges correct

### F.4 — Day Selector — Horizontal Tabs
**Steps**: Click each day tab in the workout area
**Verify**: Content updates to show that day's workout, active tab highlighted
**Deep**: Only training days shown (not rest days), correct exercises per day

### F.5 — Workout Details — Exercise List
**Steps**: View a day's workout
**Verify**: Exercise names listed with set count, expandable rows
**Deep**: Exercise order matches AI-generated plan

### F.6 — Exercise Row — Expand/Collapse
**Steps**: Click an exercise row
**Verify**: Expands to show `SetRow` components with set details (reps, weight, RPE, etc.)
**Deep**: Expand all / collapse all toggle works

### F.7 — Inline Set Editing (Known Stub)
**Steps**: Expand exercise → try to edit a set value
**Verify**: **KNOWN ISSUE**: `onUpdate` and `onRemove` are TODO console.logs (lines 1327-1332 in IndividualPlanPage.tsx). Editing UI appears but changes don't save.
**Deep**: Document as known gap, verify console.log fires, UI doesn't crash

### F.8 — Advanced Fields Toggle
**Steps**: Click `AdvancedFieldsToggle`
**Verify**: Shows/hides RPE, tempo, velocity, effort fields on exercises
**Deep**: Toggle state persists via localStorage across page navigation

### F.9 — Block Switcher Dropdown
**Steps**: Click block header dropdown
**Verify**: Shows list of all blocks (active, completed, upcoming), can switch between them
**Deep**: Switching loads new block data, URL updates to new block ID

### F.10 — Edit Block Button → `EditTrainingBlockDialog`
**Steps**: Click "Edit Block" button
**Verify**: Dialog opens with current block name, description, date range editable
**Deep**: Save updates block, cancel preserves original, validation on fields

### F.11 — Edit Block — Change Name
**Steps**: Open edit dialog → change name → save
**Verify**: Block name updates everywhere (sidebar, header, breadcrumbs)
**Deep**: Optimistic update or wait for server response?

### F.12 — Edit Block — Change Date Range
**Steps**: Extend block by 2 weeks
**Verify**: Additional weeks appear in sidebar, existing data preserved
**Deep**: What happens if you shorten the block? Are extra weeks' data deleted?

### F.13 — Mobile Layout — Sticky Header
**Steps**: View on 375px width
**Verify**: Sticky header with block name, settings icon, edit icon. Week selector is a card that opens `WeekSelectorSheet` bottom sheet.
**Deep**: Bottom sheet scrollable, dismissible, selection triggers content update

### F.14 — Mobile Layout — Day Selector
**Steps**: On mobile, scroll horizontal day selector
**Verify**: Horizontally scrollable, touch-friendly, active day visible
**Deep**: Doesn't conflict with page scroll (horizontal vs vertical)

### F.15 — AI Chat Drawer
**Steps**: Open AI chat via `PlanAssistantWrapper`/`ChatDrawer`
**Verify**: Chat drawer opens, can type message, AI responds contextually about the current plan
**Deep**: AI knows which block/week/day is selected, responses reference correct exercises

### F.16 — AI Inline Proposals
**Steps**: Check for `InlineProposalSlot` above exercise list
**Verify**: If AI has suggestions, they appear as proposal cards
**Deep**: Can accept/dismiss proposals, acceptance modifies the plan

### F.17 — Empty Week State
**Steps**: Navigate to a future week with no workouts generated yet
**Verify**: Clear empty state message, option to generate or plan
**Deep**: Not a blank page, actionable UI

### F.18 — Workout with Many Exercises (Performance)
**Steps**: View a day with 8+ exercises, each with 4+ sets
**Verify**: Page renders smoothly, no lag on expand/collapse
**Deep**: Virtual scrolling or all rendered? Memory usage acceptable?

### F.19 — Session Edit Navigation
**Steps**: Click "Edit Session" on a workout
**Verify**: Either inline editing expands or navigates to `/plans/[id]/session/[sessionId]`
**Deep**: Navigation preserves context, back button returns to plan detail

### F.20 — Error Boundary
**Steps**: Trigger an error (e.g., corrupt data) in plan view
**Verify**: `ErrorBoundary` catches it, shows fallback UI, doesn't crash entire app
**Deep**: Error message is helpful, has retry or back-to-plans option

---

## Suite G: Session Planner (`/plans/[id]/session/[sessionId]`)

### G.1 — Page Load with Valid Session
**Steps**: Navigate to session planner page
**Verify**: `SessionPlannerV2` renders with exercise editor, AI context visible
**Deep**: Correct exercises for this session, editable fields

### G.2 — Exercise Reordering
**Steps**: Drag/reorder exercises
**Verify**: Order updates, saves (if drag supported), or manual move up/down buttons
**Deep**: New order persists on page reload

### G.3 — Add Exercise
**Steps**: Click add exercise → search in `ExercisePickerSheet`
**Verify**: Search works, can select exercise, added to session
**Deep**: Search hits `/api/exercises/search`, results relevant

### G.4 — Remove Exercise
**Steps**: Remove an exercise from session
**Verify**: Exercise removed, confirmation if destructive, undo option?
**Deep**: Removal persists on save/reload

### G.5 — Edit Set Details
**Steps**: Modify reps, weight, RPE for a set
**Verify**: Changes save (auto-save or manual save), validation on numeric fields
**Deep**: Negative numbers, decimals, empty fields handled

### G.6 — Add/Remove Sets
**Steps**: Add extra sets to an exercise, remove a set
**Verify**: Set count updates, UI re-renders correctly
**Deep**: Minimum 1 set enforced? Maximum set limit?

### G.7 — AI Session Assistant
**Steps**: Interact with AI assistant in session context
**Verify**: `POST /api/ai/session-assistant` called, AI responses contextual to session exercises
**Deep**: Can ask "make this easier" or "add a warmup" and get relevant modifications

### G.8 — AI Inline Proposals in Session
**Steps**: Check `InlineProposalSlot` in session view
**Verify**: AI proposals appear for exercise substitutions or modifications
**Deep**: Accept/dismiss flow works, plan updates accordingly

### G.9 — Session with No Exercises
**Steps**: Open a session that has zero exercises
**Verify**: Clear empty state with "Add exercises" CTA, not a blank page
**Deep**: AI can suggest initial exercises if prompted

### G.10 — Back Navigation to Plan
**Steps**: From session planner → back button or breadcrumb
**Verify**: Returns to `/plans/[id]` with correct week/day selected
**Deep**: Session edits are saved before navigation (auto-save or prompt)

### G.11 — Session for Non-Training Day
**Steps**: Try to access a session for a rest day
**Verify**: Appropriate message or redirect, not an error
**Deep**: URL manipulation shouldn't expose rest-day sessions

### G.12 — Concurrent Editing (Two Tabs)
**Steps**: Open same session in two tabs → edit in both
**Verify**: Last save wins or conflict resolution, no data corruption
**Deep**: No silent data loss

### G.13 — Long Session (15+ Exercises)
**Steps**: Add many exercises to test scrolling/performance
**Verify**: Page remains responsive, all exercises accessible
**Deep**: Save performance with large payload

### G.14 — Invalid Session ID
**Steps**: Navigate to `/plans/[validId]/session/[invalidId]`
**Verify**: 404 or "session not found" message, not a crash
**Deep**: No unhandled errors, graceful fallback

---

## Suite H: Workout Flow

### H.1 — Workout Hub (`/workout`) — With Upcoming Workout
**Steps**: Navigate to `/workout` as individual with active block
**Verify**: `NextSessionCard` shows today's planned workout, "Start Workout" CTA prominent
**Deep**: Workout matches current day in current week of active block

### H.2 — Workout Hub — No Upcoming Workout (Rest Day)
**Steps**: Navigate to `/workout` on a rest day
**Verify**: "No workout scheduled for today" message, can browse available sessions
**Deep**: Shows next scheduled workout date

### H.3 — Workout Hub — No Active Block
**Steps**: Navigate to `/workout` with no active training block
**Verify**: "No training block active" message with CTA to create one
**Deep**: Links to `/plans/new`

### H.4 — Start Workout
**Steps**: Click "Start Workout" on NextSessionCard
**Verify**: `startTrainingSessionAction` fires, navigates to `/workout/[sessionId]`
**Deep**: Workout log created in DB, timestamp recorded

### H.5 — Active Workout — Exercise Logging
**Steps**: In active workout, log sets for first exercise
**Verify**: Can enter reps, weight, mark set complete
**Deep**: Auto-save fires (check `SaveStatusIndicator`), data persists

### H.6 — Active Workout — Set Completion Toggle
**Steps**: Mark individual sets as complete/incomplete
**Verify**: Visual feedback (strikethrough, checkmark, color change), count updates
**Deep**: Toggle is instant, no lag, can undo

### H.7 — Active Workout — All Sets Complete
**Steps**: Complete all sets for all exercises
**Verify**: Workout can be finished/submitted, completion UI appears
**Deep**: What happens to completion? Auto-finish? Manual finish button?

### H.8 — Active Workout — Partial Completion
**Steps**: Complete 3 of 5 exercises → leave page
**Verify**: Progress saved, can resume later
**Deep**: Ongoing workout banner shows on `/workout` hub

### H.9 — Active Workout — Ongoing Session Banner
**Steps**: Start workout → navigate away → return to `/workout`
**Verify**: Banner shows "Continue workout" with resume link
**Deep**: Resume loads exact state where left off

### H.10 — Active Workout — AI Workout Assistant
**Steps**: Trigger AI assistant during workout
**Verify**: `POST /api/ai/workout-assistant` called, AI gives contextual advice
**Deep**: AI knows current exercise, current weight, athlete history

### H.11 — Workout History (`/workout/history`)
**Steps**: Navigate to workout history page
**Verify**: List of past completed workouts, dates, exercise summaries
**Deep**: Sorted by date (newest first), pagination if many entries

### H.12 — Workout History — Empty State
**Steps**: View history with zero completed workouts
**Verify**: "No workouts logged yet" message, not blank
**Deep**: CTA to start first workout

### H.13 — Workout History — Click Past Workout
**Steps**: Click on a completed workout entry
**Verify**: Detail view shows exercises, sets, weights logged
**Deep**: Read-only (can't edit past workouts?), or editable?

### H.14 — Start Second Workout Same Day
**Steps**: Complete a workout → try to start another for the same day
**Verify**: Allowed (maybe different session) or blocked (one per day)
**Deep**: What if user has AM and PM sessions?

### H.15 — Workout Timer/Duration Tracking
**Steps**: Start workout → check if duration is tracked
**Verify**: Timer running or total duration calculated from start/end
**Deep**: Visible to user during workout? Shown in history?

### H.16 — Workout — Network Loss Mid-Session
**Steps**: Start logging → drop network → continue logging
**Verify**: Data cached locally, syncs when network returns
**Deep**: `SaveStatusIndicator` shows "offline" or "saving..." state

### H.17 — Workout — Close Browser Mid-Session
**Steps**: Start workout → force close browser → reopen
**Verify**: Ongoing session recoverable, data not lost
**Deep**: Depends on auto-save frequency and localStorage fallback

### H.18 — Workout — Override Planned Weight/Reps
**Steps**: Plan says "Squat 3x5 @ 100kg" → log 3x5 @ 110kg
**Verify**: Can override planned values, actual vs planned tracked
**Deep**: Overrides don't modify the plan, only the workout log

---

## Suite I: Performance Analytics

### I.1 — Performance Page Load
**Steps**: Navigate to `/performance`
**Verify**: 4 tabs visible: Sprint, Gym, Races, Compare
**Deep**: Default tab selection (Sprint?)

### I.2 — Sprint Tab — With Data
**Steps**: View sprint analytics with logged sprint sessions
**Verify**: `SprintQuickStats`, `RaceProgressionChart`, `SplitTimeChart`, `PhaseAnalysisCards`, `SprintSessionsTable`, `BenchmarkReferenceCard` all render
**Deep**: Data accurate, charts interactive (hover/click)

### I.3 — Sprint Tab — No Data
**Steps**: View sprint tab with zero sprint sessions
**Verify**: Empty state per chart, not broken charts with no data
**Deep**: Helpful message per section

### I.4 — Gym Tab — One RM Progression
**Steps**: View gym analytics with strength data
**Verify**: `OneRMProgressionChart` shows progression over time, `WorkoutConsistencyHeatmap` accurate
**Deep**: 1RM calculated correctly from logged sets

### I.5 — Gym Tab — Strength Benchmarks
**Steps**: View `StrengthBenchmarkCard`
**Verify**: Shows benchmarks relative to bodyweight (if BW entered in settings)
**Deep**: Calculations use correct BW, update when BW changes

### I.6 — Races Tab — Add Race Result
**Steps**: Click add race → fill `AddRaceResultDialog`
**Verify**: Event, time, date, conditions fields. Save creates record.
**Deep**: Validation on time format (seconds), required fields

### I.7 — Races Tab — Edit Race Result
**Steps**: Edit existing race via `EditRaceResultDialog`
**Verify**: Pre-filled with existing data, can modify, saves correctly
**Deep**: Optimistic update or loading state during save

### I.8 — Races Tab — Import Results
**Steps**: Use `ImportResultsDialog`
**Verify**: Can import from external source (file/paste), data mapped correctly
**Deep**: Error handling for malformed import data

### I.9 — Races Tab — Delete Race Result
**Steps**: Delete a race result
**Verify**: Confirmation dialog, deletion permanent, removed from table and charts
**Deep**: Cascade effects on analytics calculations

### I.10 — Compare Tab — Individual Access
**Steps**: View compare tab as individual
**Verify**: Privacy controls respected, can only compare with opted-in users
**Deep**: Individual's own data always visible, others require consent

### I.11 — Performance — Date Range Filtering
**Steps**: Filter analytics to specific date range
**Verify**: Charts and stats update to reflect filtered period
**Deep**: Filter persists during tab switches

### I.12 — Performance — Chart Interactions
**Steps**: Hover/click data points on charts
**Verify**: Tooltips with details, clickable points for drill-down
**Deep**: Charts responsive to viewport changes

---

## Suite J: Settings

### J.1 — Settings Page Load
**Steps**: Navigate to `/settings`
**Verify**: All 6 sections visible: Account, Notifications, Install App, Personal Details, Athlete Profile, Appearance
**Deep**: Correct data pre-filled from user profile

### J.2 — Account Section — Clerk Integration
**Steps**: View account card
**Verify**: Shows Clerk avatar, email, name, "Manage Account" button
**Deep**: "Manage Account" opens Clerk user profile modal (not a full page redirect)

### J.3 — Notifications — Push Toggle
**Steps**: Toggle push notifications on
**Verify**: Browser permission prompt → `POST /api/push/subscribe` → toggle reflects state
**Deep**: Toggle off calls `/api/push/unsubscribe`, state persists

### J.4 — Notifications — Daily Reminder Toggle & Time
**Steps**: Enable daily reminders → set time to 7:00 AM
**Verify**: Toggle saves, time input functional, `updateReminderPreferencesAction` called
**Deep**: Time input validates format, respects timezone

### J.5 — PWA Install Prompt
**Steps**: View install app section on non-iOS device
**Verify**: "Install" button triggers `promptInstall()` PWA prompt
**Deep**: On iOS, shows step-by-step Safari instructions instead

### J.6 — Personal Details — Birth Date
**Steps**: Set birth date via calendar picker
**Verify**: Calendar opens, can select, saves correctly
**Deep**: Edge: very old dates, future dates, today

### J.7 — Personal Details — Gender Select
**Steps**: Select gender option
**Verify**: Dropdown with options, selection saves
**Deep**: Options match expected list (Male/Female/Other/Prefer not to say?)

### J.8 — Personal Details — Timezone
**Steps**: Select timezone
**Verify**: Dropdown with timezones, detects current timezone as default
**Deep**: Timezone affects reminder scheduling

### J.9 — Athlete Profile — Height & Weight
**Steps**: Enter height (180cm) and weight (74kg)
**Verify**: Numeric inputs, units shown, saves via `createOrUpdateAthleteProfileAction`
**Deep**: Validation (negative numbers, unrealistic values like 500cm)

### J.10 — Athlete Profile — Experience Level
**Steps**: Select experience level
**Verify**: Beginner/Intermediate/Advanced selection
**Deep**: Matches onboarding selection, can be updated

### J.11 — Athlete Profile — Events Multi-Select
**Steps**: Select sprint events (60m, 100m, 200m)
**Verify**: Multi-select from track/field/combined events via `getEventsAction`
**Deep**: Selections persist, affect performance analytics context

### J.12 — Athlete Profile — Training Goals
**Steps**: Edit training goals textarea
**Verify**: Free-text area, saves correctly
**Deep**: Long text handling, special characters

### J.13 — Appearance — Theme Switcher
**Steps**: Switch between Light / Dark / System
**Verify**: Theme changes immediately, persists via `next-themes`
**Deep**: System respects OS preference, all components respect theme

### J.14 — Floating Save Bar
**Steps**: Modify any field
**Verify**: Floating save bar appears with Save + Discard buttons
**Deep**: Discard reverts ALL changes (not just last field). Save submits ALL changes atomically.

### J.15 — Settings — Discard Changes
**Steps**: Modify 3 fields → click Discard
**Verify**: All 3 fields revert to original values, save bar disappears
**Deep**: No partial discard, clean revert

### J.16 — Settings — Save Partial (Network Error)
**Steps**: Modify fields → save → simulate network error
**Verify**: Error shown, changes preserved in UI (not reverted), can retry
**Deep**: No data loss on save failure

---

## Suite K: AI Integration (Cross-Feature)

### K.1 — Plan Generator — Respects Athlete Profile
**Steps**: Generate plan with persona's profile (sprinter, advanced, knee/achilles injuries)
**Verify**: Generated exercises account for injury restrictions, training level appropriate
**Deep**: No deep squats (knee issue), no heavy plyometrics (achilles), sprint-appropriate exercises

### K.2 — Plan Generator — Training Notes Influence
**Steps**: Generate with notes "I only have dumbbells and resistance bands"
**Verify**: No barbell exercises, all exercises use specified equipment
**Deep**: AI adherence to constraints, no hallucinated equipment

### K.3 — Session Assistant — Modification Request
**Steps**: Ask AI "Replace bench press with pushup variations"
**Verify**: AI suggests replacement, can accept/reject change
**Deep**: Replacement fits within session context (volume, muscle group)

### K.4 — Workout Assistant — In-Session Advice
**Steps**: During workout, ask "This weight feels too heavy"
**Verify**: AI suggests deload or alternative, contextual to current exercise
**Deep**: Advice accounts for set history within the session

### K.5 — AI Streaming — Cancel Mid-Response
**Steps**: Start AI generation → cancel/abort
**Verify**: Stream stops cleanly, partial response not saved as complete
**Deep**: No orphaned server processes

### K.6 — AI — Rate Limiting
**Steps**: Rapid-fire 10+ AI requests
**Verify**: Rate limiting kicks in gracefully, user informed, no silent failures
**Deep**: Queue or reject with message

### K.7 — AI — Empty/Garbage Input
**Steps**: Send empty message, single character, pure emoji, 10000 characters
**Verify**: Handled gracefully — empty rejected, long input truncated or validated
**Deep**: No server errors, UI doesn't break

### K.8 — AI — Concurrent Requests
**Steps**: Open AI chat + trigger inline proposal + start plan generation simultaneously
**Verify**: Each operates independently or queued, no cross-contamination
**Deep**: No shared state between different AI contexts

### K.9 — AI Plan Generation — Long Duration
**Steps**: Generate 8-week plan with 6 training days and all equipment
**Verify**: Generation completes (may take 60+ seconds), progress indicator accurate
**Deep**: No timeout, user can navigate away and return?

### K.10 — AI Context — Role-Aware Language
**Steps**: Check AI responses for terminology
**Verify**: AI uses "Training Block" not "Mesocycle", "Workout" not "Session Plan"
**Deep**: Terminology mapping applied to AI prompts and responses

---

## Suite L: Mobile / Responsive

### L.1 — Mobile (375px) — Plans Home
**Verify**: Full-width cards, no horizontal overflow, CTAs reachable with thumb

### L.2 — Mobile — QuickStartWizard
**Verify**: Steps stack vertically, day grid is tappable, equipment selector scrollable

### L.3 — Mobile — Plan Detail
**Verify**: Sticky header, week selector bottom sheet, horizontal day scroll, exercise cards full-width

### L.4 — Mobile — Workout Logging
**Verify**: Number inputs have numeric keyboard, set rows don't overflow, save indicator visible

### L.5 — Mobile — Performance Charts
**Verify**: Charts resize gracefully, touch interactions work, no text overlap

### L.6 — Mobile — Settings
**Verify**: All sections scrollable, floating save bar doesn't obscure content, modals full-screen

### L.7 — Tablet (768px) — Plans Layout
**Verify**: Two-column where appropriate, sidebar visible or collapsible

### L.8 — Tablet — Workout
**Verify**: Wider exercise cards, more set info visible

### L.9 — Desktop (1920px) — Full Layout
**Verify**: Two-column plan view, sidebar visible, no stretched elements, content centered

### L.10 — Viewport Resize (Responsive Transition)
**Steps**: Start at desktop → resize to mobile → back to desktop
**Verify**: Layout transitions smoothly, no stuck mobile/desktop state

### L.11 — Mobile — Touch Targets
**Verify**: All buttons/links minimum 44x44px, no overlapping touch targets

### L.12 — Mobile — Keyboard Handling
**Steps**: Focus an input → verify virtual keyboard doesn't obscure content
**Verify**: Page scrolls to keep focused input visible

### L.13 — Mobile — Landscape Orientation
**Steps**: Rotate to landscape
**Verify**: Layout adapts, no content hidden behind notch/safe areas

### L.14 — PWA Mode
**Steps**: Open as installed PWA (if possible)
**Verify**: No browser chrome, splash screen, back navigation works

---

## Suite M: Error & Edge Cases

### M.1 — 404 Page
**Steps**: Navigate to `/nonexistent-page`
**Verify**: Custom 404 page, not a crash, navigation still works

### M.2 — API Error Handling — 500 Response
**Steps**: Mock server error on plan load
**Verify**: Error UI shown, not white screen, retry option

### M.3 — Stale Data After Supabase Migration
**Steps**: Scenario where DB schema changes under running app
**Verify**: Graceful degradation, not crash

### M.4 — Extremely Long Content
**Steps**: Block name with 500 chars, exercise name with 200 chars, notes with 5000 chars
**Verify**: Text truncated in UI, full text accessible somewhere, no layout break

### M.5 — Unicode/Emoji in All Text Fields
**Steps**: Enter Japanese (日本語テスト), Arabic (اختبار), emoji (🏃‍♂️💪) in block names, notes, goals
**Verify**: Renders correctly, saves correctly, search works
**Deep**: Persona is HK/Chinese — CJK character support essential

### M.6 — Zero-Width Characters / Invisible Input
**Steps**: Enter zero-width spaces, invisible Unicode in name fields
**Verify**: Trimmed or detected, doesn't create "blank" looking entries
**Deep**: Validation catches purely whitespace input

### M.7 — Double Submit / Race Condition
**Steps**: Double-click "Create Block" rapidly
**Verify**: Only one block created, second click ignored or blocked
**Deep**: Submit button disabled during processing

### M.8 — Browser Back from Destructive Action
**Steps**: Delete something → immediately hit browser back
**Verify**: Deleted item doesn't reappear, no ghost state

### M.9 — localStorage Full
**Steps**: Fill localStorage to capacity → try onboarding/wizard
**Verify**: Graceful fallback if localStorage write fails
**Deep**: Try-catch around localStorage operations

### M.10 — JavaScript Disabled
**Steps**: Disable JS → navigate to `/plans`
**Verify**: At minimum, server-rendered content visible, sign-in works
**Deep**: Next.js SSR should provide base content

### M.11 — Slow Connection (3G Throttle)
**Steps**: Throttle to 3G → full user flow
**Verify**: Loading states everywhere, no timeouts on normal operations, images lazy-load

### M.12 — Concurrent Session (Two Devices)
**Steps**: Login on desktop + mobile simultaneously
**Verify**: Both sessions work, data eventually consistent
**Deep**: No session conflict or forced logout

### M.13 — Expired Training Block
**Steps**: View a block whose end date has passed
**Verify**: Shows as "Completed", can't start workouts from it, read-only
**Deep**: Transition from active to completed is clean

### M.14 — Empty Database (Fresh User, Post-Onboarding)
**Steps**: Complete onboarding → land on `/plans`
**Verify**: Clean empty states everywhere — plans, workout, performance, history
**Deep**: Every page an individual can visit has a defined empty state

### M.15 — Large Data Set
**Steps**: User with 50+ completed blocks, 500+ workout logs
**Verify**: Pages load without timeout, pagination/infinite scroll works
**Deep**: React Query handles large lists, no memory leak

### M.16 — Console Error Audit
**Steps**: Navigate through entire individual path
**Verify**: Zero console errors (warnings acceptable if known Clerk/dev warnings)
**Deep**: React key warnings, unhandled promise rejections, hydration mismatches

---

## Suite N: Cross-Feature Flows (End-to-End Journeys)

### N.1 — Full First-Time User Journey
**Steps**: New user → sign up → onboard as individual → create first block → view plan → start first workout → log sets → finish workout → view in history → check performance
**Verify**: Entire flow works without errors, data consistent across all views
**Time**: 10-15 minutes
**Persona**: Use athlete profile — 26yo sprinter, advanced, Improve Speed + Train for Event goals

### N.2 — Returning User — Weekly Training Loop
**Steps**: Auth → `/workout` → see today's workout → start → log all exercises → finish → check performance update
**Verify**: Workout hub shows correct next session, logging saves, performance stats update
**Deep**: Stats recalculate after new workout entry

### N.3 — Plan Modification Mid-Block
**Steps**: Week 2 of active block → edit session → modify exercises → next workout reflects changes
**Verify**: Session edit saves, workout hub shows updated exercises
**Deep**: Only modified session changes, other weeks unaffected

### N.4 — Block Completion → New Block Creation
**Steps**: Reach end of block → block auto-completes → navigate to plans → create new block
**Verify**: Old block marked complete, new block becomes active, fresh plan generated
**Deep**: History preserved, no overlap between blocks

### N.5 — Settings Change → Plan Impact
**Steps**: Update weight in settings → generate new plan → verify plan accounts for new weight
**Verify**: AI generation uses updated profile data
**Deep**: Existing plans don't retroactively change

### N.6 — Race Result → Performance Analytics Flow
**Steps**: Add race result (60m indoor, 7.24s) → view sprint analytics → check progression chart
**Verify**: New result appears in chart, stats recalculate
**Deep**: Race result maps to correct event, timeline accurate

### N.7 — Dark Mode Full Journey
**Steps**: Switch to dark mode → navigate through all pages
**Verify**: Every page/component respects dark theme, no white flashes, charts readable
**Deep**: Dialogs, tooltips, dropdowns all themed

### N.8 — Multi-Day Usage Simulation
**Steps**: Log in Monday → start workout → log → Tuesday → different workout → log → view week summary
**Verify**: Each day's workout logged separately, week view shows completed days
**Deep**: Date-based workout matching works across timezone changes

---

## Execution Strategy

### Phase 1 (P0 — Must Pass)
Run Suites A, B, E first. These gate the entire individual user path.

### Phase 2 (P1 — Core Experience)
Run Suites C, D, F, H, L, M, N. These cover the daily user experience.

### Phase 3 (P2 — Enhancement)
Run Suites G, I, J, K. These cover secondary features and AI.

### Parallelization
- Use `--session` flags to run independent suites in parallel
- Suite A (auth) must run first
- Suites C, D, I, J can run in parallel after auth
- Suite N runs last (depends on all other suites passing)

### Evidence Collection
- Screenshot every failure: `/tmp/e2e/[suite]-[test]-fail.png`
- Screenshot key success states: `/tmp/e2e/[suite]-[test]-pass.png`
- Console log dump for every suite: `/tmp/e2e/[suite]-console.txt`
