---
description: End-to-end product, UX, and technical documentation for the Exercise Library feature
globs: apps/web/app/(protected)/library/**, apps/web/components/features/exercise/**
alwaysApply: false
---

- **User Story**
  - **As a** strength coach (primary) or athlete (secondary)
  - **I want** to browse a curated exercise library, surface correct technique guidance, and manage my own custom entries
  - **So that** I can build accurate training plans without re-entering defaults and enforce consistency across my organization

- **Personas & Access**
  - Coach (admin-level permissions) can create, edit, archive, or delete custom exercises scoped to their organization
  - Athlete can view all exercises made available to their org; may optionally create personal custom exercises when allowed by RLS policy
  - Default exercises (seeded by Kasoku) are read-only for every persona
  - Custom exercises are **private** by default - only visible to the creator and their group members

- **Navigation**
  - Route: `/library` (protected). Loaded via server component `apps/web/app/(protected)/library/page.tsx`
  - Layout: `PageLayout` with Suspense -> `<ExerciseLibraryPage />`

- **UI Overview (`ExerciseLibraryPage`)**
  - Search & filters card
  - Results summary + “Add Exercise” button
  - Grid/List toggle with responsive cards
  - Exercise details modal
  - Create/Edit modal (`ExerciseForm`)

- **Data Flow**
  - In Suspense boundary, client component fetches initial data via TanStack Query `exercise-library-initial-data`
  - Server Actions (all in `apps/web/actions/training/exercise-actions.ts`)
    - `getExercisesAction` (includes type, unit, tags join)
    - `getExerciseTypesAction`, `getUnitsAction`, `getTagsAction`
    - Mutations: `createExerciseAction`, `updateExerciseAction`, `deleteExerciseAction`, `addTagsToExerciseAction`, `removeTagsFromExerciseAction`
  - Mutations invalidate the query and re-fetch
  - Supabase client uses Clerk-authenticated singleton (`lib/supabase-server`); RLS enforces per-user/org access

- **Key Feature Rules**
  - Default exercises → no edit/delete UI; actions enforce permission check server-side
  - Custom exercises → full CRUD but scoped to owner organization via RLS
  - **Visibility Model**: Only `global` (default) and `private` (custom) exercises
  - Private exercises are only visible to the creator and their group members
  - Tag & exercise-type creation now managed elsewhere (no UI within library)
  - Import/export functionality removed from UI until productized with audit trail

- **Component Responsibilities**
  - `ExerciseLibraryPage` (client)
    - Local state for filters, view mode, modal toggles
    - Handles query caching, filtering, sorting, basic derived state
    - Renders result cards and binds view/edit/delete handlers
  - `ExerciseCard`
    - Pure presentational; accepts callbacks; respects view mode
  - `ExerciseForm`
    - Zod-backed form for create/edit
    - Loads reference data lazily on open
    - Handles tag assignment via server actions

- **Filtering & Sorting**
  - Filters: search, exercise type, unit
  - Sorting fields: name (default), type, created order (id proxy)
  - In-memory filtering on already-fetched data; future optimization includes server-side filtered queries

- **Error Handling & Toasts**
  - TanStack Query surfaces fetch errors → red error card
  - Mutations show success/error toasts (`useToast`)

- **Permission Logic**
  - "Add Exercise" button visible to all, but server actions rely on Clerk auth & Supabase RLS; unauthorized operations return error toast
  - Default exercise detection currently derived from absence of `owner_user_id`; TODO: surface in UI to hide edit/delete cascaded
  - Custom exercises automatically set `owner_user_id` and `visibility: 'private'` on creation
  - Only exercises with matching `owner_user_id` can be updated/deleted

- **E2E Workflow Scenarios**
  - Browse & watch demo: search/filter → open card → view detail modal → watch video CTA (future streaming integration)
  - Create custom exercise: click `Add Exercise` → fill form (type, unit, optional tags/video) → submit → optimistic toast + refresh
  - Edit custom exercise: open card actions → `Edit` → modify fields/tags → submit
  - Delete custom exercise: card action `Delete` with toast confirmation → list refresh

- **Known Gaps / Backlog**
  - Distinguish default vs. custom exercise in UI (badge, disable actions)
  - Bulk tag assignment & tag creation flows when reintroduced
  - Video playback integration (currently placeholder button)
  - Pagination / infinite scroll for large libraries
  - Audit logs for destructive actions

- **Testing Considerations**
  - Unit coverage on filtering/sorting logic (future extraction)
  - Integration tests spanning create/edit/delete via Playwright (pending RLS test harness)
  - Supabase row-level tests validating default exercise immutability

- **Related Docs & References**
  - [Supabase integration](mdc:apps/web/docs/integrations/supabase-integration.md)
  - [Clerk authentication](mdc:apps/web/docs/integrations/clerk-authentication.md)

