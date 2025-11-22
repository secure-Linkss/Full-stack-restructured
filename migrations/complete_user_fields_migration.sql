-- ============================================================================
-- COMPLETE USER FIELDS MIGRATION
-- ============================================================================
-- This migration adds ALL missing fields to the users table to match the User model
-- Run this BEFORE deploying to fix the "column users.bio does not exist" error

-- Add profile information fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'dark';

-- Add security/2FA fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS backup_codes TEXT;

-- Add activity tracking fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_count INTEGER DEFAULT 0;

-- Add enhanced subscription fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active';

-- Verify all critical columns exist
DO $$
BEGIN
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Migration Complete! Verifying columns...';
    RAISE NOTICE '================================================================';
END $$;

-- List all user table columns
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY ordinal_position;
