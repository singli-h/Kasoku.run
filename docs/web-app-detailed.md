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

**UI Enhancements (New):**
- The tab navigation (Wizard, Calendar, Builder) is now sticky at the top of the page for better accessibility.
- Tabs are styled with a modern look, using a light background, clear active state, and icons for visual distinction (Wand for Wizard, Calendar for Calendar, Wrench for Builder).

### Workflow & Logic Steps
1. User navigates to `/plans`.
2. `PlansPage` mounts; obtains `roleData` from `useUserRole()`.
3. Initialize `tab = 'wizard'` on mount (or potentially reads from URL query param `?tab=`).
4. **User selects a tab** (`wizard`, `calendar`, `builder`):
   - On tab change, `setTab(value)` (updates URL query param if implemented).
5. **Wizard Tab** (`MesoWizard`):
   a. User completes wizard steps (delegated to component).
   b. On `onComplete(result)`:
      i. Extract `groups = result.apiResponse.data.groups`.
      ii. For each `group.id`, POST to `/api/plans/preset-groups/${id}/assign-sessions`.
      iii. After all assignments:
         - If `role === 'coach'` → `router.push('/sessions')`
         - Else → `router.push('/workout')`
      iv. On error → display error message.
6. **Calendar Tab** (`CalendarView`):
   - Fetches and renders existing training plan data in an interactive calendar format.
7. **Builder Tab** (`PresetGroupBuilder` component is rendered):
   a. **Displays List**: `PresetGroupBuilder` fetches and renders a list of the user's existing preset groups using the `GroupListView` component.
      - **Filtering (New)**: `GroupListView` includes a client-side search input to filter groups by name.
      - **UI (New)**: `GroupListView` has an improved UI with better card styling for each group and an enhanced empty state message.
   b. **Create New**: A "Create New Preset Group" button in `GroupListView` (managed by `PresetGroupBuilder`) triggers a POST to `/api/plans/preset-groups` to create a new group with a default name. The list then refreshes. (Optionally, can navigate to the edit page for the new group).
   c. **Select to Edit**: User clicks an "Edit" button on a preset group card in `GroupListView`.
      - **Navigation (New)**: This action navigates the user to a dedicated RESTful route: `/preset-groups/[id]/edit`.

### Role Cases
- **Coach** → redirected to `/sessions` upon plan creation from Wizard.
- **Athlete** → redirected to `/workout` upon plan creation from Wizard.
- Both roles can use the Builder and Calendar tabs according to their permissions for viewing/editing preset groups and plans.

### API Routes
- **POST** `/api/plans/preset-groups/{id}/assign-sessions` (used by Wizard)
- **GET** `/api/plans/preset-groups` (used by Builder to list groups)
- **POST** `/api/plans/preset-groups` (used by Builder to create new groups)
- *See `/api/plans/preset-groups/[id]` routes documented in `api-documentation.md` for edit/delete, used by the new edit page.*

### Design & Patterns
- Radix UI Tabs with enhanced styling.
- Client-side routing for dedicated edit pages (`/preset-groups/[id]/edit`).
- SWR for data fetching and caching.
- Component composition for builder functionality (`PresetGroupBuilder` -> `GroupListView`).

---

## 6.1. Preset Group Edit Page `/preset-groups/[id]/edit` (New Page)

**Purpose:** Allow users to edit the details of a specific preset group, including its metadata and associated exercises.

