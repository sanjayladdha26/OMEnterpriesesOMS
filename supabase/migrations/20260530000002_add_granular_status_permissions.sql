-- Add granular status update permissions
ALTER TABLE staff
ADD COLUMN can_accept_order BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN can_dispatch_order BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN can_complete_order BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN can_reject_order BOOLEAN NOT NULL DEFAULT FALSE;

-- Migrate existing permissions
UPDATE staff
SET 
  can_accept_order = TRUE,
  can_dispatch_order = TRUE,
  can_complete_order = TRUE,
  can_reject_order = TRUE
WHERE can_update_status = TRUE;

-- Drop old column
ALTER TABLE staff
DROP COLUMN can_update_status;
