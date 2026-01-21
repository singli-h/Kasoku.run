---
# Kasoku Running Website – Feature-by-Feature Overview

> **Last Updated**: 2025-12-24

This document provides a concise yet comprehensive overview of the **nine core application pages / features** currently implemented in the `apps/web` Next.js application.  
For each page you will find:

* **User Story** – why this page exists and the value it brings.
* **Workflow** – high-level step-by-step of how the user interacts with the page.
* **Logic** – key data-flow, server actions, and component interactions.
* **Design** – notable UI/UX patterns, components, and visual choices.
* **Implementation Gaps** – shortcomings or TODO items observed from the current code-base that prevent the feature from fully meeting the PRD requirements.

> NOTE
> Gap assessments based on codebase as of December 2025 (staging branch).
> References use the simplified path notation `apps/web/...`.
> For database schema optimization plans, see `specs/005-database-schema-optimization/spec.md`.

---

## 1. Onboarding (`/onboarding`)

### User Story
* **As a** brand-new user (athlete or coach)  
* **I want** a guided, multi-step wizard  
* **So that** my role, profile, goals, and subscription are captured before entering the product.

### Workflow
1. Un-authenticated visitor signs up via Clerk.
2. App Router middleware forwards the user to `/onboarding` until completion.
3. Wizard steps rendered by `OnboardingWizard` (`components/features/onboarding/onboarding-wizard.tsx`):
   1. Welcome → 2. Role Selection → 3. Role-specific Details → 4. Subscription → 5. Dashboard Tour → 6. Completion.
4. On final step the wizard calls `completeOnboardingAction` (`actions/users/onboarding-actions.ts`) to persist data and marks `onboarding_completed = true`.
5. User is redirected to `/dashboard`.

### Logic Highlights
* **State:** `useState<OnboardingData>` holds a rich profile object, incrementally updated by child steps.
* **Auth:** `useAuth()` & `useUser()` hydrate name/email from Clerk on mount.
* **Server Action:** `checkUserNeedsOnboardingAction` gate-keeps access (redirects finished users away).
* **Progress:** `<Progress />` component shows percentage complete.

### Design
* Framer-motion for step transitions.
* Radix UI + shadcn/ui for inputs, cards, and buttons.
* Responsive, mobile-first layout (`container mx-auto px-4 py-8`).

### Implementation Gaps
* **Stripe payments** – `SubscriptionStep` exists but no live checkout / billing integration.
* **Profile picture upload** – `profilePicture` field handled in state but no upload widget or Supabase Storage write.
* **Validation** – zod / react-hook-form not applied; potential invalid data submission.
* **Accessibility** – keyboard navigation between steps is not addressed.

---

## 2. Plans (`/plans`)

### User Story
* **As a** coach **I want** to create, view, and reuse structured training plans so that I can quickly prescribe periodised programs to athletes.  
* **As an** athlete **I want** to browse assigned plans.

### Workflow
1. Page mounted via `PlansPage` → `<TrainingPlansPage />` (`components/features/plans/...`).
2. Three tabs (`Tabs`): **Existing**, **Templates**, **Create New Plan**.
3. *Existing* tab loads user/team plans (`ExistingPlansTab`).
4. *Templates* lists reusable plan blueprints (`TemplatesPage`).
5. *Create* instantiates the **MesoWizard** multi-step creator (`mesowizard/mesowizard.tsx`).

### Logic Highlights
* MesoWizard orchestrates 5 detailed sub-steps culminating in server actions to create `macrocycles / mesocycles / microcycles` and `exercise_preset_groups`.
* React Context + internal state for wizard data; animated transitions via Framer Motion.

### Design
* Card-based wizard embedded inside a tab.
* Lucide icons (Calendar / Trophy / Plus) reinforce tab meaning.
* Extensive use of shadcn/ui components for form inputs and progress.

### Implementation Gaps
* **Advanced Session Planning** – PRD calls for multi-superset, bulk edits, templates; only *single* superset & basic list currently implemented (see `session-planning.tsx`).
* **Template Marketplace** – placeholder component, no CRUD or public sharing.
* **Plan Copy / Progression** logic not coded.
* Missing **unit tests** for plan CRUD actions.

