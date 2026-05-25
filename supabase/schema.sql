-- ============================================================
-- MudraPOS Database Schema
-- Run this in your Supabase SQL Editor
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
  sku_name TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  price_per_unit NUMERIC(10, 2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'piece' CHECK (unit IN ('metre', 'piece')),
  hsn_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Customers ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT DEFAULT '',
  outstanding_balance NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Bills ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'flat')),
  discount_value NUMERIC(10, 2) DEFAULT 0,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  gst_rate NUMERIC(5, 2) DEFAULT 0,
  cgst_amount NUMERIC(10, 2) DEFAULT 0,
  sgst_amount NUMERIC(10, 2) DEFAULT 0,
  gst_amount NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'upi', 'card', 'split', 'credit')),
  amount_paid NUMERIC(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Bill Items ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bill_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'metre',
  unit_price NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  hsn_code TEXT
);

-- ── Payments (Khata) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'upi', 'card', 'waiver')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Payment Allocations ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS payment_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Staff ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'billing' CHECK (role IN ('owner', 'manager', 'billing')),
  email TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Settings ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_name TEXT DEFAULT 'MudraPOS',
  gst_low_threshold NUMERIC(10, 2) DEFAULT 1000,
  gst_low_rate NUMERIC(5, 2) DEFAULT 5,
  gst_high_rate NUMERIC(5, 2) DEFAULT 12,
  printer_enabled BOOLEAN DEFAULT false,
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_number TEXT DEFAULT '',
  low_stock_threshold INTEGER DEFAULT 10
);

-- ── Row Level Security ──────────────────────────────────────

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow all access for now (no auth setup yet)
DROP POLICY IF EXISTS "Allow all access to categories" ON categories;
CREATE POLICY "Allow all access to categories" ON categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to products" ON products;
CREATE POLICY "Allow all access to products" ON products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to customers" ON customers;
CREATE POLICY "Allow all access to customers" ON customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to bills" ON bills;
CREATE POLICY "Allow all access to bills" ON bills FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to bill_items" ON bill_items;
CREATE POLICY "Allow all access to bill_items" ON bill_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to payment_allocations" ON payment_allocations;
CREATE POLICY "Allow all access to payment_allocations" ON payment_allocations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to payments" ON payments;
CREATE POLICY "Allow all access to payments" ON payments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to staff" ON staff;
CREATE POLICY "Allow all access to staff" ON staff FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to settings" ON settings;
CREATE POLICY "Allow all access to settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- ── Indexes ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_bills_customer ON bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_bills_created ON bills(created_at);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_pa_payment ON payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_pa_bill ON payment_allocations(bill_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
