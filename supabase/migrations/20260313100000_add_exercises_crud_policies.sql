-- Add INSERT, UPDATE, DELETE policies for exercises table
-- Currently only has SELECT policy — users cannot create/edit/delete exercises

-- INSERT: authenticated users can create exercises they own
CREATE POLICY "Users can create exercises"
  ON public.exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_user_id = (SELECT u.id FROM public.users u WHERE u.clerk_id = (auth.jwt() ->> 'sub'))
  );

-- UPDATE: owners can update their own exercises only
CREATE POLICY "Users can update own exercises"
  ON public.exercises
  FOR UPDATE
  TO authenticated
  USING (
    owner_user_id = (SELECT u.id FROM public.users u WHERE u.clerk_id = (auth.jwt() ->> 'sub'))
  )
  WITH CHECK (
    owner_user_id = (SELECT u.id FROM public.users u WHERE u.clerk_id = (auth.jwt() ->> 'sub'))
  );

-- DELETE: owners can delete their own exercises only
CREATE POLICY "Users can delete own exercises"
  ON public.exercises
  FOR DELETE
  TO authenticated
  USING (
    owner_user_id = (SELECT u.id FROM public.users u WHERE u.clerk_id = (auth.jwt() ->> 'sub'))
  );
