# Onboarding Workflow Issues Found

## Critical Issues

### 1. **Missing Database Tables**
- ❌ `athletes` table does NOT exist in database
- ❌ `coaches` table does NOT exist in database
- ✅ `users` table exists but has different schema than TypeScript types

### 2. **Schema Mismatch: Users Table**

**TypeScript Types Say (database.ts):**
- `username` (required)
- `birthdate` (nullable)
- `subscription_status` (required)
- `timezone` (required)
- `role` (required)
- `metadata` (nullable)

**Actual Database Schema:**
- `clerk_id` (text, nullable, unique)
- `email` (text, required, unique)
- `first_name` (text, nullable)
- `last_name` (text, nullable)
- `avatar_url` (text, nullable)
- `onboarding_completed` (boolean, nullable, default: false)
- `is_active` (boolean, nullable, default: true)
- `disabled_at` (timestamptz, nullable)
- `disabled_reason` (text, nullable)
- `created_at` (timestamptz, nullable, default: now())
- `updated_at` (timestamptz, nullable)
- `slack_id` (text, nullable)

**Missing in Database:**
- `username` - NOT in database
- `birthdate` - NOT in database
- `subscription_status` - NOT in database
- `timezone` - NOT in database
- `role` - NOT in database
- `metadata` - NOT in database

### 3. **Onboarding Action Issues**

The `completeOnboardingAction` tries to:
1. Upsert user with fields that don't exist → **WILL FAIL**
2. Insert into `athletes` table that doesn't exist → **WILL FAIL**
3. Insert into `coaches` table that doesn't exist → **WILL FAIL**

### 4. **Webhook Handler Issues**

The webhook handler uses `upsert` which is good, but:
- Uses `supabaseService` (service role) - ✅ Correct
- But the user fields it sets may not match actual schema

## Required Fixes

### Option A: Update Database Schema (Recommended)
Add missing columns to `users` table and create `athletes`/`coaches` tables.

### Option B: Update Code to Match Database
Modify onboarding action to only use existing columns.

## Next Steps

1. **Verify actual database schema** - Check what columns actually exist
2. **Decide on approach** - Add columns or update code
3. **Fix onboarding action** - Match actual schema
4. **Test end-to-end flow** - Signup → Webhook → Onboarding → Data sync

