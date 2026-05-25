-- ============================================================
-- Add hsn_code column to bill_items
-- The app stores HSN codes per bill item for GST invoicing,
-- but this column was missing from the initial schema.
-- ============================================================

ALTER TABLE bill_items
  ADD COLUMN IF NOT EXISTS hsn_code TEXT;
