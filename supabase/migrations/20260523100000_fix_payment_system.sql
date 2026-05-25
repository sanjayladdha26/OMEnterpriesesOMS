-- ============================================================
-- Migration: Fix Payment Allocation System
-- Adds payment_allocations table, amount_paid column,
-- and transactional RPC functions for all payment operations.
-- ============================================================

-- ── 1. Add amount_paid column to bills ──────────────────────

ALTER TABLE bills ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10, 2) DEFAULT 0;

-- ── 2. Create payment_allocations table ─────────────────────

CREATE TABLE IF NOT EXISTS payment_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to payment_allocations" ON payment_allocations;
CREATE POLICY "Allow all access to payment_allocations"
  ON payment_allocations FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_pa_payment ON payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_pa_bill ON payment_allocations(bill_id);

-- ── 3. Helper: recalculate customer balance ─────────────────

CREATE OR REPLACE FUNCTION recalc_customer_balance(p_customer_id UUID)
RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
  v_total_billed NUMERIC;
  v_total_paid NUMERIC;
BEGIN
  IF p_customer_id IS NULL THEN RETURN; END IF;

  SELECT COALESCE(SUM(total), 0) INTO v_total_billed
    FROM bills WHERE customer_id = p_customer_id;

  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM payments WHERE customer_id = p_customer_id;

  UPDATE customers
    SET outstanding_balance = v_total_billed - v_total_paid
    WHERE id = p_customer_id;
END;
$$;

-- ── 4. record_payment ───────────────────────────────────────
-- Records a payment, creates allocations, updates bills atomically.
-- p_allocations: JSONB array  [{"bill_id":"uuid","amount":123.45}, ...]

