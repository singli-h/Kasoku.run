# Row Level Security (RLS) Analysis
## Kasoku Running Website Database

> **Last Updated**: 2025-12-24  
> **Status**: All tables have RLS enabled

## Overview
This document outlines the RLS policies implemented in the Kasoku running website database, designed to work with Clerk authentication and our athlete/coach role system.

**Current Status** (Verified December 2025):
- ✅ **All 32 tables have RLS enabled**
- ✅ Comprehensive policies implemented across all user-scoped tables
- ⚠️ Some policies may benefit from optimization (50+ identified by Supabase advisors)

**Planned Table Renames** (see `specs/005-database-schema-optimization/spec.md`):
- `exercise_preset_groups` → `session_plans`
- `exercise_presets` → `session_plan_exercises`
- `exercise_preset_details` → `session_plan_sets`
- `exercise_training_sessions` → `workout_logs`
- `exercise_training_details` → `workout_log_sets`

## Authentication Pattern
- **Clerk Integration**: Uses `auth.jwt() ->> 'sub'` for user identification
- **User Lookup**: `clerk_id` field in users table matches Clerk user ID
- **Role System**: athlete, coach, admin roles defined in users.role

## Database Schema Summary

### Core Tables
- **users**: Central user table with Clerk integration
- **athletes**: Athlete profiles linked to users (one-to-one)
- **coaches**: Coach profiles linked to users (one-to-one)
- **athlete_groups**: Groups managed by coaches
- **Training Periodization**: macrocycles → mesocycles → microcycles
- **Exercise System**: exercises, exercise_types, units, tags (mostly public)
- **Training Data**: preset_groups, training_sessions, performance details

### Key Relationships
- Athletes belong to athlete_groups managed by coaches
- Training follows periodization hierarchy
- Performance data links to athletes and preset plans

## Recommended RLS Policies

### 1. Users Table
```sql
-- Users can view and update their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (clerk_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (clerk_id = (auth.jwt() ->> 'sub'));

-- Only authenticated users can insert (handled by webhook)
CREATE POLICY "Authenticated users can insert"
ON users FOR INSERT
WITH CHECK (auth.jwt() ->> 'sub' IS NOT NULL);
```

### 2. Athletes Table
```sql
-- Athletes can view/edit their own data
CREATE POLICY "Athletes can manage own data"
ON athletes FOR ALL
USING (
  user_id IN (
    SELECT id FROM users 
    WHERE clerk_id = (auth.jwt() ->> 'sub')
  )
);

-- Coaches can view athletes in their groups
CREATE POLICY "Coaches can view their athletes"
ON athletes FOR SELECT
USING (
  athlete_group_id IN (
    SELECT ag.id FROM athlete_groups ag
    JOIN coaches c ON ag.coach_id = c.id
    JOIN users u ON c.user_id = u.id
    WHERE u.clerk_id = (auth.jwt() ->> 'sub')
  )
);

-- Coaches can update athletes in their groups
CREATE POLICY "Coaches can update their athletes"
ON athletes FOR UPDATE
USING (
  athlete_group_id IN (
    SELECT ag.id FROM athlete_groups ag
    JOIN coaches c ON ag.coach_id = c.id
    JOIN users u ON c.user_id = u.id
    WHERE u.clerk_id = (auth.jwt() ->> 'sub')
  )
);
```

### 3. Coaches Table
```sql
-- Coaches can manage their own data
CREATE POLICY "Coaches can manage own data"
ON coaches FOR ALL
USING (
  user_id IN (
    SELECT id FROM users 
    WHERE clerk_id = (auth.jwt() ->> 'sub')
  )
);

-- Athletes can view their coach details
CREATE POLICY "Athletes can view their coach"
ON coaches FOR SELECT
USING (
  id IN (
    SELECT ag.coach_id FROM athlete_groups ag
    JOIN athletes a ON a.athlete_group_id = ag.id
    JOIN users u ON a.user_id = u.id
    WHERE u.clerk_id = (auth.jwt() ->> 'sub')
  )
);
```

### 4. Athlete Groups
```sql
-- Coaches can manage their groups
CREATE POLICY "Coaches can manage their groups"
ON athlete_groups FOR ALL
USING (
  coach_id IN (
    SELECT c.id FROM coaches c
    JOIN users u ON c.user_id = u.id
    WHERE u.clerk_id = (auth.jwt() ->> 'sub')
  )
);

-- Athletes can view their group
CREATE POLICY "Athletes can view their group"
ON athlete_groups FOR SELECT
USING (
  id IN (
    SELECT a.athlete_group_id FROM athletes a
    JOIN users u ON a.user_id = u.id
    WHERE u.clerk_id = (auth.jwt() ->> 'sub')
  )
);
```

### 5. Training Periodization (Macrocycles, Mesocycles, Microcycles)
```sql
-- Users can manage their own training cycles
CREATE POLICY "Users can manage own training cycles"
ON macrocycles FOR ALL
USING (
  user_id IN (
    SELECT id FROM users 
    WHERE clerk_id = (auth.jwt() ->> 'sub')
  )
);

-- Similar policies for mesocycles and microcycles
-- Athletes can view cycles assigned to their group
CREATE POLICY "Athletes can view group training cycles"
ON macrocycles FOR SELECT
USING (
  athlete_group_id IN (
    SELECT a.athlete_group_id FROM athletes a
    JOIN users u ON a.user_id = u.id
    WHERE u.clerk_id = (auth.jwt() ->> 'sub')
  )
);
```

