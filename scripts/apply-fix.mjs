import { Client } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const rawUrl = process.env.DATABASE_URL.replace(/^"|"$/g, '');
const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
const match = rawUrl.match(regex);
const client = new Client({
  user: match[1],
  password: match[2],
  host: match[3],
  port: parseInt(match[4]),
  database: match[5],
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log("Connected to database.");
  const sql = fs.readFileSync('supabase/migrations/20260601000000_add_image_url_to_order_items.sql', 'utf8');
  try {
    await client.query(sql);
    console.log("SQL executed successfully!");
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    await client.end();
  }
}

run();
