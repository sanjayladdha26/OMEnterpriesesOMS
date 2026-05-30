import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vuktnkskajpedqfodssx.supabase.co',
  'sb_publishable_yJdyHFT1d3s2PbWTDejwhw_KmZmzRpJ' // We only have the anon key
);

async function test() {
  const { data, error } = await supabase.from('order_items').select('*').limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
}

test();
