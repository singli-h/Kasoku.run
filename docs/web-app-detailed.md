# Detailed Web Application Workflows & Logic

This document provides an in-depth, step-by-step illustration of user interactions, decision branches, and core logic for each page, followed by detailed breakdowns of major custom components.

---

## 1. Home Page `/`

**Purpose:** Public landing page showcasing product features to unauthenticated users.

### Workflow & Logic Steps
1. Browser requests `/`.
2. Next.js App Router serves `(default)/page.jsx`.
3. Render components in order:
   - `Hero` → displays headline, call-to-action button (`Sign In` / `Sign Up`).
   - `Features` → lists platform capabilities.
   - `Pricing` → shows subscription tiers.
   - `About` → company info.
4. No authentication check; all content public.
5. CTA button logic:
   - If user clicks **Sign In** → navigate to `/sign-in`.
   - If user clicks **Sign Up** → navigate to `/sign-up`.

### API & Routes
- No API calls on this page.

### Design & Patterns
- Composition of landing components.
- Tailwind utility classes for responsive layout.


---

## 2. Sign-In Page `/sign-in`

**Purpose:** Authenticate existing users via Clerk and route based on onboarding status.

### Workflow & Logic Steps
1. User navigates to `/sign-in`.
2. Component mounts (`LoginPage`).
3. `useAuth()` provides `{ isLoaded, isSignedIn }`.
4. `useEffect` triggers when `isLoaded` or `isSignedIn` changes:
   - If `!isLoaded || !isSignedIn` → set `isChecking = false`; skip redirect.
   - If `isSignedIn`:
     a. Fetch `/api/users/status` (no auth header required due to SSR cookie).  
     b. On success:
        - If `data.onboarding_completed === true` → `router.push('/plans')`.
        - Else → `router.push('/onboarding')`.
     c. On fetch error → log and `router.push('/plans')` as fallback.
     d. Finally, set `isChecking = false` to end loading.
5. **Render Logic**:
   - While `isLoaded && isSignedIn && isChecking` → show spinner/logo placeholder.
   - Otherwise → render Clerk `SignIn` component with:
     - Custom appearance settings.
     - Props: `redirectUrl=/auth/session`, `routing='path'`, `signUpUrl='/sign-up'`.

### Role Cases
- No role branch here; onboarding status alone determines next route.

### API Routes
- **GET** `/api/users/status` → returns `{ onboarding_completed, subscription_status }`.

### Design & Patterns
- Clerk UI for auth flows.
- React state & effect hooks to manage loading.
- Tailwind for layout and animations.


---

## 3. Sign-Up Page `/sign-up`

**Purpose:** Register new users, then route to onboarding/plans based on status.

### Workflow & Logic Steps
1. User navigates to `/sign-up`.
2. `RegisterPage` mounts; obtains `isSignedIn` from `useAuth()`.
3. `useEffect` on `isSignedIn`:
   - If `isSignedIn`:
     a. Fetch `/api/users/status`.
     b. If `onboarding_completed === true` → navigate to `/plans`.
     c. Else → navigate to `/onboarding`.
     d. On error → navigate to `/onboarding`.
4. Render Clerk `SignUp` component with:
   - Appearance config.
   - `redirectUrl='/auth/session'`, `routing='path'`, `signInUrl='/sign-in'`.
5. No loading spinner; Clerk handles internal state.

### API Routes
- **GET** `/api/users/status` (same as sign-in).

### Design & Patterns
- Similar to Sign-In page.


---

## 4. Session Handler `/auth/session`

**Purpose:** Intermediate page to finalize authentication and route based on onboarding status.

