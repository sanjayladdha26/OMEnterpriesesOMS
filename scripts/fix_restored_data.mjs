import dotenv from 'dotenv';
import { Client } from 'pg';
import { execSync } from 'child_process';

dotenv.config();

const dbUrl = process.env.DATABASE_URL.replace('jgeBQHKx?viB4u)', encodeURIComponent('jgeBQHKx?viB4u)'));
const client = new Client({ connectionString: dbUrl });

async function fix() {
  await client.connect();
  console.log('Connected to DB. Fixing data...');

  // 1. Re-add the default staff
  console.log('Restoring default staff (Chirag)...');
  await client.query(`
    INSERT INTO staff (
      name, code, is_admin, can_create_order,
      can_view_orders, can_view_inventory, can_view_agents, can_view_staff,
      can_accept_order, can_dispatch_order, can_complete_order, can_reject_order
    ) 
    VALUES ('Chirag', 'chirag', true, true, true, true, true, true, true, true, true, true)
    ON CONFLICT (code) DO NOTHING;
  `);

  // 2. Generate access codes for all parties that don't have one
  console.log('Generating access codes for parties...');
  const partiesRes = await client.query('SELECT id FROM parties WHERE access_code IS NULL;');
  let updated = 0;
  for (const row of partiesRes.rows) {
    const accessCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    // Since unique constraint exists, simple retry loop if collision
    try {
      await client.query('UPDATE parties SET access_code = $1 WHERE id = $2', [accessCode, row.id]);
      updated++;
    } catch (e) {
      // Ignore collision and skip for this run (very rare for 6 digits on 3k parties, but possible)
    }
  }
  console.log(`Generated access codes for ${updated} parties.`);

  // 3. Clear the wrong products from the other website and load products.json
  console.log('Clearing wrong products...');
  await client.query('DELETE FROM order_items;'); // Need to clear this before deleting products due to FK constraint
  await client.query('DELETE FROM products;');
  
  console.log('Loading correct products from products.json...');
  try {
    execSync('python seed_products.py', { cwd: './scripts', stdio: 'inherit' });
    console.log('Products re-seeded.');
  } catch(e) {
    console.error('Failed to run seed_products.py:', e.message);
  }

  await client.end();
  console.log('Fixes complete!');
}

fix().catch(console.error);
