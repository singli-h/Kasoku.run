# Testing Checklist - Individual Plan Page Bug Fixes

## Setup
1. Start dev server: `npm run dev:web`
2. Navigate to an individual plan page: `/plans/[id]`
3. Have browser DevTools open (Console + Network tabs)

---

## Fix 1: Exercise Duplication Bug ✅

### Test Steps
1. Navigate to an individual plan page with workouts
2. Find a workout in collapsed state (shows exercise list with "S1, S2..." badges)
3. Click the "Edit" button on the workout
4. **Expected**: Exercise list disappears, SessionPlannerV2 shows with full exercise cards
5. **Bug if**: You see exercises TWICE (collapsed rows + expanded cards)
6. Click "Collapse" button
7. **Expected**: Collapsed exercise rows reappear

### Success Criteria
- [ ] No duplicate exercises when expanded
- [ ] Smooth transition between collapsed/expanded states
- [ ] Edit button works correctly

---

## Fix 2: AI Messages Disappearing Bug ✅

### Test Steps
1. Open AI chat (click FAB or AI button)
2. Send a message that triggers a tool call, e.g., "Add 3 sets of planks"
3. Wait for AI to respond with thinking section
4. Approve the proposal
5. **Expected**: AI message remains visible after approval
6. **Bug if**: AI message vanishes after you click "Apply"

### Success Criteria
- [ ] AI messages persist after tool execution
- [ ] Thinking section remains visible
- [ ] Tool results show in message
- [ ] No blank spaces where messages should be

---

## Fix 3: Redundant "Edit with AI" Buttons Removed ✅

### Test Steps

**Desktop:**
1. View plan page on desktop (>768px width)
2. Look at the left sidebar
3. **Expected**: Only "Edit Block" button visible
4. **Bug if**: You see "Edit with AI" or sparkles button

**Mobile:**
1. View plan page on mobile (<768px width)
2. Look at header buttons
3. **Expected**: Settings icon and Edit Block icon only
4. **Bug if**: You see sparkles icon button

### Success Criteria
- [ ] No "Edit with AI" button on desktop sidebar
- [ ] No sparkles icon on mobile header
- [ ] "Edit Block" button still works
- [ ] FAB (floating action button) still visible in bottom-right

---

## Fix 4: AI Expand Feature ✅

### Test Steps - Desktop

1. Open AI sidebar (click FAB)
2. **Expected**: Sidebar shows on right (400px width)
3. Look for expand button (maximize icon) in header
4. **Expected**: Maximize button visible next to pin/close buttons
5. Click the maximize button
6. **Expected**:
   - Week sidebar on left disappears
   - AI expands to full width
   - "Back to Plan" button appears on left
   - Maximize button becomes minimize button
   - Content centered with max-width
7. Click "Back to Plan" or minimize button
8. **Expected**: Returns to normal sidebar view

### Test Steps - Mobile

1. Open AI drawer (click FAB)
2. **Expected**: Drawer slides up from bottom (85vh height)
3. Look for expand button in header
4. Click expand button
5. **Expected**:
   - Drawer becomes full screen (100vh)
   - Rounded corners disappear
   - Drag handle hidden
   - "Back to Plan" button appears
6. Click "Back to Plan" or minimize
7. **Expected**: Returns to drawer view

### Success Criteria
- [ ] Expand button visible in collapsed state
- [ ] Desktop: Week sidebar hides when expanded
- [ ] Desktop: AI takes full viewport width
- [ ] Mobile: Drawer becomes full screen
- [ ] "Back to Plan" button works
- [ ] Minimize button collapses back
- [ ] Content constrained to max-w-4xl when expanded
- [ ] Smooth animation transitions

---

## Fix 5: Empty Sets Bug ✅

### Test Steps

1. Find or create an exercise with NO sets defined
2. **Expected**: Shows "No sets yet — tap to add" with amber dot
3. **Bug if**: Shows blank/empty space or breaks layout
4. Find an exercise WITH sets
5. **Expected**: Shows "S1, S2, S3..." badges normally

### Success Criteria
- [ ] Empty exercises show fallback message
- [ ] Amber indicator dot visible
- [ ] Message is clear and actionable
- [ ] Clicking row still opens edit dialog
- [ ] Exercises with sets render normally

---

## Cross-Feature Integration Tests

### AI Expand + Exercise Edit
1. Open AI sidebar
2. Expand to full width
3. Try editing a workout
4. **Expected**: Both work independently without conflicts

### AI Messages + Empty Sets
1. Open AI chat
2. Request to add sets to an exercise with no sets
3. Verify AI message persists after approval
4. Verify sets appear correctly

### Mobile Responsiveness
1. Test on multiple viewport sizes:
   - Mobile: 375px, 414px
   - Tablet: 768px, 1024px
   - Desktop: 1280px, 1920px
2. Verify all fixes work across breakpoints

---

## Regression Checks

### Existing Features (Should Still Work)

- [ ] Week selector navigation
- [ ] Day pills (Mon, Wed, Fri, etc.)
- [ ] Exercise expand/collapse in SessionPlannerV2
- [ ] Drag-and-drop exercise reordering
- [ ] Set completion checkboxes
- [ ] Advanced fields toggle
- [ ] Inline AI proposals
- [ ] Pin sidebar functionality
- [ ] Speech recognition (mic button)

---

## Known Issues from Code Review

### Accessibility Warning (Not Blocking)
- Expand/collapse buttons use `title` instead of `aria-label`
- Screen readers may not announce button purpose clearly
- Low priority - doesn't affect visual users

---

## Console Errors to Watch For

Open Browser DevTools → Console and check for:
- [ ] No React key warnings
- [ ] No TypeScript errors
- [ ] No "Cannot read property of undefined" errors
- [ ] No infinite re-render loops
- [ ] No hydration mismatches

---

## Performance Checks

- [ ] Expand/collapse animation is smooth (60fps)
- [ ] No layout shift when toggling states
- [ ] AI messages render without lag
- [ ] Exercise list scrolls smoothly

---

## Test Data Needed

To fully test, you need:
1. A plan with multiple weeks
2. Workouts with exercises
3. Some exercises with sets, some without
4. Access to AI chat functionality

---

## Pass/Fail Criteria

**PASS** if:
- All 5 fixes work as documented
- No new bugs introduced
- Performance is acceptable
- Console shows no critical errors

**FAIL** if:
- Any original bug still reproduces
- New regression bugs appear
- Critical console errors
- Major UX issues

---

## Reporting Issues

If you find bugs, document:
1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Screenshots/video** (if applicable)
5. **Console errors**
6. **Browser/device info**

---

## Quick Smoke Test (5 min)

If short on time, test these critical paths:
1. ✅ Open plan → Click workout Edit → No duplicates
2. ✅ Open AI → Send message → Message persists
3. ✅ Check sidebar → No "Edit with AI" button
4. ✅ Open AI → Click expand → Full width works
5. ✅ Find exercise with no sets → Shows fallback message
