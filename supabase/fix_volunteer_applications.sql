-- 🚨 RUN THIS IN SUPABASE SQL EDITOR 🚨
-- This fixes the missing 'user_id' column error for volunteer applications and explicitly reloads the schema cache.

-- 1. Add the missing user_id column
ALTER TABLE volunteer_applications 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- 2. Add other optional columns just in case they are missing
ALTER TABLE volunteer_applications 
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE volunteer_applications 
ADD COLUMN IF NOT EXISTS experience TEXT;

ALTER TABLE volunteer_applications 
ADD COLUMN IF NOT EXISTS date TEXT;

ALTER TABLE volunteer_applications 
ADD COLUMN IF NOT EXISTS interest TEXT;

-- 3. Force Supabase (PostgREST) to reload its schema cache
-- This is critical for clearing the "Could not find the 'user_id' column ... in the schema cache" error
NOTIFY pgrst, 'reload schema';
