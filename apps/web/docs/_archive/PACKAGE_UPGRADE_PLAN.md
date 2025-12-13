# Package Upgrade Plan - December 2025

> **Date**: 2025-12-12
> **Current Status**: Multiple packages outdated
> **Priority**: Execute before production deployment

---

## Quick Summary

| Status | Count | Packages |
|--------|-------|----------|
| 🚨 **MAJOR UPDATES** | 2 | Zod, AI SDK |
| ⚠️ **MINOR UPDATES** | 4 | Clerk, TanStack Query, React Hook Form, Supabase |
| ✅ **UP TO DATE** | 6 | React, Next.js, TipTap, Framer Motion, Tailwind CSS, PostCSS |

---

## Complete Package Status Table

| Package | Current | Latest | Status | Breaking | Priority |
|---------|---------|--------|--------|----------|----------|
| **react** | 19.2.1 | 19.2.1 | ✅ Current | - | - |
| **react-dom** | 19.2.1 | 19.2.1 | ✅ Current | - | - |
| **next** | 16.0.10 | 16.0.10 | ✅ Current | - | - |
| **@clerk/nextjs** | 6.34.1 | **6.36.2** | ⚠️ Outdated | No | MEDIUM |
| **@supabase/supabase-js** | 2.87.0 | **2.87.1** | ⚠️ Outdated | No | LOW |
| **@tanstack/react-query** | 5.80.6 | **5.90.12** | ⚠️ Outdated | No | MEDIUM |
| **@tiptap/react** | 3.13.0 | 3.13.0 | ✅ Current | - | - |
| **ai** (Vercel SDK) | 4.3.16 | **5.x** | 🚨 Major Behind | **YES** | **HIGH** |
| **framer-motion** | 12.23.26 | 12.23.26 | ✅ Current | - | - |
| **react-hook-form** | 7.54.1 | **7.68.0** | ⚠️ Outdated | No | MEDIUM |
| **zod** | 3.24.1 | **4.1.13** | 🚨 Major Behind | **YES** | **HIGH** |
| **tailwindcss** | 4.1.18 | 4.1.18 | ✅ Current | - | - |
| **@tailwindcss/postcss** | 4.1.18 | 4.1.18 | ✅ Current | - | - |
| **postcss** | 8.5.6 | 8.5.6 | ✅ Current | - | - |

---

## Phase 1: Pre-Upgrade Checklist

**Before starting any upgrades**:

- [ ] **Commit all current work** to git
- [ ] **Create backup branch**: `git checkout -b backup-before-upgrades`
- [ ] **Document current state**: `npm list --depth=0 > pre-upgrade-versions.txt`
- [ ] **Run current tests**: `npm test` (ensure all pass)
- [ ] **Build successfully**: `npm run build` (ensure no errors)

---

## Phase 2: Non-Breaking Minor Updates (SAFE)

These updates have no breaking changes and can be applied safely.

### Step 1: Update Clerk

```bash
cd apps/web
npm install @clerk/nextjs@6.36.2
```

**What's New in 6.35-6.36**:
- Enhanced PPR (Partial Prerendering) support
- Performance improvements for auth() calls
- Bug fixes for Next.js 16 edge cases

**Testing After Update**:
```bash
# Verify no type errors
npm run type-check

# Test auth flows
npm run dev
# Manual test: Sign in, sign out, protected routes
```

---

### Step 2: Update TanStack Query

```bash
cd apps/web
npm install @tanstack/react-query@5.90.12 @tanstack/react-query-devtools@5.90.12
```

**What's New in 5.81-5.90**:
- Enhanced TypeScript inference
- Performance improvements for large datasets
- Better React 19 concurrent rendering support
- Bug fixes for SSR hydration

**Testing After Update**:
```bash
npm run type-check
npm run dev
# Test pages that use useQuery/useMutation
```

---

### Step 3: Update React Hook Form

```bash
cd apps/web
npm install react-hook-form@7.68.0
```

**What's New in 7.55-7.68**:
- Enhanced TypeScript inference
- Better React 19 support
- Performance improvements
- Bug fixes for edge cases

**Testing After Update**:
```bash
npm run type-check
npm run dev
# Test all forms (plan creation, athlete management, etc.)
```

---

### Step 4: Update Supabase

```bash
cd apps/web
npm install @supabase/supabase-js@2.87.1
```

**What's New in 2.87.1**:
- Minor bug fixes
- Performance improvements

**Testing After Update**:
```bash
npm run type-check
npm run dev
# Test database queries, auth flows
```

---

## Phase 3: Major Version Updates (BREAKING CHANGES)

⚠️ **WARNING**: These updates require code changes and thorough testing.

