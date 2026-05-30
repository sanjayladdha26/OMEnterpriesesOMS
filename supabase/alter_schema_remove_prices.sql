-- 1. Drop constraints/defaults that depend on the columns
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_unit_check;
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_unit_check;

-- 2. Drop columns from products
ALTER TABLE products 
DROP COLUMN IF EXISTS category,
DROP COLUMN IF EXISTS price_per_unit,
DROP COLUMN IF EXISTS unit,
DROP COLUMN IF EXISTS description;

-- Rename sku_name to item_code
ALTER TABLE products RENAME COLUMN sku_name TO item_code;

-- 3. Drop columns from order_items
ALTER TABLE order_items 
DROP COLUMN IF EXISTS unit,
DROP COLUMN IF EXISTS unit_price,
DROP COLUMN IF EXISTS subtotal;

-- 4. Drop columns from orders
ALTER TABLE orders 
DROP COLUMN IF EXISTS subtotal,
DROP COLUMN IF EXISTS total;

-- 5. Recreate the create_order RPC function without price calculations
DROP FUNCTION IF EXISTS create_order;

CREATE OR REPLACE FUNCTION create_order(
  p_order_number TEXT,
  p_party_id UUID,
  p_party_name TEXT,
  p_agent_id UUID,
  p_agent_name TEXT,
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
    order_number, party_id, party_name, agent_id, agent_name, status
  ) VALUES (
    p_order_number, p_party_id, p_party_name, p_agent_id, p_agent_name, 'pending'
  ) RETURNING id, created_at INTO v_order_id, v_created_at;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO order_items (
      order_id, product_id, product_name, quantity
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      v_item->>'product_name',
      (v_item->>'quantity')::NUMERIC
    );
  END LOOP;

  RETURN jsonb_build_object('id', v_order_id, 'created_at', v_created_at);
END;
$$;
