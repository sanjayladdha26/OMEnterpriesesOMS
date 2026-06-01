ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS allowed_products uuid[];
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Drop the old create_order function if it exists and recreate it to include the item status
DROP FUNCTION IF EXISTS public.create_order(text, uuid, text, uuid, text, numeric, numeric, jsonb);

CREATE OR REPLACE FUNCTION public.create_order(
  p_order_number text, 
  p_party_id uuid, 
  p_party_name text, 
  p_agent_id uuid, 
  p_agent_name text, 
  p_subtotal numeric, 
  p_total numeric, 
  p_items jsonb
) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_order_id UUID;
  v_created_at TIMESTAMPTZ;
  v_item JSONB;
BEGIN
  INSERT INTO orders (
    order_number, party_id, party_name, agent_id, agent_name,
    subtotal, total, status
  ) VALUES (
    p_order_number, p_party_id, p_party_name, p_agent_id, p_agent_name,
    p_subtotal, p_total, 'pending'
  ) RETURNING id, created_at INTO v_order_id, v_created_at;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO order_items (
      order_id, product_id, product_name, quantity,
      unit, unit_price, subtotal, note, image_url, status
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      v_item->>'product_name',
      (v_item->>'quantity')::NUMERIC,
      COALESCE(v_item->>'unit', 'piece'),
      (v_item->>'unit_price')::NUMERIC,
      (v_item->>'subtotal')::NUMERIC,
      v_item->>'note',
      v_item->>'image_url',
      'pending'
    );
  END LOOP;

  RETURN jsonb_build_object('id', v_order_id, 'created_at', v_created_at);
END;
$$;
