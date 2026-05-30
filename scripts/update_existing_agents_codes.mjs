import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

async function run() {
  const envPath = path.join(process.cwd(), '..', '.env');
  let env = '';
  try {
    env = fs.readFileSync(envPath, 'utf8');
  } catch (e) {
    env = fs.readFileSync(path.join(process.cwd(), '..', '.env.local'), 'utf8');
  }

  const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
  const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/) || env.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.*)/);

  if (!urlMatch || !keyMatch) {
    console.error('Could not find Supabase URL or Key in environment variables.');
    return;
  }

  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  const { data: agents, error } = await supabase.from('agents').select('*');
  if (error) {
    console.error('Error fetching agents:', error);
    return;
  }

  console.log(`Found ${agents.length} agents. Updating codes and names if necessary...`);

  let updateCount = 0;
  for (const agent of agents) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Check if name already has 4 digits at the end
    const nameHasDigits = /\d{4}$/.test(agent.name);
    // Check if code already has 4 digits at the end
    const codeHasDigits = /\d{4}$/.test(agent.code);

    let newName = agent.name;
    let newCode = agent.code;
    let needsUpdate = false;

    if (!nameHasDigits) {
      newName = `${agent.name} ${randomDigits}`;
      needsUpdate = true;
    }

    if (!codeHasDigits) {
      // Typically codes don't have spaces
      newCode = `${agent.code}${randomDigits}`;
      needsUpdate = true;
    }

    if (needsUpdate) {
      console.log(`Updating agent ID ${agent.id}: ${agent.name} -> ${newName}, ${agent.code} -> ${newCode}`);
      const { error: updateError } = await supabase
        .from('agents')
        .update({ name: newName, code: newCode })
        .eq('id', agent.id);

      if (updateError) {
        console.error(`Error updating agent ${agent.id}:`, updateError);
      } else {
        updateCount++;
      }
    }
  }

  console.log(`Successfully updated ${updateCount} agents.`);
}

run();
