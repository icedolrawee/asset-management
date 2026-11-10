USE asset_management;

-- Run once after taking a database backup.
-- Keep existing rows unassigned; do not infer the borrower from checked_out_by,
-- which records the Admin account that created the checkout.
ALTER TABLE asset_checkouts
  ADD COLUMN borrower_user_id BIGINT UNSIGNED NULL AFTER checked_out_by,
  ADD KEY idx_asset_checkouts_borrower_active (borrower_user_id, returned_at),
  ADD CONSTRAINT fk_asset_checkouts_borrower
    FOREIGN KEY (borrower_user_id) REFERENCES users(id);

-- Keep the existing development test account aligned with its profile record.
UPDATE users
SET display_name = 'ดลรวี มุ้ยแก้ว'
WHERE email = 'ice@gmail.com'
  AND (display_name IS NULL OR TRIM(display_name) = '' OR display_name = 'ผู้ใช้งานจำลอง');
