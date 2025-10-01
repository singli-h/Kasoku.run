# Athletes Management Page – Lean MVP Specification

## 🎯 Purpose
- Provide coaches with a single-page workspace to invite and manage athletes.
- Consolidate roster and group controls into focused sections that reflect 2025/2026 minimalist UI trends.
- Remove analytics noise to keep attention on people-management tasks.
- Track athlete group history for audit trail and coaching insights.

## 🧭 Page Structure (Single Page)
- **Section 1 – Roster & Bulk Actions**
  - Sticky header with page title, "Coach only" badge, and quick invite form.
  - Data table listing athletes with columns: `Name`, `Email`, `Group`, `Age`, `Sex`, `Events` (rendered as tags pulled from the athlete profile).
  - Bulk selection row (checkbox column, select-all) with primary actions: `Add to Group`, `Move to Group`, `Remove from Group`.
  - Row-level menu containing the same actions plus `View Profile`.
- **Section 2 – Group Directory**
  - Card list (or compact table) showing `Group Name` and `Athlete Count`.
  - Inline controls for `Create`, `Rename`, and `Delete` groups; no extra metadata captured for MVP.
  - Clicking a group filters the roster table in Section 1.

## ✉️ Invite / Add Flow
1. Coach enters an email in the header form and chooses a target group.
2. Server action checks for an existing platform user:
   - If found and the user has an athlete profile, assign them to the chosen group.
   - If found without an athlete profile, create the profile before assigning.
3. If no user exists, call Clerk’s invitation API, await success, and pre-create an athlete stub linked to the pending invite (so the roster shows them immediately).
4. Surface outcome via toast; keep the input ready for the next email.

### Implementation Notes
- Reuse any existing user lookup helpers (see `getDbUserId`, `getAthleteProfileAction`).
- Introduce a new `inviteOrAttachAthleteAction` that orchestrates the flow above and enforces RLS (coach-only).
- Ensure Clerk and Supabase updates happen in a single server action to prevent partial state.

## 🔁 Athlete Management Details
- Table rows display the minimal data set; age is derived from stored birthdate when available.
- Events appear as pill tags; when empty, show `—` to keep layout even.
- Bulk operation drawer/modal includes:
  - **Add to Group**: assigns all selected athletes who are unassigned.
  - **Move to Group**: assigns to a new group; athletes already in that group are skipped with inline feedback.
  - **Remove from Group**: clears the `athlete_group_id` field.
- Row menu mirrors these actions for single-athlete adjustments.

## 👥 Group Management
- Minimal CRUD using existing actions (`createAthleteGroupAction`, `updateAthleteGroupAction`, `deleteAthleteGroupAction`).
- Group cards show only name and athlete count.
- Selecting a group applies a filter badge in the roster header; badge can be cleared to reset view.

## 🔒 Access & Permissions
- Page is already scoped to the protected coach route; reinforce in UI with a coach-only label.
- All new server actions must follow the RLS pattern using singleton Supabase client with Clerk authentication.
- Bulk operations validate that the current coach owns both source athletes and destination groups.
- **Security Model**: Coaches can view, update, and move athletes but CANNOT delete athlete records (only remove from groups).
- **History Tracking**: All group assignments/movements are logged in `athlete_group_histories` for audit trail.

## 🧱 Deferred / Removed Features
- No KPI widgets, charts, or mock analytics in the MVP release.
- No performance metrics columns until real data is available.
- Duplicate “message” or “export” bulk actions are excluded.

## ✅ Implementation Status
- [x] **COMPLETED**: Implemented lean roster and group components under `features/athletes` using modular structure.
- [x] **COMPLETED**: Added `inviteOrAttachAthleteAction` with Clerk integration and Supabase updates.
- [x] **COMPLETED**: Replaced existing page tabs with consolidated layout.
- [x] **COMPLETED**: Fixed RLS policies for athlete_groups (added missing INSERT, UPDATE, DELETE policies).
- [x] **COMPLETED**: Added coach access policies for athletes table.
- [ ] **IN PROGRESS**: Implement athlete group history tracking infrastructure.
- [ ] **PENDING**: Update security model to prevent coach deletion of athlete records.
- [ ] **PENDING**: Add history logging to all group assignment actions.
- [ ] **PENDING**: Write integration tests for invite flow and bulk reassignment actions.

