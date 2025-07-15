-- Row Level Security (RLS) Policies for Training Plans
-- This file contains the SQL scripts needed to set up RLS policies for exercise_preset_groups table

-- Enable RLS on the exercise_preset_groups table
ALTER TABLE exercise_preset_groups ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own training plans or templates
CREATE POLICY "owner_or_template" ON exercise_preset_groups
  FOR ALL
  USING (
    user_id = (
      SELECT id FROM users WHERE clerk_id = auth.uid()::text
    ) OR 
    is_template = true
  );

-- Policy: Users can only insert their own training plans
CREATE POLICY "users_can_insert_own_plans" ON exercise_preset_groups
  FOR INSERT
  WITH CHECK (
    user_id = (
      SELECT id FROM users WHERE clerk_id = auth.uid()::text
    )
  );

-- Policy: Users can only update their own training plans
CREATE POLICY "users_can_update_own_plans" ON exercise_preset_groups
  FOR UPDATE
  USING (user_id = (
    SELECT id FROM users WHERE clerk_id = auth.uid()::text
  ))
  WITH CHECK (user_id = (
    SELECT id FROM users WHERE clerk_id = auth.uid()::text
  ));

-- Policy: Users can only delete their own training plans
CREATE POLICY "users_can_delete_own_plans" ON exercise_preset_groups
  FOR DELETE
  USING (user_id = (
    SELECT id FROM users WHERE clerk_id = auth.uid()::text
  ));

-- Note: The auth.uid() function returns the Clerk user ID from the JWT token
-- This is mapped to the database user_id through the users table using clerk_id
-- The policies ensure that:
-- 1. Users can only see plans they created (user_id matches their DB user ID) OR templates (is_template = true)
-- 2. Users can only create plans with their own user_id
-- 3. Users can only modify/delete their own plans
-- 4. Template plans (is_template = true) are visible to all users for future template functionality 