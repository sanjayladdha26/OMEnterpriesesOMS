const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://asqiycozhpcligyqfpkl.supabase.co',
  'sb_publishable_AGeCj55NzSImNMvpreSruw_-DsjGhM7'
);

async function inspectProducts() {
  const { data, error } = await supabase.from('products').insert([{
    name: 'Fail Test',
    category: 'Sarees',
    price_per_unit: 100,
    unit: 'metre',
    hsn_code: null
  }]).select();
  
  console.log('Insert Error:', JSON.stringify(error, null, 2));
  console.log('Insert Data:', data);
}

inspectProducts();
