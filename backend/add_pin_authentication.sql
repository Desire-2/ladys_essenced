-- Add PIN authentication columns to users table
-- This migration adds PIN-based authentication support to the existing password-based system

ALTER TABLE users ADD COLUMN pin_hash VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN enable_pin_auth BOOLEAN DEFAULT FALSE;

-- Create index for PIN authentication lookups
CREATE INDEX idx_pin_auth ON users(enable_pin_auth);

-- Migration notes:
-- pin_hash: Stores the bcrypt hash of the 4-digit PIN
-- enable_pin_auth: Boolean flag to indicate if PIN authentication is enabled for this user
-- 
-- Users can now authenticate using either:
-- 1. Password (existing method)
-- 2. PIN (new method, requires setup during registration or in profile settings)
