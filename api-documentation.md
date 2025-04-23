# API Documentation

## Overview
This document describes the current API structure and design conventions for the **Next.js** application within our Turborepo.

All API routes live under `apps/web/src/app/api` and follow Next.js file-based routing (`route.ts`). Edge functions under `apps/edge-functions` are being migrated to Next.js API routes.

## Table of Contents
- [Monorepo Structure](#monorepo-structure)
- [Authentication & Authorization](#authentication--authorization)
- [Common Utilities](#common-utilities)
- [API Response Schema](#api-response-schema)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [/api/users](#apiusers)
  - [/api/dashboard](#apidashboard)
  - [/api/planner](#apiplanner)
- [Design Patterns & Best Practices](#design-patterns--best-practices)
- [Pitfalls & Anti-Patterns](#pitfalls--anti-patterns)

## Monorepo Structure
- **Frontend App**: `apps/web` (Next.js, JavaScript/TypeScript)
- **API Routes**: `apps/web/src/app/api`
- **Shared Libraries**: `apps/web/src/lib` (contains `auth.ts`, `roles.ts`, `supabase.ts`)
- **Edge Functions**: `apps/edge-functions` (Deno; not in use and being gradually replaced by Next.js API)

## Authentication & Authorization
- Use `requireAuth()` (in `lib/auth.ts`) at the top of each handler; it returns a `clerkId` or a `NextResponse` (redirect/forbidden).
- Use `getUserRoleData(clerkId)` (in `lib/roles.ts`) to fetch `{ role, coachId?, athleteId? }` directly from the `users.role` column, no longer reading from metadata.
- **RBAC**:
  - **Coach-only**: check `role === 'coach'`
  - **Athlete-only**: check `role === 'athlete'`
  - **Open**: verify `role` existence

## Common Utilities
- `createServerSupabaseClient()`: instantiates Supabase client in server context
- `NextRequest` / `NextResponse`: Next.js types for handlers
- Routes export HTTP methods as functions (e.g., `export async function GET(...)`)

## API Response Schema
All endpoints return JSON in the shape:
```json
{
  "status": "success" | "error",
  "data"?: any,
  "message"?: string
}
```
Use appropriate HTTP status codes.

## Error Handling
- Wrap logic in `try/catch`.
- Log errors: `console.error('[API] <context>:', error)`.
- Return structured errors:
  - **500**: unexpected errors
  - **403**: forbidden / RBAC failures
  - **404**: resource not found
  - Additional 4xx codes for validation when implemented

## Endpoints

### /api/users
#### GET /api/users/profile
- **Auth**: any authenticated user
- **Returns**: `{ id, email, first_name, last_name, username, avatar_url, subscription_status, timezone, metadata }`

#### GET /api/users/status
- **Auth**: any authenticated user
- **Returns**: `{ onboarding_completed, subscription_status }`

### /api/dashboard
#### GET /api/dashboard/exercisesInit
- **Auth**: any authenticated user
- **Purpose**: initialize the dashboard with the latest training session and details

#### POST /api/dashboard/trainingSession
- **Auth**: any authenticated user
- **Body**: `{ exercise_training_session_id, exercisesDetail[] }`
- **Purpose**: start a session

#### PUT /api/dashboard/trainingSession
- **Auth**: any authenticated user
- **Body**: `{ exercise_training_session_id, exercisesDetail[], status? }`
- **Purpose**: save or complete a training session

#### GET /api/dashboard/weeklyOverview
- **Auth**: **coach-only**
- **Returns**: mock weekly statistics (Training Volume, Sessions, Calories, Completed Exercises)

### /api/planner
#### GET /api/planner/exercises
- **Auth**: coach & athlete
- **Returns**: list of exercises with related `exercise_types`, formatted for UI

#### GET /api/planner/mesocycle
- **Auth**: coach-only
- **Returns**: list of mesocycles for the authenticated `coach_id`, ordered by `start_date` desc

#### POST /api/planner/mesocycle
- **Auth**: coach-only
- **Body**: `{ sessions: Array, timezone: string }`
- **Purpose**: create mesocycle and associated groups, presets, details

#### GET /api/planner/mesocycle/[id]
- **Auth**: coach-only
- **Params**: `id`
- **Returns**: full mesocycle details (`group`, `presets`, `presetDetails`)

#### POST /api/planner/microcycle
- **Auth**: coach-only
- **Body**: array of session objects with `group` and `presets`
- **Purpose**: create microcycle (1-week plan)

#### GET /api/planner/microcycle
- **Auth**: coach-only
- **Returns**: list of microcycles (if implemented)

#### GET /api/planner/microcycle/[id]
- **Auth**: coach-only
- **Params**: `id`
- **Returns**: full microcycle details (`microcycle`, `sessions`)

## Design Patterns & Best Practices
- **Single Responsibility**: one route handler per HTTP method/file
- **Reusability**: share auth and role logic in `lib/` modules
- **Consistent Responses**: uniform `status`, `data`, `message` keys
- **Early RBAC**: check roles before any DB operations
- **Logging**: clear, prefixed logs for easier debugging
- **Input Validation**: sanitize and validate `req.json()` on POST/PUT

## Pitfalls & Anti-Patterns
- Avoid overly complex nested logic—break into small helpers
- Never bypass or remove `requireAuth()`
- Do not expose raw DB errors—wrap or sanitize messages
- Avoid code duplication—factor shared logic into utilities
- Watch for Next.js "Cannot access 'function' before initialization"—keep imports at top

---
*This document guides developers and AI to maintain simplicity, security, and consistency across API routes.* 