# Kasoku.run Development Guide for AI Assistants

> **Last Updated**: 2025-10-25
> **Project**: Kasoku.run - AI-Powered Training Platform
> **Stack**: Next.js 15 + Supabase + Clerk + TypeScript

---

## Quick Start

**Kasoku.run** is a training management platform for coaches and athletes built with:
- Next.js 15 (App Router) + TypeScript (strict mode)
- Supabase (PostgreSQL) + Clerk (Auth)
- Turborepo monorepo, primary app at `apps/web/`

**Documentation**: Comprehensive docs exist at `apps/web/docs/` - ALWAYS check there first:
- `docs/architecture/` - System design, component patterns
- `docs/security/` - RLS policies, auth patterns
- `docs/development/` - API design, performance, loading patterns
- `docs/integrations/` - Clerk, Supabase setup guides
- `docs/features/` - Product requirements, feature specs

**Key Principle**: This CLAUDE.md contains architectural decisions, non-obvious patterns, and common pitfalls. Detailed implementation examples live in the docs folder.

---

## Common Commands

**Development:**
- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

**Testing:**
- `npm test` - Run all tests
- `npm test -- --coverage` - Run with coverage report
- `npm test -- --watch` - Watch mode for development

**Database:**
- `npx supabase gen types typescript --project-id pcteaouusthwbgzczoae` - Generate DB types

**FORBIDDEN:**
- `npm install` in CI (use `npm ci` instead)
- Direct database migrations (use Supabase dashboard or migration files)
- Committing `.env.local` files

---

## Critical Rules

**NEVER:**
- Use `any` types (use `unknown` if type is truly dynamic, then narrow with type guards)
- Skip authentication checks in server actions
- Create API routes for CRUD operations (use server actions)
- Hardcode mock/default data as fallbacks
- Return raw database errors to client
- Disable RLS without explicit security review

**ALWAYS:**
- Start server actions with `const { userId } = await auth()` check
- Return `ActionState<T>` from all server actions
- Validate input with Zod at boundaries (forms, APIs)
- Log errors with context before returning: `console.error('[actionName]', error)`
- Revalidate paths after mutations: `revalidatePath('/path')`
- Use explicit type annotations (no implicit `any`)

**REQUIRED:**
- Type safety: Define proper interfaces/types
- Error handling: Try-catch with ActionState return
- Auth checks: Both authentication AND authorization
- RLS filters: Add explicit `.eq('user_id', dbUserId)` even though RLS auto-filters

---

