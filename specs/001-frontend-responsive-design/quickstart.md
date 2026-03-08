# Quickstart Guide: Frontend Responsive Design Fixes

**Feature**: 001-frontend-responsive-design
**Date**: 2025-12-03
**Audience**: Developers implementing CSS fixes + Browser testing

---

## Prerequisites

- Node.js 18+ installed
- Access to Kasoku.run repository
- Supabase CLI (for MCP integration during testing)
- Cursor IDE with browser tool access

---

## Quick Start (5 minutes)

### 1. Switch to Feature Branch

```bash
cd /path/to/RunningWebsite
git checkout 001-frontend-responsive-design
```

### 2. Install Dependencies (if not already done)

```bash
cd apps/web
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

Server will start at http://localhost:3000

### 4. Verify Current Issues

**Mobile (resize browser to 375px width)**:
- Navigate to http://localhost:3000/plans
- Charts should be too tall (256px fixed height)
- Exercise cards should force horizontal scroll (85vw width)
- No focus indicators when tabbing through UI

---

## Implementation Workflow

### Phase 1: CSS Fixes (2 hours estimated)

#### Fix 1: Responsive Chart Heights (~15 min)

**File**: `apps/web/components/features/plans/home/VolumeIntensityChart.tsx`

**Change**:
```diff
- <div className="h-64 w-full">
+ <div className="h-48 sm:h-56 md:h-64 w-full">
```

**Verify**: Resize browser - chart should shrink on mobile, grow on desktop

---

#### Fix 2: Responsive Chart Margins (~30 min)

**File**: `apps/web/components/features/plans/home/VolumeIntensityChart.tsx`

**Add hook** (before component):
```typescript
const useResponsiveChartMargins = () => {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    top: 20,
    right: windowWidth < 640 ? 10 : windowWidth < 1024 ? 20 : 30,
    left: windowWidth < 640 ? 10 : 20,
    bottom: 5,
  };
};
```

**Use in component**:
```diff
+ const margins = useResponsiveChartMargins();

  <ComposedChart
    data={chartData}
-   margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
+   margin={margins}
  >
```

**Verify**: X-axis labels should not overlap on iPhone SE (320px width)

---

#### Fix 3: Focus Indicators (~30 min)

**Files**: Multiple (sidebar.tsx, dialog.tsx, button.tsx)

**Pattern**: Remove `outline-none`, add focus-visible ring

**Example** (sidebar.tsx):
```diff
  <button
-   className="outline-none ..."
+   className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ..."
  >
```

**Verify**: Press Tab key - all interactive elements should show blue ring

---

#### Fix 4: Touch Targets (~15 min)

**File**: `apps/web/components/ui/button.tsx`

**Change** (sm variant):
```diff
  sm: "h-9 rounded-md px-3"
+ sm: "h-9 rounded-md px-3 touch-target"
```

**Verify**: Icon buttons should be minimum 44x44px on mobile (inspect with devtools)

---

#### Fix 5: Mobile Exercise Card Width (~10 min)

**File**: `apps/web/components/features/plans/session-planner/components/ExerciseRow.tsx`

**Change** (mobile card):
```diff
  <div
-   className="snap-start shrink-0 w-[85vw] max-w-[320px] ..."
+   className="snap-start shrink-0 w-[calc(100vw-2rem)] max-w-[360px] ..."
  >
```

**Verify**: Cards should fill screen width minus padding, no forced horizontal scroll

---

#### Fix 6: Z-Index Hierarchy (~20 min)

**File**: `apps/web/tailwind.config.ts`

**Add to theme.extend**:
```typescript
zIndex: {
  sidebar: '10',
  header: '20',
  dropdown: '30',
  tooltip: '40',
  modal: '50',
  toast: '60',
}
```

**Update components**:
- sidebar.tsx: `z-10` → `z-sidebar`
- dialog.tsx: `z-50` → `z-modal`
- toast.tsx: `z-50` → `z-toast`

**Verify**: Open dialog with sidebar visible - dialog should appear above sidebar

---

#### Fix 7: Dialog Overflow (~10 min)

**File**: `apps/web/components/ui/dialog.tsx`

**Change** (DialogContent):
```diff
  <DialogContent
