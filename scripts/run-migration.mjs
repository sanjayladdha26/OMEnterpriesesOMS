// Run this script to apply the invoice_start_number migration to the remote Supabase DB
// Usage: node scripts/run-migration.mjs

const SUPABASE_URL = "https://asqiycozhpcligyqfpkl.supabase.co";

// Read service role key from environment or prompt
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error(
    "ERROR: Set SUPABASE_SERVICE_ROLE_KEY environment variable.\n" +
    "Find it at: Supabase Dashboard -> Project Settings -> API -> service_role key"
  );
  process.exit(1);
}

const sql = `ALTER TABLE settings ADD COLUMN IF NOT EXISTS invoice_start_number INTEGER NOT NULL DEFAULT 1;`;

const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
  },
  body: JSON.stringify({ query: sql }),
});

// Try the SQL endpoint via pg_meta
const res2 = await fetch(`${SUPABASE_URL}/pg/query`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
  },
  body: JSON.stringify({ query: sql }),
});

if (res2.ok) {
  console.log("✅ Migration applied successfully");
} else {
  const body = await res2.text();
  console.log("Response:", res2.status, body);
  console.log("\nIf this fails, paste this SQL directly in Supabase SQL Editor:");
  console.log(sql);
}
