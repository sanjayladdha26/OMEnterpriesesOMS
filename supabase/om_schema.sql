-- ============================================================
-- OM Order System — Database Schema v2 (Agent & Party Model)
-- ============================================================

-- ── Categories ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  preferred_mtr NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Products ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  item_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Agents ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE, -- For login
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Parties ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS parties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  pin_code TEXT,
  state TEXT,
  gstin TEXT,
  phone1 TEXT,
  phone2 TEXT,
  transport TEXT,
  delivery_city TEXT,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Orders ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  party_name TEXT NOT NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  agent_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'dispatched', 'completed', 'rejected')),
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Order Items ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL
);

-- Row Level Security and Policies (Allow all for now)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to agents" ON agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to parties" ON parties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_party ON orders(party_id);
CREATE INDEX IF NOT EXISTS idx_orders_agent ON orders(agent_id);
CREATE INDEX IF NOT EXISTS idx_parties_agent ON parties(agent_id);

-- Triggers for updated_at
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

-- RPC Functions
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

-- Mock Data
INSERT INTO agents (id, name, code) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'A.K.AGENCY', 'akagency'),
  ('22222222-2222-2222-2222-222222222222', 'AJAY P NOTANI', 'ajayp');

INSERT INTO parties (account_name, address, city, pin_code, state, gstin, phone1, phone2, transport, delivery_city, agent_id) VALUES
  ('K.RAJ CREATION.', 'J/8, GROUND FLOOR, GHANTAKARAN MARKET', 'AHMEDABAD', '380002', 'GUJARAT', '24BAJPK2607R2ZC', '', '', '', '', '11111111-1111-1111-1111-111111111111'),
  ('AMBIKA CREATION', 'B/33, GROUND FLOOR, C.C - 2, AHMEDABAD', 'AHMEDABAD', '380002', 'GUJARAT', '24AUTPJ3465B1ZN', '', '', '', '', '22222222-2222-2222-2222-222222222222'),
  ('ANIKA FASHION', 'A/40, THIRD FLOOR, SAFAL-2', 'AHMEDABAD', '380002', 'GUJARAT', '24BGYPG1645J1Z2', '9377745908', '8000668242', '', '', '22222222-2222-2222-2222-222222222222'),
  ('ARYAAN TEXTILE', 'D/417, FOURTH FLOOR, SAFAL-4, AHMEDABAD', 'AHMEDABAD', '380001', 'GUJARAT', '24AONPN0782R1Z6', '', '', '', '', '22222222-2222-2222-2222-222222222222');
