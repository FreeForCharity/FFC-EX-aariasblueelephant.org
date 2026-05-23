-- Summer Buddy Up Database Schema
-- 🚨 Run this script in the Supabase SQL Editor to initialize tables and RLS policies 🚨

-- 1. Create TEAMS table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT UNIQUE NOT NULL,
  focus_area TEXT NOT NULL,
  head_coach_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING_CONSENT',
  ratio_override BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create SUB_COACHES table
CREATE TABLE IF NOT EXISTS sub_coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  consent_accepted BOOLEAN NOT NULL DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  CONSTRAINT sub_coaches_email_lowercase CHECK (email = LOWER(email))
);

-- 3. Create STUDENTS table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  school_district TEXT NOT NULL,
  classification TEXT NOT NULL,
  award_delivery_type TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  parent_user_id UUID REFERENCES auth.users(id),
  parent_sub_coach_id UUID REFERENCES sub_coaches(id) ON DELETE SET NULL
);

-- 4. Create CHECK_INS table
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  milestone_target TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (team_id, milestone_target)
);

-- 5. Create INDEXES for faster queries
CREATE INDEX IF NOT EXISTS idx_teams_head_coach ON teams(head_coach_id);
CREATE INDEX IF NOT EXISTS idx_sub_coaches_team ON sub_coaches(team_id);
CREATE INDEX IF NOT EXISTS idx_sub_coaches_email ON sub_coaches(email);
CREATE INDEX IF NOT EXISTS idx_sub_coaches_user ON sub_coaches(user_id);
CREATE INDEX IF NOT EXISTS idx_students_team ON students(team_id);
CREATE INDEX IF NOT EXISTS idx_students_parent_user ON students(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_students_parent_sub ON students(parent_sub_coach_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_team ON check_ins(team_id);

-- 6. Enable Row-Level Security (RLS)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- RLS POLICIES FOR TEAMS
-- =========================================================================

-- SELECT: Head coach, sub coaches (if email matches), or admins
DROP POLICY IF EXISTS "Select teams policy" ON teams;
CREATE POLICY "Select teams policy" ON teams
FOR SELECT TO authenticated
USING (
  head_coach_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM sub_coaches 
    WHERE sub_coaches.team_id = teams.id 
    AND sub_coaches.email = LOWER(auth.jwt() ->> 'email')
  )
  OR auth.jwt() ->> 'email' IN ('admin@aariasblueelephant.org', 'aariasblueelephant@gmail.com')
);

-- INSERT: Authenticated users can create
DROP POLICY IF EXISTS "Insert teams policy" ON teams;
CREATE POLICY "Insert teams policy" ON teams
FOR INSERT TO authenticated
WITH CHECK (head_coach_id = auth.uid());

-- UPDATE: Head coach or admin
DROP POLICY IF EXISTS "Update teams policy" ON teams;
CREATE POLICY "Update teams policy" ON teams
FOR UPDATE TO authenticated
USING (
  head_coach_id = auth.uid()
  OR auth.jwt() ->> 'email' IN ('admin@aariasblueelephant.org', 'aariasblueelephant@gmail.com')
);

-- DELETE: Head coach or admin
DROP POLICY IF EXISTS "Delete teams policy" ON teams;
CREATE POLICY "Delete teams policy" ON teams
FOR DELETE TO authenticated
USING (
  head_coach_id = auth.uid()
  OR auth.jwt() ->> 'email' IN ('admin@aariasblueelephant.org', 'aariasblueelephant@gmail.com')
);

-- =========================================================================
-- RLS POLICIES FOR SUB_COACHES
-- =========================================================================

-- SELECT: Head coach, self, consented team sub-coaches, or admins
DROP POLICY IF EXISTS "Select sub_coaches policy" ON sub_coaches;
CREATE POLICY "Select sub_coaches policy" ON sub_coaches
FOR SELECT TO authenticated
USING (
  -- Head coach of the team can view all sub-coaches
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = sub_coaches.team_id 
    AND teams.head_coach_id = auth.uid()
  )
  -- A sub-coach can view their own record
  OR email = LOWER(auth.jwt() ->> 'email')
  -- A sub-coach who has consented can view other sub-coaches on the same team
  OR (
    EXISTS (
      SELECT 1 FROM sub_coaches my_self
      WHERE my_self.team_id = sub_coaches.team_id
      AND my_self.email = LOWER(auth.jwt() ->> 'email')
      AND my_self.consent_accepted = true
    )
  )
  -- Admins
  OR auth.jwt() ->> 'email' IN ('admin@aariasblueelephant.org', 'aariasblueelephant@gmail.com')
);

