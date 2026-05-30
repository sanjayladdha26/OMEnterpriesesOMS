import dotenv from 'dotenv';
dotenv.config();
import { Client } from 'pg';

const dbUrl = process.env.DATABASE_URL.replace('jgeBQHKx?viB4u)', encodeURIComponent('jgeBQHKx?viB4u)'));
const client = new Client({ connectionString: dbUrl });

async function run() {
  await client.connect();
  const tables = ['categories', 'products', 'agents', 'parties', 'staff', 'orders', 'order_items'];
  for (const table of tables) {
    const res = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1;`, [table]);
    console.log(`\nTable: ${table}`);
    console.log(res.rows.map(r => `  ${r.column_name} (${r.data_type})`).join('\n'));
  }
  await client.end();
}
run().catch(console.error);
