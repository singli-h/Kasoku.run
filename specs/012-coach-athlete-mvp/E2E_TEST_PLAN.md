# Coach/Athlete MVP Production Readiness — E2E Browser Test Plan

**Feature**: Coach/Athlete MVP (012)
**Tool**: `agent-browser` CLI (headless accessibility-tree testing)
**Auth Method**: Clerk Sign-In Token API (programmatic, no manual login)
**Branch**: `pm/spec012-coach-athlete-mvp`

---

## Authentication Setup (Multi-Role Sessions)

Each role uses a separate `--session` flag for cookie/storage isolation. Auth is programmatic via Clerk's Backend API sign-in tokens.

```bash
# === COACH SESSION ===
COACH_TOKEN=$(curl -s -X POST https://api.clerk.com/v1/sign_in_tokens \
  -H "Authorization: Bearer $CLERK_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user_38BYmyd498J2OYivVToBBAscotj"}')
COACH_URL=$(echo "$COACH_TOKEN" | jq -r '.url')
agent-browser --session coach open "$COACH_URL"

# === INDIVIDUAL SESSION ===
INDIV_TOKEN=$(curl -s -X POST https://api.clerk.com/v1/sign_in_tokens \
  -H "Authorization: Bearer $CLERK_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user_39fGg3ukH1F2ss0AEONCIEmiPGe"}')
INDIV_URL=$(echo "$INDIV_TOKEN" | jq -r '.url')
agent-browser --session individual open "$INDIV_URL"

# === ATHLETE SESSION (use Kim Wong after she's been invited and promoted) ===
ATHLETE_TOKEN=$(curl -s -X POST https://api.clerk.com/v1/sign_in_tokens \
  -H "Authorization: Bearer $CLERK_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user_38BBsTh64BoqRU0TDKeJP9NITL0"}')
ATHLETE_URL=$(echo "$ATHLETE_TOKEN" | jq -r '.url')
agent-browser --session athlete open "$ATHLETE_URL"
```

### Test Users

| Persona | Name | Email | Clerk ID | DB user_id | Role | Coach ID | Athlete ID | Group |
|---------|------|-------|----------|-----------|------|----------|------------|-------|
| Coach | Kim Coach | sing.kim2023@gmail.com | `user_38BYmyd498J2OYivVToBBAscotj` | 21 | coach | 6 | 13 | — |
| Individual | Kimmy Bear | ms.kimmy.bear@gmail.com | `user_39fGg3ukH1F2ss0AEONCIEmiPGe` | 23 | individual | — | 15 | — |
| Invite Target | Kim Wong | kim.sing.canada@gmail.com | `user_38BBsTh64BoqRU0TDKeJP9NITL0` | 13 | individual | — | 6 | — |
| DO NOT TOUCH | Sing Li | singli.hk@gmail.com | `user_2wwjAKlTnCDri0VPt3SMjAejEki` | 1 | coach | 1 | 1 | 1 (OG) |

**Synthetic test athletes** (all in group 1, coach Sing Li — read-only reference):

| Name | DB user_id | Athlete ID | Group |
|------|-----------|------------|-------|
| Alex Chen | 28 | 17 | 1 |
| Maya Johnson | 29 | 18 | 1 |
| Ryan Park | 30 | 19 | 1 |

### Pre-Test Setup

Before running Suite A (Invite Flow), Kim Coach (coach_id=6) needs an athlete group:

```bash
# Create athlete group for Kim Coach via Supabase MCP or PostgREST
curl -s -X POST "$SUPABASE_URL/rest/v1/athlete_groups" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"coach_id": 6, "group_name": "Sprint Squad"}'
# Record the returned group ID as $COACH_GROUP_ID
```

---

## Test Suite Overview

| Suite | Focus | Tests | Priority | Roles | Est. Time |
|-------|-------|-------|----------|-------|-----------|
| A | Invite Flow (US2) | 14 | P0 | Coach + New Athlete | 25 min |
| B | Athlete Program View (US1) | 10 | P0 | Athlete | 15 min |
| C | Plan Deletion (US3) | 12 | P0 | Coach + Athlete | 20 min |
| D | Workout UX (US12, US13, US14) | 16 | P1 | Athlete | 25 min |
| E | Coach Athlete Profile (US4) | 10 | P1 | Coach | 15 min |
| F | Stats & Data Fixes (US5, US8) | 12 | P0 | All roles | 20 min |
| G | Workspace Persistence (US9, US10) | 12 | P1 | Coach | 20 min |
| H | Cleanup Verification (US5b, US6) | 18 | P1 | All roles | 20 min |
| I | Cross-Role Flows (E2E journeys) | 8 | P1 | Coach + Athlete | 20 min |
| J | Edge Cases & Regressions | 10 | P2 | All roles | 15 min |
| **TOTAL** | | **122** | | | **~3.25 hours** |

---

## Suite A: Invite Flow (US2) — P0

**Prerequisites**: Coach session authenticated, coach has at least one athlete group.

### A.1 — Coach Opens Invite Dialog

**Steps**:
```bash
agent-browser --session coach open http://localhost:3000/athletes
agent-browser --session coach snapshot -i -c
# Look for "Invite Athlete" button
agent-browser --session coach click @invite-athlete-button
agent-browser --session coach snapshot -i -c
```
**Verify**: Dialog opens with email input field, group selector dropdown, and "Send Invitation" button
**Deep**: Group selector shows Kim Coach's groups (e.g., "Sprint Squad")

### A.2 — Coach Invites Unknown Email (Path B — New User)

**Steps**:
```bash
# Fill email that doesn't exist in DB
agent-browser --session coach fill @email-input "new.test.athlete@example.com"
# Select group
agent-browser --session coach click @group-selector
agent-browser --session coach click @group-option-sprint-squad
agent-browser --session coach click @send-invitation-button
agent-browser --session coach snapshot -i -c
```
**Verify**: Success toast "Invitation sent", dialog closes
**Deep**: Verify via Clerk API that invitation was created:
```bash
curl -s "https://api.clerk.com/v1/invitations?query=new.test.athlete@example.com" \
  -H "Authorization: Bearer $CLERK_SECRET_KEY" | jq '.[0].status'
# Expected: "pending"
```

### A.3 — Coach Invites Existing Individual User (Path A — Role Promotion)

**Steps**:
```bash
agent-browser --session coach fill @email-input "kim.sing.canada@gmail.com"
agent-browser --session coach click @group-selector
agent-browser --session coach click @group-option-sprint-squad
agent-browser --session coach click @send-invitation-button
agent-browser --session coach snapshot -i -c
```
**Verify**: Success toast indicates existing user will be promoted
**Deep**: Verify DB — Kim Wong's role should now be 'athlete' and athlete_group_id set:
```bash
curl -s "$SUPABASE_URL/rest/v1/users?id=eq.13&select=role" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq '.[0].role'
# Expected: "athlete"

curl -s "$SUPABASE_URL/rest/v1/athletes?user_id=eq.13&select=athlete_group_id" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq '.[0].athlete_group_id'
# Expected: $COACH_GROUP_ID
```

### A.4 — Coach Invites Existing Coach → Role NOT Changed

**Steps**:
```bash
# Use the coach's own email or another coach's email
agent-browser --session coach fill @email-input "sing.kim2023@gmail.com"
agent-browser --session coach click @send-invitation-button
agent-browser --session coach snapshot -i -c
```
**Verify**: Error or info toast: coach role is not changed/demoted
**Deep**: DB role still 'coach':
```bash
curl -s "$SUPABASE_URL/rest/v1/users?id=eq.21&select=role" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq '.[0].role'
# Expected: "coach"
```

