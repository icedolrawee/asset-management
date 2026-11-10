USE asset_management;

CREATE TABLE IF NOT EXISTS asset_checkouts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id BIGINT UNSIGNED NOT NULL,
  checked_out_by BIGINT UNSIGNED NOT NULL,
  borrower_name VARCHAR(255) NOT NULL,
  asset_number VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  room VARCHAR(100) NOT NULL,
  checked_out_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  returned_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_asset_checkouts_asset_active (asset_id, returned_at),
  KEY idx_asset_checkouts_user (checked_out_by),
  CONSTRAINT fk_asset_checkouts_asset FOREIGN KEY (asset_id) REFERENCES assets(id),
  CONSTRAINT fk_asset_checkouts_user FOREIGN KEY (checked_out_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
