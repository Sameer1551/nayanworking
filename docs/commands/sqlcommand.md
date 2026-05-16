& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot

-- BASIC COMMANDS
SHOW DATABASES;USE `nayan-db`;SHOW TABLES;

-- USER MANAGEMENT
SELECT * FROM users;
SELECT id, first_name, last_name, email, user_type FROM users WHERE user_type = 'SUPPLIER';
SELECT id, first_name, last_name, email, user_type FROM users WHERE user_type = 'CUSTOMER';
-- Mark a user as inactive: UPDATE users SET is_active = 0 WHERE id = <user_id>;

-- INVENTORY & STOCK
SELECT * FROM inventory_items;
-- Check low stock items (below minimum stock level)
SELECT product_name, product_code, quantity, minimum_stock FROM inventory_items WHERE quantity <= minimum_stock;
-- Find products by category
SELECT * FROM inventory_items WHERE category = 'EYEWEAR';
-- Calculate total inventory value (Purchase Price)
SELECT SUM(quantity * purchase_price) as total_inventory_value FROM inventory_items;

-- SALES & BILLING
SELECT * FROM billing_records ORDER BY created_at DESC LIMIT 10;
-- Find products in a specific bill
SELECT * FROM billing_products WHERE billing_record_id = <bill_id>;
-- Get all bills for a specific customer contact
SELECT * FROM billing_records WHERE customer_contact = '1234567890';
-- Total sales for the current month
SELECT SUM(final_payable) as monthly_sales FROM billing_records WHERE MONTH(bill_date) = MONTH(CURRENT_DATE()) AND YEAR(bill_date) = YEAR(CURRENT_DATE());

-- PURCHASES
SELECT * FROM purchases ORDER BY purchase_date DESC;
SELECT * FROM purchase_items WHERE purchase_id = <purchase_id>;

-- SEARCHING
-- Search products by name (fuzzy search)
SELECT * FROM inventory_items WHERE product_name LIKE '%Frame%';

-- RETURNS
SELECT * FROM sales_returns ORDER BY return_date DESC;
SELECT * FROM purchase_returns ORDER BY return_date DESC;

-- SYSTEM STATE (Numbering/IDs)
SELECT * FROM numbering_state;

-- SYSTEM MAINTENANCE (CAUTION!)
-- DELETE FROM billing_products;
-- DELETE FROM billing_records;
-- ALTER TABLE billing_records AUTO_INCREMENT = 1;













