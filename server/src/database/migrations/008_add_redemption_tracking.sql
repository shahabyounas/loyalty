-- Migration: Add redemption tracking to user_reward_progress
-- Date: 2025-01-01
-- Description: Add redeemed_at column to track when rewards were redeemed

-- Add redeemed_at column to user_reward_progress table
ALTER TABLE user_reward_progress 
ADD COLUMN redeemed_at TIMESTAMP DEFAULT NULL;

-- Add index for faster queries on redeemed_at
CREATE INDEX idx_user_reward_progress_redeemed_at ON user_reward_progress(redeemed_at);

-- Add action_type column to scan_history table for tracking different scan types
ALTER TABLE scan_history 
ADD COLUMN action_type VARCHAR(50) DEFAULT 'stamp_collection';

-- Add index for faster queries on action_type
CREATE INDEX idx_scan_history_action_type ON scan_history(action_type);

-- Update existing scan_history records to have action_type = 'stamp_collection'
UPDATE scan_history 
SET action_type = 'stamp_collection' 
WHERE action_type IS NULL OR action_type = '';

-- Add comment to explain the action_type values
COMMENT ON COLUMN scan_history.action_type IS 'Type of scan action: stamp_collection, redemption';
COMMENT ON COLUMN user_reward_progress.redeemed_at IS 'Timestamp when the reward was redeemed by the user';