---

## 3. Sessions (`/sessions`)

### User Story
* **As a** coach **I want** to manage sprint training sessions for multiple athlete groups in a single interface so that I can efficiently track and record sprint performance for all my athletes.

### Workflow
1. `SessionsPage` renders `<SprintSessionDashboard />` with table-like interface.
2. Dashboard displays multiple athlete groups with their respective athletes in separate sections.
3. Coaches can add/remove sprints, set distances, and record sprint times for each athlete.
4. Real-time updates save performance data to training session records.

### Logic Highlights
* **Multi-Group Management**: Single page interface for managing multiple athlete groups simultaneously.
* **Sprint-Focused**: Dedicated to sprint training sessions with distance and time tracking.
* **Table-Like Design**: Athletes as rows, sprints as columns for easy data entry.
* **Real-time Performance Tracking**: Live updates as coaches record sprint times.
* **Preset Integration**: Sprint sessions reflect original training preset records.

### Design
* **Table Layout**: Athletes as rows, sprints as columns for intuitive data entry.
* **Group Sections**: Each athlete group has its own section/table on the same page.
* **Distance Management**: Add/remove sprints with customizable distances (100m, 200m, 400m, custom).
* **Time Entry**: Easy-to-use time input cells for recording sprint performance.
* **Real-time Updates**: Automatic saving of performance data to training session records.
* **Mobile Responsive**: Optimized for tablet/phone use during training sessions.

### Implementation Gaps
* **Multi-group table interface** not implemented - currently single group focus.
* **Sprint distance management** (add/remove sprints) missing from UI.
* **Real-time performance tracking** not wired to training session records.
* **Mobile-optimized table design** for easy coach use during sessions.
* **Bulk operations** for managing multiple athletes' sprint sessions.

---

## 4. Workout (`/workout`)

### User Story
* **As an** athlete **I want** an interactive dashboard to execute my workout, log sets, and see progress in real-time so that I remain engaged and accurate.

### Workflow
1. Page renders `<WorkoutSessionDashboard />` wrapped with `ExerciseProvider` context.
2. Athlete clicks **Start Session** → `startTrainingSessionAction` creates `exercise_training_sessions` row.
3. Athlete logs each set; `addExercisePerformanceAction` persists details.
4. On completion **Finish Session** triggers `completeTrainingSessionAction` and navigates to summary.

### Logic Highlights
* In-memory context holds session status; writes are debounced before hitting Supabase.
* Video guidance placeholders using `<VideoPlayer />` component.
* Rest timer component for interval timing.

### Design
* Motion animations for set transitions.
* Card-driven exercise list; supersets visually grouped (`EnhancedExerciseOrganization`).

### Implementation Gaps
* **Video playback** logic is stubbed – no storage fetch or player controls.
* **Offline capability / optimistic caching** not present (PRD requirement).
* **Velocity / power metrics** inputs absent – only reps/weight supported.

---

## 5. Athletes (`/athletes`)

### User Story
* **As a** coach **I want** to view and manage my roster, create groups, and track global metrics so that I can provide targeted coaching.

### Workflow
1. Page uses `AthleteManagementDashboard` component.
2. Calls `getAthletesAction` & `getGroupsAction` server actions.
3. Coach can drill into an athlete or create/edit groups via dialogs.

### Logic Highlights
* Data tables with pagination (`data-table.tsx`).
* Group create/delete actions in `actions/training/coach-actions.ts`.

### Design
* Two-pane layout: list on left, details on right.
* Color badges for status (Active / Injured / Archived).

### Implementation Gaps
* **Bulk operations** (assign plan, message athletes) not implemented.
* **CSV import/export** of athlete data missing.
* **Permissions** – athletes can technically access this route if they change URL; route guard needed.

---

## 6. Settings (`/settings`)

### User Story
* **As a** user **I want** to manage profile, notifications, and theme so that my account behaves the way I prefer.