## Table of Contents
1. [Core Architectural Decisions](#core-architectural-decisions)
2. [Critical Patterns (MUST Follow)](#critical-patterns-must-follow)
3. [Anti-Patterns (NEVER Do)](#anti-patterns-never-do)
4. [Error Resolution Workflow](#error-resolution-workflow)
5. [Project Structure & Organization](#project-structure--organization)
6. [Authentication & Security](#authentication--security)
7. [Database & Backend](#database--backend)
8. [Type Safety & Validation](#type-safety--validation)
9. [Component Development](#component-development)
10. [Known Issues & Technical Debt](#known-issues--technical-debt)
11. [When to Ask for Clarification](#when-to-ask-for-clarification)

---

## Core Architectural Decisions

### Why These Patterns Exist

**1. Server Actions Over API Routes**
- **Decision**: Use server actions for ALL data mutations, API routes ONLY for webhooks
- **Why**: Type safety, no CORS, automatic serialization, better DX
- **Exception**: Stripe/Clerk webhooks, external integrations
- **See**: `docs/development/api-architecture.md`

**2. ActionState Discriminated Union**
- **Decision**: ALL server actions return `ActionState<T>`
- **Why**: Type-safe error handling, consistent API, eliminates try-catch in client
- **Never**: Return raw data or throw errors from server actions
- **Location**: `types/api.ts`

**3. Clerk + Supabase JWT Flow**
- **Decision**: Singleton server client with fresh JWT per request, LRU cache for user ID mapping
- **Why**: Security (fresh tokens), performance (cached lookups), Clerk-first architecture
- **Caveat**: Cache is process-local in serverless (cold starts = cache miss)
- **See**: `docs/integrations/clerk-authentication.md`, `docs/security/rbac-implementation.md`

**4. Server Components by Default**
- **Decision**: Use server components unless you need interactivity
- **Why**: Better performance, SEO, less client JS
- **When to use 'use client'**: Hooks, event handlers, browser APIs, context consumers
- **Loading**: Prefer Suspense + loading.tsx over client-side loading states

**5. Feature-Based Component Organization**
- **Decision**: Components organized by feature in `components/features/[feature]/`
- **Why**: Co-location of related logic, easier to reason about, scales better
- **Pattern**: Each feature has its own components/, hooks/, types.ts, context.tsx
- **See**: `docs/architecture/component-architecture.md`

**6. Row Level Security (RLS) First**
- **Decision**: All tables have RLS policies, queries filtered automatically
- **Why**: Defense in depth, prevents data leaks even if application logic fails
- **Still Required**: Application-level auth checks for better error messages
- **Exception**: `memories` table (RLS disabled for AI operations) - use extreme caution
- **See**: `docs/security/row-level-security-analysis.md`

**7. Type Safety Everywhere**
- **Decision**: Strict TypeScript, no `any` types allowed
- **Why**: Catch bugs at compile time, better IDE support, self-documenting
- **Pattern**: Database types in `types/database.ts`, feature types in `types/[feature].ts`
- **Validation**: Zod schemas for runtime validation at boundaries

**8. Monorepo with Turborepo**
- **Decision**: Single repo, future-ready for mobile app, shared packages
- **Why**: Code sharing, atomic changes, easier refactoring
- **Current State**: Only `apps/web/` exists, structure ready for expansion

---

## Critical Patterns (MUST Follow)

### 1. Server Actions with ActionState

**Pattern**: ALL server actions return `ActionState<T>` discriminated union

```typescript
// Type: types/api.ts
export type ActionState<T> =
  | { isSuccess: true; message: string; data: T }
  | { isSuccess: false; message: string; data?: never }

// Template
export async function myAction(input: Input): Promise<ActionState<Output>> {
  try {
    const { userId } = await auth()
    if (!userId) return { isSuccess: false, message: 'Not authenticated' }

    const dbUserId = await getDbUserId(userId)
    const { data, error } = await supabase.from('table').insert(...).select().single()

    if (error) {
      console.error('[myAction] DB error:', error)
      return { isSuccess: false, message: 'Failed to create' }
    }

    revalidatePath('/path')
    return { isSuccess: true, message: 'Success', data }
  } catch (error) {
    console.error('[myAction]:', error)
    return { isSuccess: false, message: error instanceof Error ? error.message : 'Unknown' }
  }
}
```

**Why**: Type-safe errors, no client try-catch needed, consistent API
**See**: `actions/plans/plan-actions.ts`

### 2. Authentication Flow

**Pattern**: Always use Clerk → DB user ID flow with caching

```typescript
import { auth } from '@clerk/nextjs/server'
import { getDbUserId } from '@/lib/user-cache' // LRU cached lookup
import { supabase } from '@/lib/supabase-server' // Singleton with JWT

const { userId } = await auth() // Clerk ID
const dbUserId = await getDbUserId(userId) // Database user.id (cached)
```

**Auth helpers** available at `actions/auth/auth-helpers.ts`:
- `isAuthenticatedAction()` - Check auth
- `hasRoleAction('coach' | 'athlete' | 'admin')` - Check role
- `isCoachAction()`, `isAthleteAction()` - Convenience methods

**Why**: Separation of auth provider (Clerk) from app database, performance via caching
**See**: `docs/integrations/clerk-authentication.md`

### 3. Server vs Client Components

**Default to server components**, use `'use client'` only when:
- React hooks (useState, useEffect, useContext, etc.)
- Event handlers (onClick, onChange, onSubmit, etc.)
- Browser APIs (window, localStorage, etc.)
- Third-party libraries that require client (charts, editors, etc.)

**Loading**: Prefer `<Suspense>` boundaries over client-side loading states
**See**: `docs/development/loading-patterns.md`

### 4. Component Organization

```
components/
├── ui/              # shadcn/ui primitives ONLY (Button, Card, Dialog, etc.)
├── features/        # Business logic, organized by feature
│   ├── plans/
│   │   ├── components/  # Plan-specific components
│   │   ├── hooks/       # usePlanData, etc.
│   │   └── types.ts     # Plan component types
│   ├── athletes/
│   └── sessions/
├── layout/          # App structure (Sidebar, Header, etc.)
└── utilities/       # Shared utilities (ErrorBoundary, etc.)
```

**Never**: Put business logic in `ui/`, it's for primitives only
**See**: `docs/architecture/component-architecture.md`

### 5. Database Queries

**Server-side** (preferred):
```typescript
import { supabase } from '@/lib/supabase-server' // Singleton
const { data, error } = await supabase.from('table').select('*')
```

**Client-side** (when needed for real-time, optimistic updates):
```typescript
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { useAuth } from '@clerk/nextjs'

const { getToken } = useAuth()
const supabase = createClientSupabaseClient(getToken) // Factory, not singleton
```

**RLS auto-applied**: All queries filtered by policies, but still add explicit filters for clarity
**Exception**: `memories` table has RLS disabled - ALWAYS validate access in application code

### 6. Type Safety

**Never use `any`** - define proper types:
- Database types: `types/database.ts`
- API types: `types/api.ts`
- Feature types: `types/[feature].ts` or `components/features/[feature]/types.ts`

**Runtime validation**: Use Zod schemas at boundaries (form inputs, API responses)

### 7. Error Handling

**Server actions**: Return error in ActionState, log with context
**Client**: Check `isSuccess`, show user-friendly messages via toast/alert
**Always log**: `console.error('[functionName] Context:', error)`

### 8. Cache Revalidation

**After mutations**, revalidate affected paths:
```typescript
import { revalidatePath } from 'next/cache'

revalidatePath('/plans')
revalidatePath(`/plans/${id}`)
```

---

## Anti-Patterns (NEVER Do)

### 🚫 1. Never Use `any` Types
```typescript
// ❌ DON'T
const data: any = await fetchData()

// ✅ DO
const data: DataType = await fetchData()
// OR if truly unknown:
const data: unknown = await fetchData()
if (isDataType(data)) { /* use data */ }
```

### 🚫 2. Never Mix Data Fetching Patterns
```typescript
// ❌ DON'T: useEffect + server actions in client component
'use client'
useEffect(() => { fetchData() }, [])

// ✅ DO: Server component
export default async function Page() {
  const result = await getDataAction()
  return <div>{result.data}</div>
}

// ✅ OR: React Query for real-time updates
const { data } = useQuery({ queryKey: ['data'], queryFn: getDataAction })
```
**Fix existing**: `components/features/plans/home/PlansHome.tsx`

### 🚫 3. Never Hardcode Mock/Default Data
```typescript
// ❌ DON'T
const volume = data?.volume || [5, 6, 7, 5]

// ✅ DO
if (!data?.volume || data.volume.length === 0) {
  return <EmptyState message="No data" />
}
```
**Fix existing**: `PlansHome.tsx`, `PlanWorkspace.tsx`

### 🚫 4. Never Skip Authentication
```typescript
// ❌ DON'T
export async function deleteData(id: number) { ... }

// ✅ DO
export async function deleteData(id: number): Promise<ActionState<void>> {
  const { userId } = await auth()
  if (!userId) return { isSuccess: false, message: 'Not authenticated' }
  ...
}
```

### 🚫 5. Never Create API Routes for CRUD
```typescript
// ❌ DON'T: app/api/plans/route.ts
export async function POST(req: Request) { ... }

// ✅ DO: actions/plans/plan-actions.ts
export async function createPlanAction(...): Promise<ActionState<Plan>> { ... }
```
**Exception**: Webhooks, file uploads, external APIs only

### 🚫 6. Never Forget Cache Revalidation
```typescript
// ❌ DON'T
await supabase.from('table').update(...)
return { isSuccess: true, data }

// ✅ DO
await supabase.from('table').update(...)
revalidatePath('/path')
return { isSuccess: true, data }
```

### 🚫 7. Never Over-Select Data
```typescript
// ❌ DON'T
.select('*')

// ✅ DO
.select('id, name, created_at')
```

### 🚫 8. Never Silence Errors
```typescript
// ❌ DON'T
catch (error) {
  return { isSuccess: false, message: 'Failed' }
}

// ✅ DO
catch (error) {
  console.error('[actionName]:', error)
  return { isSuccess: false, message: error instanceof Error ? error.message : 'Failed' }
}
```

### 🚫 9. Never Return Raw Errors
```typescript
// ❌ DON'T
return { isSuccess: false, message: error.message } // May expose DB details

// ✅ DO
console.error('[action] Full error:', error) // Log everything
return { isSuccess: false, message: 'Failed to create resource' } // Generic message
```

### 🚫 10. Never Put Business Logic in `ui/`
```typescript
// ❌ DON'T: components/ui/button.tsx with data fetching

// ✅ DO: components/features/plans/CreatePlanButton.tsx
```

---

## Error Resolution Workflow

**When you encounter errors, fix in this order:**

1. **Type Errors** → `npm run type-check`
   - Fix TypeScript compilation errors first
   - They often cascade and cause other issues

2. **Linting Errors** → `npm run lint`
   - Fix ESLint warnings/errors
   - Auto-fix with `npm run lint -- --fix`

3. **Test Failures** → `npm test`
   - Run tests after type/lint fixes
   - Ensure business logic still works

4. **Build Errors** → `npm run build`
   - Final check before deployment
   - Catches production-only issues

**Before creating PR:**
```bash
npm run type-check && npm run lint && npm test && npm run build
```

---

## Project Structure & Organization

### Key Directories

```
apps/web/
├── app/
│   ├── (protected)/       # Auth-required routes: /dashboard, /plans, /athletes, /sessions
│   ├── (marketing)/       # Public routes: /, /pricing, /about
│   └── api/               # Webhooks ONLY (Stripe, Clerk)
├── actions/               # Server actions (primary data layer)
│   ├── plans/plan-actions.ts
│   ├── athletes/athlete-actions.ts
│   └── auth/auth-helpers.ts
├── components/
│   ├── ui/                # shadcn/ui primitives (Button, Card, Dialog, etc.)
│   ├── features/          # Business logic (plans/, athletes/, sessions/)
│   └── layout/            # App structure (Sidebar, Header)
├── lib/
│   ├── supabase-server.ts    # Singleton server client
│   ├── supabase-client.ts    # Client factory
│   └── user-cache.ts          # Clerk ID → DB ID cache
├── types/
│   ├── api.ts                 # ActionState, API types
│   ├── database.ts            # Database table types
│   └── training.ts            # Domain types (Macrocycle, etc.)
└── docs/                      # Comprehensive documentation (READ FIRST)
```

### File Naming Conventions

- **Components**: PascalCase (`PlanCard.tsx`, `AthleteList.tsx`)
- **Actions**: kebab-case with `-actions` suffix (`plan-actions.ts`, `athlete-actions.ts`)
- **Types**: kebab-case (`database.ts`, `training.ts`, `api.ts`)
- **Utils**: kebab-case (`date-utils.ts`, `format-utils.ts`)
- **Tests**: Same name + `.test.ts` (`plan-actions.test.ts`)

### Import Patterns

**Use path alias** `@/` for all imports:
```typescript
import { Button } from '@/components/ui/button'
import { createMacrocycleAction } from '@/actions/plans/plan-actions'
import type { ActionState } from '@/types/api'
```

**Import order** (enforced by linter):
1. React/Next.js imports
2. Third-party libraries
3. Internal absolute imports (`@/`)
4. Relative imports (`./`, `../`)
5. Type imports last

---

## Authentication & Security

### Clerk + Supabase Flow

**Pattern**: Clerk handles auth, Supabase uses JWT for RLS
```typescript
// Server-side (lib/supabase-server.ts)
const supabase = createClient(url, key, {
  async accessToken() {
    return (await auth()).getToken() // Fresh JWT every request
  }
})

// In actions
const { userId } = await auth() // Clerk user ID
const dbUserId = await getDbUserId(userId) // Database user.id (cached)
```

**Why fresh tokens**: Security (never cached), RLS policies work correctly
**Why cache user ID**: Performance (reduces DB queries), serverless-safe with TTL

### Row Level Security (RLS)

**All tables protected** except `memories` (AI operations - validate manually)

**Pattern**: RLS auto-filters queries, but add explicit filters for clarity
```typescript
// RLS will filter this, but be explicit
const { data } = await supabase
  .from('macrocycles')
  .select('*')
  .eq('user_id', dbUserId) // Explicit filter
```

**See**: `docs/security/row-level-security-analysis.md` for full policy details

### Authorization Patterns

**Check ownership before mutations**:
```typescript
// Verify user owns resource before update/delete
const { data: resource } = await supabase
  .from('table')
  .select('user_id')
  .eq('id', resourceId)
  .single()

if (resource?.user_id !== dbUserId) {
  return { isSuccess: false, message: 'Unauthorized' }
}
```

**Role-based access**: Use auth helpers from `actions/auth/auth-helpers.ts`

---

## Database & Backend

### Supabase Setup

**Project ID**: pcteaouusthwbgzczoae (Sprint Dev)
**Region**: eu-west-2
**PostgreSQL**: 15.8.1

**Core Tables** (see `docs/` for full schema):
- **Identity**: users, athletes, coaches, athlete_groups
- **Training**: macrocycles, mesocycles, microcycles
- **Exercises**: exercises, exercise_types, exercise_preset_groups, exercise_training_sessions
- **AI** (infrastructure ready, not implemented): memories, embeddings

### Query Patterns

**Basic query**:
```typescript
const { data, error } = await supabase
  .from('table')
  .select('id, name, created_at')
  .eq('user_id', dbUserId)
  .order('created_at', { ascending: false })
  .limit(10)
```

**Complex join**:
```typescript
const { data } = await supabase
  .from('exercise_training_sessions')
  .select(`
    *,
    athlete:athletes(id, user:users(first_name, last_name)),
    exercise_preset_group:exercise_preset_groups(
      id,
      exercise_presets(exercise:exercises(name), exercise_preset_details(*))
    )
  `)
```

**Avoid**: `select('*')` when you only need specific fields
**See**: `docs/integrations/supabase-integration.md` for advanced patterns

---

## Type Safety & Validation

### TypeScript Configuration

**Strict mode enabled** - Never use `any`, always define types

**Type locations**:
- `types/database.ts` - Database table types
- `types/api.ts` - ActionState, API response types
- `types/training.ts` - Domain types (Macrocycle, Mesocycle, etc.)
- `types/[feature].ts` - Feature-specific types
- `components/features/[feature]/types.ts` - Component prop types

### Zod for Runtime Validation

**Use at boundaries** (form inputs, external APIs):
```typescript
const formSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(120).optional(),
})

type FormData = z.infer<typeof formSchema>

// In server action
const validation = formSchema.safeParse(input)
if (!validation.success) {
  return { isSuccess: false, message: validation.error.errors[0].message }
}
```

**Why**: Type safety at compile time + runtime validation at boundaries

---

## Component Development

### shadcn/ui

**Install components**: `npx shadcn@latest add [component-name]`
**Location**: `components/ui/`
**Customize**: Use `className` prop with Tailwind, `cn()` utility for conditional classes

### Forms

**Stack**: React Hook Form + Zod + shadcn Form components

**Pattern**:
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const form = useForm({
  resolver: zodResolver(formSchema),
  defaultValues: { ... }
})

async function onSubmit(values: FormValues) {
  const result = await myAction(values)
  if (result.isSuccess) {
    toast.success(result.message)
    form.reset()
  } else {
    toast.error(result.message)
  }
}
```

### Styling

**Tailwind** - Mobile-first, use breakpoints: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
**Design Tokens**: Defined in `tailwind.config.ts`
**See**: `docs/design/design-system-overview.md` for full design system

---

## Known Issues & Technical Debt

### Recent Fixes (October 25, 2025) ✅

**UI/UX Improvements - All Resolved**
1. **Mesocycle Ordering**: Fixed chronological display in plan workspace
2. **Toolbar Alignment**: Corrected session planner toolbar positioning
3. **Duplicate Headers**: Removed duplicate "Training Plans" header
4. **Plan Creation Flow**: Fixed wizard navigation (`onNext` undefined error)
5. **Type Safety**: Resolved TypeScript errors in actions layer

**Files Modified**: `plan-actions.ts`, `athlete-actions.ts`, `plan-assignment-actions.ts`, `Toolbar.tsx`, `PlansHomeClient.tsx`, `plan-type-selection.tsx`

**Documentation**: See `docs/changelog/2025-10-25-ui-bug-fixes.md`

---

### Critical Gaps (High Priority)

**1. Error Boundary Missing**
- **Location**: `components/error-boundary/` (empty directory in git status)
- **Impact**: No graceful error recovery, app crashes propagate to user
- **Action**: Implement global error boundary with fallback UI
- **Priority**: CRITICAL

**2. AI Integration Incomplete**
- **Status**: Database infrastructure ready (memories, embeddings tables), NO implementation
- **Impact**: Core product differentiator missing
- **Tables**: `memories` (RLS disabled), `embeddings` (pgvector enabled)
- **Action**: Implement AI backend + UI components
- **Priority**: CRITICAL - PRODUCT

**3. Payment Processing Incomplete**
- **Status**: Stripe SDK installed, webhook handlers exist but incomplete
- **Location**: `app/api/stripe/webhooks/route.ts` has TODO comments
- **Impact**: Cannot monetize platform
- **Action**: Complete Stripe subscription workflow
- **Priority**: CRITICAL - REVENUE

### Code Quality Issues (Medium Priority)

**4. ~~Type Safety Gaps~~ ✅ RESOLVED (Oct 25, 2025)**
- ~~Location: `components/features/plans/workspace/PlanWorkspace.tsx`~~
- ~~Problem: Uses `any[]` for mesocycles, events~~
- **Fixed**: Resolved type safety issues in athlete-actions, plan-actions, plan-assignment-actions

**5. ~~Mixed Data Fetching Patterns~~ ✅ RESOLVED (Previous)**
- ~~Location: `components/features/plans/home/PlansHome.tsx`~~
- **Fixed**: Refactored to server component pattern (see previous updates)

**6. ~~Hardcoded Mock Data~~ ✅ RESOLVED (Previous)**
- ~~Locations: `PlansHome.tsx`, `PlanWorkspace.tsx`~~
- **Fixed**: Removed mock data, implemented proper data fetching

**7. Incomplete Features (TODOs)**
- Search codebase for `// TODO:` comments
- Multiple files have unfinished implementations
- **Priority**: Catalog and prioritize

### Performance Considerations

**8. LRU Cache Serverless Limitation**
- **Location**: `lib/user-cache.ts`
- **Issue**: Process-local cache, not shared across lambda instances
- **Impact**: Cold starts = empty cache = database hit
- **Solution**: Acceptable for current scale, consider Redis if needed
- **Documented**: Not mentioned in cache usage locations

**9. Query Optimization Needed**
- **Problem**: Over-fetching with `select('*')`, no pagination in some lists
- **Action**: Audit queries, add pagination, select specific fields

### Security Notes

**10. Memory Table RLS Disabled**
- **Table**: `memories`
- **Reason**: AI operations need cross-user access
- **Risk**: Application-level validation REQUIRED
- **Current**: No documented access control patterns
- **Action**: Document and implement access validation

### Testing Gaps

**11. Minimal Test Coverage**
- **Status**: Infrastructure ready (Jest, Playwright), few tests exist
- **Location**: `__tests__/` directories sparse
- **Action**: Write tests for critical paths (auth, payments, data mutations)

**12. No E2E Tests**
- **Status**: Playwright configured, no scenarios written
- **Action**: Implement E2E test suite for critical user flows

---

## When to Ask for Clarification

**ALWAYS ask the user** before:

### 1. Architectural Changes
- Changing core patterns (ActionState, auth flow, component organization)
- Adding new libraries or frameworks
- Modifying database schema (tables, columns, RLS policies)
- Changing build configuration (Turborepo, Next.js config)

### 2. Breaking Changes
- Renaming widely-used functions/types
- Changing ActionState return types
- Modifying API contracts between server actions and clients
- Removing existing features or endpoints

### 3. Security & Privacy
- Disabling RLS policies
- Exposing new data to unauthenticated users
- Adding new API endpoints
- Changing authentication/authorization logic

### 4. Multiple Valid Approaches
- **Example**: "Should I use server component + Suspense or client component + React Query for this data fetching?"
- **Example**: "Should this be a new table or a column on existing table?"
- **Example**: "Implement as modal or separate page?"

### 5. Ambiguous Requirements
- User says "fix the plans page" but there are multiple issues
- Request is vague: "make it faster" (optimize what specifically?)
- Conflicting patterns in existing code (which one to follow?)

### 6. Technical Debt Decisions
- **Example**: "Should I fix the existing anti-pattern in PlansHome.tsx while implementing this feature?"
- **Example**: "This component has hardcoded mock data. Should I remove it or work around it?"

**Propose recommended approach** with tradeoffs, then ask user to confirm before implementing.

---

## Quick Reference

### Key Commands

```bash
# Development
npm run dev                    # Start dev server (port 3000)
npm run build                  # Production build
npm run lint                   # ESLint check
npm run type-check            # TypeScript check

# Testing
npm test                       # Run tests
npm test -- --coverage        # With coverage

# Database
npx supabase gen types typescript --project-id pcteaouusthwbgzczoae
```

### Critical Files

| Purpose | Location |
|---------|----------|
| Server actions example | `actions/plans/plan-actions.ts` |
| Auth helpers | `actions/auth/auth-helpers.ts` |
| Server Supabase client | `lib/supabase-server.ts` |
| Client Supabase factory | `lib/supabase-client.ts` |
| User ID cache | `lib/user-cache.ts` |
| ActionState type | `types/api.ts` |
| Database types | `types/database.ts` |

### Documentation Map

| Need | Read |
|------|------|
| Component patterns | `docs/architecture/component-architecture.md` |
| API design | `docs/development/api-architecture.md` |
| Loading states | `docs/development/loading-patterns.md` |
| RLS policies | `docs/security/row-level-security-analysis.md` |
| Clerk setup | `docs/integrations/clerk-authentication.md` |
| Supabase patterns | `docs/integrations/supabase-integration.md` |
| Design system | `docs/design/design-system-overview.md` |

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://pcteaouusthwbgzczoae.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>  # Server-side only

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<key>
CLERK_SECRET_KEY=<secret>
CLERK_WEBHOOK_SECRET=<webhook_secret>

# Stripe
STRIPE_SECRET_KEY=<secret>
STRIPE_WEBHOOK_SECRET=<webhook_secret>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<key>
```

---

## How to Use This Guide

1. **Start here** for architectural decisions and critical patterns
2. **Check docs/** for detailed implementation examples
3. **Follow anti-patterns list** to avoid common mistakes
4. **Reference Known Issues** to understand existing technical debt
5. **Ask for clarification** when requirements are ambiguous

**This file is a living document** - update it when architectural decisions change or new patterns emerge.

---

**Last Updated**: 2025-10-24
**Maintainer**: Development Team
**Version**: 2.0.0 (Streamlined)

