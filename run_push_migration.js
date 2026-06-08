const { Client } = require('pg');
require('dotenv').config();

const sql = `
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(endpoint)
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT,
    icon TEXT,
    url TEXT,
    status TEXT DEFAULT 'sent',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- We ignore policy already exists errors by doing it manually or safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own subscriptions' AND tablename = 'push_subscriptions') THEN
        CREATE POLICY "Users can insert their own subscriptions" ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own subscriptions' AND tablename = 'push_subscriptions') THEN
        CREATE POLICY "Users can view their own subscriptions" ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own subscriptions' AND tablename = 'push_subscriptions') THEN
        CREATE POLICY "Users can update their own subscriptions" ON push_subscriptions FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own subscriptions' AND tablename = 'push_subscriptions') THEN
        CREATE POLICY "Users can delete their own subscriptions" ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own notifications' AND tablename = 'notifications') THEN
        CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own notifications' AND tablename = 'notifications') THEN
        CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END
$$;
`;

async function run() {
  let dbUrl = process.env.DATABASE_URL.replace(/^"|"$/g, ''); 
  
  const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@(.*)/);
  if (match) {
    const user = match[1];
    const password = match[2];
    const rest = match[3];
    dbUrl = `postgresql://${user}:${encodeURIComponent(password)}@${rest}`;
  }

  const dns = require('dns');
  dns.setDefaultResultOrder('ipv6first');

  const client = new Client({
    connectionString: dbUrl,
  });
  
  try {
    await client.connect();
    console.log("Connected to the database");
    
    console.log("Executing migration...");
    await client.query(sql);
    
    console.log("Migration applied successfully!");
  } catch (err) {
    console.error("Error running migration:", err);
  } finally {
    await client.end();
  }
}

run();
