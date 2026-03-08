-- Migration: Add unique constraints to prevent duplicate user profiles
-- These constraints ensure one-to-one relationship between users and their profiles

-- Add unique constraint on athletes.user_id
ALTER TABLE athletes
ADD CONSTRAINT athletes_user_id_unique UNIQUE (user_id);

-- Add unique constraint on coaches.user_id
ALTER TABLE coaches
ADD CONSTRAINT coaches_user_id_unique UNIQUE (user_id);

-- Add comments for documentation
COMMENT ON CONSTRAINT athletes_user_id_unique ON athletes IS
  'Ensures each user can only have one athlete profile';
COMMENT ON CONSTRAINT coaches_user_id_unique ON coaches IS
  'Ensures each user can only have one coach profile';
