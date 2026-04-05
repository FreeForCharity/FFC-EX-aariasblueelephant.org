-- 🚨 RUN THIS IN SUPABASE SQL EDITOR 🚨
-- This fixes the 'missing column' error for community story submissions.

-- 1. Add the author_email column (this is the missing one causing the error)
ALTER TABLE testimonials 
ADD COLUMN IF NOT EXISTS author_email TEXT;

-- 2. Add the rating column for the 5-star heart system
ALTER TABLE testimonials 
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5) DEFAULT 5;

-- 3. Update the RLS policy to allow anyone to see approved testimonials
-- (Optional: adjust if you need custom visibility)
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated users to read approved stories
DROP POLICY IF EXISTS "Anyone can view approved stories" ON testimonials;
CREATE POLICY "Anyone can view approved stories" 
ON testimonials FOR SELECT 
USING (status = 'Approved');

-- Allow authenticated users to submit their own stories
DROP POLICY IF EXISTS "Authenticated users can submit stories" ON testimonials;
CREATE POLICY "Authenticated users can submit stories" 
ON testimonials FOR INSERT 
TO authenticated 
WITH CHECK (true);
