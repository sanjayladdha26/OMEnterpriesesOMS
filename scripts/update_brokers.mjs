import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
  const key = env.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim();
  const supabase = createClient(url, key);

  const rawData = fs.readFileSync('scripts/brokers_phones.json', 'utf8');
  const brokers = JSON.parse(rawData);

  // Filter out the header row if it accidentally made it in
  const validBrokers = brokers.filter(b => b.name !== 'ACCOUNT NAME');

  // Fetch all agents
  const { data: agents, error: err } = await supabase.from('agents').select('id, name');
  if (err) {
    console.error('Error fetching agents:', err);
    return;
  }

  console.log(`Fetched ${agents.length} agents from DB. Found ${validBrokers.length} brokers with phone numbers in file.`);

  let updatedCount = 0;
  let notFoundCount = 0;

  for (const broker of validBrokers) {
    // Find matching agent
    const agent = agents.find(a => a.name === broker.name);
    if (agent) {
      // Update phone number
      const { error: updateErr } = await supabase
        .from('agents')
        .update({ phone: broker.phone })
        .eq('id', agent.id);

      if (updateErr) {
        console.error(`Failed to update ${broker.name}:`, updateErr);
      } else {
        updatedCount++;
      }
    } else {
      notFoundCount++;
      // console.log(`Broker not found in DB: ${broker.name}`);
    }
  }

  console.log(`Successfully updated ${updatedCount} agents.`);
  console.log(`Could not find ${notFoundCount} brokers in the agents table.`);
}

run();
