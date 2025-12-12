# Research: Frontend Responsive Design Fixes

**Feature**: 001-frontend-responsive-design
**Date**: 2025-12-03
**Phase**: 0 (Research & Decision Log)

---

## Research Questions

All technical unknowns from the Technical Context have been resolved through spec clarification and existing codebase analysis.

---

## Decision Log

### Decision 1: Responsive Chart Heights

**Question**: How should chart heights scale across mobile/tablet/desktop to ensure readability without excessive scrolling?

**Decision**: Use Tailwind responsive height classes: `h-48` (192px) mobile, `h-56` (224px) tablet, `h-64` (256px) desktop

**Rationale**:
- Mobile (< 640px): 192px fits within viewport without scrolling on iPhone SE (667px height)
- Tablet (640-1024px): 224px balances readability with content density on iPad
- Desktop (1024px+): 256px (current height) is appropriate for larger screens
- Uses existing Tailwind breakpoints (sm:, md:) for consistency

**Alternatives Considered**:
- Fixed height (current): Rejected - causes excessive scrolling on mobile
- Viewport-based heights (vh units): Rejected - unpredictable with browser chrome
- Container queries: Rejected - not widely supported, adds complexity

**Implementation**: Change `className="h-64"` to `className="h-48 sm:h-56 md:h-64"` in VolumeIntensityChart.tsx

---

### Decision 2: Chart Margin Scaling

**Question**: How should Recharts margin prop scale to prevent label overlap on small screens?

**Decision**: Responsive margins via hook: 10px mobile, 20px tablet, 30px desktop

**Rationale**:
- iPhone SE (320px width): 30px margins leave only ~260px for chart content, causing label overlap
- Reducing to 10px margins on mobile provides ~300px usable space
- Maintains existing 30px margins on desktop for comfortable spacing
- Requires useWindowSize hook or media query detection

**Alternatives Considered**:
- Fixed margins (current): Rejected - x-axis labels overlap on phones
- CSS-only responsive margins: Rejected - Recharts uses inline props, not CSS
- Remove margins entirely: Rejected - labels would touch container edges

**Implementation**: Add responsive margin calculation:
```typescript
const useResponsiveChartMargins = () => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

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

---

### Decision 3: Focus Indicator Styling

**Question**: What visual style should focus indicators use to meet WCAG 2.1 AA contrast (4.5:1) in both light and dark modes?

**Decision**: Use `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` with `--ring` color from theme

**Rationale**:
- `focus-visible` only shows ring on keyboard navigation (not mouse click)
- 2px ring width is visible without being obtrusive
- `ring-offset-2` creates 2px gap between element and ring for clarity
- Theme variable `--ring` is already designed for accessibility in both light/dark modes (from globals.css)
- shadcn/ui components already use this pattern - maintains consistency

**Alternatives Considered**:
- Outline-only: Rejected - outline-none is removed, need replacement
- Custom border colors: Rejected - theme variables already handle contrast
- Glow effect: Rejected - may not meet WCAG contrast requirements

**Implementation**: Remove all `outline-none` and add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` to interactive elements

---

### Decision 4: Touch Target Sizing

**Question**: How to ensure all interactive elements meet WCAG 2.1 Level AAA minimum 44x44px on mobile?

**Decision**: Use existing `.touch-target` utility class from globals.css (`min-h-[44px] min-w-[44px]`)

**Rationale**:
- globals.css already defines `.touch-target`, `.touch-target-sm`, `.touch-target-lg` utilities
- Applying to icon buttons ensures consistent sizing across app
- Mobile-only application via media query `@media (max-width: 640px)` already in globals.css
- No new CSS needed - just add className

**Alternatives Considered**:
- Inline padding: Rejected - inconsistent, hard to maintain
- New utility class: Rejected - already exists in globals.css
- Larger base button sizes: Rejected - would affect desktop UX negatively

**Implementation**: Add `touch-target` class to icon buttons in Button component (sm variant)

---

### Decision 5: Exercise Card Width on Mobile

**Question**: What width should exercise cards use on mobile to maximize screen usage without forced horizontal scroll?

**Decision**: `w-[calc(100vw-2rem)]` (full viewport width minus 32px total padding)

**Rationale**:
- Current `w-[85vw]` leaves 15% of screen unused, forcing horizontal scroll
- `calc(100vw-2rem)` accounts for 16px padding on each side (from parent container)
- Snap scroll still works with `snap-start` and `snap-x snap-mandatory`
- No horizontal scroll, maximum content visibility

**Alternatives Considered**:
- `w-full`: Rejected - doesn't account for parent padding, causes overflow
- `w-screen`: Rejected - ignores padding, breaks out of container
- `w-[95vw]`: Rejected - still forces horizontal scroll