### A.5 — New User Accepts Invitation → Accept-Invitation Page

**Steps**:
```bash
# Get invitation ticket from Clerk API
TICKET=$(curl -s "https://api.clerk.com/v1/invitations?query=new.test.athlete@example.com" \
  -H "Authorization: Bearer $CLERK_SECRET_KEY" | jq -r '.[0].id')

# Navigate to accept-invitation page with ticket
agent-browser --session new-athlete open "http://localhost:3000/accept-invitation?__clerk_ticket=$TICKET"
agent-browser --session new-athlete snapshot -i -c
```
**Verify**: Accept-invitation page renders with Clerk SignUp component
**Deep**: Page shows sign-up form pre-filled with the invited email

### A.6 — After Signup, Onboarding Shows LOCKED Athlete Role

**Steps**:
```bash
# After completing signup, user should be redirected to onboarding
agent-browser --session new-athlete snapshot -i -c
# Navigate to onboarding if not auto-redirected
agent-browser --session new-athlete open http://localhost:3000/onboarding
agent-browser --session new-athlete snapshot -i -c
```
**Verify**: Role selection step shows ONLY athlete card (not coach or individual), role is locked
**Absent**: Coach card, Individual card, ability to change role

### A.7 — Cannot Change Locked Role

**Steps**:
```bash
# Try clicking where other role cards would be
agent-browser --session new-athlete snapshot -i -c
# Verify only one role card is visible and it's pre-selected
```
**Verify**: Only "Athlete" role card visible, already selected, no toggle possible
**Deep**: The continue/next button is enabled without requiring a click on the card

### A.8 — Complete Onboarding → RPC Called with p_group_id

**Steps**:
```bash
# Fill athlete onboarding fields
agent-browser --session new-athlete fill @height-input "175"
agent-browser --session new-athlete fill @weight-input "70"
# Complete remaining steps and submit
agent-browser --session new-athlete click @complete-button
agent-browser --session new-athlete snapshot -i -c
```
**Verify**: Onboarding completes, user redirected to /dashboard
**Deep**: DB verification:
```bash
# Check user record
curl -s "$SUPABASE_URL/rest/v1/users?email=eq.new.test.athlete@example.com&select=id,role,onboarding_completed" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
# Expected: role='athlete', onboarding_completed=true

# Check athlete record has group assignment
curl -s "$SUPABASE_URL/rest/v1/athletes?user_id=eq.NEW_USER_ID&select=id,athlete_group_id" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
# Expected: athlete_group_id=$COACH_GROUP_ID

# Check audit trail
curl -s "$SUPABASE_URL/rest/v1/athlete_group_histories?group_id=eq.$COACH_GROUP_ID&select=*&order=created_at.desc&limit=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
# Expected: notes='Joined via invitation link'
```

### A.9 — Athlete Lands on Dashboard After Onboarding

**Steps**:
```bash
agent-browser --session new-athlete get url
agent-browser --session new-athlete snapshot -i -c
```
**Verify**: URL is `/dashboard`, page shows athlete-appropriate content
**Absent**: Coach-specific elements (athlete management, group creation)

### A.10 — lookup_user_for_invite RPC Only Callable by Coaches

**Steps**:
```bash
# Call RPC as non-coach user (Kimmy Bear, individual role)
curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/lookup_user_for_invite" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $INDIVIDUAL_JWT" \
  -H "Content-Type: application/json" \
  -d '{"email_input": "test@example.com"}'
# Expected: Error "Only coaches can look up users for invitations"
```
**Verify**: RPC rejects non-coach callers with permission error
**Deep**: Same call with coach JWT should succeed (return empty or matching user)

### A.11 — Invalid groupId in Metadata → Gracefully Ignored

**Steps**:
```bash
# Set invalid groupId in Clerk metadata for a test user
curl -s -X PATCH "https://api.clerk.com/v1/users/user_38BBsTh64BoqRU0TDKeJP9NITL0" \
  -H "Authorization: Bearer $CLERK_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"public_metadata": {"groupId": 99999, "role": "athlete"}}'

# Trigger onboarding flow for this user
# Expected: onboarding completes, athlete_group_id remains null (invalid group ignored)
```
**Verify**: Onboarding succeeds without error, athlete_group_id is null
**Deep**: Console has warning log about invalid groupId

### A.12 — Verify Clerk publicMetadata After Invite

**Steps**:
```bash
# After A.3, check Kim Wong's Clerk metadata
curl -s "https://api.clerk.com/v1/users/user_38BBsTh64BoqRU0TDKeJP9NITL0" \
  -H "Authorization: Bearer $CLERK_SECRET_KEY" | jq '.public_metadata'
```
**Verify**: `public_metadata` contains `{ groupId: $COACH_GROUP_ID, coachId: 6, role: "athlete" }`

### A.13 — Session Auth Handler Forwards groupId Without Error

**Steps**:
```bash
agent-browser --session athlete open "http://localhost:3000/auth/session?groupId=123"
agent-browser --session athlete snapshot -i -c
```
**Verify**: No error, page redirects normally (groupId is a passthrough parameter)

### A.14 — Onboarding Interrupted → State Preserved on Resume

**Steps**:
```bash
# Start onboarding, fill some fields, then navigate away
agent-browser --session new-athlete open http://localhost:3000/onboarding
agent-browser --session new-athlete fill @height-input "180"
# Navigate away
agent-browser --session new-athlete open http://localhost:3000/dashboard
# Come back
agent-browser --session new-athlete open http://localhost:3000/onboarding
agent-browser --session new-athlete snapshot -i -c
```
**Verify**: Previously filled fields are preserved (height still shows 180)

---

## Suite B: Athlete Program View (US1) — P0

**Prerequisites**: Athlete session authenticated, athlete has an assigned plan via coach.

### B.1 — Athlete Sees "My Program" in Sidebar

**Steps**:
```bash
agent-browser --session athlete open http://localhost:3000/dashboard
agent-browser --session athlete snapshot -i -c
```
**Verify**: Sidebar contains "My Program" or "Program" navigation item
**Absent**: "Plans" workspace link (coach-only)

### B.2 — Navigate to /program → Plan Details Shown

**Steps**:
```bash
agent-browser --session athlete open http://localhost:3000/program
agent-browser --session athlete snapshot -i -c
```
**Verify**: Page shows plan name, current week indicator, session list for the week
**Deep**: Plan name matches the macrocycle assigned to athlete's group

### B.3 — Sessions Show Correct Status Icons

**Steps**:
```bash
agent-browser --session athlete snapshot -i -c
```
**Verify**: Each session in the list shows appropriate status:
- Completed sessions: checkmark or "completed" indicator
- Assigned sessions: circle or "assigned" indicator
- Ongoing sessions: clock or "ongoing" indicator

### B.4 — No Plan Assigned → Empty State

**Steps**:
```bash
# Use Kimmy Bear (individual, no plan assigned)
agent-browser --session individual open http://localhost:3000/program
agent-browser --session individual snapshot -i -c
```
**Verify**: Empty state message: "No training plan assigned yet" or similar
**Absent**: Broken layout, error messages, loading spinner stuck

### B.5 — Athlete Cannot Access /plans Workspace (Role Guard)

