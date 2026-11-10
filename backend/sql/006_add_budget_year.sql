USE asset_management;

ALTER TABLE assets
  ADD COLUMN budget_year SMALLINT UNSIGNED NULL AFTER department;
