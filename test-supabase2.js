const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://asqiycozhpcligyqfpkl.supabase.co',
  'sb_publishable_AGeCj55NzSImNMvpreSruw_-DsjGhM7'
);

async function testQuery() {
  const tables = ['categories', 'products', 'customers', 'bills'];
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    console.log(`Table ${table} error:`, error?.message || 'OK');
  }
}

testQuery();
