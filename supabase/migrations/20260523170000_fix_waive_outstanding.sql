-- ============================================================
-- Migration: Fix waived amount not reducing outstanding balance
-- When a bill balance is waived off, the waived amount must be
-- recorded as a payment so that recalc_customer_balance works
-- correctly (outstanding = SUM(bills.total) - SUM(payments.amount)).
-- ============================================================

-- ── 1. Recreate save_bill_with_payment with p_waived_amount ──

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
  p_payment_notes TEXT DEFAULT NULL,
  p_waived_amount NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_bill_id UUID;
  v_created_at TIMESTAMPTZ;
  v_payment_id UUID;
  v_item JSONB;
  v_safe_paid NUMERIC;
  v_unallocated_payment RECORD;
  v_unallocated_amount NUMERIC;
  v_remaining_to_pay NUMERIC;
  v_apply_amount NUMERIC;
  v_waive_payment_id UUID;
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

  -- 3.2. Record waived amount as a separate "waiver" payment
  IF p_customer_id IS NOT NULL AND COALESCE(p_waived_amount, 0) > 0 THEN
    INSERT INTO payments (customer_id, amount, payment_method, notes)
      VALUES (p_customer_id, p_waived_amount, 'waiver',
              'Waived balance for Bill ' || p_bill_number)
      RETURNING id INTO v_waive_payment_id;

    INSERT INTO payment_allocations (payment_id, bill_id, amount)
      VALUES (v_waive_payment_id, v_bill_id, p_waived_amount);

    -- Update bill's amount_paid to include the waived amount
    v_safe_paid := v_safe_paid + p_waived_amount;
    UPDATE bills
      SET amount_paid = v_safe_paid,
          status = CASE WHEN v_safe_paid >= p_total THEN 'completed' ELSE status END
      WHERE id = v_bill_id;
  END IF;

  -- 3.5. Auto-allocate any existing advance payments (unallocated payments)
  IF p_customer_id IS NOT NULL AND v_safe_paid < p_total THEN
    v_remaining_to_pay := p_total - v_safe_paid;
    
    FOR v_unallocated_payment IN
      SELECT
        p.id,
        p.amount - COALESCE((SELECT SUM(amount) FROM payment_allocations WHERE payment_id = p.id), 0) AS avail
      FROM payments p
      WHERE p.customer_id = p_customer_id
    LOOP
      v_unallocated_amount := v_unallocated_payment.avail;
      IF v_unallocated_amount > 0 THEN
        v_apply_amount := LEAST(v_remaining_to_pay, v_unallocated_amount);
        
        INSERT INTO payment_allocations (payment_id, bill_id, amount)
          VALUES (v_unallocated_payment.id, v_bill_id, v_apply_amount);
          
        v_safe_paid := v_safe_paid + v_apply_amount;
        v_remaining_to_pay := v_remaining_to_pay - v_apply_amount;
        
        IF v_remaining_to_pay <= 0 THEN
          EXIT;
        END IF;
      END IF;
    END LOOP;
    
    -- Update bill's amount_paid and status if we auto-allocated
    IF v_safe_paid > LEAST(p_amount_paid, p_total) THEN
      UPDATE bills
      SET amount_paid = v_safe_paid,
          status = CASE WHEN v_safe_paid >= p_total THEN 'completed' ELSE 'pending' END
      WHERE id = v_bill_id;
    END IF;
  END IF;

  -- 4. Recalculate customer balance
  IF p_customer_id IS NOT NULL THEN
    PERFORM recalc_customer_balance(p_customer_id);
  END IF;

  RETURN jsonb_build_object('id', v_bill_id, 'created_at', v_created_at);
END;
$$;
