-- 🚨 RUN THIS IN SUPABASE SQL EDITOR 🚨
-- This adds the missing columns for avatars, ranking, and titles to the testimonials table.

ALTER TABLE public.testimonials 
ADD COLUMN IF NOT EXISTS avatar TEXT,
ADD COLUMN IF NOT EXISTS rank INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Ensure author_email exists just in case
ALTER TABLE public.testimonials 
ADD COLUMN IF NOT EXISTS author_email TEXT;
