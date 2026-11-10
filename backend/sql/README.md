# Database setup

1. Review `001_schema.sql`.
2. Import it using phpMyAdmin or the XAMPP MySQL CLI.
3. The script creates the `asset_management` database and its tables if absent; it does not drop or erase existing tables.
4. Do not create an administrator password directly in SQL. Authentication setup will be implemented separately after the Admin Authen365 flow is confirmed.

The schema includes soft-deleted personnel and asset status history. Serial Numbers are stored directly in `assets.serial_number`, protected by a unique index; no separate serial registry table is used. Department support is introduced by `004_departments.sql`. For an existing database, run it after taking a backup. It creates the departments master table, an optional department link on assets, and a many-to-many user-to-department assignment table. The older `002_remove_departments.sql` is a historical migration and should not be rerun after `004_departments.sql`.

For an existing database, back it up and run `004_checkout_borrower_user.sql` once. Legacy checkout rows remain unassigned (`borrower_user_id` is NULL) until an Admin edits and assigns the correct account; the migration deliberately does not guess ownership from the old free-text borrower name or the Admin creator account.
