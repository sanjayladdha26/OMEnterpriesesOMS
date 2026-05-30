import dotenv from 'dotenv';
import { Client } from 'pg';
import { execSync } from 'child_process';
import fs from 'fs';

dotenv.config();

const dbUrl = process.env.DATABASE_URL.replace('jgeBQHKx?viB4u)', encodeURIComponent('jgeBQHKx?viB4u)'));
const client = new Client({ connectionString: dbUrl });

async function restore() {
  await client.connect();
  console.log('Connected to the database. Wiping dummy data...');

  await client.query('DELETE FROM order_items;');
  await client.query('DELETE FROM orders;');
  await client.query('DELETE FROM products;');
  await client.query('DELETE FROM categories;');
  await client.query('DELETE FROM parties;');
  await client.query('DELETE FROM agents;');
  await client.query('DELETE FROM staff;');

  console.log('Dummy data cleared. Restoring agents and parties...');
  
  try {
    execSync('python seed_parties.py', { cwd: './scripts', stdio: 'inherit' });
    console.log('Restored parties. Running deduplication...');
    execSync('node dedupe_parties.js', { stdio: 'inherit' });
    
    console.log('Restoring products...');
    const sql = fs.readFileSync('scripts/import_products_fixed.sql', 'utf8');
    await client.query(sql);
    console.log('Restored products successfully.');

    // We can also try running the broker phone data script to restore phone numbers if it was used
    console.log('Restoring broker phone data...');
    execSync('node scripts/update_brokers_phones.mjs', { stdio: 'inherit' });

    console.log('ALL OLD DATA RESTORED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error during restore:', err.message);
  } finally {
    await client.end();
  }
}

restore().catch(console.error);