### Workflow & Logic Steps
1. User is redirected here post-auth callback.
2. `SessionHandler` mounts; obtains `{ isLoaded, isSignedIn, session }` via `useSession()`.
3. `useEffect` runs when `isLoaded` changes:
   - If `!isLoaded` → do nothing until Clerk finishes.
   - If `!isSignedIn` → `router.push('/login')`.
   - Else → call `checkOnboardingStatus()`:
     a. Get `token = await session.getToken()`.
     b. Fetch `/api/users/status` with `Authorization: Bearer ${token}`.
     c. If response not OK or `body.status !== 'success'` → route `/plans`.
     d. Else examine `body.data.onboarding_completed`:
        - `true` → `/plans`
        - `false` → `/onboarding`
        - other → default `/plans`.
     e. On exception → log and `/onboarding`.
4. Render a logo + "Redirecting..." message until redirection occurs.

### API Routes
- **GET** `/api/users/status` with auth header.

### Design & Patterns
- Clerk session integration.
- Explicit token authentication for API.


---

## 5. Onboarding Page `/onboarding`

**Purpose:** Guide first-time users through multi-step onboarding flow.

### Workflow & Logic Steps
1. User navigates to `/onboarding`.
2. `OnboardingPage` mounts; gets `{ isLoaded, isSignedIn }` via `useAuth()`.
3. `useEffect`:
   - If `NEXT_PUBLIC_BYPASS_AUTH === 'true'` → skip auth checks.
   - If `isLoaded && !isSignedIn` → redirect to `/sign-in`.
4. Render `<OnboardingFlow />` which handles internal step logic.

### API Routes & Data
- On each onboarding step, `OnboardingFlow` components may POST/PUT to:
  - `/api/users/onboard` or `/api/users/profile`.
  - Validate inputs and persist to Supabase.

### Design & Patterns
- Single-page wizard using dynamic import of steps.
- State machine for step navigation.


---

## 6. Plans Page `/plans`

**Purpose:** Allow users (athlete or coach) to create or manage training plans via Wizard, Calendar, or Builder.

### Workflow & Logic Steps
1. User navigates to `/plans`.
2. `PlansPage` mounts; obtains `roleData` from `useUserRole()`.
3. While `loading` → show spinner.
4. Initialize `tab = 'wizard'` on mount.
5. **User selects a tab** (`wizard`, `calendar`, `builder`):
   - On tab change, `setTab(value)`.
6. **Wizard Tab** (`MesoWizard`):
   a. User completes wizard steps (delegated to component).
   b. On `onComplete(result)`:
      i. Extract `groups = result.apiResponse.data.groups`.
      ii. For each `group.id`, POST to `/api/plans/preset-groups/${id}/assign`.
      iii. After all assignments:
         - If `role === 'coach'` → `router.push('/sessions')`
         - Else → `router.push('/workout')`
      iv. On error → display error message.
7. **Calendar Tab** (`CalendarView`):
   - Fetch existing mesocycle data and render interactive calendar.
8. **Builder Tab** (`PresetGroupBuilder`):
   - Custom UI to drag/drop or configure preset groups.

### Role Cases
- **Coach** → redirected to `/sessions` upon plan creation.
- **Athlete** → redirected to `/workout`.

### API Routes
- **POST** `/api/plans/preset-groups/{id}/assign`

### Design & Patterns
- Radix UI Tabs.
- React Suspense + lazy imports for large components.
- Context API for role-based UI.


---

## [Additional Pages: Overview, Workout, Sessions, Athletes, Profile, Settings, Insights, Performance]

The same structured detail applies:  
- **Page Purpose**  
- **Step-by-Step Workflow & Logic**  
- **Role Variations**  
- **API Endpoints**  
- **Design Patterns & Components**  

