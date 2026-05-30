import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

const dbUrl = process.env.DATABASE_URL.replace('jgeBQHKx?viB4u)', encodeURIComponent('jgeBQHKx?viB4u)'));
const client = new Client({ connectionString: dbUrl });

async function fix() {
  await client.connect();
  console.log('Checking for parties missing an access_code...');

  const partiesRes = await client.query('SELECT id FROM parties WHERE access_code IS NULL;');
  
  if (partiesRes.rows.length === 0) {
    console.log('All parties have access codes!');
    await client.end();
    return;
  }

  console.log(`Found ${partiesRes.rows.length} parties missing codes. Fixing...`);
  
  let updated = 0;
  for (const row of partiesRes.rows) {
    let success = false;
    while (!success) {
      const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
      try {
        await client.query('UPDATE parties SET access_code = $1 WHERE id = $2', [accessCode, row.id]);
        success = true;
        updated++;
      } catch (e) {
        // If collision, it will loop and try a new random number
      }
    }
  }
  
  console.log(`Successfully generated codes for the remaining ${updated} parties.`);
  await client.end();
}

fix().catch(console.error);