### Workflow
* Tabs inside `SettingsPage` (`components/features/settings/...`): **Profile**, **Notifications**, **Theme**.
* Each tab loads a form component that reads & writes via respective server actions.

### Logic Highlights
* Profile tab uses Clerk data merged with Supabase profile table.
* Notification preferences saved to `user_settings` table.
* Theme toggle writes to local storage + optional Supabase field for sync.

### Design
* Simple vertical nav list on desktop; collapsible accordion on mobile.

### Implementation Gaps
* **Billing / subscription management tab** absent (PRD section 1.2).
* **Danger zone** (account delete) not coded.
* No **audit trail** or password-less security controls yet.

---

## 7. Performance (`/performance`)

### User Story
* **As an** athlete **I want** rich visual analytics of my training over time, and **as a** coach **I want** to benchmark athletes.

### Workflow
1. `PerformancePage` renders Tabs **Individual** & **Comparative**.
2. Each tab lazy-loads its analytic component under Suspense.
3. Charts built with Recharts inside respective components.

### Logic Highlights
* The fetcher components show TODO comments – they currently return static components without server data.
* Intended to query `exercise_training_details` aggregated by Supabase view.

### Design
* Tab UI with Radix-based Tabs.
* Responsive chart containers.

### Implementation Gaps
* **Actual data fetching** not implemented – components render placeholder/demo data.
* **Export / share report** functionality missing.
* **Benchmarks / percentiles** not calculated.

---

## 8. Dashboard (`/dashboard`)

### User Story
* **As a** user **I want** a personalised snapshot of today’s training, recent activity, and quick actions so that I always know what to do next.

### Workflow
1. Server component checks onboarding state; redirects if incomplete.
2. Concurrently executes `getCurrentUserAction` and `getDashboardDataAction`.
3. `<DashboardLayout />` receives prepared DTO with recent tasks, action cards, and analytics summary.

### Logic Highlights
* Action cards defined in `features/dashboard/constants/dashboard-config.ts`.
* Data aggregator `dashboard-actions.ts` joins multiple tables.

### Design
* Masonry-like grid with cards (Recent Tasks, Progress Chart, Quick Links).
* Skeleton loader for initial fetch.

### Implementation Gaps
* **PostHog tracking** for card clicks not instrumented.
* **Real-time updates** (e.g., task completion) require page refresh.
* No **customisation** – users can’t reorder/hide cards.

---

## 9. Library (`/library`)

### User Story
* **As an** athlete **I want** to browse an exercise library with filters and videos so that I can learn proper technique.

### Workflow
1. `LibraryPage` renders `<ExerciseLibraryPage />` inside Suspense.
2. Page loads list of exercises with search & category filters (component path `features/exercise/...`).
3. Clicking an exercise opens a dialog with details & demonstration video.

### Logic Highlights
* Uses TanStack Query for client-side pagination & caching.
* Server action `getExercisesAction` queries `exercises` table.

### Design
* Grid layout—responsive 1-4 columns.
* Cards display thumbnail, name, tags.

### Implementation Gaps
* **Video storage** – path references exist but Supabase Storage integration incomplete.
* **Advanced filters** (equipment, difficulty) mentioned in PRD but not wired.
* No **bookmark / favourite** feature.

---

## 📋 Consolidated Gap Summary
| Feature | High-Impact Missing Pieces |
|---------|---------------------------|
| Onboarding | Stripe checkout, image upload, validation, a11y |
| Plans | Multi-superset planning, template CRUD, copy/progression, tests |
| Sessions | Attendance, real-time updates, search/filter |
| Workout | Video playback, offline/optimistic, velocity/power inputs |
| Athletes | Bulk ops, CSV import/export, route guard |
| Settings | Billing tab, danger zone, audit/security controls |
| Performance | Real data queries, export/share, benchmark calc |
| Dashboard | PostHog events, live data, user customisation |
| Library | Supabase Storage videos, advanced filters, bookmarks |

Addressing these gaps will align the implementation with the detailed PRD and deliver a fully-featured, production-ready platform. 
