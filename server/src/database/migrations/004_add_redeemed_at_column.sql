-- Migration: Add redeemed_at column to user_reward_progress table
-- This column will track when a reward was redeemed (status changed to 'availed')

ALTER TABLE user_reward_progress 
ADD COLUMN redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comment to document the column
COMMENT ON COLUMN user_reward_progress.redeemed_at IS 'Timestamp when the reward was redeemed (status changed to availed)';

-- Update existing 'availed' records to have a redeemed_at timestamp
-- (if any exist, set to their updated_at time)
UPDATE user_reward_progress 
SET redeemed_at = updated_at 
WHERE status = 'availed' AND redeemed_at IS NULL;