(For brevity, not all are expanded here. Please let me know if you'd like specific pages next.)

---

# Major Custom Components

Below are the key components used across pages, with their internal workflows and logic.

## A. `OnboardingFlow`
**Location:** `components/onboarding/onboarding-flow.jsx`

### Purpose
Controls multi-step onboarding wizard, rendering different step components and managing shared state.

### Workflow & Logic
1. Import step definitions in sequence:  
   - `WelcomeStep` → `RoleSelectionStep` → `AthleteDetailsStep` / `CoachDetailsStep` → `SubscriptionStep` → `WorkoutTourStep` → `DashboardTourStep` → `FinalStep` → `CompletionStep`
2. Maintain `currentStepIndex`, `formData` in local state.
3. **onNext(data)**:
   - Validate `data` against step-specific rules (e.g., required fields, email format).
   - Merge into `formData`.
   - If step === role selection:
     - Branch to Athlete vs Coach details.
   - Increment `currentStepIndex`.
4. **onBack()** → decrement `currentStepIndex`.
5. On step components with API calls:
   - Call `/api/users/onboard` or `/api/users/profile`.
   - Handle response or show validation errors.
6. At final confirmation, call `/api/users/status` to refresh and redirect to `/plans`.

### Validation & Branching
- Role selection decides which detail step.
- Subscription preferences saved only after valid payment or free-tier selection.

## B. `MesoWizard`
**Location:** `components/mesoWizard/mesoWizard.jsx`

### Purpose
Guided interface to build a mesocycle plan.

### Workflow & Logic
1. Initialize wizard state: `mesocycleParameters`, `phases`, `goals`.
2. Render stepper UI: phases, weeks, intensity sliders.
3. **onSubmit()**:
   - Validate all fields (e.g., numeric ranges, date order).
   - POST to `/api/plans/mesocycle` with parameters.
   - Return created preset group IDs via callback.

## C. `CalendarView`
**Location:** `components/overview/CalendarView.jsx`

### Purpose
Displays and edits schedule within a calendar grid.

### Workflow & Logic
1. Accept `mesocycle` prop.
2. Map `mesocycle.weeks` to calendar days.
3. Allow click to open modal to adjust reps/loads.
4. **onUpdate(dayData)** → call `props.onUpdate(updatedMesocycle)`.

## D. `PlanBuilder`
**Location:** `components/overview/PlanBuilder.jsx`

### Purpose
Drag-and-drop interface to configure workout sessions manually.

### Workflow & Logic
1. Fetch existing preset groups for selected mesocycle.
2. Render list of groups, enable reorder.
3. **onReorder(newOrder)** → update state and call `props.onUpdate`.

## E. `WeeklyOverview` & `MesocycleOverview`
**Location:** `components/overview/WeeklyOverview.jsx`, `MesocycleOverview.jsx`

### Purpose
Visual summary charts for progress tracking.

### Workflow & Logic
- **WeeklyOverview**: Fetch `/api/workout/weeklyOverview`, plot bar charts of completed vs assigned.
- **MesocycleOverview**: Calculate aggregate stats from `mesocycle` prop and render progress indicators.

## F. `PresetGroupBuilder`
**Location:** `components/builder/PresetGroupBuilder.jsx`

### Workflow & Logic
1. Fetch available presets and groups.
2. Render filterable list; allow selecting multiple presets.
3. **onSave(selectedPresets)** → POST to `/api/plans/preset-groups`.

## G. `ExerciseDashboard` & `useExerciseData`
**Location:** `components/workout`, `hooks/useExerciseData.jsx`

### Purpose
Manage state for an active training session: start, save progress, complete.

### Workflow & Logic
1. **useExerciseData** hook:
   - Fetch session details via `/api/workout/trainingSession?sessionId=`.
   - `startSession()` → POST to create training details.
   - `saveSession()` → PUT updates with current reps/resistance.
   - `completeSession()` → PUT with `status: 'completed'`.
2. **ExerciseDashboard**:
   - Render list of exercises, input fields for reps/resistance.
   - Buttons to save or complete; call corresponding hook methods.
   - Disable inputs when `isReadOnly`.

## H. `ErrorAndLoadingOverlay`
**Location:** `components/ui/loading.jsx`

### Workflow & Logic
- Displays a full-screen overlay if `isLoading` or `error`.
- Props:
  - `blocking` toggles interaction blocking.
  - `position` defines overlay location.

---

*This detailed document covers page-level workflows and major component logic. Let me know if you need further expansion on specific pages or components!* 