### Workflow & Logic Steps
1. User navigates to `/preset-groups/[id]/edit` (typically from the "Edit" button on the Builder tab's group list).
2. `PresetGroupEditPage` component mounts.
3. It extracts the `groupId` from the URL parameters.
4. Fetches authentication token using `useSession`.
5. **Data Fetching (using SWR):**
   a. Fetches all available exercises from `/api/plans/exercises`.
   b. Fetches the specific preset group details (metadata and its current presets/exercises) from `/api/plans/preset-groups/[id]` using the `groupId`.
6. **Render Logic:**
   a. While data is loading, a loading spinner is displayed.
   b. If errors occur during fetching, an error message is shown.
   c. If data is successfully fetched, the `GroupEditorView` component is rendered, passing down:
      - The `group` object (metadata).
      - The `presets` array (exercises within the group).
      - `allExercises` (all available system exercises for selection).
      - `loadingExercises` status.
      - `onBack` handler (navigates back to `/plans?tab=builder`).
      - `onSave` handler.
7. **User Interaction (within `GroupEditorView`):**
   a. **Edit Metadata**: User modifies group name, date, session mode, and description. These are managed by local state within `GroupEditorView`.
   b. **Manage Exercises**: User adds, removes, reorders, or modifies details of exercises within the group using the integrated `ExerciseSectionManager` and `ExerciseTimeline` components (similar to MesoWizard).
   c. **Save Changes**: User clicks "Save Changes".
      - The `onSave` handler in `PresetGroupEditPage` is called.
      - It makes a `PUT` request to `/api/plans/preset-groups/[id]` with the updated group metadata and exercise preset data.
      - On success, it revalidates the SWR cache for the group detail and navigates the user back to `/plans?tab=builder`.
      - On failure, an error message is shown (e.g., via alert or toast).
   d. **Delete Group**: User clicks "Delete Group".
      - A confirmation dialog is shown.
      - If confirmed, the `handleDelete` function in `GroupEditorView` makes a `DELETE` request to `/api/plans/preset-groups/[id]`.
      - On success, an alert is shown, and the user is navigated back to `/plans?tab=builder`.
      - On failure, an error message is shown.
   e. **Cancel**: User clicks "Cancel" or "Back to Builder", navigating back to `/plans?tab=builder` without saving changes.

### API Routes
- **GET** `/api/plans/exercises`
- **GET** `/api/plans/preset-groups/[id]`
- **PUT** `/api/plans/preset-groups/[id]`
- **DELETE** `/api/plans/preset-groups/[id]`

### Design & Patterns
- Dedicated dynamic route for editing a specific resource, following RESTful principles.
- Data fetching at the page level, passing data down to display/form components.
- Re-use of `GroupEditorView` component.
- SWR for efficient data fetching and cache management.
- Clear separation of concerns: page handles data fetching and top-level actions, editor view handles form state and UI.
- UI Enhancements (New): `GroupEditorView` uses `Card` components for better structure, improved form layout, and includes a description field.

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
**Location:** `apps/web/src/components/builder/PresetGroupBuilder.jsx` (Path corrected)

### Purpose
Manages the main view for the "Builder" tab on the `/plans` page. It is responsible for fetching and displaying a list of preset groups with filtering capabilities, and for initiating the creation of new ones.

### Workflow & Logic (Updated)
1. Fetches authentication token using `useSession`.
2. Initializes state for filters: `nameFilter`, `microcycleIdFilter`, `athleteGroupIdFilter`, `sessionModeFilter`.
3. **Data Fetching**: Fetches the list of preset groups for the user from `/api/plans/preset-groups` using SWR (`useSWRImmutable`). 
   - The SWR key is dynamically built to include the current filter states (`name`, `microcycleId`, `athleteGroupId`, `sessionMode`). Changes to these filters trigger a refetch.
   - The fetcher function constructs the API URL with these filters as query parameters.
4. Renders the `GroupListView` component, passing down:
   - The fetched `groups`.
   - Current filter values and their state setter functions.
   - An `isLoading` flag based on the SWR fetch status.
   - An `onNew` handler.
5. **`onNew` Handler**: 
   - When triggered (e.g., by a "Create New" button in `GroupListView`), it makes a POST request to `/api/plans/preset-groups`.
   - The request body includes a default name (e.g., "New Preset Group - [timestamp]"), today's date, and a default session mode ('individual') to ensure required fields by the database (like `date` if it's NOT NULL) are populated.
   - On successful creation, it mutates (refreshes) the SWR cache for the group list.
6. Does NOT handle the display or logic for editing a specific group; this is delegated to the `/preset-groups/[id]/edit` page.

## F.1. `GroupListView` (New Component Detail)
**Location:** `apps/web/src/components/builder/GroupListView.jsx`