**Steps**:
```bash
agent-browser --session athlete open http://localhost:3000/plans
agent-browser --session athlete get url
agent-browser --session athlete snapshot -i -c
```
**Verify**: Redirected away from /plans or shown access denied
**Deep**: URL should NOT be /plans after redirect

### B.6 — Current Week Calculated Correctly

**Steps**:
```bash
agent-browser --session athlete open http://localhost:3000/program
agent-browser --session athlete snapshot -i -c
```
**Verify**: "Week X" indicator matches the current date relative to microcycle start dates
**Deep**: Compare with DB microcycle date ranges

### B.7 — Next Week Sessions Visible

**Steps**:
```bash
# Navigate or scroll to see next week
agent-browser --session athlete snapshot -i -c
```
**Verify**: Next week's sessions are accessible (via tab, scroll, or navigation)

### B.8 — Non-Athlete Role Blocked from /program

**Steps**:
```bash
agent-browser --session coach open http://localhost:3000/program
agent-browser --session coach get url
```
**Verify**: Coach is redirected away or shown appropriate message (program is athlete-only)

### B.9 — Skeleton Loading During Page Load

**Steps**:
```bash
agent-browser --session athlete open http://localhost:3000/program
# Capture immediately before data loads
agent-browser --session athlete screenshot /tmp/e2e/012/B9-loading.png
```
**Verify**: Skeleton placeholders shown during loading (not text "Loading...")

### B.10 — Page Refresh Preserves State

**Steps**:
```bash
agent-browser --session athlete open http://localhost:3000/program
agent-browser --session athlete snapshot -i -c
# Capture state
agent-browser --session athlete open http://localhost:3000/program
agent-browser --session athlete snapshot -i -c
```
**Verify**: Same plan, same week, same session list after refresh

---

## Suite C: Plan Deletion (US3) — P0

**Prerequisites**: Coach session authenticated, coach has at least one plan (macrocycle).

### C.1 — Delete Dropdown Item Is Enabled

**Steps**:
```bash
agent-browser --session coach open http://localhost:3000/plans
agent-browser --session coach snapshot -i -c
# Click plan action menu (three dots / kebab menu)
agent-browser --session coach click @plan-action-menu
agent-browser --session coach snapshot -i -c
```
**Verify**: "Delete" menu item is visible and enabled (not grayed out)

### C.2 — Duplicate/Export Items NOT in Dropdown

**Steps**:
```bash
# Continue from C.1 snapshot
agent-browser --session coach snapshot -i -c
```
**Verify**: Dropdown does NOT contain "Duplicate" or "Export" items
**Absent**: "Duplicate", "Export", "Clone"

### C.3 — Click Delete → Dialog Shows Plan Name

**Steps**:
```bash
agent-browser --session coach click @delete-menu-item
agent-browser --session coach snapshot -i -c
```
**Verify**: AlertDialog opens showing the plan name in the confirmation message

### C.4 — Plan with 0 Assignments → Delete Button Enabled

**Steps**:
```bash
# Create or find a plan with no athlete assignments
agent-browser --session coach snapshot -i -c
```
**Verify**: Delete confirmation button is enabled, no assignment warnings shown

### C.5 — Delete Unassigned Plan → Success Toast

**Steps**:
```bash
agent-browser --session coach click @confirm-delete-button
agent-browser --session coach snapshot -i -c
```
**Verify**: Success toast "Plan deleted successfully" or similar, plan removed from list
**Deep**: DB verification:
```bash
curl -s "$SUPABASE_URL/rest/v1/macrocycles?id=eq.$DELETED_PLAN_ID" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
# Expected: empty array []
```

### C.6 — Plan with Assignments → Shows Warning Count

**Steps**:
```bash
# Open delete dialog for plan assigned to athletes
agent-browser --session coach click @plan-action-menu-assigned
agent-browser --session coach click @delete-menu-item
agent-browser --session coach snapshot -i -c
```
**Verify**: Dialog shows "assigned to N athlete(s)" warning message

### C.7 — Athlete Names Shown in Assignment Warning

**Steps**:
```bash
agent-browser --session coach snapshot -i -c
```
**Verify**: Individual athlete names listed in the warning (not just a count)

### C.8 — "Remove All Assignments" → Cancels Assigned Logs

**Steps**:
```bash
agent-browser --session coach click @remove-assignments-button
agent-browser --session coach snapshot -i -c
```
**Verify**: Assignments removed, delete button now enabled
**Deep**: DB verification:
```bash
curl -s "$SUPABASE_URL/rest/v1/workout_logs?session_plan_id=in.($SESSION_PLAN_IDS)&select=session_status" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
# Expected: all session_status='cancelled' (not 'assigned')
```

### C.9 — Verify DB: Cancelled Workout Logs After Assignment Removal

**Steps**:
```bash
# Direct DB query after C.8
curl -s "$SUPABASE_URL/rest/v1/workout_logs?session_plan_id=in.($SESSION_PLAN_IDS)&session_status=eq.assigned" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```
**Verify**: Zero rows with session_status='assigned' for this plan's sessions
**Deep**: Rows exist with session_status='cancelled'

### C.10 — Delete Plan with Completed Sessions → Logs Survive

**Steps**:
```bash
# Delete a plan that has completed workout_logs
agent-browser --session coach click @confirm-delete-button
agent-browser --session coach snapshot -i -c
```
**Verify**: Plan deleted successfully
**Deep**: DB verification — workout logs survive with session_plan_id=NULL:
```bash
curl -s "$SUPABASE_URL/rest/v1/workout_logs?athlete_id=eq.$ATHLETE_ID&session_plan_id=is.null&session_status=eq.completed&select=id" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
# Expected: completed logs still exist with session_plan_id=null
```

### C.11 — Plans List Refreshes After Delete

**Steps**:
```bash
agent-browser --session coach snapshot -i -c
```
**Verify**: Deleted plan no longer appears in the plans list, no stale entry

### C.12 — revalidatePath Fires (Verify via Navigation)

**Steps**:
```bash
# Navigate away and back
agent-browser --session coach open http://localhost:3000/dashboard
agent-browser --session coach open http://localhost:3000/plans
agent-browser --session coach snapshot -i -c
```
**Verify**: Plans list still correct (revalidation worked), deleted plan not shown

---

## Suite D: Workout UX (US12, US13, US14) — P1

**Prerequisites**: Athlete session with at least one assigned session.

### D.1 — Skeleton Loading (Not Text)

**Steps**:
```bash
agent-browser --session athlete open http://localhost:3000/workout
agent-browser --session athlete screenshot /tmp/e2e/012/D1-loading.png
```
**Verify**: Skeleton placeholders shown during load
**Absent**: "Loading workouts..." text, spinner with text

### D.2 — "View History" Link Visible and Navigates

**Steps**:
```bash
agent-browser --session athlete open http://localhost:3000/workout
agent-browser --session athlete snapshot -i -c
agent-browser --session athlete click @view-history-link
agent-browser --session athlete get url
```
**Verify**: "View History" link visible, navigates to `/workout/history`

### D.3 — Skip Button Visible on NextSessionCard

**Steps**:
```bash
agent-browser --session athlete open http://localhost:3000/workout
agent-browser --session athlete snapshot -i -c
```
**Verify**: "Skip" button visible on the next session card (for assigned sessions)

### D.4 — Click Skip → AlertDialog Confirmation

**Steps**:
```bash
agent-browser --session athlete click @skip-button
agent-browser --session athlete snapshot -i -c
```
**Verify**: AlertDialog opens with skip confirmation message
**Absent**: Native browser confirm() dialog (no `window.confirm`)

