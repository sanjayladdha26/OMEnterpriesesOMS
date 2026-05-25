const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://asqiycozhpcligyqfpkl.supabase.co',
  'sb_publishable_AGeCj55NzSImNMvpreSruw_-DsjGhM7'
);

async function testInsertProduct() {
  const payload = {
    name: 'Test Fabric ' + Date.now(),
    category: 'fabric',
    price_per_unit: 100,
    unit: 'metre',
    hsn_code: null,
  };
  const { data, error } = await supabase.from('products').insert([payload]);
  console.log('Error:', error);
  console.log('Data:', data);
}

testInsertProduct();
