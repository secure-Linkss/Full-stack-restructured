-- Database Migration Script
-- Add missing columns for new features
-- Run this SQL script on your database

-- ================================================================
-- ADD MISSING COLUMNS TO USERS TABLE
-- ================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS background_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS background_color VARCHAR(20) DEFAULT '#000000';
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system'));

-- ================================================================
-- ADD MISSING COLUMNS TO CAMPAIGNS TABLE
-- ================================================================

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'standard';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS impressions INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS total_visitors INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMP;

-- ================================================================
-- CREATE INDEXES FOR NEW COLUMNS
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_users_theme ON users(theme);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_last_activity ON campaigns(last_activity_date);

-- ================================================================
-- VERIFY CHANGES
-- ================================================================

-- Run these queries to verify the columns were added:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('avatar_url', 'background_url', 'background_color', 'theme');
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name IN ('type', 'impressions', 'total_visitors', 'last_activity_date');
