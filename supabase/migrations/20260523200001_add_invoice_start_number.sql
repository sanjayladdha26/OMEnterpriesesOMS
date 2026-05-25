-- ============================================================
-- Migration: Add invoice_start_number to settings
-- Allows resetting / customising the invoice counter start
-- ============================================================

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS invoice_start_number INTEGER NOT NULL DEFAULT 1;
