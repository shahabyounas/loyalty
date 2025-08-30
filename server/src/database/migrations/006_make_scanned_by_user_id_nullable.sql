-- Migration: Make scanned_by_user_id nullable
-- This allows scan history to be recorded even when staff authentication is not implemented

ALTER TABLE scan_history 
ALTER COLUMN scanned_by_user_id DROP NOT NULL;

-- Add a comment to explain why this can be null
COMMENT ON COLUMN scan_history.scanned_by_user_id IS 'Staff member who performed the scan (nullable until staff authentication is implemented)';