### D.5 — Confirm Skip → Session Cancelled, List Refreshes

**Steps**:
```bash
agent-browser --session athlete click @confirm-skip-button
agent-browser --session athlete snapshot -i -c
```
**Verify**: Session removed from list or marked as skipped, success toast shown
**Deep**: DB verification:
```bash
curl -s "$SUPABASE_URL/rest/v1/workout_logs?id=eq.$SKIPPED_LOG_ID&select=session_status" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
# Expected: session_status='cancelled'
```

### D.6 — Ongoing Sessions Shown Regardless of Date

**Steps**:
```bash
agent-browser --session athlete open http://localhost:3000/workout
agent-browser --session athlete snapshot -i -c
```
**Verify**: Any session with status='ongoing' is visible regardless of its date_time

### D.7 — Assigned Sessions Filtered to ±7 Days

**Steps**:
```bash
agent-browser --session athlete snapshot -i -c
```
**Verify**: Only assigned sessions within ±7 days of today are shown
**Deep**: Assigned sessions outside this window should not appear

### D.8 — Start Workout → Navigate to /workout/[id]

**Steps**:
```bash
agent-browser --session athlete click @start-workout-button
agent-browser --session athlete get url
agent-browser --session athlete snapshot -i -c
```
**Verify**: URL matches `/workout/[uuid]`, exercise list shown

### D.9 — Complete Workout → Navigate Back to /workout

**Steps**:
```bash
# Complete all exercises/sets in the workout
agent-browser --session athlete click @complete-workout-button
agent-browser --session athlete get url
```
**Verify**: Redirected to `/workout` (post-completion navigation), success toast shown
**Deep**: Not staying on the completed workout page

### D.10 — Weight Input Shows kg, Placeholder "60"

**Steps**:
```bash
# Start a workout and look at set inputs
agent-browser --session athlete open http://localhost:3000/workout/$WORKOUT_ID
agent-browser --session athlete snapshot -i -c
```
**Verify**: Weight input placeholder is "60" (sensible kg value)
**Absent**: "135" (lbs-centric placeholder), "lbs" label

### D.11 — Rest Timer Input NOT Visible

**Steps**:
```bash
agent-browser --session athlete snapshot -i -c
```
**Verify**: No rest timer input field in exercise/set rows
**Absent**: "Rest" input, timer controls

### D.12 — Session Duration Calculated from Timestamps

**Steps**:
```bash
# Open a completed session details
agent-browser --session athlete open http://localhost:3000/workout
agent-browser --session athlete click @completed-session
agent-browser --session athlete snapshot -i -c
```
**Verify**: Duration shown (e.g., "45 min") calculated from started_at/completed_at
**Edge**: If timestamps missing → duration hidden (not "0 min")

### D.13 — Skip Already-Completed Session → Not Possible

**Steps**:
```bash
agent-browser --session athlete snapshot -i -c
```
**Verify**: No skip button on completed sessions

### D.14 — Multiple Sessions Same Day → All Shown

**Steps**:
```bash
agent-browser --session athlete snapshot -i -c
```
**Verify**: If multiple sessions assigned to today, all are visible

### D.15 — No Session Today → Appropriate Message

**Steps**:
```bash
agent-browser --session athlete open http://localhost:3000/workout
agent-browser --session athlete snapshot -i -c
```
**Verify**: Appropriate empty state message when no sessions for today

### D.16 — History Page Accessible and Shows Past Workouts

**Steps**:
```bash
agent-browser --session athlete open http://localhost:3000/workout/history
agent-browser --session athlete snapshot -i -c
```
**Verify**: Page loads, past completed workouts listed

---

## Suite E: Coach Athlete Profile (US4) — P1

**Prerequisites**: Coach session, at least one athlete in coach's group.

### E.1 — Navigate to /athletes/[id] → Plan Summary Section

**Steps**:
```bash
agent-browser --session coach open http://localhost:3000/athletes
agent-browser --session coach snapshot -i -c
# Click on an athlete
agent-browser --session coach click @athlete-row
agent-browser --session coach snapshot -i -c
```
**Verify**: Athlete profile page loads with plan summary section visible

### E.2 — Plan Name, Current Week, Completion Rate Shown

**Steps**:
```bash
agent-browser --session coach snapshot -i -c
```
**Verify**: Plan summary shows: plan name, current week, completion rate percentage

### E.3 — Completion Rate Is Stable (Not Random)

**Steps**:
```bash
# Load page 3 times, capture completion rate each time
agent-browser --session coach open http://localhost:3000/athletes/$ATHLETE_ID
agent-browser --session coach snapshot -i -c
# Record rate
agent-browser --session coach open http://localhost:3000/athletes/$ATHLETE_ID
agent-browser --session coach snapshot -i -c
# Record rate
agent-browser --session coach open http://localhost:3000/athletes/$ATHLETE_ID
agent-browser --session coach snapshot -i -c
```
**Verify**: Completion rate is identical across all 3 loads
**Absent**: Random values (Math.random), values changing between refreshes

### E.4 — "View Plan" Links to Athlete's Assigned Plan

**Steps**:
```bash
agent-browser --session coach click @view-plan-link
agent-browser --session coach get url
```
**Verify**: URL navigates to the correct plan page for the athlete's assigned macrocycle

### E.5 — "View Workout History" Link

**Steps**:
```bash
agent-browser --session coach open http://localhost:3000/athletes/$ATHLETE_ID
agent-browser --session coach click @view-workout-history-link
agent-browser --session coach get url
```
**Verify**: URL navigates to workout history filtered for this athlete

### E.6 — "View Group" Links to /athletes

**Steps**:
```bash
agent-browser --session coach open http://localhost:3000/athletes/$ATHLETE_ID
agent-browser --session coach click @view-group-link
agent-browser --session coach get url
```
**Verify**: URL navigates to /athletes (group management page)

### E.7 — Zero "Coming Soon" Text

**Steps**:
```bash
agent-browser --session coach open http://localhost:3000/athletes/$ATHLETE_ID
agent-browser --session coach snapshot -i -c
```
**Verify**: No text containing "coming soon" anywhere on the page
**Absent**: "coming soon", "Coming Soon", "COMING SOON"

### E.8 — "Send Message" Button NOT Visible

**Steps**:
```bash
agent-browser --session coach snapshot -i -c
```
**Verify**: No "Send Message" or messaging-related buttons
**Absent**: "Send Message", "Message", "Chat"

### E.9 — Athlete with No Plan → "No Plan Assigned"

**Steps**:
```bash
# Navigate to an athlete who has no assigned plan
agent-browser --session coach open http://localhost:3000/athletes/$NO_PLAN_ATHLETE_ID
agent-browser --session coach snapshot -i -c
```
**Verify**: Shows "No Plan Assigned" or similar empty state in plan summary

### E.10 — Athlete with No Workouts → Completion Rate 0%

**Steps**:
```bash
agent-browser --session coach snapshot -i -c
```
**Verify**: Completion rate shows 0% (not undefined, NaN, or blank)

---

## Suite F: Stats & Data Fixes (US5, US8) — P0

**Prerequisites**: Sessions authenticated for all roles.

### F.1 — Profile Completion Rate Stable Across 3 Loads

