-- Migration to add rating column to testimonials table
-- This allows for the new 5-star rating system

ALTER TABLE testimonials 
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);

-- Maintain any existing testimonials with a default rating of 5 if preferred, or leave as NULL
-- UPDATE testimonials SET rating = 5 WHERE rating IS NULL;

-- Ensure author_email column exists for authenticated submissions
ALTER TABLE testimonials 
ADD COLUMN IF NOT EXISTS author_email TEXT;

-- Update RLS policies if necessary to allow users to insert their own testimonials
-- Note: status defaults to 'Pending' in DataContext logic, so it's safe.
