-- Add track and field specific equipment tags
-- These complement the existing gym equipment tags for athletic training

INSERT INTO tags (name, category) VALUES
  ('hurdles', 'equipment'),
  ('cones', 'equipment'),
  ('agility ladder', 'equipment'),
  ('plyo box', 'equipment'),
  ('sled', 'equipment'),
  ('starting blocks', 'equipment')
ON CONFLICT DO NOTHING;

-- Merge 'pull-up bar' exercises into 'bodyweight' category
-- Pull-up bar is a bodyweight accessory, not a separate equipment category
INSERT INTO exercise_tags (exercise_id, tag_id)
SELECT et.exercise_id, (SELECT id FROM tags WHERE name = 'bodyweight' AND category = 'equipment')
FROM exercise_tags et
JOIN tags t ON et.tag_id = t.id
WHERE t.name = 'pull-up bar' AND t.category = 'equipment'
ON CONFLICT DO NOTHING;

-- Note: We keep the 'pull-up bar' tag for now for backward compatibility
-- It can be removed in a future migration after verifying no issues