**Steps**:
```bash
agent-browser --session coach open http://localhost:3000/athletes/$ATHLETE_ID
agent-browser --session coach snapshot -i -c
# Note completion rate
agent-browser --session coach open http://localhost:3000/athletes/$ATHLETE_ID
agent-browser --session coach snapshot -i -c
# Note completion rate
agent-browser --session coach open http://localhost:3000/athletes/$ATHLETE_ID
agent-browser --session coach snapshot -i -c
```
**Verify**: Rate identical all 3 times (no Math.random)

### F.2 — Completion Rate Matches Actual workout_logs Count

**Steps**:
```bash
# Get DB counts
curl -s "$SUPABASE_URL/rest/v1/workout_logs?athlete_id=eq.$ATHLETE_ID&session_status=eq.completed&select=id" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Prefer: count=exact"
# Compare with displayed rate
```
**Verify**: Displayed completion % = (completed logs / total assigned+completed logs) * 100

### F.3 — Weekly Streak Hidden (Not Showing 0)

**Steps**:
```bash
agent-browser --session individual open http://localhost:3000/dashboard
agent-browser --session individual snapshot -i -c
```
**Verify**: Weekly streak not displayed when value is 0
**Absent**: "0 week streak", "Weekly Streak: 0"

### F.4 — Years Experience ≥1 Shown, <1 Hidden

**Steps**:
```bash
agent-browser --session coach open http://localhost:3000/dashboard
agent-browser --session coach snapshot -i -c
```
**Verify**: If coach account is ≥1 year old, shows "X years experience". If <1 year, section is hidden
**Deep**: Calculation uses millisecond-based math (365.25 days/year), not year subtraction

### F.5 — Personal Bests Show Exercise Names (Not IDs)

**Steps**:
```bash
agent-browser --session individual open http://localhost:3000/performance
agent-browser --session individual snapshot -i -c
```
**Verify**: Personal bests display human-readable exercise names
**Absent**: "Exercise ID: X", raw database IDs

### F.6 — PB "Add" Buttons Removed

**Steps**:
```bash
agent-browser --session individual snapshot -i -c
```
**Verify**: No "Add Personal Best" or "+" buttons in PB section
**Absent**: "Add", "+", "Create" buttons for PBs

### F.7 — PB "Edit" Toast Removed

**Steps**:
```bash
# If any edit action exists, click it
agent-browser --session individual snapshot -i -c
```
**Verify**: No edit/toast functionality for personal bests
**Absent**: "Edit" buttons, toast notifications about PB editing

### F.8 — Plan Wizard Saves Sessions with Correct microcycleId

**Steps**:
```bash
# Create a plan via wizard and verify sessions are saved correctly
agent-browser --session coach open http://localhost:3000/plans/new
# Complete wizard steps
agent-browser --session coach snapshot -i -c
```
**Verify**: After wizard completion, sessions appear under correct weeks
**Deep**: DB verification:
```bash
curl -s "$SUPABASE_URL/rest/v1/session_plans?microcycle_id=eq.$MICROCYCLE_ID&select=id,name,day,week" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
# Expected: sessions have non-null microcycle_id
```

### F.9 — Wizard Sessions Appear Under Correct Week in Workspace

**Steps**:
```bash
agent-browser --session coach open http://localhost:3000/plans/$PLAN_ID/edit
agent-browser --session coach snapshot -i -c
```
**Verify**: Sessions are under the correct week tabs/sections matching their microcycle assignment

### F.10 — Templates "View Details" Links Removed (No 404)

**Steps**:
```bash
agent-browser --session coach open http://localhost:3000/plans
agent-browser --session coach snapshot -i -c
# Navigate to templates section
```
**Verify**: No "View Details" links on template cards
**Absent**: "View Details" links that lead to 404 pages

### F.11 — Coach Dashboard "Active Plans" Counts Only Coach-Created Assigned Plans

**Steps**:
```bash
agent-browser --session coach open http://localhost:3000/dashboard
agent-browser --session coach snapshot -i -c
```
**Verify**: "Active Plans" count matches only plans created by this coach that are assigned to athletes
**Deep**: DB verification — count macrocycles where user_id=21 and athlete_group_id IS NOT NULL

### F.12 — Week Selector Shows Real Completion (Not Fake 100%)

**Steps**:
```bash
agent-browser --session athlete open http://localhost:3000/program
agent-browser --session athlete snapshot -i -c
# Open week selector
agent-browser --session athlete click @week-selector
agent-browser --session athlete snapshot -i -c
```
**Verify**: Week completion percentages match actual workout_log data
**Absent**: Hardcoded "100%" for all weeks

---

## Suite G: Workspace Persistence (US9, US10) — P1

**Prerequisites**: Coach session, existing plan in workspace.

### G.1 — Add Race Event → Refresh → Persisted

**Steps**:
```bash
agent-browser --session coach open http://localhost:3000/plans/$PLAN_ID/edit
agent-browser --session coach click @add-race-button
agent-browser --session coach fill @race-name "City Marathon"
agent-browser --session coach fill @race-date "2026-05-15"
agent-browser --session coach click @save-race-button
# Refresh
agent-browser --session coach open http://localhost:3000/plans/$PLAN_ID/edit
agent-browser --session coach snapshot -i -c
```
**Verify**: "City Marathon" race event still visible after refresh

### G.2 — Edit Race Event → Refresh → Changes Persisted

**Steps**:
```bash
agent-browser --session coach click @edit-race-button
agent-browser --session coach fill @race-name "City Marathon 2026"
agent-browser --session coach click @save-race-button
agent-browser --session coach open http://localhost:3000/plans/$PLAN_ID/edit
agent-browser --session coach snapshot -i -c
```
**Verify**: Updated name "City Marathon 2026" persisted

### G.3 — Delete Race Event (AlertDialog) → Refresh → Gone

**Steps**:
```bash
agent-browser --session coach click @delete-race-button
agent-browser --session coach snapshot -i -c
# Verify AlertDialog appears
agent-browser --session coach click @confirm-delete-race
agent-browser --session coach open http://localhost:3000/plans/$PLAN_ID/edit
agent-browser --session coach snapshot -i -c
```
**Verify**: AlertDialog used for confirmation (not native confirm), race event gone after refresh
**Absent**: Native browser confirm dialog

### G.4 — Edit Session Name → Refresh → Persisted

**Steps**:
```bash
agent-browser --session coach click @session-name
agent-browser --session coach fill @session-name-input "Sprint Intervals"
agent-browser --session coach click @save-session-button
agent-browser --session coach open http://localhost:3000/plans/$PLAN_ID/edit
agent-browser --session coach snapshot -i -c
```
**Verify**: Session name "Sprint Intervals" persisted after refresh

### G.5 — Delete Session → Refresh → Gone

**Steps**:
```bash
agent-browser --session coach click @delete-session-button
agent-browser --session coach click @confirm-delete-session
agent-browser --session coach open http://localhost:3000/plans/$PLAN_ID/edit
agent-browser --session coach snapshot -i -c
```
**Verify**: Deleted session no longer visible

### G.6 — Rename Plan Title → Wait 1s Debounce → Refresh → Persisted

**Steps**:
```bash
agent-browser --session coach click @plan-title
agent-browser --session coach fill @plan-title-input "Updated Marathon Prep"
# Wait for debounce (1000ms)
agent-browser --session coach wait 1500
agent-browser --session coach open http://localhost:3000/plans/$PLAN_ID/edit
agent-browser --session coach snapshot -i -c
```
**Verify**: Plan title shows "Updated Marathon Prep" after refresh

