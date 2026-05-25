const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function test() {
  const { data, error } = await supabase.from('products').insert([{
    name: 'Test Fabric',
    category: 'fabric',
    price_per_unit: 100,
    unit: 'metre'
  }]);
  
  console.log("Error:", error);
  console.log("Data:", data);
}

test();
