const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function run() {
  let dbUrl = process.env.DATABASE_URL.replace(/^"|"$/g, ''); 
  
  const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@(.*)/);
  if (match) {
    const user = match[1];
    const password = match[2];
    const rest = match[3];
    dbUrl = `postgresql://${user}:${encodeURIComponent(password)}@${rest}`;
  }

  // Passing host and family to force IPv6 resolution? No, pg doesn't directly take family,
  // but let's see if we can resolve it manually using dns
  const dns = require('dns');
  dns.setDefaultResultOrder('ipv6first');

  const client = new Client({
    connectionString: dbUrl,
  });
  
  try {
    await client.connect();
    console.log("Connected to the database");
    
    const sql = fs.readFileSync('supabase/migrations/20260601000000_add_image_url_to_order_items.sql', 'utf8');    
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