### G.7 — Rapid Title Typing → Only One Save Fires (Debounce)

**Steps**:
```bash
agent-browser --session coach click @plan-title
agent-browser --session coach fill @plan-title-input "A"
agent-browser --session coach fill @plan-title-input "AB"
agent-browser --session coach fill @plan-title-input "ABC"
agent-browser --session coach fill @plan-title-input "ABCD"
agent-browser --session coach wait 1500
```
**Verify**: Network tab shows only 1 save request (not 4)
**Deep**: Check browser console for save logs — should see single debounced save

### G.8 — Navigate Away During Debounce → No Errors

**Steps**:
```bash
agent-browser --session coach click @plan-title
agent-browser --session coach fill @plan-title-input "Quick Edit"
# Navigate away immediately (before debounce fires)
agent-browser --session coach open http://localhost:3000/plans
agent-browser --session coach snapshot -i -c
```
**Verify**: No console errors, no uncaught promise rejections
**Deep**: useEffect cleanup properly clears timeout

### G.9 — Plan State Computed from Dates (Draft/Active/Archived)

**Steps**:
```bash
agent-browser --session coach open http://localhost:3000/plans
agent-browser --session coach snapshot -i -c
```
**Verify**: Plan state badges reflect date-based computation:
- Future start_date → "Draft"
- Current date within start-end range → "Active"
- Past end_date → "Archived"

### G.10 — Past Plan Shows "Archived" Badge

**Steps**:
```bash
agent-browser --session coach snapshot -i -c
```
**Verify**: Plans with end_date before today show "Archived" badge

### G.11 — Future Plan Shows "Draft" Badge

**Steps**:
```bash
agent-browser --session coach snapshot -i -c
```
**Verify**: Plans with start_date after today show "Draft" badge

### G.12 — Current Plan Shows "Active" Badge

**Steps**:
```bash
agent-browser --session coach snapshot -i -c
```
**Verify**: Plans where today falls between start_date and end_date show "Active" badge

---

## Suite H: Cleanup Verification (US5b, US6) — P1

**Prerequisites**: All three role sessions authenticated.

### H.1 — Coach Pages: Zero "Coming Soon" Text

**Steps**:
```bash
agent-browser --session coach open http://localhost:3000/dashboard
agent-browser --session coach snapshot -i -c
agent-browser --session coach open http://localhost:3000/plans
agent-browser --session coach snapshot -i -c
agent-browser --session coach open http://localhost:3000/athletes
agent-browser --session coach snapshot -i -c
agent-browser --session coach open http://localhost:3000/performance
agent-browser --session coach snapshot -i -c
```
**Verify**: Zero instances of "coming soon" text across all coach pages
**Absent**: "coming soon", "Coming Soon", "COMING SOON", "placeholder"

### H.2 — Athlete Pages: Zero "Coming Soon" Text

**Steps**:
```bash
agent-browser --session athlete open http://localhost:3000/dashboard
agent-browser --session athlete snapshot -i -c
agent-browser --session athlete open http://localhost:3000/program
agent-browser --session athlete snapshot -i -c
agent-browser --session athlete open http://localhost:3000/workout
agent-browser --session athlete snapshot -i -c
agent-browser --session athlete open http://localhost:3000/performance
agent-browser --session athlete snapshot -i -c
```
**Verify**: Zero "coming soon" text

### H.3 — Individual Pages: Zero "Coming Soon" Text

**Steps**:
```bash
agent-browser --session individual open http://localhost:3000/dashboard
agent-browser --session individual snapshot -i -c
agent-browser --session individual open http://localhost:3000/plans
agent-browser --session individual snapshot -i -c
agent-browser --session individual open http://localhost:3000/workout
agent-browser --session individual snapshot -i -c
agent-browser --session individual open http://localhost:3000/performance
agent-browser --session individual snapshot -i -c
```
**Verify**: Zero "coming soon" text

### H.4 — Settings Page: Zero "Coming Soon" Text

**Steps**:
```bash
agent-browser --session individual open http://localhost:3000/settings
agent-browser --session individual snapshot -i -c
```
**Verify**: Zero "coming soon" text

### H.5 — Knowledge Base: Zero "Coming Soon" Text

**Steps**:
```bash
agent-browser --session coach open http://localhost:3000/knowledge-base
agent-browser --session coach snapshot -i -c
```
**Verify**: Zero "coming soon" text

### H.6 — MesocycleEditor: No Inert UI Elements

**Steps**:
```bash
agent-browser --session coach open http://localhost:3000/plans/$PLAN_ID/edit
agent-browser --session coach snapshot -i -c
# Navigate to mesocycle editor
```
**Verify**: No "Chart visualization coming soon" text, no inert "Duplicate" or "Add Week" buttons
**Absent**: "Chart visualization", disabled Duplicate/Add Week buttons that do nothing

### H.7 — MicrocycleEditor: No console.log Stubs

**Steps**:
```bash
agent-browser --session coach open http://localhost:3000/plans/$PLAN_ID/edit
# Open browser console
agent-browser --session coach snapshot -i -c
# Click "Add Session" if button exists
```
**Verify**: No console.log("Add Session") or stub messages in browser console
**Deep**: Monitor console output during interaction

### H.8 — RaceDayManager: Delete Button Functional with AlertDialog

**Steps**:
```bash
agent-browser --session coach open http://localhost:3000/plans/$PLAN_ID/edit
# Find race event and click delete
agent-browser --session coach click @delete-race-button
agent-browser --session coach snapshot -i -c
```
**Verify**: AlertDialog confirmation appears (not window.confirm)
**Deep**: Clicking confirm actually deletes the race

### H.9 — confirm() Replaced → Location 1: Plan Delete

**Steps**:
```bash
# Delete a plan from plans list
agent-browser --session coach click @plan-action-menu
agent-browser --session coach click @delete-menu-item
agent-browser --session coach snapshot -i -c
```
**Verify**: AlertDialog component renders (has accessible dialog role)
**Absent**: Native browser confirm dialog

### H.10 — confirm() Replaced → Location 2: Session Delete

**Steps**:
```bash
agent-browser --session coach click @delete-session-button
agent-browser --session coach snapshot -i -c
```
**Verify**: AlertDialog component (not native confirm)

### H.11 — confirm() Replaced → Location 3: Race Delete

**Steps**:
```bash
agent-browser --session coach click @delete-race-button
agent-browser --session coach snapshot -i -c
```
**Verify**: AlertDialog component (not native confirm)

### H.12 — confirm() Replaced → Location 4: Knowledge Base Delete

**Steps**:
```bash
agent-browser --session coach open http://localhost:3000/knowledge-base
agent-browser --session coach click @delete-category-button
agent-browser --session coach snapshot -i -c
```
**Verify**: AlertDialog component (not native confirm)

### H.13 — window.location Replaced → SPA Transition 1: Post-Login

**Steps**:
```bash
# Auth and observe navigation
agent-browser --session coach open http://localhost:3000/auth/session
agent-browser --session coach get url
```
**Verify**: Navigation uses router.push (no full page reload)
**Deep**: No `window.location.href =` in network/console

### H.14 — window.location Replaced → SPA Transition 2: Post-Onboarding

**Steps**:
```bash
# Complete onboarding and observe navigation
agent-browser --session new-athlete snapshot -i -c
```
**Verify**: router.push used (SPA transition), not window.location

### H.15 — window.location Replaced → SPA Transition 3: Post-Plan-Create

