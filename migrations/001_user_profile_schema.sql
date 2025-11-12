-- Migration: Add User Profile Fields
-- Description: Adds avatar, subscription, and password reset fields to user table

-- Add avatar/profile picture fields
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS avatar VARCHAR(500);
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);

-- Add subscription fields
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free';
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'active';

-- Add password reset fields
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS reset_token VARCHAR(200);
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- Create profile settings table
CREATE TABLE IF NOT EXISTS profile_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    bio TEXT,
    phone VARCHAR(20),
    company VARCHAR(100),
    website VARCHAR(200),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_profile_settings_user ON profile_settings(user_id);
