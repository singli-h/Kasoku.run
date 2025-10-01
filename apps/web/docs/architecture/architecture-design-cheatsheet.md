# Kasoku Running Website – Architecture & Design Cheatsheet

*"What's in the box, why it's there, and where we still need to tighten the bolts"*

---

## 1. UI / UX FOUNDATION

### Design Primitives
- **Radix UI primitives** (`@radix-ui/react-*`) everywhere – **single source of truth for behaviour**
- **shadcn/ui layer** in `components/ui/` wraps Radix with Tailwind styling → **uniform look-and-feel**
- **Icon sets**: `lucide-react` (primary) + `@radix-ui/react-icons` for a handful of table buttons – **two icon systems; consider converging on lucide**

### Motion & Micro-interactions
- Heavy use of `framer-motion` (wizard steps, dashboards, landing, etc.)

### Charts
- Internal `components/ui/chart.tsx` wraps **Recharts** → consistent API for all charts

### Forms & Validation
- Thin global wrapper `components/ui/form.tsx` (Radix + Tailwind)
- `react-hook-form` + `zod` resolver used in some complex forms (e.g. ExerciseForm); many other forms still unmanaged ⇒ **gap**

### Loading / Skeletons
- Generic `components/ui/skeleton.tsx` plus feature-specific skeletons (dashboard, onboarding)

### Notifications
- Unified toast hook (`hooks/use-toast.ts`) backed by **sonner**; hundreds of calls use the same signature → ✅ **consistent**

---

## 2. STATE, DATA-FETCH & CACHING

- **TanStack Query** wired via `QueryProvider` (client side). Server components stream data → React 18 + Suspense
- **Server-side caching**: mandated utility `createCache` (quick-lru wrapper); search shows no direct `quick-lru` usage yet → cache layer is ready but under-utilised
- No Redux/Zustand/SWR present – good single-lib policy

---

## 3. AUTH & SECURITY

### Auth Provider
- **Clerk** (`@clerk/nextjs`)
  - Middleware forces onboarding completion
  - Server actions start with `auth()` helper

### Data Store
- **Supabase Postgres** (row-level security)
  - Pattern enforced by rules: Singleton `supabase` client + Clerk auth → RLS isolation
  - Repo still contains a few legacy `createClientSupabaseClient` usages in client pages (e.g. sprint dashboard) that bypass the new pattern → needs refactor

---

## 4. SERVER ACTION CONVENTION

- Domain-based folders under `apps/web/actions/*`
- All actions return the canonical `ActionState<T>` union (centralised in `types/server-action-types.ts`) → **standardised success/error handling**
- Try/catch with toast fallback on the front-end; no global error-boundary yet (only an ad-hoc one in Mesowizard) ⇒ should add an app-level ErrorBoundary

---

## 5. FILE & COMPONENT ORGANISATION

### Three-layer Rule (Held Consistently)
1. `lib/` – infra only (`supabase-server.ts`, `stripe.ts`, cache, utils)
2. `actions/` – business logic with auth + RLS
3. `app/api/` – thin wrappers (Clerk webhook, Stripe webhooks, user onboard)

### React Components
- `components/ui/` (primitive), `components/composed/` (compound), `components/features/<domain>/` (feature bundles)
- Pages mounted under `(protected)/(marketing)/(auth)` layouts → clear routing context

---

## 6. SUPPORTING SERVICES

- **Analytics**: PostHog client/provider with auto page-view + user identification
- **Payment**: Stripe server files exist but checkout step in onboarding is still a stub
- **Linting rules**: custom ESLint plugin `apps/web/eslint-rules/*` enforces "no direct Supabase in components", "no re-create supabase client", naming conventions

---

## 7. CONSISTENCY & REDUNDANCY SCORECARD

✅ **Single animation lib** (framer-motion)  
✅ **Single data-query lib** (TanStack)  
✅ **Single notification pattern** (toast/sonner)  
✅ **Single auth layer** (Clerk)  
⚠️ **Two icon libraries** (lucide + radix-icons) – pick one  
⚠️ **Quick-lru present but caching rarely used**  
⚠️ **Mixed form validation** – migrate all to RHF + Zod  
⚠️ **Some client pages still spin up their own Supabase client** – migrate to server actions or edge helpers  
⚠️ **Only a few feature-level ErrorBoundaries** – extract global boundary

---

## 8. MANDATORY REQUIREMENTS & STANDARDS

### 8.1 Icon System Standardization
**REQUIREMENT**: Use **lucide-react** exclusively for all icons
- **Remove**: `@radix-ui/react-icons` imports
- **Replace**: All radix icon imports with equivalent lucide icons
- **Pattern**: `import { IconName } from "lucide-react"`
- **Rationale**: Single icon library reduces bundle size and ensures consistency

