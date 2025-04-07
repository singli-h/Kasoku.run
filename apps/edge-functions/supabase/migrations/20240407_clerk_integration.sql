-- Create a function to get the Clerk user ID from the JWT claims
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT AS $$
  RETURN (
    SELECT sub 
    FROM auth.jwt() as jwt 
    WHERE jwt.role = 'authenticated'
  );
$$ LANGUAGE SQL STABLE;

-- Create a function to get the clerk_id claim from the JWT
CREATE OR REPLACE FUNCTION requesting_clerk_id()
RETURNS TEXT AS $$
  RETURN (
    SELECT coalesce(
      claims ->> 'user_metadata' ::jsonb ->> 'clerk_id',
      claims ->> 'sub'
    )
    FROM auth.jwt() as jwt
  );
$$ LANGUAGE SQL STABLE;

-- Create the profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security on the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the profiles table

-- Allow users to read only their own profile
CREATE POLICY "Users can read only their own profile"
ON public.profiles
FOR SELECT
USING (clerk_id = requesting_clerk_id());

-- Allow authenticated users to update only their own profile
CREATE POLICY "Users can update only their own profile"
ON public.profiles
FOR UPDATE
USING (clerk_id = requesting_clerk_id());

-- Create a function to create a profile if it doesn't exist
CREATE OR REPLACE FUNCTION ensure_profile_exists()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, clerk_id, email, first_name, last_name)
  VALUES (NEW.id, NEW.clerk_id, NEW.email, NEW.first_name, NEW.last_name)
  ON CONFLICT (clerk_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; 