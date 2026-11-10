-- Allow assets that do not have a manufacturer Serial Number.
-- The asset_number remains the required unique identifier enforced by the API.
-- Serial Numbers are stored directly in assets.serial_number; no separate registry table is used.
ALTER TABLE assets
  MODIFY COLUMN serial_number VARCHAR(255) NULL;