**Steps**:
```bash
# Create plan and observe navigation
agent-browser --session coach click @create-plan-button
agent-browser --session coach get url
```
**Verify**: SPA transition to plan edit page

### H.16 — window.location Replaced → SPA Transition 4: Post-Workout-Complete

**Steps**:
```bash
# Complete workout and observe navigation
agent-browser --session athlete click @complete-workout-button
agent-browser --session athlete get url
```
**Verify**: SPA transition to /workout (router.push)

### H.17 — window.location Replaced → SPA Transition 5: Post-Delete Navigation

**Steps**:
```bash
# Delete plan and observe navigation
agent-browser --session coach click @confirm-delete-button
agent-browser --session coach get url
```
**Verify**: SPA transition back to plans list

### H.18 — Landing Page: No Fake Stats

**Steps**:
```bash
agent-browser open http://localhost:3000
agent-browser snapshot -i -c
```
**Verify**: No fake statistics on landing page
**Absent**: "95% Success Rate", "4.9/5", "10,000+ users", made-up testimonials

---

## Suite I: Cross-Role E2E Journeys — P1

### I.1 — Full Invite Journey: Coach → Athlete Signup → Program → Workout

**Steps**:
```bash
# 1. Coach invites new email
agent-browser --session coach open http://localhost:3000/athletes
agent-browser --session coach click @invite-athlete-button
agent-browser --session coach fill @email-input "journey.test@example.com"
agent-browser --session coach click @send-invitation-button

# 2. New athlete signs up via invitation
# (Use Clerk API to create user + complete signup programmatically)

# 3. Athlete completes onboarding with locked role
agent-browser --session journey-athlete open http://localhost:3000/onboarding
agent-browser --session journey-athlete snapshot -i -c
# Complete onboarding steps

# 4. Athlete sees /program with assigned plan
agent-browser --session journey-athlete open http://localhost:3000/program
agent-browser --session journey-athlete snapshot -i -c

# 5. Athlete starts and completes a workout
agent-browser --session journey-athlete open http://localhost:3000/workout
agent-browser --session journey-athlete click @start-workout-button
agent-browser --session journey-athlete click @complete-workout-button

# 6. Coach sees completion on athlete profile
agent-browser --session coach open http://localhost:3000/athletes/$NEW_ATHLETE_ID
agent-browser --session coach snapshot -i -c
```
**Verify**: End-to-end: invitation → signup → onboarding → program view → workout completion → coach visibility

### I.2 — Plan Lifecycle: Create → Assign → Athlete Sees → Delete → Empty State

**Steps**:
```bash
# 1. Coach creates plan
agent-browser --session coach open http://localhost:3000/plans/new
# Complete plan creation

# 2. Coach assigns plan to group
agent-browser --session coach open http://localhost:3000/plans/$NEW_PLAN_ID/edit
agent-browser --session coach click @assign-group-button

# 3. Athlete sees plan in /program
agent-browser --session athlete open http://localhost:3000/program
agent-browser --session athlete snapshot -i -c

# 4. Coach deletes plan
agent-browser --session coach open http://localhost:3000/plans
agent-browser --session coach click @plan-action-menu
agent-browser --session coach click @delete-menu-item
agent-browser --session coach click @remove-assignments-button
agent-browser --session coach click @confirm-delete-button

# 5. Athlete sees empty state
agent-browser --session athlete open http://localhost:3000/program
agent-browser --session athlete snapshot -i -c
```
**Verify**: Athlete program view updates from showing plan to empty state after coach deletes

### I.3 — Existing User Invite: Individual → Athlete Role Promotion

**Steps**:
```bash
# 1. Coach invites existing individual (Kimmy Bear)
agent-browser --session coach open http://localhost:3000/athletes
agent-browser --session coach click @invite-athlete-button
agent-browser --session coach fill @email-input "ms.kimmy.bear@gmail.com"
agent-browser --session coach click @send-invitation-button

# 2. Individual user logs in
agent-browser --session individual open http://localhost:3000/dashboard

# 3. Check role changed
agent-browser --session individual open http://localhost:3000/program
agent-browser --session individual snapshot -i -c
```
**Verify**: Individual user's role promoted to athlete, can now see /program
**Deep**: DB shows role='athlete' and athlete_group_id set

### I.4 — Delete Plan Mid-Workout → Session Continues, Log Preserved

**Steps**:
```bash
# 1. Athlete starts a workout
agent-browser --session athlete open http://localhost:3000/workout
agent-browser --session athlete click @start-workout-button
agent-browser --session athlete get url
# Note workout_log_id

# 2. Coach deletes the plan while athlete has ongoing session
agent-browser --session coach open http://localhost:3000/plans
agent-browser --session coach click @plan-action-menu
agent-browser --session coach click @delete-menu-item
agent-browser --session coach click @remove-assignments-button
agent-browser --session coach click @confirm-delete-button

# 3. Athlete completes workout
agent-browser --session athlete click @complete-workout-button
agent-browser --session athlete snapshot -i -c
```
**Verify**: Workout completes successfully despite plan deletion, log preserved in DB with session_plan_id=NULL

### I.5 — Coach Dashboard After Plan Changes → Counts Update

**Steps**:
```bash
# 1. Note initial dashboard counts
agent-browser --session coach open http://localhost:3000/dashboard
agent-browser --session coach snapshot -i -c

# 2. Create a new plan, assign it
# 3. Delete another plan

# 4. Refresh dashboard
agent-browser --session coach open http://localhost:3000/dashboard
agent-browser --session coach snapshot -i -c
```
**Verify**: "Active Plans" count updates correctly after create/delete operations

### I.6 — Multi-Tab Consistency

**Steps**:
```bash
# Open same page in two sessions
agent-browser --session coach-tab1 open http://localhost:3000/plans
agent-browser --session coach-tab2 open http://localhost:3000/plans

# Delete plan in tab1
agent-browser --session coach-tab1 click @plan-action-menu
agent-browser --session coach-tab1 click @delete-menu-item
agent-browser --session coach-tab1 click @confirm-delete-button

# Refresh tab2
agent-browser --session coach-tab2 open http://localhost:3000/plans
agent-browser --session coach-tab2 snapshot -i -c
```
**Verify**: Tab2 reflects the deletion after refresh

### I.7 — Stripe Webhook Endpoint → Returns 200 (No-Op)

**Steps**:
```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/stripe/webhooks \
  -H "Content-Type: application/json" \
  -d '{"type": "checkout.session.completed", "data": {}}'
```
**Verify**: Returns 200 status code (acknowledged, no-op)

### I.8 — Athlete Transfers Groups → Plan Changes

**Steps**:
```bash
# Move athlete from one group to another (via DB or coach action)
# Verify athlete sees new group's plan in /program
agent-browser --session athlete open http://localhost:3000/program
agent-browser --session athlete snapshot -i -c
```
**Verify**: After group change, athlete sees the new group's assigned plan

---

## Suite J: Edge Cases & Regressions — P2

### J.1 — Invalid Macrocycle ID → 404 or "Not Found"

**Steps**:
```bash
agent-browser --session coach open http://localhost:3000/plans/99999/edit
agent-browser --session coach snapshot -i -c
```
**Verify**: Shows "not found" or 404 page, no crash

### J.2 — Access Another User's Plan → Blocked by RLS

**Steps**:
```bash
# Athlete tries to access coach's plan directly
agent-browser --session athlete open http://localhost:3000/plans/1/edit
agent-browser --session athlete snapshot -i -c
```
**Verify**: Access denied or redirected (RLS prevents cross-user plan access)

