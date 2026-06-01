const { Client } = require('pg');

// Decode and re-encode the password properly for pg package
const url = "postgresql://postgres:jgeBQHKx%3FviB4u%29@db.vuktnkskajpedqfodssx.supabase.co:5432/postgres";

const client = new Client({ connectionString: url });

async function run() {
  await client.connect();

  const query = `
CREATE OR REPLACE FUNCTION create_order(
  p_order_number TEXT,
  p_party_id UUID,
  p_party_name TEXT,
  p_agent_id UUID,
  p_agent_name TEXT,
  p_subtotal NUMERIC,
  p_total NUMERIC,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_order_id UUID;
  v_created_at TIMESTAMPTZ;
  v_item JSONB;
BEGIN
  INSERT INTO orders (
    order_number, party_id, party_name, agent_id, agent_name, status, subtotal, total
  ) VALUES (
    p_order_number, p_party_id, p_party_name, p_agent_id, p_agent_name, 'pending', p_subtotal, p_total
  ) RETURNING id, created_at INTO v_order_id, v_created_at;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO order_items (
      order_id, product_id, product_name, quantity, note, image_url, unit, unit_price, subtotal
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      v_item->>'product_name',
      (v_item->>'quantity')::NUMERIC,
      v_item->>'note',
      v_item->>'image_url',
      COALESCE(v_item->>'unit', 'metre'),
      COALESCE((v_item->>'unit_price')::NUMERIC, 0),
      COALESCE((v_item->>'subtotal')::NUMERIC, 0)
    );
  END LOOP;

  RETURN jsonb_build_object('id', v_order_id, 'created_at', v_created_at);
END;
$$;
  `;

  try {
    await client.query(query);
    console.log("Successfully updated create_order RPC");
  } catch (err) {
    console.error("Failed:", err);
  } finally {
    await client.end();
  }
}

run();
