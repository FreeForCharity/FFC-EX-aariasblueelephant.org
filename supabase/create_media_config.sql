-- Create a simple key-value store for app settings, starting with media_config
CREATE TABLE IF NOT EXISTS app_settings (
    key text PRIMARY KEY,
    value text NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public profiles are viewable by everyone." ON app_settings
    FOR SELECT USING (true);

-- Allow admins to insert/update
CREATE POLICY "Board members can insert app_settings" ON app_settings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'board'
        )
    );

CREATE POLICY "Board members can update app_settings" ON app_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'board'
        )
    );

-- Insert initial empty or placeholder config
INSERT INTO app_settings (key, value)
VALUES ('google_photos_album_url', '')
ON CONFLICT (key) DO NOTHING;
