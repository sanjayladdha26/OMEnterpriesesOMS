import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function test() {
  const { error } = await supabase.rpc('update_order_status', {
    p_order_id: '11111111-1111-1111-1111-111111111111',
    p_status: 'pending',
    p_admin_notes: null
  });
  console.log('Update result:', error || 'Success');

  const { error: err2 } = await supabase.rpc('delete_order', {
    p_order_id: '11111111-1111-1111-1111-111111111111'
  });
  console.log('Delete result:', err2 || 'Success');
}

test().catch(console.error);
