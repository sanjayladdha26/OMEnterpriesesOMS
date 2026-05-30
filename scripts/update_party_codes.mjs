import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

const dbUrl = process.env.DATABASE_URL.replace('jgeBQHKx?viB4u)', encodeURIComponent('jgeBQHKx?viB4u)'));
const client = new Client({ connectionString: dbUrl });

function sanitizeName(name) {
  // Convert to lowercase, remove all non-alphanumeric characters
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function run() {
  await client.connect();
  console.log('Fetching all parties...');
  
  const res = await client.query('SELECT id, account_name FROM parties ORDER BY id;');
  const parties = res.rows;
  
  console.log(`Found ${parties.length} parties. Generating name-based codes...`);
  
  // Set to keep track of used codes to ensure uniqueness
  const usedCodes = new Set();
  const updates = [];

  for (const party of parties) {
    const baseCode = sanitizeName(party.account_name) || 'party';
    let code = '';
    let success = false;
    
    while (!success) {
      const fourDigit = Math.floor(1000 + Math.random() * 9000).toString();
      code = `${baseCode}${fourDigit}`;
      
      if (!usedCodes.has(code)) {
        usedCodes.add(code);
        success = true;
      }
    }
    
    updates.push({ id: party.id, code });
  }

  console.log('Applying updates to the database...');
  let updatedCount = 0;
  
  // Batch update strategy: using transactions and executing in chunks
  await client.query('BEGIN');
  try {
    for (const update of updates) {
      await client.query('UPDATE parties SET access_code = $1 WHERE id = $2', [update.code, update.id]);
      updatedCount++;
      if (updatedCount % 500 === 0) {
        console.log(`Updated ${updatedCount} / ${parties.length}`);
      }
    }
    await client.query('COMMIT');
    console.log(`Successfully updated ${updatedCount} parties with name-based access codes!`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error during update, transaction rolled back:', e);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
