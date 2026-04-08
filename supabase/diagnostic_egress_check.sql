-- 🚨 SUPABASE DIAGNOSTIC: EGRESS/BANDWIDTH CHECK 🚨
-- Run this in the Supabase SQL Editor to find the heaviest rows in your database.
-- These are likely the ones consuming your bandwidth limit.

SELECT 
    id, 
    author, 
    LEFT(content, 20) as snippet,
    LENGTH(media) / 1024 as media_kb,
    LENGTH(avatar) / 1024 as avatar_kb,
    (COALESCE(LENGTH(media), 0) + COALESCE(LENGTH(avatar), 0)) / 1024 as total_row_kb
FROM public.testimonials
ORDER BY total_row_kb DESC
LIMIT 10;

-- Also check events table if you have large event images
SELECT 
    id, 
    title, 
    LENGTH(image) / 1024 as image_kb,
    LENGTH(description) / 1024 as desc_kb
FROM public.events
ORDER BY image_kb DESC
LIMIT 5;