**Implementation**: Change `w-[85vw]` to `w-[calc(100vw-2rem)]` in ExerciseRow.tsx mobile card layout

---

### Decision 6: Z-Index Hierarchy

**Question**: How to centralize z-index management to prevent sidebar/modal/toast stacking conflicts?

**Decision**: Define z-index scale in tailwind.config.ts theme.extend.zIndex

**Rationale**:
- Current approach uses inline z-index values (z-10, z-50) causing conflicts
- Tailwind config allows named z-index values for semantic clarity
- Prevents accidental conflicts by establishing clear hierarchy
- Easy to reference across all components

**Hierarchy**:
```typescript
zIndex: {
  'sidebar': '10',
  'header': '20',
  'dropdown': '30',
  'tooltip': '40',
  'modal': '50',
  'toast': '60',
}
```

**Alternatives Considered**:
- CSS variables: Rejected - Tailwind config is more discoverable
- Keep inline values: Rejected - no single source of truth
- Auto-incrementing: Rejected - loses semantic meaning

**Implementation**: Add zIndex to tailwind.config.ts, update all components to use `z-sidebar`, `z-modal`, etc.

---

### Decision 7: Dialog Overflow Handling

**Question**: How to ensure dialog content scrolls when exceeding `max-h-[90vh]` on smaller screens?

**Decision**: Add `overflow-y-auto` to DialogContent component

**Rationale**:
- Current `max-h-[90vh]` limits height but doesn't enable scrolling
- Content gets cut off on tablet portrait (768px height) with 10+ athletes
- `overflow-y-auto` shows scrollbar only when needed
- Keeps action buttons visible at bottom (sticky footer pattern)

**Alternatives Considered**:
- Smaller max height: Rejected - reduces usable space on desktop
- Pagination: Rejected - adds complexity for edge case
- Modal body scroll only: Rejected - action buttons would scroll away

**Implementation**: Add `overflow-y-auto` to DialogContent className in dialog.tsx

---

### Decision 8: Browser Testing Execution Strategy

**Question**: How should comprehensive browser tests be structured and executed to ensure "no bugs remaining"?

**Decision**: AI agent on-demand testing with Cursor browser tool + Supabase MCP integration

**Rationale**:
- Cursor's browser tool allows real browser automation with AI-driven interactions
- Supabase MCP server enables database state verification after each operation
- On-demand execution allows interactive debugging when issues are found
- AI agent can adapt test scenarios based on actual UI state (more robust than static Playwright tests)
- Comprehensive coverage: all CRUD operations + edge cases across all 3 pages

**Test Structure**:
1. **Plans Page Tests** (~20 scenarios)
   - Create/read/update/delete macrocycles
   - Create/read/update/delete mesocycles
   - Create/read/update/delete microcycles
   - Assign plan to athletes
   - Verify responsive layout (mobile/tablet/desktop)
   - Edge cases: empty states, deletion with dependencies

2. **Workout Page Tests** (~15 scenarios)
   - Start training session
   - Add performance data (reps, weight, time)
   - Complete session
   - Verify exercise_training_sessions table
   - Edge cases: incomplete sessions, zero data

3. **Session Page Tests** (~20 scenarios)
   - Create exercises in session planner
   - Update set parameters
   - Delete exercises
   - Superset grouping
   - Save session with all exercises
   - Verify exercise_preset_groups and exercise_preset_details tables
   - Edge cases: unsaved changes, empty sessions

4. **Cross-Page Tests** (~10 scenarios)
   - Dialog z-index stacking
   - Focus trap navigation
   - Mobile touch targets
   - Empty states
   - Concurrent edits

**Supabase Verification Pattern**:
```typescript
// After each operation, verify database state
await browser.click('button[type="submit"]');
const dbResult = await supabase.from('macrocycles').select('*').eq('id', newId).single();
expect(dbResult.data).toMatchObject({ name: 'Test Macrocycle', ... });
```

**Alternatives Considered**:
- Playwright automated tests: Rejected - less flexible, requires hardcoded selectors
- Cypress: Rejected - not set up, Cursor browser tool is better for AI-driven testing
- Manual QA only: Rejected - not repeatable, doesn't verify database state

**Implementation**: AI agent will use browser tool to execute tests on-demand after CSS fixes are applied

---

## Summary

All technical decisions are finalized. No unknowns remaining. Ready for Phase 1 (Design & Contracts).

**Key Takeaways**:
- All CSS fixes use existing Tailwind utilities and responsive patterns
- No new dependencies or libraries required
- Browser testing via Cursor + Supabase MCP provides comprehensive verification
- Zero backend changes - purely visual/layout improvements