### 6. Exercise Preset Groups & Training Sessions
```sql
-- Users can manage sessions they created
CREATE POLICY "Users can manage own preset groups"
ON exercise_preset_groups FOR ALL
USING (
  user_id IN (
    SELECT id FROM users 
    WHERE clerk_id = (auth.jwt() ->> 'sub')
  )
);

-- Athletes can view group training sessions
CREATE POLICY "Athletes can view group sessions"
ON exercise_preset_groups FOR SELECT
USING (
  athlete_group_id IN (
    SELECT a.athlete_group_id FROM athletes a
    JOIN users u ON a.user_id = u.id
    WHERE u.clerk_id = (auth.jwt() ->> 'sub')
  )
);

-- Athletes can manage their own training sessions
CREATE POLICY "Athletes can manage own training sessions"
ON exercise_training_sessions FOR ALL
USING (
  athlete_id IN (
    SELECT a.id FROM athletes a
    JOIN users u ON a.user_id = u.id
    WHERE u.clerk_id = (auth.jwt() ->> 'sub')
  )
);

-- Coaches can view all sessions for their athletes
CREATE POLICY "Coaches can view athlete sessions"
ON exercise_training_sessions FOR SELECT
USING (
  athlete_id IN (
    SELECT a.id FROM athletes a
    JOIN athlete_groups ag ON a.athlete_group_id = ag.id
    JOIN coaches c ON ag.coach_id = c.id
    JOIN users u ON c.user_id = u.id
    WHERE u.clerk_id = (auth.jwt() ->> 'sub')
  )
);
```

### 7. Public Data (Exercises, Units, Tags)
```sql
-- Public read access for exercise library
CREATE POLICY "Public read access to exercises"
ON exercises FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Public read access to exercise_types"
ON exercise_types FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Public read access to units"
ON units FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Public read access to tags"
ON tags FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Public read access to events"
ON events FOR SELECT
TO authenticated
USING (true);
```

### 8. Admin Overrides
```sql
-- Admin users have full access (add to all tables)
CREATE POLICY "Admin full access"
ON users FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE clerk_id = (auth.jwt() ->> 'sub') 
    AND role = 'admin'
  )
);
```

## Implementation Steps

1. **Enable RLS on all tables**:
   ```sql
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
   ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
   -- ... continue for all tables
   ```

2. **Create policies using the patterns above**

3. **Test with different user roles**:
   - Athlete accessing own data ✓
   - Coach accessing athlete group data ✓
   - Cross-group access blocked ✓
   - Public exercise data accessible ✓

## Security Benefits

- **Data Isolation**: Users can only access authorized data
- **Role-Based Access**: Proper athlete/coach permissions
- **Coach-Athlete Relationship**: Coaches manage their groups safely
- **Performance Data Protection**: Training data is user-specific
- **Public Resources**: Exercise library accessible to all authenticated users

## Current Implementation Status

### Tables with RLS Enabled (32 total)

**User & Profile Tables**:
- `users` - User profile access control
- `athletes` - Athlete data isolation
- `coaches` - Coach data isolation

**Group & Organization Tables**:
- `athlete_groups` - Group membership access
- `athlete_group_histories` - Historical tracking
- `athlete_cycles` - Cycle assignment access

**Training Cycle Tables**:
- `macrocycles` - Long-term cycle access
- `mesocycles` - Medium-term cycle access
- `microcycles` - Short-term cycle access

**Exercise & Training Tables**:
- `exercise_types` - Public read, authenticated write
- `exercises` - Exercise library access
- `units` - Public read, authenticated write
- `tags` - Public read, authenticated write
- `exercise_tags` - Tag relationship access
- `exercise_preset_groups` - Preset group access
- `exercise_presets` - Preset access
- `exercise_preset_details` - Preset detail access
- `exercise_training_sessions` - Training session access
- `exercise_training_details` - Training detail access

**Event & Performance Tables**:
- `events` - Event data access
- `races` - Race data access
- `athlete_personal_bests` - Performance data access

**Knowledge Base Tables**:
- `knowledge_base_categories` - Coach-specific categories
- `knowledge_base_articles` - Coach-specific articles

**AI System Tables**:
- `ai_memories` - AI memory system (coach/athlete/group-scoped)

### RLS-Disabled Tables

**None** - All tables have RLS enabled as of December 2025.

**Note**: Previous documentation indicated `memories` (now `ai_memories`) had RLS disabled, but this has been updated. The table now has RLS enabled with appropriate policies for AI/ML operations.

## Policy Optimization Recommendations

Based on Supabase advisor analysis (December 2025):

1. **Performance Optimization**: 50+ RLS policies could be optimized by using `(select auth.uid())` pattern
2. **Index Optimization**: 30+ missing indexes on foreign keys identified
3. **Policy Consolidation**: 20+ tables have multiple permissive policies that could be consolidated
4. **Index Cleanup**: 2 duplicate indexes and 30+ unused indexes identified for review

## Notes
- All policies assume proper Clerk JWT configuration
- `get_user_role_data` function can be used for complex role checks
- Consider performance impact of complex JOIN operations in policies
- Test thoroughly with different authentication states
- All tables verified via Supabase MCP tools (December 2025) 