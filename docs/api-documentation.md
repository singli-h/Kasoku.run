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
  - [/api/plans](#apiplans)
    - [/api/plans/exercises](#apiplansexercises)
    - [/api/plans/mesocycle](#apiplansmesocycle)
    - [/api/plans/microcycle](#apiplansmicrocycle)
    - [/api/plans/preset-groups](#apiplanspreset-groups)
- [Design Patterns & Best Practices](#design-patterns--best-practices)
- [Pitfalls & Anti-Patterns](#pitfalls--anti-patterns)

## Monorepo Structure
- **Frontend App**: `apps/web` (Next.js, JavaScript/TypeScript)
- **API Routes**: `apps/web/src/app/api`
- **Shared Libraries**: `apps/web/src/lib` (contains `auth.ts`, `roles.ts`, `supabase.ts`)
- **Edge Functions**: `apps/edge-functions` (Deno; not in use and being gradually replaced by Next.js API)

## Authentication & Authorization
- Use `requireAuth()` (in `lib/auth.ts`) at the top of each handler; it returns a `clerkId` or a `NextResponse` (redirect/forbidden).
- Use `getUserRoleData(clerkId)` (in `lib/roles.ts`) to fetch `{ role, coachId?, athleteId?, userId }` directly from the `users` table (using `clerk_id` to find the `user_id`).
- **RBAC**:
  - **Coach-only**: check `role === 'coach'`
  - **Athlete-only**: check `role === 'athlete'`
  - **Coach & Athlete**: check `role === 'coach' || role === 'athlete'`
  - **Open**: verify `role` existence if specific roles aren't required but authentication is.

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
  - **400**: bad request / validation errors
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

### /api/plans
#### GET /api/plans/exercises
- **Auth**: coach & athlete
- **Returns**: list of exercises with related `exercise_types`, formatted for UI

#### GET /api/plans/mesocycle
##### GET /api/plans/mesocycle
- **Auth**: coach-only
- **Returns**: list of mesocycles for the authenticated `coach_id`, ordered by `start_date` desc

##### POST /api/plans/mesocycle
- **Auth**: coach-only
- **Body**: `{ sessions: Array, timezone: string }` (among other plan details)
- **Purpose**: create mesocycle and associated groups, presets, details

##### GET /api/plans/mesocycle/[id]
- **Auth**: coach-only
- **Params**: `id` (mesocycle ID)
- **Returns**: full mesocycle details (`group`, `presets`, `presetDetails`)

#### GET /api/plans/microcycle
##### POST /api/plans/microcycle
- **Auth**: coach-only
- **Body**: array of session objects with `group` and `presets` (among other plan details)
- **Purpose**: create microcycle (1-week plan)

##### GET /api/plans/microcycle
- **Auth**: coach-only
- **Returns**: list of microcycles (if implemented)

##### GET /api/plans/microcycle/[id]
- **Auth**: coach-only
- **Params**: `id` (microcycle ID)
- **Returns**: full microcycle details (`microcycle`, `sessions`)

#### GET /api/plans/preset-groups
##### GET /api/plans/preset-groups
- **Auth**: coach & athlete
- **Returns**: List of preset groups for the authenticated user, ordered by `created_at` desc.
- **Query Params (Optional)**: 
  - `name` (string): Filter groups by name (case-insensitive, partial match).
  - *Future: `cycleId`, `cycleType` for filtering by associated cycle.*

##### POST /api/plans/preset-groups
- **Auth**: coach & athlete
- **Body**: `{ name: string, description?: string, date?: string, session_mode?: string, athlete_group_id?: string }`
  - `name` is required.
- **Purpose**: Create a new preset group with initial metadata.
- **Returns**: The created preset group object.

##### GET /api/plans/preset-groups/[id]
- **Auth**: coach & athlete (must own the group)
- **Params**: `id` (preset group ID)
- **Returns**: A single preset group object with its `presets` (including nested `exercises` and `exercise_preset_details`).

##### PUT /api/plans/preset-groups/[id]
- **Auth**: coach & athlete (must own the group)
- **Params**: `id` (preset group ID)
- **Body**: `{ name?: string, description?: string, date?: string, session_mode?: string, athlete_group_id?: string, presets?: Array }`
  - `presets` array contains exercise preset objects with their details. The API will delete existing presets and details for the group and replace them with the provided ones.
- **Purpose**: Update the group metadata and its associated presets and details.
- **Returns**: The updated preset group object.

##### DELETE /api/plans/preset-groups/[id]
- **Auth**: coach & athlete (must own the group)
- **Params**: `id` (preset group ID)
- **Purpose**: Delete a preset group and all its associated presets and details.
- **Returns**: Success or error message.

##### POST /api/plans/preset-groups/[id]/assign-sessions
- **Auth**: coach & athlete (must own the group)
- **Params**: `id` (preset group ID)
- **Purpose**: Assigns the preset group to relevant training sessions (specific logic within handler).
- **Returns**: Success or error message.

## Design Patterns & Best Practices
- **Single Responsibility**: one route handler per HTTP method/file
- **Reusability**: share auth and role logic in `lib/` modules
- **Consistent Responses**: uniform `status`, `data`, `message` keys
- **Early RBAC**: check roles before any DB operations
- **Logging**: clear, prefixed logs for easier debugging
- **Input Validation**: sanitize and validate `req.json()` on POST/PUT (especially required fields).

## Pitfalls & Anti-Patterns
- Avoid overly complex nested logic—break into small helpers
- Never bypass or remove `requireAuth()`
- Do not expose raw DB errors—wrap or sanitize messages
- Avoid code duplication—factor shared logic into utilities
- Watch for Next.js "Cannot access 'function' before initialization"—keep imports at top

---
*This document guides developers and AI to maintain simplicity, security, and consistency across API routes.* 