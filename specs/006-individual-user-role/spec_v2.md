🔴 COMPREHENSIVE AUDIT REPORT: Individual Role User Features
I've completed a thorough, deep audit of the individual role user features from onboarding to workout completion. Here's the executive summary and detailed findings:

Executive Summary
Category	Status	Critical	High	Medium	Low
Onboarding	❌ NOT READY	4	6	8	3
Plan Creation	⚠️ PARTIAL	2	2	3	-
Workout Execution	⚠️ PARTIAL	4	4	10	2
Performance Tracking	❌ NOT READY	4	2	4	-
Database/API	❌ NOT READY	2	1	4	8
TOTAL	❌ NOT PRODUCTION READY	16	15	29	13
🚨 CRITICAL ISSUES (Must Fix Before Production)
1. Onboarding - API Route Rejects Individual Role
File: route.ts:14

The Zod validation schema only accepts "athlete" | "coach", missing "individual":


role: z.enum(["athlete", "coach"], { ... })  // "individual" MISSING!
Impact: Individual users cannot complete onboarding via API route.

2. Onboarding - Equipment Data Silently Discarded
File: onboarding-actions.ts:218

User's availableEquipment selection is collected but never persisted - the athletes table has no column for it.

Impact: User input is lost, degraded experience.

3. Onboarding - Silent Athlete Record Failure
File: onboarding-actions.ts:221-226

If athlete record creation fails for individual users, onboarding reports success anyway. Later workout logging will fail with FK constraint errors.

4. Session Page - Missing Role Protection
File: page.tsx

The session page has NO serverProtectRoute() call. Athletes could access individual user sessions if they obtain the URL.

5. Workout Authorization - Missing Ownership Validation
Files:

workout-session-actions.ts:46-59
workout-session-actions.ts:478-487
training-session-actions.ts:553-565
Multiple server actions accept session/athlete IDs without verifying the authenticated user owns them:

getTodayAndOngoingSessionsAction - can fetch other users' sessions
updateTrainingSessionStatusAction - can change any session's status
startTrainingSessionAction - can start any session
addExercisePerformanceAction - can inject data into any workout
Impact: Privilege escalation, unauthorized data access/manipulation.

6. Performance Tracking - Unauthorized PB Access
File: personal-best-actions.ts:17-62

getAthletePBsAction accepts any athleteId without verifying ownership. Any authenticated user can view any athlete's personal bests.

7. Database - No RLS Policies
Impact: CRITICAL SECURITY GAP

The codebase relies entirely on application-level validation with NO database-level Row Level Security. If a bad actor bypasses application checks, they can access ANY user's data.

Tables affected: session_plans, workout_logs, workout_log_exercises, workout_log_sets, macrocycles, mesocycles, microcycles

8. Database - Missing user_id in workout_logs
File: database.ts:1299-1362

workout_logs table has no direct user_id field - must join through athletes table for ownership validation. This makes RLS policies complex and error-prone.

⚠️ HIGH SEVERITY ISSUES
Issue	Location	Impact
Missing isSuccess check in onboarding page	page.tsx:14	Runtime errors
No transaction support in onboarding	onboarding-actions.ts:36-257	Inconsistent data state
Username generation edge case	onboarding-wizard.tsx:151	Malformed usernames
Race condition in athlete record check	onboarding-actions.ts:202-207	Duplicate records
Weak one-active-block validation	plan-actions.ts:1437-1444	Race condition allows duplicates
Missing user_id check in getSessionPlanByIdAction	exercise-actions.ts	Unauthorized session access
Auto-save forceSave timeout	exercise-context.tsx:335-339	Data loss on completion
Missing async save on page unload	workout-session-dashboard.tsx:85-93	Data loss
Duplicate workout exercises possible	Migration 20260109	Data corruption
Silent workout_log_exercise creation	training-session-actions.ts:741-806	UI-DB sync loss
PB metadata not validated	personal-best-actions.ts:432	Corrupted analytics
Inconsistent athlete creation for individual	onboarding-actions.ts:177-200	FK constraint failures
📋 RECOMMENDED ACTION PLAN
Phase 1: BLOCKING (Before any production use)
Fix API Route Validation


// apps/web/app/api/users/onboard/route.ts
role: z.enum(["athlete", "coach", "individual"], {
  message: "Role must be 'athlete', 'coach', or 'individual'",
}),
Add Authorization Checks to All Session/Workout Actions

Verify athlete ownership before any session operations
Add user_id check to getSessionPlanByIdAction
Validate session ownership in status updates
Implement RLS Policies


-- Example for workout_logs
CREATE POLICY "Users can only access their own workout logs"
ON workout_logs FOR ALL
USING (athlete_id IN (
  SELECT id FROM athletes WHERE user_id = auth.uid()
));
Fix Athlete Record Creation for Individuals

Make athlete creation blocking (not silent fail)
Or use database transaction to rollback on failure
Add Role Protection to Session Page


// apps/web/app/(protected)/plans/[id]/session/[sessionId]/page.tsx
const role = await serverProtectRoute({ allowedRoles: ['coach', 'individual'] })
Phase 2: HIGH PRIORITY (This Sprint)
Add equipment storage for individual users (new column or metadata)
Add server-side validation of individual data in onboarding
Fix one-active-block with database constraint
Increase forceSave timeout and add proper error handling
Add UNIQUE constraint on workout_log_exercises(workout_log_id, exercise_id)
Phase 3: MEDIUM PRIORITY (Next Sprint)
Add database transactions to onboarding flow
Implement comprehensive input validation for numeric fields
Add audit logging for sensitive operations
Fix null value handling in set updates
Add request timeouts for network operations
✅ What's Working Well
Role-based page routing: serverProtectRoute implemented on most pages
Role context: UserRoleProvider correctly identifies individual users
UI differentiation: Individual users see appropriate terminology ("My Training" vs "Training Plans")
Plan creation flow: QuickStartWizard correctly creates training blocks for individuals
Error handling pattern: Server actions consistently return ActionState<T> with proper error messages
User caching: LRU cache reduces database lookups
Draft persistence: Workout data auto-saves to localStorage
📊 Production Readiness Score
Area	Score	Notes
Authentication	✅ 90%	Clerk integration solid
Authorization	❌ 40%	Missing ownership checks
Data Validation	⚠️ 60%	Client OK, server gaps
Error Handling	⚠️ 70%	Silent failures in places
Database Security	❌ 20%	No RLS policies
Feature Completeness	⚠️ 75%	Edit features incomplete
Overall: ❌ NOT PRODUCTION READY

The individual role feature requires approximately 16 critical fixes and 15 high-priority improvements before it can be considered production-ready. The most urgent issues are the authorization gaps that could allow unauthorized data access.