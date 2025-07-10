-- Enable RLS for athletes and coaches tables
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own athlete profile" ON public.athletes;
DROP POLICY IF EXISTS "Users can manage their own coach profile" ON public.coaches;


-- RLS Policies for 'athletes' table
-- This policy allows users to perform all actions (SELECT, INSERT, UPDATE, DELETE) on their own athlete profile.
-- The `USING` clause applies to SELECT, UPDATE, DELETE operations, ensuring users can only affect their own rows.
-- The `WITH CHECK` clause applies to INSERT and UPDATE operations, ensuring a user cannot create or move a record to belong to someone else.
CREATE POLICY "Users can manage their own athlete profile"
ON public.athletes
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for 'coaches' table
-- This policy allows users to perform all actions on their own coach profile.
CREATE POLICY "Users can manage their own coach profile"
ON public.coaches
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id); 