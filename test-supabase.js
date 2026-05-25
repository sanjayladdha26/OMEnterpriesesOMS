const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://asqiycozhpcligyqfpkl.supabase.co',
  'sb_publishable_AGeCj55NzSImNMvpreSruw_-DsjGhM7'
);

async function testInsert() {
  const { data, error } = await supabase.from('categories').insert([{ name: 'Test Category' }]);
  console.log('Error:', error);
  console.log('Data:', data);
}

testInsert();
