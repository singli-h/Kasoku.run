<context>
# MVP 1 – Foundation, Production Readiness, and Comprehensive Standardization

This PRD defines the minimal product to launch with confidence and invite pilot users. It consolidates the current repository state, clarifies gaps, and sets precise implementation standards (RLS, caching, UI/UX, forms, error handling) to stabilize the app.

## Background & Situation

The repo largely follows a clean 2025 stack: Next.js App Router (React 19), Server Actions with a Supabase singleton client authenticated via Clerk, TanStack Query on the client, Tailwind tokens for theming, and lucide icons. Server actions consistently return a canonical `ActionState<T>`.

Gaps and mismatches identified:
- RLS docs mention “organization scope” helpers that don’t exist in code. Actual product uses “groups” (coach can manage many groups; an athlete belongs to exactly one group). RLS must be re-specified for group scope.
- Performance analytics actions call RPCs (`get_comparative_performance_data`, `get_individual_performance_data`) that must exist in DB; verify or implement.
- Sessions have both a legacy monolith (`GroupSessionDashboard`) and a newer sprint multi-group dashboard; ensure one final path and end-to-end persistence.
- Caching: `user-cache` uses `lru-cache`. Docs reference a shared `createCache` that doesn’t exist yet.
- Global error boundary exists; ensure it wraps all `(protected)` routes.
- Forms: great RHF + Zod example (exercise form). Some legacy forms likely still not standardized.

## Concise Page/Feature Overview (Current Behavior, Use Cases, Gaps)

1) Onboarding (`/onboarding`)
- Flow: multi-step wizard (role, details, subscription, completion). Validates, persists via `actions/users/onboarding-actions.ts` and `/api/users/onboard`.
- Use cases: new athlete; new coach.
- Gaps: payment step is stubbed; ensure RHF+Zod everywhere; image upload.

2) Plans (`/plans`)
- Flow: tabs (Existing/Templates/Create via MesoWizard). Presets map to sessions. Plan CRUD lives in actions under `actions/training/*`.
- Use cases: coach drafts group presets; athlete views own assigned plan; coach edits presets.
- Gaps: advanced session planning/bulk ops; complete tests for CRUD.

3) Sessions (`/sessions`)
- Flow: live sprint/group management; new `SprintSessionDashboard` supports multi-group rounds and logging; older `GroupSessionDashboard` monolith still present.
- Use cases: coach runs multi-group sprint, records times per athlete per round; completes session with summary.
- Gaps: finalize one implementation; verify batch logging actions; ensure RLS on writes; optimize mobile table.

4) Workout (`/workout`)
- Flow: start session → log sets → complete; uses `ExerciseProvider` and training-session actions.
- Use cases: athlete executes assigned session; add set-by-set metrics.
- Gaps: video playback source; offline/optimistic not required for MVP.

5) Athletes (`/athletes`)
- Flow: coach views roster, groups, dialogs for CRUD.
- Use cases: manage groups; assign plans.
- Gaps: bulk ops (optional later); route guard checks.

6) Settings (`/settings`)
- Flow: profile and notifications (tabs). Theme toggle present.
- Use cases: update profile; notification prefs; theme.
- Gaps: billing tab; danger zone (not MVP-critical).

7) Performance (`/performance`)
- Flow: Individual/Comparative tabs. Components request RPC-backed analytics.
- Use cases: athlete sees trends; coach benchmarks.
- Gaps: ensure RPCs exist and are indexed; initial data charts acceptable.

8) Dashboard (`/dashboard`)
- Flow: aggregates user snapshot via server actions; action cards; skeletons.
- Gaps: add PostHog events later; MVP fine with static actions.

9) Library (`/library`)
- Flow: exercise search & filters with TanStack Query; CRUD via actions.
- Gaps: Supabase Storage video references; advanced filters optional.

10) Copilot (`/copilot`)
- Flow: UI scaffold exists for chat and conversation list; backend not wired (to be covered in MVP 2).

</context>

<PRD>
# Technical Architecture

## System Components
- Next.js App Router (React 19), Server Components + Server Actions
- Supabase PostgreSQL with RLS; Clerk auth → Supabase via token in `supabase-server.ts`
- Tailwind + tokens in `app/globals.css`; lucide-react icons only
- TanStack Query on client; PostHog analytics; Stripe placeholder

## Data Model (Group-Scoped)
- Users: `users(id INT PK, clerk_id TEXT UNIQUE, role enum, …)`
- Groups: `groups(id INT PK, name, …)`
- Group membership: `group_members(group_id INT, user_id INT, role enum['coach','athlete'], UNIQUE(group_id,user_id))`
- Plans vs Sessions:
  - Presets (group-level plans): `training_presets(id, group_id, …)`
  - Sessions (tailored per athlete): `training_sessions(id, group_id, athlete_id, preset_id, status, …)`

