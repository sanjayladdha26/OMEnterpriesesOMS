CREATE TABLE IF NOT EXISTS staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  can_create_order BOOLEAN DEFAULT false,
  can_update_status BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to staff" ON staff FOR ALL USING (true) WITH CHECK (true);

-- Insert the default admin if it doesn't exist
INSERT INTO staff (name, code, is_admin)
VALUES ('Chirag', 'chirag', true)
ON CONFLICT (code) DO NOTHING;
