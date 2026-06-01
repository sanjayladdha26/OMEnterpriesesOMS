const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });
async function test() {
  await client.connect();
  const res = await client.query("SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'create_order';");
  console.log(res.rows.map(r => r.pg_get_functiondef).join('\n\n=====================\n\n'));
  await client.end();
}
test();
