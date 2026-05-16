-- Migration: Add ADMIN user type and secondary_password column
-- Run this to enable dual-password authentication for admin accounts

-- Add ADMIN to user_type enum (run on PostgreSQL/MySQL with enum support)
-- For MySQL without enum, this is a no-op as VARCHAR is used

-- Add secondary_password column for dual-password authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS secondary_password VARCHAR(255);

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- Example: Create an admin user (run manually with secure password)
-- INSERT INTO users (first_name, last_name, email, password, secondary_password, user_type, is_active, created_at, updated_at)
-- VALUES ('Admin', 'User', 'admin@nayaneyecare.com', '$2a$10$...', '$2a$10$...', 'ADMIN', true, NOW(), NOW());