### 8.2 LRU Cache Implementation
**REQUIREMENT**: Implement LRU cache following clean best practices when available
- **Use**: `createCache` utility (quick-lru wrapper) for expensive operations
- **Apply to**: Library queries, performance charts, dashboard data
- **Pattern**: 
  ```typescript
  import { createCache } from "@/lib/cache"
  const cache = createCache()
  ```
- **TTL**: 5 minutes default, max 100-1000 entries based on cache class
- **Rationale**: Reduces database load and improves performance

### 8.3 Form Validation Standardization
**REQUIREMENT**: Migrate all forms to React Hook Form + Zod
- **Current**: Mixed validation (some RHF+Zod, some uncontrolled)
- **Target**: All forms use `react-hook-form` + `zodResolver`
- **Pattern**:
  ```typescript
  import { useForm } from "react-hook-form"
  import { zodResolver } from "@hookform/resolvers/zod"
  import * as z from "zod"
  ```
- **Apply to**: Onboarding, settings, athlete forms, plan creation
- **Rationale**: Consistent validation, better UX, type safety

### 8.4 Supabase Usage Guidelines
**REQUIREMENT**: Follow `@supabase-client.ts` and `@supabase-server.ts` and `@user-cache.ts` guidelines

#### Server Actions (Primary Pattern)
```typescript
import supabase from "@/lib/supabase-server"
import { auth } from "@clerk/nextjs/server"

export async function someAction(): Promise<ActionState<T>> {
  const { userId } = await auth()
  if (!userId) return { isSuccess: false, message: "Not authenticated" }
  
  // Use supabase singleton - DO NOT create new clients
  const { data, error } = await supabase.from('table').select('*')
}
```

#### Client Components (Limited Use)
```typescript
import { createClientSupabaseClient } from "@/lib/supabase-client"
import { useAuth } from "@clerk/nextjs"

export function SomeComponent() {
  const { getToken } = useAuth()
  const supabase = createClientSupabaseClient(getToken)
}
```

#### Critical ID Management
- **NEVER confuse**: Clerk UUID vs Supabase User ID (INT)
- **Always use**: Supabase User ID (INT) for database queries
- **Pattern**: Get Clerk user → fetch Supabase user record → use Supabase user ID
- **Rationale**: Database relationships require consistent integer IDs

### 8.5 Global Error Boundary & Reusable Error UI/UX
**REQUIREMENT**: Implement global error boundary with consistent error UI

#### Global Error Boundary
```typescript
// components/error-boundary.tsx
export function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={<ErrorFallback />}
      onError={(error, errorInfo) => {
        // Log to PostHog/Sentry
        console.error('Global error:', error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
```

#### Reusable Error Components
```typescript
// components/ui/error-display.tsx
export function ErrorDisplay({ 
  error, 
  retry, 
  variant = "default" 
}: ErrorDisplayProps) {
  // Consistent error UI across the app
}
```

#### Implementation Requirements
- **Wrap**: All `(protected)` routes with `GlobalErrorBoundary`
- **Components**: `ErrorDisplay`, `ErrorFallback`, `LoadingError`
- **Integration**: PostHog error tracking
- **Rationale**: Consistent error handling, better user experience

---

## 9. RECOMMENDED NEXT STEPS

1. **Icon Unification** – remove `@radix-ui/react-icons`, swap imports to lucide
2. **Validation Pass** – adopt RHF + Zod across all remaining forms (onboarding, settings)
3. **Supabase Client Audit** – search for `createClientSupabaseClient` and replace with action calls + RLS policies
4. **Global Error Boundary & logging** – wrap `(protected)` layout; send to PostHog or Sentry
5. **Cache Utilisation** – wrap expensive Supabase reads (library, performance charts) with `createCache`
6. **Loading UX** – ensure every async page has Skeleton + Suspense fallback, follow `skeleton.tsx` pattern
7. **Testing Coverage** – many `__tests__` exist but gaps in Plans/Sessions; add jest + react-testing-library tests for new server actions

---

## 10. ARCHITECTURE PRINCIPLES

- **Single Responsibility**: Each file has one clear purpose
- **Type Safety**: All data flows are strongly typed
- **Performance First**: Cache expensive operations, lazy load components
- **Security by Default**: RLS policies, auth checks, input validation
- **Consistency**: Same patterns across similar features
- **Maintainability**: Clear separation of concerns, documented patterns

---

*This overview should give the team a clear map of the current tech stack, patterns in force, and the few hotspots that need standardisation for a fully coherent, scalable codebase.*