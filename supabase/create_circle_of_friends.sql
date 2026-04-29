-- 🚨 RUN THIS IN SUPABASE SQL EDITOR 🚨
-- This creates the table for Circle of Friends submissions

CREATE TABLE IF NOT EXISTS public.circle_of_friends (
    id TEXT PRIMARY KEY, -- Using TEXT instead of UUID to preserve your existing short IDs
    name TEXT NOT NULL,
    grade TEXT NOT NULL,
    school TEXT NOT NULL,
    teacher TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    media TEXT[] DEFAULT '{}', -- Array of base64 image strings
    priority INTEGER DEFAULT 23,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.circle_of_friends ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the entries
CREATE POLICY "Enable read access for all users" 
ON public.circle_of_friends 
FOR SELECT 
USING (true);

-- Allow admins to insert/update/delete
CREATE POLICY "Admins can insert entries" 
ON public.circle_of_friends 
FOR INSERT TO authenticated
WITH CHECK (
  auth.email() IN ('admin@aariasblueelephant.org', 'aariasblueelephant@gmail.com')
  OR auth.email() LIKE '%@aariasblueelephant.org'
);

CREATE POLICY "Admins can update entries" 
ON public.circle_of_friends 
FOR UPDATE TO authenticated
USING (
  auth.email() IN ('admin@aariasblueelephant.org', 'aariasblueelephant@gmail.com')
  OR auth.email() LIKE '%@aariasblueelephant.org'
);

CREATE POLICY "Admins can delete entries" 
ON public.circle_of_friends 
FOR DELETE TO authenticated
USING (
  auth.email() IN ('admin@aariasblueelephant.org', 'aariasblueelephant@gmail.com')
  OR auth.email() LIKE '%@aariasblueelephant.org'
);
