const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vuktnkskajpedqfodssx.supabase.co';
const supabaseKey = 'sb_publishable_yJdyHFT1d3s2PbWTDejwhw_KmZmzRpJ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  let allParties = [];
  let from = 0;
  let limit = 1000;
  let fetchMore = true;

  console.log("Fetching all parties...");
  while (fetchMore) {
    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .range(from, from + limit - 1);
    
    if (error) {
      console.error("Error fetching parties:", error);
      return;
    }
    
    allParties = allParties.concat(data);
    from += limit;
    if (data.length < limit) {
      fetchMore = false;
    }
  }

  console.log(`Fetched ${allParties.length} parties.`);

  const { data: orders, error: ordersError } = await supabase.from('orders').select('id, party_id');
  if (ordersError) {
    console.error("Error fetching orders:", ordersError);
    return;
  }

  const partiesWithOrders = new Set(orders.map(o => o.party_id));

  // Group by account_name and agent_id
  const groups = {};
  for (const p of allParties) {
    // Add trim and lowercase to ensure slightly different names match
    const name = (p.account_name || "").trim().toLowerCase();
    const gstin = (p.gstin || "").trim().toLowerCase();
    const agent = p.agent_id;
    // Grouping by name and agent_id (we can also include gstin if needed, but the user complaint is multiple parties for same agent)
    const key = `${name}||${agent}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }

  let totalDeleted = 0;

  for (const key in groups) {
    const group = groups[key];
    if (group.length > 1) {
      console.log(`Group ${key} has ${group.length} records (${group.length - 1} duplicates).`);
      
      // Sort so that parties with orders are first, then by created_at (oldest first)
      group.sort((a, b) => {
        const aHasOrder = partiesWithOrders.has(a.id) ? 1 : 0;
        const bHasOrder = partiesWithOrders.has(b.id) ? 1 : 0;
        if (aHasOrder !== bHasOrder) return bHasOrder - aHasOrder;
        return new Date(a.created_at) - new Date(b.created_at);
      });

      const keptParty = group[0];
      const duplicates = group.slice(1);

      for (const dup of duplicates) {
        if (partiesWithOrders.has(dup.id)) {
          console.log(`  Updating orders for duplicate party ${dup.id} to kept party ${keptParty.id}`);
          const { error: updateError } = await supabase
            .from('orders')
            .update({ party_id: keptParty.id })
            .eq('party_id', dup.id);
          if (updateError) {
            console.error(`  Error updating orders: ${updateError.message}`);
          }
        }
        
        console.log(`  Deleting duplicate party ${dup.id} (${dup.account_name})`);
        const { error: deleteError } = await supabase
          .from('parties')
          .delete()
          .eq('id', dup.id);
        
        if (deleteError) {
          console.error(`  Error deleting party ${dup.id}: ${deleteError.message}`);
        } else {
          totalDeleted++;
        }
      }
    }
  }

  console.log(`Total duplicates deleted: ${totalDeleted}`);
}

run();