## RLS (Group Scope; replaces organization scope)
Helper functions (security definer) to keep policies fast and readable:
- `app.current_user_id() → users.id`
- `app.is_group_member(group_id) -> boolean`
- `app.is_coach_of_group(group_id) -> boolean`
- `app.is_athlete_of_group(group_id) -> boolean`

Policies (examples):
- Presets (read: all group members; write: coaches)
  - SELECT: `app.is_group_member(group_id)`
  - ALL (write): `app.is_coach_of_group(group_id)` with CHECK same
- Sessions (read: coach sees all; athlete sees own)
  - SELECT: `app.is_coach_of_group(group_id) OR (app.is_athlete_of_group(group_id) AND athlete_id = app.current_user_id())`
  - UPDATE (athlete self-notes only): same condition in USING/CHECK
  - ALL (coach write): `app.is_coach_of_group(group_id)`

Indexes to add: `group_members (group_id, user_id)`, `training_sessions (group_id, athlete_id)`, `training_presets (group_id)`.

## Supabase Usage Pattern
- Server Actions import `supabase` singleton from `lib/supabase-server.ts` (Clerk token via `accessToken()` per request). No client creation in components. ESLint rule enforced.
- Always map Clerk UUID → `users.id` via `lib/user-cache.ts` before DB usage [[memory:3750131]].

## Caching
- Frontend (TanStack Query)
  - Keys: include scope and params (e.g., `['groupPresets', groupId]`, `['session', id]`).
  - `staleTime`: lists 5–10m; dashboards 30–60s; live sessions ~0–5s with optimistic updates.
  - `gcTime`: 30–60m. Use `invalidateQueries` on mutation success.
- Backend (LRU)
  - Add `lib/cache.ts` with `createCache({ ttl: 5m, max: 500 })` and `withCache(key, ttl, fn)` helper.
  - Cache expensive reads (performance aggregates, dashboard DTOs) and reference tables (types, tags, units). Key by user/group and params.
  - Avoid caching frequently-mutated session rows.

## UI/UX Standards (Global)
- Tokens: use CSS vars from `globals.css` for colors; maintain WCAG AA contrast.
- Components: primitives under `components/ui/*`; no bespoke inline styles.
- Icons: lucide only; minimal usage for affordance.
- Error handling: wrap `(protected)` routes with `react-error-boundary` + `ErrorFallback`.
- Forms: RHF + Zod + `components/ui/form` wrappers across all new/legacy forms.

## APIs & Integrations
- API routes are thin, delegating to server actions. Keep streaming/chat for AI out of MVP1.
- Performance analytics: implement required RPCs or replace with action-based queries; index policy columns.

# Development Roadmap

## MVP Scope (Foundation to Pilot)
- RLS group-scope: create helper functions and policies; add indexes.
- Sessions: finalize single sprint dashboard; ensure batch logging and completion flow; mobile UX checks.
- Workout logging: verify `start/update/complete` actions and surfaces; minimal summaries.
- Plans: ensure preset→session assignment flows; CRUD happy path; add unit tests to critical actions.
- Caching: add `lib/cache.ts`; instrument dashboards/performance.
- Forms: standardize remaining forms with RHF+Zod.
- Error boundary: verify global wrapping in `(protected)`.
- Performance RPCs: create or replace with SQL views/queries used by actions; seed minimal data.

## Out of Scope (MVP1)
- Payments (Stripe flows), marketplace, advanced analytics, push notifications, AI features.

# Logical Dependency Chain
1) RLS helpers + indexes → unblock safe reads/writes
2) Session dashboard unification → reliable live logging
3) Workout session actions → minimal execution flow
4) Plans CRUD/test → assign presets and generate sessions
5) Cache helper + perf/dashboard usage → acceptable perf
6) Forms + Error boundaries → consistency and resilience
7) Performance data RPC/views → charts render real data

# Risks and Mitigations
- RPCs missing/slow → implement SQL views with indexes; test on realistic volumes.
- RLS errors → test matrix: athlete vs coach across groups; add integration tests.
- Serverless cache variability → treat cache as best-effort; no correctness reliance.
- Legacy components drift → add lint rules and checklist in PR template.

# Appendix
- Repository docs to reference: `docs/Architecture & Design Cheatsheet.md`, `docs/feature-overview.md`, `apps/web/docs/web-app-detailed.md`, `apps/web/docs/api-documentation.md` (treat older docs as guidance; code is source of truth).

</PRD>