### Step 5: Update Zod (v3 → v4)

**BREAKING CHANGES - Read migration guide first!**

#### Pre-Migration

1. **Read official migration guide**: https://zod.dev/v4/versioning
2. **Review all Zod usage** in codebase:
   ```bash
   grep -r "import.*zod" apps/web/
   ```

#### Migration Steps

```bash
cd apps/web
npm install zod@4.1.13
```

#### Known Breaking Changes (Zod v4)

1. **Performance improvements** may change validation order
2. **Error messages** may have different formats
3. **Type inference** improvements may require type adjustments

#### Files to Review

Based on our codebase:
- ✅ `components/features/plans/components/mesowizard/PlanConfiguration.tsx`
- ✅ All form components using `zodResolver`
- ✅ Server actions with input validation

#### Testing After Update

```bash
# 1. Type check (may show new errors)
npm run type-check

# 2. Run build
npm run build

# 3. Test all forms extensively
npm run dev

# Manual tests:
# - Plan creation wizard (PlanConfiguration form)
# - Athlete management forms
# - Exercise forms
# - All schema validations
```

#### Rollback if Needed

```bash
npm install zod@3.24.1
```

---

### Step 6: Update Vercel AI SDK (v4 → v5)

**BREAKING CHANGES - Read migration guide first!**

#### Pre-Migration

1. **Read official migration guide**: https://vercel.com/blog/ai-sdk-5
2. **Review all AI SDK usage** in codebase:
   ```bash
   grep -r "import.*from.*'ai'" apps/web/
   ```

3. **Document current AI features** before upgrading

#### Migration Steps

```bash
cd apps/web
npm install ai@latest
```

#### Known Breaking Changes (AI SDK v5)

From [AI SDK 5 announcement](https://vercel.com/blog/ai-sdk-5):

1. **Type-safe chat API**: New typing system
2. **Agentic loop control**: New architecture patterns
3. **Provider changes**: OpenAI, Anthropic integrations updated
4. **Breaking API changes**: Function signatures changed

#### Action Required

1. **Identify all AI SDK usage** in codebase
2. **Update imports** to new v5 patterns
3. **Refactor agentic workflows** if applicable
4. **Test AI features** thoroughly

#### Testing After Update

```bash
# 1. Type check
npm run type-check

# 2. Build
npm run build

# 3. Test AI features
npm run dev

# Manual tests:
# - All AI-powered features
# - Chat interfaces
# - Any streaming responses
```

#### Rollback if Needed

```bash
npm install ai@4.3.16
```

---

## Phase 4: Optional Improvement - Supabase SSR

**Not required but recommended for Next.js 16**

### Current Implementation

Using `@supabase/supabase-js` with custom JWT flow (works correctly).

### Recommended Implementation

Migrate to `@supabase/ssr` for official Next.js 16 patterns.

#### Migration Steps

```bash
cd apps/web
npm install @supabase/ssr
```

#### Code Changes Required

**File**: `lib/supabase-server.ts`

**Before** (Current):
```typescript
import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"

const supabase = createClient(url, key, {
  async accessToken() {
    return (await auth()).getToken()
  },
})

export default supabase
```

**After** (Recommended):
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      },
    },
  })
}
```

#### Files to Update

All server actions currently using:
```typescript
import supabase from '@/lib/supabase-server'
```

Change to:
```typescript
import { createClient } from '@/lib/supabase-server'
const supabase = await createClient()
```

#### Testing

- Test all database queries
- Test authentication flows
- Test RLS policies
- Verify no performance regression

---

## Phase 5: Post-Upgrade Validation

After completing all upgrades:

### 1. Comprehensive Type Check

```bash
npm run type-check
```

**Expected**: Zero TypeScript errors

### 2. Linting

```bash
npm run lint
```

**Expected**: Zero ESLint errors/warnings

### 3. Build Verification

```bash
npm run build
```

**Expected**: Successful production build

### 4. Test Suite

```bash
npm test
```

**Expected**: All tests passing

### 5. Clean npm Install

Due to previous npm corruption:

```bash
# Remove corrupted node_modules
Remove-Item -Recurse -Force node_modules, apps\web\node_modules
Remove-Item -Force package-lock.json, apps\web\package-lock.json

# Fresh install with updated versions
npm install

