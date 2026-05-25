-- ============================================================
-- Migration: Simplify POS → Order Management System
-- Drops unused tables, renames bills→orders, simplifies schema
-- ============================================================

-- ── 1. Drop all existing RPC functions ──────────────────────

DROP FUNCTION IF EXISTS save_bill_with_payment(TEXT, UUID, TEXT, NUMERIC, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, JSONB, TEXT);
DROP FUNCTION IF EXISTS save_bill_with_payment(TEXT, UUID, TEXT, NUMERIC, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, JSONB, TEXT, NUMERIC);
DROP FUNCTION IF EXISTS update_bill_with_payment(UUID, UUID, TEXT, NUMERIC, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, JSONB, TEXT);
DROP FUNCTION IF EXISTS delete_bill(UUID);
DROP FUNCTION IF EXISTS delete_payment(UUID);
DROP FUNCTION IF EXISTS record_payment(UUID, NUMERIC, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS recalc_customer_balance(UUID);
DROP FUNCTION IF EXISTS delete_customer(UUID);

-- ── 2. Drop unused tables ───────────────────────────────────

DROP TABLE IF EXISTS payment_allocations CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- ── 3. Drop bill_items (will be recreated as order_items) ───

DROP TABLE IF EXISTS bill_items CASCADE;

-- ── 4. Rename and restructure bills → orders ────────────────

-- Drop the old bills table and recreate as orders
DROP TABLE IF EXISTS bills CASCADE;

CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'dispatched', 'completed', 'rejected')),
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 5. Create order_items table ─────────────────────────────

CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'piece',
  unit_price NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL
);

-- ── 6. Simplify customers table ────────────────────────────

ALTER TABLE customers DROP COLUMN IF EXISTS outstanding_balance;

-- ── 7. Row Level Security ──────────────────────────────────

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to orders" ON orders;
CREATE POLICY "Allow all access to orders" ON orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to order_items" ON order_items;
CREATE POLICY "Allow all access to order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);

-- ── 8. Indexes ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ── 9. Auto-update updated_at trigger ──────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ── 10. create_order RPC ───────────────────────────────────
-- Creates order + items atomically. Returns order JSON.

CREATE OR REPLACE FUNCTION create_order(
  p_order_number TEXT,
  p_customer_id UUID,
  p_customer_name TEXT,
  p_customer_phone TEXT,
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
  -- 1. Insert order
  INSERT INTO orders (
    order_number, customer_id, customer_name, customer_phone,
    subtotal, total, status
  ) VALUES (
    p_order_number, p_customer_id, p_customer_name, p_customer_phone,
    p_subtotal, p_total, 'pending'
  ) RETURNING id, created_at INTO v_order_id, v_created_at;

  -- 2. Insert order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO order_items (
      order_id, product_id, product_name, quantity,
      unit, unit_price, subtotal
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      v_item->>'product_name',
      (v_item->>'quantity')::NUMERIC,
      v_item->>'unit',
      (v_item->>'unit_price')::NUMERIC,
      (v_item->>'subtotal')::NUMERIC
    );
  END LOOP;

  RETURN jsonb_build_object('id', v_order_id, 'created_at', v_created_at);
END;
$$;

-- ── 11. update_order_status RPC ────────────────────────────
-- Admin updates order status with optional notes.

CREATE OR REPLACE FUNCTION update_order_status(
  p_order_id UUID,
  p_status TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
  -- Validate status
  IF p_status NOT IN ('pending', 'accepted', 'dispatched', 'completed', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  UPDATE orders SET
    status = p_status,
    admin_notes = COALESCE(p_admin_notes, admin_notes)
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;
END;
$$;

-- ── 12. delete_order RPC ───────────────────────────────────

CREATE OR REPLACE FUNCTION delete_order(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;
END;
$$;
