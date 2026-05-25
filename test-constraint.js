const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://asqiycozhpcligyqfpkl.supabase.co',
  'sb_publishable_AGeCj55NzSImNMvpreSruw_-DsjGhM7'
);

async function checkConstraint() {
  // Try another category name
  const { error } = await supabase.from('products').insert([{
    name: 'Test Fabric ' + Date.now(),
    category: 'fabric',
    price_per_unit: 100,
    unit: 'metre'
  }]);
  console.log('Insert "fabric" error:', error?.message || 'OK');
}

checkConstraint();
