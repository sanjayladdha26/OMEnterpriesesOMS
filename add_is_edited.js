const { Client } = require('pg');
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

  const dns = require('dns');
  dns.setDefaultResultOrder('ipv6first');

  const client = new Client({
    connectionString: dbUrl,
  });
  
  try {
    await client.connect();
    console.log("Connected to the database");
    
    await client.query('ALTER TABLE public.order_messages ADD COLUMN is_edited boolean DEFAULT false;');
    
    console.log("Column is_edited added successfully!");
  } catch (err) {
    console.error("Error adding column:", err);
  } finally {
    await client.end();
  }
}

run();