-   className="max-w-4xl max-h-[90vh]"
+   className="max-w-4xl max-h-[90vh] overflow-y-auto"
  >
```

**Verify**: Open assignment dialog with 10+ athletes - should scroll without cutting off content

---

### Phase 2: Browser Testing (4 hours estimated)

After all CSS fixes are applied, run comprehensive browser tests.

#### Setup

1. Ensure dev server is running (`npm run dev`)
2. Ensure Supabase MCP server is accessible
3. Open Cursor IDE

#### Test Execution

Ask Cursor AI agent:
```
Using the browser tool and Supabase MCP integration, execute comprehensive
browser tests for the following:

1. Plans Page (/plans):
   - Create new macrocycle, verify in Supabase macrocycles table
   - Create mesocycle, verify in mesocycles table
   - Delete macrocycle, verify cascade delete
   - Test responsive layout on mobile (375px), tablet (768px), desktop (1920px)
   - Verify focus indicators work on all buttons/inputs
   - Test empty state when no plans exist

2. Workout Page (/workout):
   - Start training session, verify status='ongoing' in exercise_training_sessions
   - Add performance data, verify in exercise_training_details
   - Complete session, verify status='completed' and completed_at set
   - Test on mobile - verify touch targets are 44x44px
   - Test empty state

3. Session Page (/sessions):
   - Create new session with exercises
   - Update set parameters
   - Delete exercise from session
   - Save session, verify in exercise_preset_groups and exercise_presets
   - Test mobile card width fills screen

4. Cross-Page Tests:
   - Open dialog while sidebar visible, verify z-index stacking
   - Tab through all pages, verify focus indicators
   - Test empty states
   - Test deletion with dependencies

For each test, verify:
- UI renders correctly
- Database state matches expected values
- No console errors
- Responsive layout works on all viewports
```

Agent will execute tests interactively and report pass/fail status.

---

## Common Issues

### Issue: Chart margins not updating

**Solution**: Check useEffect dependency array, force re-render with `key` prop

### Issue: Focus ring not visible in dark mode

**Solution**: Verify `--ring` CSS variable is set in dark mode theme (check globals.css)

### Issue: Touch targets still too small

**Solution**: Check if `.touch-target` utility is loaded (inspect element in devtools)

### Issue: Supabase MCP connection fails

**Solution**: Verify Supabase CLI is installed and project ID is correct (pcteaouusthwbgzczoae)

---

## Testing Checklist

After implementation, verify:

- [ ] Charts use responsive heights (h-48/h-56/h-64)
- [ ] Chart margins scale on mobile (10px vs 30px desktop)
- [ ] All interactive elements show focus indicators (Tab through pages)
- [ ] Icon buttons meet 44x44px minimum on mobile
- [ ] Exercise cards fill screen width on mobile
- [ ] Z-index hierarchy prevents stacking conflicts
- [ ] Dialogs scroll when content exceeds max-height
- [ ] No console errors on any page
- [ ] All CRUD operations verified in Supabase
- [ ] Edge cases handled (empty states, deletions, etc.)

---

## Next Steps

After all tests pass:

1. Run type-check: `npm run type-check`
2. Run lint: `npm run lint`
3. Run build: `npm run build`
4. Commit changes: `git commit -m "fix: responsive design and accessibility improvements"`
5. Push to branch: `git push origin 001-frontend-responsive-design`
6. Create PR and request review

---

## Reference

- [Full Spec](./spec.md)
- [Implementation Plan](./plan.md)
- [Research Decisions](./research.md)
- [Data Model](./data-model.md)
- [CLAUDE.md Architecture Guide](../../CLAUDE.md)
- [Frontend Design Issues Report](../../FRONTEND_DESIGN_ISSUES_2025-12-03.md)
