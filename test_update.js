const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vuktnkskajpedqfodssx.supabase.co';
const supabaseKey = 'sb_publishable_yJdyHFT1d3s2PbWTDejwhw_KmZmzRpJ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: parties, error: fetchError } = await supabase.from('parties').select('*').limit(2);
  if (fetchError || parties.length < 2) {
    console.error("Fetch error or not enough parties:", fetchError);
    return;
  }
  
  console.log("Updating party 1", parties[0].id, "with access_code=''");
  const { error: err1 } = await supabase
    .from("parties")
    .update({ access_code: "" })
    .eq("id", parties[0].id);

  if (err1) console.error("Error 1:", err1);
  else console.log("Success 1");

  console.log("Updating party 2", parties[1].id, "with access_code=''");
  const { error: err2 } = await supabase
    .from("parties")
    .update({ access_code: "" })
    .eq("id", parties[1].id);

  if (err2) console.error("Error 2:", err2);
  else console.log("Success 2");
}

run();
