-- ============================================================
-- Migration: Add delete_walk_in_data RPC
-- Deletes all bills (and cascaded bill_items) where
-- customer_id IS NULL (i.e. Walk In customer data).
-- ============================================================

CREATE OR REPLACE FUNCTION delete_walk_in_data()
RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
  -- bill_items cascade-delete via bills FK (ON DELETE CASCADE)
  -- payment_allocations also cascade-delete via bills FK
  DELETE FROM bills WHERE customer_id IS NULL;
END;
$$;
