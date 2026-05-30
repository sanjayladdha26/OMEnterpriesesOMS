import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config(); // fallback to .env if .env.local doesn't have it

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const newProducts = [
  "COTTON FLEX 44 PLAIN",
  "COTTON FLEX 58 PLAIN",
  "COTTON FLEX PRINT",
  "COTTON FLEX20X20 58",
  "COTTON JECKARD",
  "COTTON LOWN 44\"",
  "COTTON LOWN 63\"",
  "COTTON LOWN PRINT",
  "COTTON MALMAL",
  "COTTON SATIN",
  "COTTON SLUB",
  "GAJJI SILK RAYON",
  "HEAVY SEMILON",
  "HEAVY SEMILONE COTTON PRINT",
  "I-10 SEMILONE",
  "I-20 SEMILONE",
  "INDO P.C",
  "JAM SATIN",
  "MAGIC SLUB",
  "RAYON 63\" GRAY FINISH 58\"",
  "RAYON GRAY 48 FINISH 42\"",
  "RAYON SLUB",
  "RAYON SLUB 58",
  "RAYON TWO TON",
  "REYON 58 22KG",
  "SHREE RAM BUTTY"
];

async function replaceProducts() {
  try {
    console.log('Connected to Supabase via REST API.');

    // Note: To delete all rows, Supabase requires a filter. We use neq id to a random UUID.
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('Error deleting products:', deleteError);
      return;
    }
    console.log('Deleted existing products.');

    const insertData = newProducts.map(name => ({
      name: name,
      price_per_unit: 0,
      unit: 'piece'
    }));
    const { error: insertError } = await supabase
      .from('products')
      .insert(insertData);

    if (insertError) {
      console.error('Error inserting products:', insertError);
    } else {
      console.log(`Inserted ${newProducts.length} new products.`);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

replaceProducts();
