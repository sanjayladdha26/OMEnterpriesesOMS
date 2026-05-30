const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
  const key = env.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim();
  const supabase = createClient(url, key);

  const { data: agents, error: err } = await supabase.from('agents').select('id, name');
  if (err) {
    console.error('Error fetching agents:', err);
    return;
  }
  
  console.log(`Fetched ${agents.length} agents`);

  // Instead of xlsx, let's write a small python script that dumps the relevant info to a JSON file
  // since reading xlsx in node without 'xlsx' module installed is hard, and I don't want to mess up package.json
}
run();
