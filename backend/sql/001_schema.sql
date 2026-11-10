CREATE DATABASE IF NOT EXISTS asset_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE asset_management;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(254) NOT NULL,
  display_name VARCHAR(255) NULL,
  password_hash VARCHAR(255) NULL,
  role ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
  auth_provider ENUM('LOCAL', 'AUTHEN365') NOT NULL DEFAULT 'LOCAL',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_active (role, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS personnel (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(255) NOT NULL,
  position VARCHAR(255) NULL,
  floor VARCHAR(100) NULL,
  room VARCHAR(100) NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_personnel_name (full_name),
  CONSTRAINT fk_personnel_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_personnel_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_number VARCHAR(100) NULL,
  item_name VARCHAR(255) NOT NULL,
  brand VARCHAR(255) NULL,
  model VARCHAR(255) NULL,
  serial_number VARCHAR(255) NULL,
  image_path VARCHAR(500) NULL,
  budget_year SMALLINT UNSIGNED NULL,
  personnel_id BIGINT UNSIGNED NULL,
  location VARCHAR(255) NULL,
  room VARCHAR(100) NULL,
  status ENUM('ใช้งาน', 'ชำรุด', 'จำหน่าย') NOT NULL DEFAULT 'ใช้งาน',
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_assets_serial_number (serial_number),
  UNIQUE KEY uq_assets_asset_number (asset_number),
  KEY idx_assets_personnel (personnel_id),
  KEY idx_assets_status (status),
  KEY idx_assets_item_name (item_name),
  CONSTRAINT fk_assets_personnel FOREIGN KEY (personnel_id) REFERENCES personnel(id) ON DELETE SET NULL,
  CONSTRAINT fk_assets_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_assets_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_checkouts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id BIGINT UNSIGNED NOT NULL,
  checked_out_by BIGINT UNSIGNED NOT NULL,
  borrower_user_id BIGINT UNSIGNED NULL,
  borrower_name VARCHAR(255) NOT NULL,
  asset_number VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  room VARCHAR(100) NOT NULL,
  checked_out_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  returned_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_asset_checkouts_asset_active (asset_id, returned_at),
  KEY idx_asset_checkouts_user (checked_out_by),
  KEY idx_asset_checkouts_borrower_active (borrower_user_id, returned_at),
  CONSTRAINT fk_asset_checkouts_asset FOREIGN KEY (asset_id) REFERENCES assets(id),
  CONSTRAINT fk_asset_checkouts_user FOREIGN KEY (checked_out_by) REFERENCES users(id),
  CONSTRAINT fk_asset_checkouts_borrower FOREIGN KEY (borrower_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id BIGINT UNSIGNED NOT NULL,
  old_status ENUM('ใช้งาน', 'ชำรุด', 'จำหน่าย') NULL,
  new_status ENUM('ใช้งาน', 'ชำรุด', 'จำหน่าย') NOT NULL,
  changed_by BIGINT UNSIGNED NULL,
  note VARCHAR(1000) NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_asset_status_history_asset (asset_id, changed_at),
  CONSTRAINT fk_status_history_asset FOREIGN KEY (asset_id) REFERENCES assets(id),
  CONSTRAINT fk_status_history_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

