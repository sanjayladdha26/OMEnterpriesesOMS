-- ============================================================
-- Migration: Add image_url & description to products, drop hsn_code
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Add new columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;

-- Drop HSN code column
ALTER TABLE products DROP COLUMN IF EXISTS hsn_code;
