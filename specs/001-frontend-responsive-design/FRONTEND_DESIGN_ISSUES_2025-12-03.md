# Frontend Design & Responsive Layout Issues Report
**Date**: December 3, 2025
**Scope**: All pages (Plans, Workout, Session, Marketing)
**Purpose**: Comprehensive audit before SpecKit implementation

---

## Executive Summary

**Total Issues Found**: 24
- **Critical**: 7 (block functionality on mobile/tablet)
- **High Priority**: 7 (degrade UX significantly)
- **Medium Priority**: 7 (polish and refinement)
- **Low Priority**: 3 (nice-to-have improvements)

**Primary Impact Areas**:
- Mobile responsiveness (8 issues)
- Touch target accessibility (3 issues)
- Z-index/overlay conflicts (1 critical issue)
- Chart visualization on mobile (2 critical issues)
- Focus states and keyboard navigation (2 high issues)

---

## CRITICAL ISSUES (Must Fix Immediately)

### 1. Mobile Chart Height Not Responsive ⚠️ CRITICAL
**File**: [VolumeIntensityChart.tsx:84](apps/web/components/features/plans/home/VolumeIntensityChart.tsx#L84)

**Issue**: Chart container uses fixed `h-64` (256px) height on all screen sizes
```tsx
<div className="h-64 w-full">
```

**Impact**:
- Chart is excessively tall on mobile devices
- Forces excessive scrolling
- Poor mobile UX

**Devices Affected**: Mobile (< 640px)

**Recommended Fix**:
```tsx
<div className="h-48 sm:h-56 md:h-64 w-full">
```

**Effort**: 5 minutes

---

### 2. Chart Margins Crush Content on Mobile ⚠️ CRITICAL
**File**: [VolumeIntensityChart.tsx:88-93](apps/web/components/features/plans/home/VolumeIntensityChart.tsx#L88-L93)

**Issue**: Recharts margins (30px right, 20px left) don't scale for mobile
```tsx
margin={{
  top: 20,
  right: 30,
  left: 20,
  bottom: 5,
}}
```

**Impact**:
- On iPhone SE (320px width), only ~270px left for chart content
- X-axis labels overlap and become unreadable
- Data points hard to distinguish

**Devices Affected**: Mobile (< 375px), especially iPhone SE

**Recommended Fix**:
```tsx
margin={{
  top: 10,
  right: window.innerWidth < 640 ? 10 : 30,
  left: window.innerWidth < 640 ? 10 : 20,
  bottom: 5,
}}
```

**Effort**: 15 minutes (add responsive margin hook)

---

### 3. Horizontal Scroll Trap in Exercise Rows ⚠️ CRITICAL
**File**: [ExerciseRow.tsx:184-188](apps/web/components/features/plans/session-planner/components/ExerciseRow.tsx#L184-L188)

**Issue**: Mobile card layout uses `w-[85vw]` creating unnecessary horizontal scroll
```tsx
<div className="snap-start shrink-0 w-[85vw] max-w-[320px]">
```

**Impact**:
- Cards don't fill screen width
- Creates awkward scrolling experience
- Set input fields are cramped (70px width)
- Touch targets are too small

**Devices Affected**: Mobile (< 640px)

**Recommended Fix**:
```tsx
<div className="snap-start shrink-0 w-[calc(100vw-2rem)] max-w-[360px]">
```

**Effort**: 10 minutes

---

### 4. Z-Index Conflicts Between Overlays ⚠️ CRITICAL
**Files**: Multiple (sidebar, dialogs, toasts)
- [sidebar.tsx:235](apps/web/components/ui/sidebar.tsx#L235) - `z-10` fixed sidebar
- [dialog.tsx:24](apps/web/components/ui/dialog.tsx#L24) - `z-50` backdrop
- [toast.tsx](apps/web/components/ui/toast.tsx) - `z-50` toasts

**Issue**: No centralized z-index management. Components compete for visibility.

**Impact**:
- Sidebar can appear above modals on desktop
- Toasts can be hidden behind dialogs
- Dropdowns may appear behind sidebars
- Inconsistent stacking context

**Devices Affected**: All devices

**Recommended Fix**: Establish z-index hierarchy in `tailwind.config.ts`:
```typescript
theme: {
  extend: {
    zIndex: {
      'sidebar': '10',
      'header': '20',
      'dropdown': '30',
      'tooltip': '40',
      'modal': '50',
      'toast': '60',
      'dialog-backdrop': '50',
    }
  }
}
```

**Effort**: 30 minutes (config + update all components)

---

### 5. Assignment Dialog Exceeds Viewport Height ⚠️ CRITICAL
**File**: [PlansHomeClient.tsx:234](apps/web/components/features/plans/home/PlansHomeClient.tsx#L234)

**Issue**: Dialog uses `max-h-[90vh]` but content can exceed this without proper scrolling
```tsx
<DialogContent className="max-w-4xl max-h-[90vh]">
```

**Impact**:
- Content gets cut off on smaller screens
- No way to scroll to see all content
- User cannot complete workflow

**Devices Affected**: Tablet Portrait (< 768px), Mobile

**Recommended Fix**:
```tsx
<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
```

**Effort**: 5 minutes

---

### 6. Missing `!important` Usage Creates Style Conflicts
**Files**: [globals.css:227,373](apps/web/app/globals.css#L227)

**Issue**: Form inputs use `!important` to prevent iOS zoom, but this is inconsistent
```css
font-size: 16px !important; /* Prevents iOS zoom */
```

**Impact**:
- Some inputs still allow iOS zoom (inconsistent)
- `!important` usage is anti-pattern
- Hard to override styles

**Devices Affected**: iOS Safari

**Recommended Fix**: Use consistent utility class approach:
```tsx
// Add to all mobile inputs
className="text-base sm:text-sm"
```

**Effort**: 30 minutes (audit all inputs)

---

### 7. Sidebar Navigation Breaks on Tablets ⚠️ CRITICAL
**File**: [sidebar.tsx:235-244](apps/web/components/ui/sidebar.tsx#L235-L244)

**Issue**: Mobile uses Sheet overlay (good), but tablet (768px+) switches to fixed sidebar with no collapse option

**Impact**:
- On iPad landscape (1024px), sidebar takes 256px
- Leaves only 768px for content
- No way to collapse for more space
- Content feels cramped

**Devices Affected**: Tablet (768px - 1024px)

**Recommended Fix**: Add collapsible sidebar state for tablets:
```tsx
const isMobile = useIsMobile() // Change: window < 1024px (not 768px)
```

**Effort**: 20 minutes

---

## HIGH PRIORITY ISSUES (Fix Before Production)

### 8. Missing Mobile Padding Consistency 🔴 HIGH
**File**: [PlansHomeClient.tsx:142,162](apps/web/components/features/plans/home/PlansHomeClient.tsx#L142)

**Issue**: Confusing negative margins then zero padding
```tsx
<div className="-mx-4 px-0 sm:mx-0 sm:px-0">
```

**Impact**: Inconsistent spacing, content butting against edges

**Devices Affected**: Mobile

**Recommended Fix**:
```tsx
<div className="mobile-safe-x"> {/* Uses px-4 sm:px-6 lg:px-8 */}
```

**Effort**: 15 minutes (use existing utility classes from globals.css)

---

### 9. Exercise Table Sticky Column Misaligned 🔴 HIGH
**File**: [ExerciseRow.tsx:273-288](apps/web/components/features/plans/session-planner/components/ExerciseRow.tsx#L273-L288)

**Issue**: Desktop table has sticky `left-0` column with `z-10`, but mobile cards don't use this pattern

**Impact**:
- Inconsistent UX between mobile/desktop
- Users expect sticky column on mobile horizontal scroll

**Devices Affected**: Mobile

**Recommended Fix**: Apply sticky column pattern to mobile cards

**Effort**: 30 minutes

---

### 10. No Focus Visible States on Interactive Elements 🔴 HIGH (Accessibility)
**Files**: Multiple components
- [sidebar.tsx:300-308](apps/web/components/ui/sidebar.tsx#L300-L308)
- [dialog.tsx:47](apps/web/components/ui/dialog.tsx#L47)

**Issue**: Uses `outline-none` without replacement focus styles
```tsx
className="outline-none" // No focus indication!
```

**Impact**:
- **WCAG 2.1 AA Violation**
- Keyboard users cannot see focused element
- Assistive technology users lose navigation

**Devices Affected**: All (keyboard navigation)

**Recommended Fix**:
```tsx
// Remove: outline-none
// Add: focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

**Effort**: 1 hour (audit all interactive elements)

---

### 11. Hardcoded Pixel Widths for Select Dropdowns 🔴 HIGH
**File**: [PlansHomeClient.tsx:183-195](apps/web/components/features/plans/home/PlansHomeClient.tsx#L183-L195)

**Issue**: Filters use `sm:w-[180px]` forcing text wrapping
```tsx
<SelectTrigger className="w-full sm:w-[180px]">
```

**Impact**:
- Long option text wraps awkwardly
- Inconsistent button sizing
- Poor visual hierarchy

**Devices Affected**: Desktop (medium screens)

**Recommended Fix**:
```tsx
<SelectTrigger className="w-full sm:w-auto sm:min-w-[160px] sm:max-w-[240px]">
```

**Effort**: 15 minutes

---

### 12. Chart Tooltip Not Touch-Friendly 🔴 HIGH
**File**: [VolumeIntensityChart.tsx:39-62](apps/web/components/features/plans/home/VolumeIntensityChart.tsx#L39-L62)

**Issue**: Uses hover-based tooltip (Recharts default `<Tooltip />`)

**Impact**:
- Mobile users cannot see data point details
- No touch interaction support

**Devices Affected**: Mobile & Tablet

**Recommended Fix**: Use Recharts click-based tooltip or custom mobile-friendly tooltip

**Effort**: 30 minutes

---

### 13. Timeline Phase Text Truncation Logic Fragile 🔴 HIGH
**File**: [MacrocycleTimeline.tsx:65-81](apps/web/components/features/plans/home/MacrocycleTimeline.tsx#L65-L81)

**Issue**: Text truncation uses hardcoded calculation:
```tsx
const estimatedWidth = (width / 100) * 1000
```

**Impact**:
- Text may overflow or be excessively truncated
- Doesn't account for font size, padding, or viewport changes
- Breaks on different screen sizes

**Devices Affected**: All viewports

**Recommended Fix**: Use CSS `text-overflow: ellipsis` instead:
```tsx
className="truncate overflow-hidden text-ellipsis"
```

**Effort**: 20 minutes

---

### 14. Touch Targets Below 44px Minimum 🔴 HIGH (Accessibility)
**Files**: Multiple components
- [sidebar.tsx:272](apps/web/components/ui/sidebar.tsx#L272) - Icon buttons 32x32px
- [button.tsx](apps/web/components/ui/button.tsx) - Small variant 32x32px

**Issue**: Touch targets are 32-40px, below WCAG 2.1 Level AAA minimum (44px)

**Impact**:
- **WCAG Violation**
- Difficult to tap on mobile
- Higher tap error rate

**Devices Affected**: Mobile

**Recommended Fix**: Use existing utility classes:
```tsx
// From globals.css
className="touch-target" // min-h-[44px] min-w-[44px]
```

**Effort**: 30 minutes (audit all icon buttons)

---

## MEDIUM PRIORITY ISSUES (Polish & Refinement)

### 15. Toolbar Action Sheet Not Full Width 🟡 MEDIUM
**File**: [Toolbar.tsx:156](apps/web/components/features/plans/session-planner/components/Toolbar.tsx#L156)

**Issue**: Sheet uses `side="bottom"` but SheetContent doesn't specify full width
```tsx
<SheetContent side="bottom" className="rounded-t-3xl">
```

**Impact**: Action sheet may not span full screen width on some devices

**Devices Affected**: Mobile

**Recommended Fix**:
```tsx
<SheetContent side="bottom" className="rounded-t-3xl w-full max-w-full">
```

**Effort**: 5 minutes

---

### 16. Duplicate Chart Rendering on Mobile 🟡 MEDIUM
**File**: [PlansHomeClient.tsx:140](apps/web/components/features/plans/home/PlansHomeClient.tsx#L140)

**Issue**: Mobile layout repeats chart inside `lg:hidden` div but parent card also renders

**Impact**:
- Double rendering (performance waste)
- Confusing DOM structure

**Devices Affected**: Mobile

**Recommended Fix**: Properly conditional render, not duplicate

**Effort**: 15 minutes

---

### 17. Inline Styles Override Tailwind (Anti-pattern) 🟡 MEDIUM
**File**: [TrainingPlanWorkspace.tsx:576,584](apps/web/components/features/plans/workspace/TrainingPlanWorkspace.tsx#L576)

**Issue**: Uses inline `style={{ width: ... }}` for progress bars
```tsx
<div style={{ width: `${((micro.volume || 0) / 10) * 100}%` }} />
```

**Impact**:
- Cannot use Tailwind's dark mode utilities
- Difficult to maintain
- Not responsive-aware

**Devices Affected**: All (maintenance issue)

**Recommended Fix**: Use CSS variables:
```tsx
<div
  className="h-full bg-blue-500"
  style={{'--tw-width': `${((micro.volume || 0) / 10) * 100}%`}}
/>
```

**Effort**: 20 minutes

---

### 18. MacrocycleTimeline Phase Button Not Keyboard Accessible 🟡 MEDIUM
**File**: [MacrocycleTimeline.tsx:98-100](apps/web/components/features/plans/home/MacrocycleTimeline.tsx#L98-L100)

**Issue**: Phase buttons lack ARIA labels and focus styling
```tsx
<button onClick={() => onPhaseClick(...)}>
```

**Impact**:
- Screen readers get no label
- Keyboard users cannot distinguish focused button

**Devices Affected**: All (accessibility)

**Recommended Fix**:
```tsx
<button
  onClick={() => onPhaseClick(...)}
  aria-label={`${phase.name} (${duration} weeks)`}
  className={cn(..., "focus-visible:ring-2")}
>
```

**Effort**: 15 minutes

---

### 19. ExerciseRow Expansion Toggle Lacks Affordance 🟡 MEDIUM
**File**: [ExerciseRow.tsx:109-115](apps/web/components/features/plans/session-planner/components/ExerciseRow.tsx#L109-L115)

**Issue**: Chevron icon toggles expand/collapse but minimal visual feedback

**Impact**: Users may not realize row is clickable

**Devices Affected**: Desktop & Mobile

**Recommended Fix**:
```tsx
<div
  className="flex-1 flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors"
  onClick={() => onToggleExpand(exercise.id)}
>
```

**Effort**: 10 minutes

---

### 20. Chart Legend Has Poor Contrast 🟡 MEDIUM (Accessibility)
**File**: [VolumeIntensityChart.tsx:71-80](apps/web/components/features/plans/home/VolumeIntensityChart.tsx#L71-L80)

**Issue**: Legend uses tiny colored boxes (3x2px volume, 3x0.5px intensity)

**Impact**:
- May not meet WCAG AA contrast (4.5:1)
- Too small to see clearly
- Users with low vision cannot identify series

**Devices Affected**: All (accessibility)

**Recommended Fix**:
```tsx
<div className="flex items-center gap-1.5">
  <div className="w-4 h-3 bg-blue-500 rounded-sm"></div>
  <span className="text-muted-foreground text-xs font-medium">Volume</span>
</div>
```

**Effort**: 20 minutes

---

### 21. Missing Responsive Breakpoints in Workspace 🟡 MEDIUM
**File**: [TrainingPlanWorkspace.tsx](apps/web/components/features/plans/workspace/TrainingPlanWorkspace.tsx)

**Issue**: 3-panel layout doesn't gracefully collapse on tablet

**Impact**: Content cramped on iPad landscape

**Devices Affected**: Tablet (768px - 1024px)

**Recommended Fix**: Add tablet-specific layout

**Effort**: 1 hour

---

## LOW PRIORITY ISSUES (Nice-to-Have)

### 22. TODOs Create Visual Debt 🟢 LOW
**Multiple files with TODO comments**:
- [exercise-dashboard.tsx:118-138](apps/web/components/features/workout/components/exercise/exercise-dashboard.tsx#L118) - Missing toast notifications
- [ExercisePlanningPanel.tsx](apps/web/components/features/plans/workspace/components/ExercisePlanningPanel.tsx) - Missing logic

**Issue**: Incomplete implementation leaves placeholder UI

**Impact**: Users encounter non-working UI

**Devices Affected**: All

**Recommended Fix**: Complete TODO implementations or remove placeholders

**Effort**: Per TODO (tracked in main status audit)

---

### 23. Insufficient Mobile Safe Area Support 🟢 LOW
**File**: [globals.css:313-327](apps/web/app/globals.css#L313-L327)

**Issue**: Safe area utilities exist but not consistently applied

**Impact**: Content may be cut off by iPhone notch or home indicator

**Devices Affected**: iPhone X+ with notch

**Recommended Fix**: Apply `.mobile-safe-area` to all full-screen layouts

**Effort**: 30 minutes

---

### 24. No Dark Mode Testing Documentation 🟢 LOW

**Issue**: Dark mode styles exist but no testing checklist

**Impact**: Potential contrast issues not caught

**Devices Affected**: All (dark mode users)

**Recommended Fix**: Create dark mode testing checklist

**Effort**: 30 minutes (documentation)

---

## SUMMARY & PRIORITIES

### Fix Phases

**Phase 1 (Critical - Do First)**: 7 issues, ~2 hours
1. Mobile chart height responsiveness
2. Chart margins for mobile
3. Exercise row horizontal scroll
4. Z-index conflicts
5. Dialog overflow
6. iOS form input font size
7. Sidebar on tablets

**Phase 2 (High Priority - Do Second)**: 7 issues, ~4 hours
8. Mobile padding consistency
9. Mobile sticky columns
10. Focus visible states (accessibility)
11. Select dropdown widths
12. Chart tooltip touch support
13. Timeline text truncation
14. Touch target sizes (accessibility)

**Phase 3 (Medium Priority - Polish)**: 7 issues, ~3 hours
15-21. Various polish and refinement issues

**Total Effort Estimate**: 9 hours for all issues

---

## RECOMMENDED APPROACH

### Option A: Fix All Critical + High Priority Issues
**Effort**: 6 hours
**Impact**: Resolves all blocking issues + major UX problems
**Recommended**: ✅ Yes, for production readiness

### Option B: Fix Critical Only
**Effort**: 2 hours
**Impact**: Resolves blocking issues, but UX still degraded
**Recommended**: ⚠️ Only if time-constrained

### Option C: Comprehensive Fix (All Issues)
**Effort**: 9 hours
**Impact**: Production-ready with excellent polish
**Recommended**: ✅ Yes, for high-quality launch

---

## TESTING REQUIREMENTS

After fixes, test on:

**Mobile Devices**:
- iPhone SE (320px width)
- iPhone 12/13 (390px width)
- iPhone 14 Pro Max (430px width)

**Tablet Devices**:
- iPad (768px width, portrait)
- iPad Pro (1024px width, landscape)

**Desktop**:
- 1366px (common laptop)
- 1920px (Full HD)
- 2560px (2K)

**Browsers**:
- Chrome (latest)
- Safari iOS (latest)
- Firefox (latest)
- Safari macOS (latest)

**Testing Checklist**:
- [ ] All charts render correctly on mobile
- [ ] No horizontal scroll on any page
- [ ] All modals/dialogs stack correctly
- [ ] All touch targets are 44x44px minimum
- [ ] Focus states visible on all interactive elements
- [ ] Sidebar works on tablet
- [ ] Dark mode contrast meets WCAG AA
- [ ] Forms don't trigger iOS zoom
- [ ] Safe area insets respected on iPhone X+

---

## FILES REQUIRING CHANGES

**High Priority Files** (7 files):
1. [VolumeIntensityChart.tsx](apps/web/components/features/plans/home/VolumeIntensityChart.tsx) - Chart responsive fixes
2. [ExerciseRow.tsx](apps/web/components/features/plans/session-planner/components/ExerciseRow.tsx) - Mobile card width fix
3. [sidebar.tsx](apps/web/components/ui/sidebar.tsx) - Tablet support, focus states
4. [dialog.tsx](apps/web/components/ui/dialog.tsx) - Focus states, overflow
5. [PlansHomeClient.tsx](apps/web/components/features/plans/home/PlansHomeClient.tsx) - Padding, dialog overflow
6. [tailwind.config.ts](apps/web/tailwind.config.ts) - Z-index hierarchy
7. [button.tsx](apps/web/components/ui/button.tsx) - Touch target sizes

**Medium Priority Files** (6 files):
8. [Toolbar.tsx](apps/web/components/features/plans/session-planner/components/Toolbar.tsx)
9. [TrainingPlanWorkspace.tsx](apps/web/components/features/plans/workspace/TrainingPlanWorkspace.tsx)
10. [MacrocycleTimeline.tsx](apps/web/components/features/plans/home/MacrocycleTimeline.tsx)
11. All files with `outline-none` (need focus states)

---

**Report Generated**: December 3, 2025
**Next Action**: Run `/specify` to create fix specification