CREATE OR REPLACE FUNCTION record_payment(
  p_customer_id UUID,
  p_amount NUMERIC,
  p_method TEXT,
  p_notes TEXT,
  p_allocations JSONB DEFAULT '[]'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql AS $$
DECLARE
  v_payment_id UUID;
  v_alloc JSONB;
  v_bill_id UUID;
  v_alloc_amount NUMERIC;
BEGIN
  -- Insert payment
  INSERT INTO payments (customer_id, amount, payment_method, notes)
    VALUES (p_customer_id, p_amount, p_method, COALESCE(p_notes, ''))
    RETURNING id INTO v_payment_id;

  -- Process each allocation
  FOR v_alloc IN SELECT * FROM jsonb_array_elements(p_allocations) LOOP
    v_bill_id := (v_alloc->>'bill_id')::UUID;
    v_alloc_amount := (v_alloc->>'amount')::NUMERIC;

    IF v_alloc_amount > 0 THEN
      INSERT INTO payment_allocations (payment_id, bill_id, amount)
        VALUES (v_payment_id, v_bill_id, v_alloc_amount);

      -- Atomic increment of amount_paid + status flip
      UPDATE bills
        SET amount_paid = COALESCE(amount_paid, 0) + v_alloc_amount,
            status = CASE
              WHEN COALESCE(amount_paid, 0) + v_alloc_amount >= total THEN 'completed'
              ELSE 'pending'
            END
        WHERE id = v_bill_id;
    END IF;
  END LOOP;

  PERFORM recalc_customer_balance(p_customer_id);
  RETURN v_payment_id;
END;
$$;

-- ── 5. delete_payment ───────────────────────────────────────
-- Reverses allocations, updates bills, recalculates balance, deletes payment.

CREATE OR REPLACE FUNCTION delete_payment(p_payment_id UUID)
RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
  v_customer_id UUID;
  v_alloc RECORD;
BEGIN
  SELECT customer_id INTO v_customer_id
    FROM payments WHERE id = p_payment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found: %', p_payment_id;
  END IF;

  -- Reverse each allocation on the linked bills
  FOR v_alloc IN
    SELECT bill_id, amount FROM payment_allocations WHERE payment_id = p_payment_id
  LOOP
    UPDATE bills
      SET amount_paid = GREATEST(0, COALESCE(amount_paid, 0) - v_alloc.amount),
          status = CASE
            WHEN GREATEST(0, COALESCE(amount_paid, 0) - v_alloc.amount) >= total
              THEN 'completed' ELSE 'pending'
          END
      WHERE id = v_alloc.bill_id;
  END LOOP;

  -- Delete allocations then payment
  DELETE FROM payment_allocations WHERE payment_id = p_payment_id;
  DELETE FROM payments WHERE id = p_payment_id;

  PERFORM recalc_customer_balance(v_customer_id);
END;
$$;

-- ── 6. delete_bill ──────────────────────────────────────────
-- Cleans up allocations, removes exclusive payments, deletes bill.

CREATE OR REPLACE FUNCTION delete_bill(p_bill_id UUID)
RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
  v_customer_id UUID;
  v_pay RECORD;
  v_other_count INT;
BEGIN
  SELECT customer_id INTO v_customer_id
    FROM bills WHERE id = p_bill_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bill not found: %', p_bill_id;
  END IF;

  -- Handle each payment that was allocated to this bill
  FOR v_pay IN
    SELECT DISTINCT payment_id FROM payment_allocations WHERE bill_id = p_bill_id
  LOOP
    -- Does this payment have allocations to OTHER bills?
    SELECT COUNT(*) INTO v_other_count
      FROM payment_allocations
      WHERE payment_id = v_pay.payment_id AND bill_id != p_bill_id;

    IF v_other_count = 0 THEN
      -- Exclusive payment (e.g. upfront) → delete entirely
      DELETE FROM payment_allocations WHERE payment_id = v_pay.payment_id;
      DELETE FROM payments WHERE id = v_pay.payment_id;
    ELSE
      -- Shared payment → only remove allocation to this bill
      DELETE FROM payment_allocations
        WHERE payment_id = v_pay.payment_id AND bill_id = p_bill_id;
    END IF;
  END LOOP;

  -- Delete bill (cascades to bill_items)
  DELETE FROM bills WHERE id = p_bill_id;

  PERFORM recalc_customer_balance(v_customer_id);
END;
$$;

-- ── 7. delete_customer ──────────────────────────────────────
-- Cascading delete of all customer data.

CREATE OR REPLACE FUNCTION delete_customer(p_customer_id UUID)
RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
  -- payment_allocations cascade-delete via payments FK
  DELETE FROM payments WHERE customer_id = p_customer_id;
  -- bill_items cascade-delete via bills FK
  DELETE FROM bills WHERE customer_id = p_customer_id;
  DELETE FROM customers WHERE id = p_customer_id;
END;
$$;

-- ── 8. save_bill_with_payment ───────────────────────────────
-- Creates bill + items + optional upfront payment atomically.
-- Returns JSONB {"id":"uuid","created_at":"timestamp"}

CREATE OR REPLACE FUNCTION save_bill_with_payment(
  p_bill_number TEXT,
  p_customer_id UUID,
  p_customer_name TEXT,
  p_subtotal NUMERIC,
  p_discount_type TEXT,
  p_discount_value NUMERIC,
  p_discount_amount NUMERIC,
  p_gst_rate NUMERIC,
  p_cgst_amount NUMERIC,
  p_sgst_amount NUMERIC,
  p_gst_amount NUMERIC,
  p_total NUMERIC,
  p_amount_paid NUMERIC,
  p_payment_method TEXT,
  p_status TEXT,
  p_items JSONB,
  p_payment_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_bill_id UUID;
  v_created_at TIMESTAMPTZ;
  v_payment_id UUID;
  v_item JSONB;
  v_safe_paid NUMERIC;
BEGIN
  -- Cap amount_paid at total to prevent overpayment
  v_safe_paid := LEAST(p_amount_paid, p_total);

  -- 1. Insert bill
  INSERT INTO bills (
    bill_number, customer_id, customer_name, subtotal,
    discount_type, discount_value, discount_amount,
    gst_rate, cgst_amount, sgst_amount, gst_amount,
    total, amount_paid, payment_method, status
  ) VALUES (
    p_bill_number, p_customer_id, p_customer_name, p_subtotal,
    p_discount_type, p_discount_value, p_discount_amount,
    p_gst_rate, p_cgst_amount, p_sgst_amount, p_gst_amount,
    p_total, v_safe_paid, p_payment_method, p_status
  ) RETURNING id, created_at INTO v_bill_id, v_created_at;

  -- 2. Insert bill items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO bill_items (
      bill_id, product_id, product_name, quantity,
      unit, unit_price, subtotal, hsn_code
    ) VALUES (
      v_bill_id,
      (v_item->>'product_id')::UUID,
      v_item->>'product_name',
      (v_item->>'quantity')::NUMERIC,
      v_item->>'unit',
      (v_item->>'unit_price')::NUMERIC,
      (v_item->>'subtotal')::NUMERIC,
      v_item->>'hsn_code'
    );
  END LOOP;

  -- 3. Upfront payment + allocation (only for known customers with payment)
  IF p_customer_id IS NOT NULL AND v_safe_paid > 0 THEN
    INSERT INTO payments (customer_id, amount, payment_method, notes)
      VALUES (p_customer_id, v_safe_paid, p_payment_method, COALESCE(p_payment_notes, ''))
      RETURNING id INTO v_payment_id;

    INSERT INTO payment_allocations (payment_id, bill_id, amount)
      VALUES (v_payment_id, v_bill_id, v_safe_paid);
  END IF;

  -- 4. Recalculate customer balance
  IF p_customer_id IS NOT NULL THEN
    PERFORM recalc_customer_balance(p_customer_id);
  END IF;

  RETURN jsonb_build_object('id', v_bill_id, 'created_at', v_created_at);
END;
$$;

-- ── 9. update_bill_with_payment ─────────────────────────────
-- Updates bill, replaces items, handles upfront payment changes atomically.

CREATE OR REPLACE FUNCTION update_bill_with_payment(
  p_bill_id UUID,
  p_customer_id UUID,
  p_customer_name TEXT,
  p_subtotal NUMERIC,
  p_discount_type TEXT,
  p_discount_value NUMERIC,
  p_discount_amount NUMERIC,
  p_gst_rate NUMERIC,
  p_cgst_amount NUMERIC,
  p_sgst_amount NUMERIC,
  p_gst_amount NUMERIC,
  p_total NUMERIC,
  p_amount_paid NUMERIC,
  p_payment_method TEXT,
  p_status TEXT,
  p_items JSONB,
  p_payment_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
  v_old_customer_id UUID;
  v_pay RECORD;
  v_other_count INT;
  v_payment_id UUID;
  v_item JSONB;
  v_safe_paid NUMERIC;
BEGIN
  -- Cap amount_paid at total
  v_safe_paid := LEAST(p_amount_paid, p_total);

  -- 1. Get old bill data
  SELECT customer_id INTO v_old_customer_id
    FROM bills WHERE id = p_bill_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bill not found: %', p_bill_id;
  END IF;

  -- 2. Remove exclusive payments for this bill
  FOR v_pay IN
    SELECT DISTINCT payment_id FROM payment_allocations WHERE bill_id = p_bill_id
  LOOP
    SELECT COUNT(*) INTO v_other_count
      FROM payment_allocations
      WHERE payment_id = v_pay.payment_id AND bill_id != p_bill_id;

    IF v_other_count = 0 THEN
      DELETE FROM payment_allocations WHERE payment_id = v_pay.payment_id;
      DELETE FROM payments WHERE id = v_pay.payment_id;
    ELSE
      DELETE FROM payment_allocations
        WHERE payment_id = v_pay.payment_id AND bill_id = p_bill_id;
    END IF;
  END LOOP;

  -- 3. Update the bill
  UPDATE bills SET
    customer_id = p_customer_id,
    customer_name = p_customer_name,
    subtotal = p_subtotal,
    discount_type = p_discount_type,
    discount_value = p_discount_value,
    discount_amount = p_discount_amount,
    gst_rate = p_gst_rate,
    cgst_amount = p_cgst_amount,
    sgst_amount = p_sgst_amount,
    gst_amount = p_gst_amount,
    total = p_total,
    amount_paid = v_safe_paid,
    payment_method = p_payment_method,
    status = p_status
  WHERE id = p_bill_id;

  -- 4. Replace items
  DELETE FROM bill_items WHERE bill_id = p_bill_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO bill_items (
      bill_id, product_id, product_name, quantity,
      unit, unit_price, subtotal, hsn_code
    ) VALUES (
      p_bill_id,
      (v_item->>'product_id')::UUID,
      v_item->>'product_name',
      (v_item->>'quantity')::NUMERIC,
      v_item->>'unit',
      (v_item->>'unit_price')::NUMERIC,
      (v_item->>'subtotal')::NUMERIC,
      v_item->>'hsn_code'
    );
  END LOOP;

  -- 5. Create new upfront payment + allocation
  IF p_customer_id IS NOT NULL AND v_safe_paid > 0 THEN
    INSERT INTO payments (customer_id, amount, payment_method, notes)
      VALUES (p_customer_id, v_safe_paid, p_payment_method, COALESCE(p_payment_notes, ''))
      RETURNING id INTO v_payment_id;

    INSERT INTO payment_allocations (payment_id, bill_id, amount)
      VALUES (v_payment_id, p_bill_id, v_safe_paid);
  END IF;

  -- 6. Recalculate balance for old and new customer
  IF v_old_customer_id IS NOT NULL THEN
    PERFORM recalc_customer_balance(v_old_customer_id);
  END IF;
  IF p_customer_id IS NOT NULL AND (v_old_customer_id IS NULL OR p_customer_id != v_old_customer_id) THEN
    PERFORM recalc_customer_balance(p_customer_id);
  END IF;
END;
$$;
