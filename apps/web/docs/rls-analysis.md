# Row Level Security (RLS) Analysis
## Kasoku Running Website Database

## Overview
This document outlines the recommended RLS policies for the Kasoku running website database, designed to work with Clerk authentication and our athlete/coach role system.

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

## Notes
- All policies assume proper Clerk JWT configuration
- `get_user_role_data` function can be used for complex role checks
- Consider performance impact of complex JOIN operations in policies
- Test thoroughly with different authentication states 