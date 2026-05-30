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

  let updateCount = 0;
  for (const agent of agents) {
    // Check if name has a space and 4 digits at the end
    const nameMatch = agent.name.match(/^(.*)\s\d{4}$/);
    if (nameMatch) {
      const originalName = nameMatch[1];
      console.log(`Reverting agent ID ${agent.id}: ${agent.name} -> ${originalName}`);
      const { error: updateError } = await supabase
        .from('agents')
        .update({ name: originalName })
        .eq('id', agent.id);

      if (updateError) {
        console.error(`Error updating agent ${agent.id}:`, updateError);
      } else {
        updateCount++;
      }
    }
  }

  console.log(`Successfully reverted names for ${updateCount} agents.`);
}

run();
