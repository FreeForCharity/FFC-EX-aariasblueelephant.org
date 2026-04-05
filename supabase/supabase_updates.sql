-- SQL to update the events table with a duration column
-- Run this in your Supabase SQL Editor

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS duration NUMERIC DEFAULT 1.0;

-- Update existing events to have a default duration if they don't have one
UPDATE public.events SET duration = 1.0 WHERE duration IS NULL;
