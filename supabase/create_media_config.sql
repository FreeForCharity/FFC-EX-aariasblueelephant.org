-- Create a simple key-value store for app settings, starting with media_config
CREATE TABLE IF NOT EXISTS app_settings (
    key text PRIMARY KEY,
    value text NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON app_settings;
CREATE POLICY "Public profiles are viewable by everyone." ON app_settings
    FOR SELECT USING (true);

-- Allow admins to insert/update based on email domain
DROP POLICY IF EXISTS "Board members can insert app_settings" ON app_settings;
CREATE POLICY "Board members can insert app_settings" ON app_settings
    FOR INSERT WITH CHECK (
        auth.email() IN ('admin@aariasblueelephant.org', 'aariasblueelephant@gmail.com')
        OR auth.email() LIKE '%@aariasblueelephant.org'
    );

DROP POLICY IF EXISTS "Board members can update app_settings" ON app_settings;
CREATE POLICY "Board members can update app_settings" ON app_settings
    FOR UPDATE USING (
        auth.email() IN ('admin@aariasblueelephant.org', 'aariasblueelephant@gmail.com')
        OR auth.email() LIKE '%@aariasblueelephant.org'
    );

-- Insert initial placeholder config
INSERT INTO app_settings (key, value)
VALUES ('google_photos_album_url', '')
ON CONFLICT (key) DO NOTHING;

INSERT INTO app_settings (key, value)
VALUES ('carousel_mode', 'events')
ON CONFLICT (key) DO NOTHING;
