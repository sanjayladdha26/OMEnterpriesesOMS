import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function test() {
  // 1. Get an agent
  const { data: agents } = await supabase.from('agents').select('*').limit(1);
  const agent = agents?.[0];
  if (!agent) {
    console.log('No agents found');
    return;
  }

  // 2. Get a party
  const { data: parties } = await supabase.from('parties').select('*').limit(1);
  const party = parties?.[0];
  if (!party) {
    console.log('No parties found');
    return;
  }

  // 3. Get a product
  const { data: products } = await supabase.from('products').select('*').limit(1);
  const product = products?.[0];
  if (!product) {
    console.log('No products found');
    return;
  }

  // 4. Try to create an order with integer quantity
  console.log('Testing with integer quantity...');
  const res1 = await supabase.rpc('create_order', {
    p_order_number: 'TEST-' + Date.now(),
    p_party_id: party.id,
    p_party_name: party.account_name,
    p_agent_id: agent.id,
    p_agent_name: agent.name,
    p_subtotal: 0,
    p_total: 0,
    p_items: [
      {
        product_id: product.id,
        product_name: product.name,
        quantity: 10,
        unit: 'metre',
        unit_price: 0,
        subtotal: 0
      }
    ]
  });
  console.log('Int res:', res1.error || 'Success');

  // 5. Try to create an order with float quantity
  console.log('Testing with float quantity...');
  const res2 = await supabase.rpc('create_order', {
    p_order_number: 'TEST-' + (Date.now() + 1),
    p_party_id: party.id,
    p_party_name: party.account_name,
    p_agent_id: agent.id,
    p_agent_name: agent.name,
    p_subtotal: 0,
    p_total: 0,
    p_items: [
      {
        product_id: product.id,
        product_name: product.name,
        quantity: 10.5,
        unit: 'metre',
        unit_price: 0,
        subtotal: 0
      }
    ]
  });
  console.log('Float res:', res2.error || 'Success');
}

test().catch(console.error);
