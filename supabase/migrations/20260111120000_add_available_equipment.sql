-- Migration: Add available_equipment column for individual users
-- This stores the user's available gym equipment as a JSONB array

-- Add available_equipment column to athletes table
ALTER TABLE athletes
ADD COLUMN IF NOT EXISTS available_equipment jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN athletes.available_equipment IS
  'JSONB array of available equipment strings for individual users (e.g., ["barbell", "dumbbells", "pullup-bar"])';

-- Create GIN index for potential filtering queries on equipment
CREATE INDEX IF NOT EXISTS idx_athletes_available_equipment
ON athletes USING GIN (available_equipment);