-- INSERT: Authenticated users (head coaches during wizard registration)
DROP POLICY IF EXISTS "Insert sub_coaches policy" ON sub_coaches;
CREATE POLICY "Insert sub_coaches policy" ON sub_coaches
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = sub_coaches.team_id 
    AND teams.head_coach_id = auth.uid()
  )
  OR auth.jwt() ->> 'email' IN ('admin@aariasblueelephant.org', 'aariasblueelephant@gmail.com')
);

-- UPDATE: Self (to accept consent/bind user_id), head coach, or admin
DROP POLICY IF EXISTS "Update sub_coaches policy" ON sub_coaches;
CREATE POLICY "Update sub_coaches policy" ON sub_coaches
FOR UPDATE TO authenticated
USING (
  email = LOWER(auth.jwt() ->> 'email')
  OR EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = sub_coaches.team_id 
    AND teams.head_coach_id = auth.uid()
  )
  OR auth.jwt() ->> 'email' IN ('admin@aariasblueelephant.org', 'aariasblueelephant@gmail.com')
);

-- DELETE: Head coach or admin
DROP POLICY IF EXISTS "Delete sub_coaches policy" ON sub_coaches;
CREATE POLICY "Delete sub_coaches policy" ON sub_coaches
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = sub_coaches.team_id 
    AND teams.head_coach_id = auth.uid()
  )
  OR auth.jwt() ->> 'email' IN ('admin@aariasblueelephant.org', 'aariasblueelephant@gmail.com')
);

-- =========================================================================
-- RLS POLICIES FOR STUDENTS
-- =========================================================================

-- SELECT: Head coach, consented team sub-coaches, or admins
DROP POLICY IF EXISTS "Select students policy" ON students;
CREATE POLICY "Select students policy" ON students
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = students.team_id 
    AND teams.head_coach_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM sub_coaches 
    WHERE sub_coaches.team_id = students.team_id 
    AND sub_coaches.email = LOWER(auth.jwt() ->> 'email')
    AND sub_coaches.consent_accepted = true
  )
  OR auth.jwt() ->> 'email' IN ('admin@aariasblueelephant.org', 'aariasblueelephant@gmail.com')
);

-- INSERT: Authenticated users (head coach registers roster)
DROP POLICY IF EXISTS "Insert students policy" ON students;
CREATE POLICY "Insert students policy" ON students
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = students.team_id 
    AND teams.head_coach_id = auth.uid()
  )
  OR auth.jwt() ->> 'email' IN ('admin@aariasblueelephant.org', 'aariasblueelephant@gmail.com')
);

-- UPDATE/DELETE: Head coach or admin
DROP POLICY IF EXISTS "Write students policy" ON students;
CREATE POLICY "Write students policy" ON students
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = students.team_id 
    AND teams.head_coach_id = auth.uid()
  )
  OR auth.jwt() ->> 'email' IN ('admin@aariasblueelephant.org', 'aariasblueelephant@gmail.com')
);

-- =========================================================================
-- RLS POLICIES FOR CHECK_INS
-- =========================================================================

-- SELECT: Head coach, consented team sub-coaches, or admins
DROP POLICY IF EXISTS "Select check_ins policy" ON check_ins;
CREATE POLICY "Select check_ins policy" ON check_ins
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = check_ins.team_id 
    AND teams.head_coach_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM sub_coaches 
    WHERE sub_coaches.team_id = check_ins.team_id 
    AND sub_coaches.email = LOWER(auth.jwt() ->> 'email')
    AND sub_coaches.consent_accepted = true
  )
  OR auth.jwt() ->> 'email' IN ('admin@aariasblueelephant.org', 'aariasblueelephant@gmail.com')
);

-- INSERT: Head coach or consented sub-coaches, AND only if team is not in PENDING_CONSENT
DROP POLICY IF EXISTS "Insert check_ins policy" ON check_ins;
CREATE POLICY "Insert check_ins policy" ON check_ins
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = check_ins.team_id 
    AND (
      teams.head_coach_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM sub_coaches 
        WHERE sub_coaches.team_id = teams.id 
        AND sub_coaches.email = LOWER(auth.jwt() ->> 'email')
        AND sub_coaches.consent_accepted = true
      )
    )
    AND teams.status != 'PENDING_CONSENT'
  )
);

-- 9. Insert Default App Settings for Buddy Up
INSERT INTO app_settings (key, value)
VALUES (
  'buddy_up_config', 
  '{"checkins_enabled": false, "checkin_questions": ["What project are you working on?", "What did you learn?", "How could you improve?"]}'
)
ON CONFLICT (key) DO NOTHING;

-- 10. Migration for existing check_ins tables (safe addition of JSONB answers)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='check_ins' AND column_name='answers') THEN
        ALTER TABLE check_ins ADD COLUMN answers JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='check_ins' AND column_name='project_summary') THEN
        ALTER TABLE check_ins DROP COLUMN project_summary;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='check_ins' AND column_name='learnings_log') THEN
        ALTER TABLE check_ins DROP COLUMN learnings_log;
    END IF;
END $$;
