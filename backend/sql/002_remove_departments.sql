USE asset_management;

-- Run after taking a database backup.
-- This migration removes department dependencies while preserving users,
-- personnel records, assets, serial registry, and asset status history.

DROP TABLE IF EXISTS asset_department_history;
DROP TABLE IF EXISTS user_department_permissions;

ALTER TABLE assets
  DROP FOREIGN KEY fk_assets_department,
  DROP INDEX idx_assets_department,
  DROP COLUMN department_id;

ALTER TABLE personnel
  DROP FOREIGN KEY fk_personnel_department,
  DROP INDEX idx_personnel_department,
  DROP COLUMN department_id;

DROP TABLE IF EXISTS departments;
