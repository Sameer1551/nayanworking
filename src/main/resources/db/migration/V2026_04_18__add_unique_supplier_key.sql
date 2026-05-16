-- =====================================================
-- SQL Migration: Add unique_supplier_key Column
-- =====================================================
-- Purpose: Implement row-level data isolation using a unique 10-character key
-- Date: 2026-04-18
-- =====================================================

-- Step 1: Add unique_supplier_key to users table
ALTER TABLE users ADD COLUMN unique_supplier_key VARCHAR(10) NULL;

-- Create unique index to prevent duplicates
CREATE UNIQUE INDEX idx_users_unique_supplier_key ON users(unique_supplier_key);

-- Step 2: Add unique_key to all business transaction tables

-- Billing Records
ALTER TABLE billing_records ADD COLUMN unique_key VARCHAR(10) NOT NULL DEFAULT '';
CREATE INDEX idx_billing_records_unique_key ON billing_records(unique_key);

-- Billing Products
ALTER TABLE billing_products ADD COLUMN unique_key VARCHAR(10) NOT NULL DEFAULT '';
CREATE INDEX idx_billing_products_unique_key ON billing_products(unique_key);

-- Bulk Purchases
ALTER TABLE bulk_purchases ADD COLUMN unique_key VARCHAR(10) NOT NULL DEFAULT '';
CREATE INDEX idx_bulk_purchases_unique_key ON bulk_purchases(unique_key);

-- Purchase Items
ALTER TABLE purchase_items ADD COLUMN unique_key VARCHAR(10) NOT NULL DEFAULT '';
CREATE INDEX idx_purchase_items_unique_key ON purchase_items(unique_key);

-- Customers
ALTER TABLE customers ADD COLUMN unique_key VARCHAR(10) NOT NULL DEFAULT '';
CREATE INDEX idx_customers_unique_key ON customers(unique_key);

-- Inventory Items
ALTER TABLE inventory_items ADD COLUMN unique_key VARCHAR(10) NOT NULL DEFAULT '';
CREATE INDEX idx_inventory_items_unique_key ON inventory_items(unique_key);

-- Purchases
ALTER TABLE purchases ADD COLUMN unique_key VARCHAR(10) NOT NULL DEFAULT '';
CREATE INDEX idx_purchases_unique_key ON purchases(unique_key);

-- Purchase Returns
ALTER TABLE purchase_returns ADD COLUMN unique_key VARCHAR(10) NOT NULL DEFAULT '';
CREATE INDEX idx_purchase_returns_unique_key ON purchase_returns(unique_key);

-- Sales Returns
ALTER TABLE sales_returns ADD COLUMN unique_key VARCHAR(10) NOT NULL DEFAULT '';
CREATE INDEX idx_sales_returns_unique_key ON sales_returns(unique_key);

-- Sales Return Items
ALTER TABLE sales_return_items ADD COLUMN unique_key VARCHAR(10) NOT NULL DEFAULT '';
CREATE INDEX idx_sales_return_items_unique_key ON sales_return_items(unique_key);

-- Branches (nullable for backward compatibility)
ALTER TABLE branches ADD COLUMN unique_key VARCHAR(10) NULL;
CREATE INDEX idx_branches_unique_key ON branches(unique_key);

-- =====================================================
-- Update existing records with placeholder values
-- IMPORTANT: Run migration_to_unique_keys.sql to populate
-- existing records before going live
-- =====================================================

-- Verify tables modified
SELECT 'Migration completed. Tables modified:' AS status;
SELECT 'users, billing_records, billing_products, bulk_purchases, purchase_items, customers, inventory_items, purchases, purchase_returns, sales_returns, sales_return_items, branches' AS modified_tables;
