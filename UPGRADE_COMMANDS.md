# Package Upgrade Commands

## Phase 1: Safe Upgrades (Recommended First)

These upgrades are low-risk and can be done immediately:

```powershell
# Navigate to web app
cd apps/web

# Update React and React DOM to latest patch
npm install react@^19.2.1 react-dom@^19.2.1

# Update Supabase to latest minor version
npm install @supabase/supabase-js@^2.87.0

# Verify installations
npm list react react-dom @supabase/supabase-js

# Test build
npm run build
```

---

## Phase 2: Next.js 16 Upgrade (Requires Testing)

**⚠️ WARNING: This is a major version upgrade with breaking changes**

**Before proceeding:**
1. Create a backup branch: `git checkout -b upgrade/nextjs-16`
2. Review [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-16)
3. Check Clerk compatibility: Verify `@clerk/nextjs` works with Next.js 16

```powershell
# Navigate to web app
cd apps/web

# Upgrade Next.js and ESLint config
npm install next@16.0.8 eslint-config-next@16.0.8

# Verify installation
npm list next eslint-config-next

# Test build
npm run build

# Test dev server
npm run dev
```

**After upgrade, check:**
- [ ] All pages load correctly
- [ ] API routes work
- [ ] Middleware functions correctly
- [ ] Clerk authentication still works
- [ ] No TypeScript errors
- [ ] No console errors

---

## Phase 3: Tailwind CSS Decision

### Option A: Stay on Tailwind 3 (RECOMMENDED)

```powershell
# Just ensure you're on latest v3 patch
cd apps/web
npm install tailwindcss@^3.4.18
```

### Option B: Upgrade to Tailwind 4 (Major Migration Required)

**⚠️ WARNING: This requires significant migration work**

```powershell
# Navigate to web app
cd apps/web

# Upgrade Tailwind CSS
npm install tailwindcss@^4.1.17

# Update related dependencies (check compatibility first!)
npm install @tailwindcss/typography@latest tailwindcss-animate@latest

# You'll need to:
# 1. Migrate tailwind.config.ts to new v4 format
# 2. Update PostCSS configuration
# 3. Update all component styles if needed
# 4. Test thoroughly
```

**Migration Steps for Tailwind v4:**
1. Review [Tailwind v4 Migration Guide](https://tailwindcss.com/docs/upgrade-guide)
2. Update `tailwind.config.ts` to new CSS-first approach
3. Update `postcss.config.mjs` if needed
4. Test all components
5. Update any custom Tailwind plugins

---

## Complete Safe Upgrade (Phase 1 Only)

If you want to do all safe upgrades at once:

```powershell
cd apps/web
npm install react@^19.2.1 react-dom@^19.2.1 @supabase/supabase-js@^2.87.0
npm run build
npm run dev
```

---

## Verify All Upgrades

After any upgrade phase:

```powershell
# Check installed versions
npm list next react react-dom tailwindcss @supabase/supabase-js

# Run linter
npm run lint

# Run build
npm run build

# Start dev server and manually test
npm run dev
```

---

## Rollback Instructions

If something breaks:

```powershell
# Restore from package-lock.json
npm ci

# Or restore specific package
npm install next@15.2.3  # Example rollback
```

---

## Notes

- Always commit your current state before upgrading: `git commit -am "Pre-upgrade checkpoint"`
- Test in development before deploying to production
- Review changelogs for each package before upgrading
- Consider upgrading one package at a time to isolate issues

