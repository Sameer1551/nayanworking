-- ============================================================
-- Schema Migration: nayan-db integrity repair
-- Date: 2026-04-17
-- Purpose: Add missing unique indexes and foreign key constraints
--          to bring the live schema in line with JPA entity declarations.
-- ============================================================

-- Run ALL statements in order.
-- Safe to re-run: uses IF NOT EXISTS / IF EXISTS guards.

USE `nayan-db`;

-- ----------------------------------------------------------------
-- 1. UNIQUE INDEXES on users table
-- ----------------------------------------------------------------

-- 1a. Unique index on email (JPA entity declares @Column(unique=true))
SELECT COUNT(*) INTO @idx_exists
FROM information_schema.STATISTICS
WHERE table_schema = 'nayan-db'
  AND table_name   = 'users'
  AND index_name   = 'uq_users_email';

SET @stmt = IF(@idx_exists = 0,
  'ALTER TABLE users ADD CONSTRAINT uq_users_email UNIQUE (email)',
  'SELECT ''uq_users_email already exists, skipping.'' AS info'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

-- 1b. Unique index on phone (JPA entity declares @Column(unique=true))
SELECT COUNT(*) INTO @idx_exists
FROM information_schema.STATISTICS
WHERE table_schema = 'nayan-db'
  AND table_name   = 'users'
  AND index_name   = 'uq_users_phone';

SET @stmt = IF(@idx_exists = 0,
  'ALTER TABLE users ADD CONSTRAINT uq_users_phone UNIQUE (phone)',
  'SELECT ''uq_users_phone already exists, skipping.'' AS info'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

-- 1c. Unique index on gst_number
SELECT COUNT(*) INTO @idx_exists
FROM information_schema.STATISTICS
WHERE table_schema = 'nayan-db'
  AND table_name   = 'users'
  AND index_name   = 'uq_users_gst_number';

SET @stmt = IF(@idx_exists = 0,
  'ALTER TABLE users ADD CONSTRAINT uq_users_gst_number UNIQUE (gst_number)',
  'SELECT ''uq_users_gst_number already exists, skipping.'' AS info'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

-- ----------------------------------------------------------------
-- 2. FOREIGN KEYS from supplier-linked tables to users
-- ----------------------------------------------------------------

-- Disable FK checks temporarily so we can add constraints safely
-- even if there are pre-existing orphaned rows (log them below first).
-- WARNING: Review the orphan queries below before applying FKs in production.

-- 2a. Orphan check — find purchases with no matching user
SELECT 'Orphan check: purchases.supplier_id not in users.id' AS check_label;
SELECT p.id, p.supplier_id
FROM purchases p
WHERE p.supplier_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.supplier_id)
LIMIT 20;

-- 2b. Orphan check — inventory_items
SELECT 'Orphan check: inventory_items.supplier_id not in users.id' AS check_label;
SELECT i.id, i.supplier_id
FROM inventory_items i
WHERE i.supplier_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = i.supplier_id)
LIMIT 20;

-- 2c. Orphan check — bulk_purchases
SELECT 'Orphan check: bulk_purchases.supplier_id not in users.id' AS check_label;
SELECT b.id, b.supplier_id
FROM bulk_purchases b
WHERE b.supplier_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = b.supplier_id)
LIMIT 20;

-- ----------------------------------------------------------------
-- ONLY run the FK additions below if the orphan checks above return 0 rows.
-- If orphans exist, DELETE or UPDATE them first.
-- ----------------------------------------------------------------

-- 2d. FK: purchases -> users
SELECT COUNT(*) INTO @fk_exists
FROM information_schema.TABLE_CONSTRAINTS
WHERE constraint_schema = 'nayan-db'
  AND table_name = 'purchases'
  AND constraint_name = 'fk_purchases_supplier';

SET @stmt = IF(@fk_exists = 0,
  'ALTER TABLE purchases ADD CONSTRAINT fk_purchases_supplier FOREIGN KEY (supplier_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT ''fk_purchases_supplier already exists, skipping.'' AS info'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

-- 2e. FK: inventory_items -> users
SELECT COUNT(*) INTO @fk_exists
FROM information_schema.TABLE_CONSTRAINTS
WHERE constraint_schema = 'nayan-db'
  AND table_name = 'inventory_items'
  AND constraint_name = 'fk_inventory_supplier';

SET @stmt = IF(@fk_exists = 0,
  'ALTER TABLE inventory_items ADD CONSTRAINT fk_inventory_supplier FOREIGN KEY (supplier_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT ''fk_inventory_supplier already exists, skipping.'' AS info'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

-- 2f. FK: bulk_purchases -> users
SELECT COUNT(*) INTO @fk_exists
FROM information_schema.TABLE_CONSTRAINTS
WHERE constraint_schema = 'nayan-db'
  AND table_name = 'bulk_purchases'
  AND constraint_name = 'fk_bulk_purchases_supplier';

SET @stmt = IF(@fk_exists = 0,
  'ALTER TABLE bulk_purchases ADD CONSTRAINT fk_bulk_purchases_supplier FOREIGN KEY (supplier_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT ''fk_bulk_purchases_supplier already exists, skipping.'' AS info'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

-- ----------------------------------------------------------------
-- 3. Verify results
-- ----------------------------------------------------------------
SELECT 'Migration complete. Verifying constraints:' AS status;

SELECT constraint_name, constraint_type, table_name
FROM information_schema.TABLE_CONSTRAINTS
WHERE constraint_schema = 'nayan-db'
  AND table_name IN ('users', 'purchases', 'inventory_items', 'bulk_purchases')
ORDER BY table_name, constraint_type;