### Purpose
Displays a filterable list of preset groups with options to create a new group or navigate to edit an existing one. It also handles the UI for filter controls.

### Workflow & Logic (Updated)
1. **Props**: Receives `groups` (array of preset group objects), `onNew` (function), filter values (`nameFilter`, `microcycleIdFilter`, etc.), filter setter functions (`setNameFilter`, etc.), and `isLoading`.
2. **Filter UI**: 
   - Renders a dedicated "Filters" `Card` section.
   - Includes an `Input` for filtering by `name` (updates `nameFilter` prop).
   - Includes an `Input` for filtering by `microcycleId` (updates `microcycleIdFilter` prop).
   - Includes an `Input` for filtering by `athleteGroupId` (updates `athleteGroupIdFilter` prop).
   - Includes a `Select` dropdown for filtering by `sessionMode` (All, Individual, Group; updates `sessionModeFilter` prop).
   - A "Clear Filters" button resets all filter states via their setter functions.
3. **Data Display**: 
   - The `groups` array received as a prop is already filtered by the API based on the filter states managed in `PresetGroupBuilder`.
   - **Client-side filtering based on `searchTerm` has been removed.**
4. **Display Logic**:
   - Renders a styled header with the title "Preset Groups" and the "Create New Preset Group" button.
   - If `isLoading` is true, displays a loading indicator.
   - If not loading and `groups` is empty:
     - Shows an informative empty state message, indicating whether it's due to active filters or no groups existing.
     - If no groups exist (and no filters are active), shows a prominent "Create First Preset Group" button.
   - If not loading and `groups` has items:
     - Maps over `groups` and renders each group as a styled `Card`.
     - Each card displays the group's name, mode, date, and (if available) `microcycle_id` and `athlete_group_id`.
     - Each card has an "Edit Group" button.
5. **Edit Action**: When the "Edit Group" button is clicked for a group:
   - It uses `useRouter().push()` to navigate to the dedicated edit page: `/preset-groups/[groupId]/edit`.

## F.2. `GroupEditorView` (Updated Component Detail)
**Location:** `apps/web/src/components/builder/GroupEditorView.jsx`

### Purpose
Provides the UI and handles the local state for editing a single preset group's metadata and its exercises. This component is now primarily rendered by the `/preset-groups/[id]/edit` page.

### Workflow & Logic
1. **Props**: Receives `group` (the preset group object to edit), `presets` (array of exercise presets within the group), `filteredExercises` (list of all available system exercises), `loadingExercises`, `onBack` (function to navigate back), and `onSave` (function to call with updated data).
2. **State Management**: 
   - Initializes local state for group metadata fields (name, date, session mode, description) based on the passed `group` prop.
   - Manages the state of `exercises` within the group (derived from `presets` prop and modified by user actions).
   - Manages `activeSections` and `supersets` for the exercises.
3. **UI Structure (New)**:
   - Uses `Card` components to visually separate sections: "Group Details" (metadata) and "Exercises".
   - Metadata section contains input fields for name, date (optional), session mode (select dropdown), and description (textarea, optional).
   - Exercises section uses a `Tabs` component for "Manage Exercises" (rendering `ExerciseSectionManager`) and "View Timeline" (rendering `ExerciseTimeline`).
4. **Exercise Management**: Leverages `ExerciseSectionManager` and `ExerciseTimeline` (similar to `MesoWizard`) for adding, removing, reordering, and detailing exercises within the preset group.
5. **Save Action**: 
   - The "Save Changes" button calls the `onSave` prop, passing the current state of the group metadata and exercises, formatted for the API.
6. **Delete Action (New)**:
   - A "Delete Group" button is present.
   - When clicked, it shows a confirmation dialog.
   - If confirmed, it calls its internal `handleDelete` function which:
     - Fetches the Clerk auth token.
     - Makes a `DELETE` request to `/api/plans/preset-groups/[groupId]`.
     - On success, shows an alert and calls `router.push('/plans?tab=builder')` (passed implicitly via `onBack` or directly if router is used within).
     - On failure, shows an error alert.
7. **Cancel Action**: The "Cancel" button calls the `onBack` prop.

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