### J.3 — Athlete Navigates to /athletes (Coach-Only) → Redirected

**Steps**:
```bash
agent-browser --session athlete open http://localhost:3000/athletes
agent-browser --session athlete get url
```
**Verify**: Redirected away from /athletes or shown access denied

### J.4 — Empty Database Fresh User → Every Page Has Empty State

**Steps**:
```bash
# Use a fresh user with no data
agent-browser --session fresh open http://localhost:3000/dashboard
agent-browser --session fresh snapshot -i -c
agent-browser --session fresh open http://localhost:3000/workout
agent-browser --session fresh snapshot -i -c
agent-browser --session fresh open http://localhost:3000/performance
agent-browser --session fresh snapshot -i -c
```
**Verify**: Every page shows appropriate empty state, no crashes, no undefined errors

### J.5 — Unicode in Plan Names, Workout Notes, Athlete Names

**Steps**:
```bash
agent-browser --session coach open http://localhost:3000/plans/new
# Use Unicode characters in plan name
agent-browser --session coach fill @plan-name "Entra\u00eenement d'\u00e9t\u00e9 \ud83c\udfc3"
agent-browser --session coach snapshot -i -c
```
**Verify**: Unicode characters render correctly, no encoding issues

### J.6 — Session Duration with Missing Timestamps → Hidden

**Steps**:
```bash
# Find a completed session without started_at or completed_at
agent-browser --session athlete snapshot -i -c
```
**Verify**: Duration field is hidden when timestamps are missing (not "0 min" or "NaN")

### J.7 — Plan with Past End Date → "Archived" State

**Steps**:
```bash
agent-browser --session coach open http://localhost:3000/plans
agent-browser --session coach snapshot -i -c
```
**Verify**: Plans with past end_date show "Archived" badge/state

### J.8 — Rapid Delete Clicks → Only One Deletion

**Steps**:
```bash
agent-browser --session coach click @confirm-delete-button
agent-browser --session coach click @confirm-delete-button
agent-browser --session coach click @confirm-delete-button
```
**Verify**: Only one deletion occurs, no duplicate errors or crashes

### J.9 — Browser Back After Deletion → No Ghost State

**Steps**:
```bash
agent-browser --session coach click @confirm-delete-button
# Go back
agent-browser --session coach open "javascript:history.back()"
agent-browser --session coach snapshot -i -c
```
**Verify**: No ghost/stale data shown, plan list is correct

### J.10 — Concurrent Sessions (Two Tabs Same Workout) → Last Save Wins

**Steps**:
```bash
agent-browser --session tab1 open http://localhost:3000/workout/$WORKOUT_ID
agent-browser --session tab2 open http://localhost:3000/workout/$WORKOUT_ID
# Make different changes in each tab
agent-browser --session tab1 fill @weight-input "80"
agent-browser --session tab2 fill @weight-input "90"
# Save both
agent-browser --session tab1 click @save-set
agent-browser --session tab2 click @save-set
```
**Verify**: Last save wins (no crash, no data corruption), DB reflects most recent value

---

## Execution Strategy

### Phase 1: P0 — Must Pass (~80 min)

**Suites**: A (Invite Flow), B (Program View), C (Plan Deletion), F (Stats & Data)

**Gate criteria**: ALL P0 tests must pass before proceeding.

```bash
# Run P0 suites in parallel across sessions
# Session 1: Coach flows (Suite A coach-side, Suite C)
agent-browser --session coach open http://localhost:3000/athletes

# Session 2: Athlete flows (Suite B, parts of Suite A new-athlete)
agent-browser --session athlete open http://localhost:3000/program

# Session 3: Stats verification (Suite F)
agent-browser --session individual open http://localhost:3000/dashboard
```

### Phase 2: P1 — Core Experience (~100 min)

**Suites**: D (Workout UX), E (Coach Profile), G (Workspace), H (Cleanup), I (Cross-Role)

**Gate criteria**: ≥90% of P1 tests pass.

```bash
# Parallelizable pairs:
# Coach-side: Suite E + Suite G (both coach-only)
# Athlete-side: Suite D (athlete-only)
# All-roles: Suite H (iterate sessions)
# Sequential: Suite I (requires cross-role coordination)
```

### Phase 3: P2 — Edge Cases (~15 min)

**Suite**: J (Edge Cases & Regressions)

**Gate criteria**: No critical failures (crashes, data corruption).

### Parallelization Guide

Use separate `--session` flags for isolation:

```bash
# Parallel execution example
agent-browser --session coach open http://localhost:3000/plans &
agent-browser --session athlete open http://localhost:3000/program &
agent-browser --session individual open http://localhost:3000/dashboard &
wait
```

### Evidence Collection

| Artifact | Path | Format |
|----------|------|--------|
| Screenshots | `/tmp/e2e/012/[suite]-[test]-[pass\|fail].png` | PNG |
| Console logs | `/tmp/e2e/012/[suite]-console.txt` | Text |
| DB snapshots | `/tmp/e2e/012/[suite]-db-verify.json` | JSON |

```bash
# Create evidence directory
mkdir -p /tmp/e2e/012

# Capture screenshot evidence
agent-browser --session coach screenshot /tmp/e2e/012/A1-invite-dialog-pass.png

# Capture DB state
curl -s "$SUPABASE_URL/rest/v1/users?select=id,role,onboarding_completed" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" > /tmp/e2e/012/F-users-snapshot.json
```

### Pass Criteria

| Priority | Threshold | Action on Fail |
|----------|-----------|----------------|
| P0 | 100% pass | Block merge, fix immediately |
| P1 | ≥ 90% pass | File issues for failures, can merge |
| P2 | ≥ 75% pass | File issues, non-blocking |

---

## User Story Coverage Map

| User Story | Suite(s) | Key Tests |
|------------|----------|-----------|
| US1 (Athlete Program View) | B | B.1-B.10 |
| US2 (Invite Flow) | A | A.1-A.14 |
| US3 (Plan Deletion) | C | C.1-C.12 |
| US4 (Coach Athlete Profile) | E | E.1-E.10 |
| US5 (Stats Cleanup) | F | F.1-F.4, F.11-F.12 |
| US5b (Coming Soon Removal) | H | H.1-H.8 |
| US6 (confirm/window.location) | H | H.9-H.17 |
| US8 (Personal Bests Fix) | F | F.5-F.7 |
| US9 (Workspace Persistence) | G | G.1-G.8 |
| US10 (Plan State from Dates) | G | G.9-G.12 |
| US12 (Workout Loading UX) | D | D.1, D.2 |
| US13 (Skip Workout) | D | D.3-D.5 |
| US14 (Workout Session UX) | D | D.6-D.16 |
| Cross-cutting | I, J | I.1-I.8, J.1-J.10 |

---

## Pre-Test Checklist

- [ ] Dev server running: `npm run dev:web` → http://localhost:3000
- [ ] Supabase local/remote accessible
- [ ] `$CLERK_SECRET_KEY` env var set
- [ ] `$SUPABASE_URL` and `$SUPABASE_SERVICE_ROLE_KEY` env vars set
- [ ] `agent-browser` CLI installed and working
- [ ] Evidence directory created: `mkdir -p /tmp/e2e/012`
- [ ] Kim Coach has athlete group (run pre-test setup)
- [ ] Branch `pm/spec012-coach-athlete-mvp` checked out
