# Detailed Web Application Workflows & Logic (2025)

This document concisely describes current workflows, data access patterns, and page responsibilities based on the code in `apps/web` (TypeScript/TSX, App Router).

## Stack and global patterns
- Auth: Clerk (App Router). Business logic in server actions; thin API routes only when necessary.
- Data: Supabase Postgres (RLS). Supabase server client in `lib/supabase-server.ts`; Clerk token supplied per request.
- Client data: TanStack Query (no direct Supabase in components). Server components stream where appropriate.
- UI: Tailwind tokens in `app/globals.css`, shadcn/ui primitives, lucide icons.
- Errors: Reusable `ErrorFallback`; `(protected)` routes should be wrapped by an error boundary.
- Forms: React Hook Form + Zod via `components/ui/form`.

## Security & RLS (group scope)
- Model: a coach can manage multiple groups; an athlete belongs to one group.
- Access: presets are group-level; sessions are athlete-tailored. Policies enforce: coaches read/write within their groups; athletes read own group presets and their own sessions.

## Pages and flows
### Marketing Home `/`
- Public landing (features, pricing, about). No auth required.

### Auth `(auth)/sign-in`, `(auth)/sign-up`
- Clerk-hosted components. After sign-in/up, redirect based on onboarding completion (checked via server action/API status endpoint). No `/auth/session` page is used.

### Onboarding `/onboarding`
- Multi-step wizard. Server actions persist data. Use RHF + Zod. Payment step can be deferred for MVP.

### Plans `/plans`
- Tabs for Existing/Templates/Create (MesoWizard). Server actions create presets and (when assigned) sessions. Builder and calendar views exist; edits occur through actions and feature components. There is no dedicated `/preset-groups/[id]/edit` route at present.

### Sessions `/sessions`
- Primary UI: `SprintSessionDashboard` (multi-group sprint management, rounds, and logging). Uses server actions to start, log (batch), and complete sessions. Prioritize this over the older monolithic dashboard.

### Workout `/workout`
- Athlete executes assigned sessions. Uses training-session server actions to start, add set-by-set performance, and complete.

### Athletes `/athletes`
- Coach views roster and groups, performs CRUD via server actions. Route guards ensure only coaches can access.

### Performance `/performance`
- Individual and Comparative tabs. Actions call RPCs to fetch aggregates. Confirm RPCs exist and are indexed; otherwise implement action-based queries.

### Settings `/settings`
- Profile, notifications, and theme. Billing/danger zone optional for MVP.

### Dashboard `/dashboard`
- Aggregated snapshot via server actions with skeleton fallbacks. PostHog instrumentation can be added later.

### Library `/library`
- Exercise list, filters, and details via TanStack Query; CRUD through server actions. Video storage integration can follow.

## Data fetching & caching
- Client: TanStack Query with sensible defaults (lists 5–10m staleTime; dashboards 30–60s; live sessions short). Invalidate targeted keys on mutations.
- Server: add `lib/cache.ts` (LRU) for expensive read aggregations and reference data; do not cache frequently mutated session rows.

## Known gaps to close for MVP
- Finalize group-scoped RLS helpers/policies and indexes.
- Consolidate sessions on `SprintSessionDashboard`; verify mobile UX and batch logging.
- Create/verify performance RPCs (and indexes) or provide action-based alternatives.
- Add `lib/cache.ts` and apply to performance/dashboard reads.
- Ensure remaining forms use RHF + Zod and `(protected)` routes have an error boundary.

---
This document reflects the current codepaths and removes legacy references (SWR, `/auth/session`, REST-only plan flows) in favor of server actions, TanStack Query, and group-scoped RLS.