# Verify build
npm run build
```

### 6. Security Audit

```bash
npm audit
```

**Expected**: No high/critical vulnerabilities

### 7. Version Verification

```bash
npm list react react-dom next @clerk/nextjs @supabase/supabase-js @tanstack/react-query react-hook-form zod ai
```

**Expected**: All packages at target versions

---

## Phase 6: Manual Testing Checklist

### Authentication Flows
- [ ] Sign in with Clerk
- [ ] Sign out
- [ ] Protected route access
- [ ] Onboarding flow
- [ ] Role-based access (coach/athlete)

### Forms (Zod validation)
- [ ] Plan creation wizard
- [ ] Athlete management
- [ ] Exercise forms
- [ ] Settings forms
- [ ] All schema validations work correctly

### Data Fetching (TanStack Query)
- [ ] Dashboard loads data
- [ ] Plans page loads/updates
- [ ] Workout sessions load
- [ ] Real-time updates work
- [ ] Caching behaves correctly

### AI Features (AI SDK)
- [ ] Test all AI-powered features
- [ ] Chat interfaces work
- [ ] Streaming responses work
- [ ] Error handling correct

### UI/Styling (Tailwind CSS v4)
- [ ] All pages render correctly
- [ ] Dark mode works
- [ ] Responsive layouts work
- [ ] No visual regressions

### Database Operations
- [ ] CRUD operations work
- [ ] RLS policies enforced
- [ ] Queries return correct data
- [ ] No authentication issues

---

## Rollback Strategy

If critical issues arise after upgrades:

### Quick Rollback

```bash
# Return to backup branch
git checkout backup-before-upgrades

# Restore node_modules
rm -rf node_modules apps/web/node_modules
npm install
```

### Partial Rollback

Revert specific packages in `apps/web/package.json`:

```json
{
  "dependencies": {
    "zod": "3.24.1",           // Rollback if v4 causes issues
    "ai": "4.3.16",            // Rollback if v5 causes issues
    "@clerk/nextjs": "6.34.1",
    // ... keep other updates
  }
}
```

Then:
```bash
npm install
```

---

## Upgrade Execution Order

**Recommended sequence**:

1. ✅ **Pre-Upgrade Checklist** (Phase 1)
2. ✅ **Safe Minor Updates** (Phase 2, Steps 1-4)
3. ⚠️ **Zod Major Update** (Phase 3, Step 5) - Test thoroughly
4. ⚠️ **AI SDK Major Update** (Phase 3, Step 6) - Test thoroughly
5. 💡 **Optional: Supabase SSR** (Phase 4) - If time permits
6. ✅ **Post-Upgrade Validation** (Phase 5)
7. ✅ **Manual Testing** (Phase 6)

**Estimated Time**:
- Phase 1-2: 30 minutes
- Phase 3 (Zod): 2-3 hours (including testing)
- Phase 3 (AI SDK): 2-3 hours (including testing)
- Phase 4 (Optional): 3-4 hours
- Phase 5-6: 1-2 hours

**Total**: 6-13 hours (depending on whether Phase 4 is included)

---

## Documentation Updates Required

After successful upgrades, update:

1. **NEXT16_MIGRATION_PLAN.md**: Mark Phase 9 complete
2. **CLAUDE.md**: Update package versions in examples
3. **package.json**: Versions already updated
4. **This document**: Mark completed phases

---

## Final Checklist

Before marking migration complete:

- [ ] All package updates installed
- [ ] All tests passing
- [ ] Build successful
- [ ] Manual testing complete
- [ ] No console errors in dev
- [ ] No TypeScript errors
- [ ] Documentation updated
- [ ] Git commit with clear message

**Commit Message Template**:
```
chore(deps): Upgrade packages to latest versions

- Clerk: 6.34.1 → 6.36.2
- TanStack Query: 5.80.6 → 5.90.12
- React Hook Form: 7.54.1 → 7.68.0
- Supabase: 2.87.0 → 2.87.1
- Zod: 3.24.1 → 4.1.13 (BREAKING)
- AI SDK: 4.3.16 → 5.x (BREAKING)

Breaking changes tested and verified.
All tests passing. Build successful.

Refs: DOCUMENTATION_VERIFICATION_REPORT_V2.md
```

---

## References

### Official Documentation
- [Clerk npm](https://www.npmjs.com/package/@clerk/nextjs)
- [TanStack Query npm](https://www.npmjs.com/package/@tanstack/react-query)
- [React Hook Form npm](https://www.npmjs.com/package/react-hook-form)
- [Supabase npm](https://www.npmjs.com/package/@supabase/supabase-js)
- [Zod v4 Migration](https://zod.dev/v4)
- [AI SDK 5 Announcement](https://vercel.com/blog/ai-sdk-5)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4)

### Migration Guides
- [Zod v3 → v4 Versioning](https://zod.dev/v4/versioning)
- [AI SDK 5 Complete Guide](https://ai-sdk.dev/docs/introduction)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)

---

**Document Version**: 1.0
**Last Updated**: 2025-12-12
**Status**: Ready for execution
