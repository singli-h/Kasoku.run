-- Add 'equipment' to tags.category CHECK constraint
-- This must run BEFORE the track & field equipment tags migration

-- Drop the existing constraint and recreate with 'equipment' included
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_category_family_ck;

ALTER TABLE tags ADD CONSTRAINT tags_category_family_ck
  CHECK (category IS NULL OR category = ANY (ARRAY[
    'region'::text,
    'goal'::text,
    'modality'::text,
    'intensity'::text,
    'contraindication'::text,
    'equipment'::text
  ]));
