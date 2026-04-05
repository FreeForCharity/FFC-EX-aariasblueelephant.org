-- Enable RLS on event_registrations
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to register for events
-- We use a simplified check here to allow the initial insert
DROP POLICY IF EXISTS "Users can register for events" ON event_registrations;
CREATE POLICY "Users can register for events" ON event_registrations
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow users to view their own registrations
DROP POLICY IF EXISTS "Users can view own registrations" ON event_registrations;
CREATE POLICY "Users can view own registrations" ON event_registrations
FOR SELECT TO authenticated
USING (auth.uid()::text = user_id OR auth.email() = user_email);

-- Allow admins to manage everything
DROP POLICY IF EXISTS "Admins can manage registrations" ON event_registrations;
CREATE POLICY "Admins can manage registrations" ON event_registrations
FOR ALL TO authenticated
USING (
  auth.email() IN ('admin@aariasblueelephant.org', 'aariasblueelephant@gmail.com')
  OR auth.email() LIKE '%@aariasblueelephant.org'
);

-- Also ensure volunteer_applications are accessible
ALTER TABLE volunteer_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can apply to volunteer" ON volunteer_applications;
CREATE POLICY "Anyone can apply to volunteer" ON volunteer_applications
FOR INSERT TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage volunteer apps" ON volunteer_applications;
CREATE POLICY "Admins can manage volunteer apps" ON volunteer_applications
FOR ALL TO authenticated
USING (
  auth.email() IN ('admin@aariasblueelephant.org', 'aariasblueelephant@gmail.com')
  OR auth.email() LIKE '%@aariasblueelephant.org'
);
