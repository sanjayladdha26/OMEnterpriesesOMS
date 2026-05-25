-- Drop the old constraint and add the new one to allow 'waiver'
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check CHECK (payment_method IN ('cash', 'upi', 'card', 'waiver'));

DO $$ 
DECLARE
  v_bill RECORD;
  v_payment_id UUID;
  v_waived_amount NUMERIC;
BEGIN
  FOR v_bill IN 
    SELECT id, bill_number, customer_id, total, amount_paid 
    FROM bills 
    WHERE total > amount_paid AND status = 'completed'
  LOOP
    v_waived_amount := v_bill.total - v_bill.amount_paid;
    
    -- Create payment
    INSERT INTO payments (customer_id, amount, payment_method, notes)
    VALUES (v_bill.customer_id, v_waived_amount, 'waiver', 'Waived balance for Bill ' || v_bill.bill_number)
    RETURNING id INTO v_payment_id;
    
    -- Create allocation
    INSERT INTO payment_allocations (payment_id, bill_id, amount)
    VALUES (v_payment_id, v_bill.id, v_waived_amount);
    
    -- Update bill
    UPDATE bills SET amount_paid = total WHERE id = v_bill.id;
    
    -- Recalculate customer balance
    PERFORM recalc_customer_balance(v_bill.customer_id);
  END LOOP;
END;
$$;
