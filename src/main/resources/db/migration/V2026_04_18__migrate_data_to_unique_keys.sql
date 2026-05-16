-- =====================================================
-- SQL Data Migration: Populate unique_key for Existing Records
-- =====================================================
-- Purpose: Backfill unique_key for existing records
--          BEFORE running this, ensure you have at least one
--          admin/supplier user to serve as the key source
-- =====================================================

-- IMPORTANT: Replace 'SUPPLIER001' with your first supplier's unique_supplier_key
-- This script assumes all existing data belongs to one supplier
-- For multi-supplier existing data, modify accordingly

-- Get the first supplier's key (adjust as needed for your data)
-- SET @supplier_key = 'ABC123XYZ0';  -- Uncomment and set your key

-- Option 1: If all existing data belongs to one supplier
UPDATE billing_records SET unique_key = @supplier_key WHERE unique_key = '' OR unique_key IS NULL;
UPDATE billing_products SET unique_key = @supplier_key WHERE unique_key = '' OR unique_key IS NULL;
UPDATE bulk_purchases SET unique_key = @supplier_key WHERE unique_key = '' OR unique_key IS NULL;
UPDATE purchase_items SET unique_key = @supplier_key WHERE unique_key = '' OR unique_key IS NULL;
UPDATE customers SET unique_key = @supplier_key WHERE unique_key = '' OR unique_key IS NULL;
UPDATE inventory_items SET unique_key = @supplier_key WHERE unique_key = '' OR unique_key IS NULL;
UPDATE purchases SET unique_key = @supplier_key WHERE unique_key = '' OR unique_key IS NULL;
UPDATE purchase_returns SET unique_key = @supplier_key WHERE unique_key = '' OR unique_key IS NULL;
UPDATE sales_returns SET unique_key = @supplier_key WHERE unique_key = '' OR unique_key IS NULL;
UPDATE sales_return_items SET unique_key = @supplier_key WHERE unique_key = '' OR unique_key IS NULL;

-- Option 2: Assign different keys based on branch or other criteria
-- Example: UPDATE inventory_items SET unique_key = 'SUPPLIER001' WHERE branch_name = 'Main Branch';

-- Option 3: Generate keys based on user mapping (requires user_id mapping)
-- Example:
-- UPDATE inventory_items i
-- INNER JOIN users u ON i.created_by_user_id = u.id
-- SET i.unique_key = u.unique_supplier_key
-- WHERE i.unique_key = '' OR i.unique_key IS NULL;

-- Verify migration
SELECT 'billing_records' AS table_name, COUNT(*) AS records_with_key FROM billing_records WHERE unique_key != '' AND unique_key IS NOT NULL
UNION ALL
SELECT 'billing_products', COUNT(*) FROM billing_products WHERE unique_key != '' AND unique_key IS NOT NULL
UNION ALL
SELECT 'bulk_purchases', COUNT(*) FROM bulk_purchases WHERE unique_key != '' AND unique_key IS NOT NULL
UNION ALL
SELECT 'purchase_items', COUNT(*) FROM purchase_items WHERE unique_key != '' AND unique_key IS NOT NULL
UNION ALL
SELECT 'customers', COUNT(*) FROM customers WHERE unique_key != '' AND unique_key IS NOT NULL
UNION ALL
SELECT 'inventory_items', COUNT(*) FROM inventory_items WHERE unique_key != '' AND unique_key IS NOT NULL
UNION ALL
SELECT 'purchases', COUNT(*) FROM purchases WHERE unique_key != '' AND unique_key IS NOT NULL
UNION ALL
SELECT 'purchase_returns', COUNT(*) FROM purchase_returns WHERE unique_key != '' AND unique_key IS NOT NULL
UNION ALL
SELECT 'sales_returns', COUNT(*) FROM sales_returns WHERE unique_key != '' AND unique_key IS NOT NULL
UNION ALL
SELECT 'sales_return_items', COUNT(*) FROM sales_return_items WHERE unique_key != '' AND unique_key IS NOT NULL;
