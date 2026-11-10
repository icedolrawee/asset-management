-- ย้ายชื่อฝ่ายมาเก็บใน assets โดยตรง (รันซ้ำได้)
SET @has_department_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'assets'
    AND COLUMN_NAME = 'department'
);
SET @add_department_sql = IF(
  @has_department_column = 0,
  'ALTER TABLE assets ADD COLUMN department VARCHAR(255) NULL AFTER personnel_id',
  'SELECT ''assets.department already exists'' AS message'
);
PREPARE stmt FROM @add_department_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- คัดลอกชื่อฝ่ายเดิมจาก departments มาเก็บใน assets
SET @has_old_department_link = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'assets'
    AND COLUMN_NAME = 'department_id'
);
SET @copy_department_sql = IF(
  @has_old_department_link > 0
    AND EXISTS (
      SELECT 1 FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'departments'
    ),
  'UPDATE assets a LEFT JOIN departments d ON d.id = a.department_id SET a.department = d.name WHERE (a.department IS NULL OR a.department = '''') AND d.name IS NOT NULL',
  'SELECT ''No legacy department link to migrate'' AS message'
);
PREPARE stmt FROM @copy_department_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT COUNT(*) AS assets_with_department
FROM assets
WHERE department IS NOT NULL AND TRIM(department) <> '';
