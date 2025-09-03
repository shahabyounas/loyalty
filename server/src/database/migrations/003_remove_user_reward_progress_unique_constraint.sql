-- Migration: Remove unique constraint on user_reward_progress table
-- This allows multiple UserRewardProgress records for the same user-reward combination
-- enabling users to collect multiple stamp cards for the same reward

-- Remove the unique constraint
ALTER TABLE user_reward_progress 
DROP CONSTRAINT IF EXISTS user_reward_progress_user_id_reward_id_key;

-- Note: This migration enables the core business requirement where:
-- 1. A user can have multiple stamp collection cycles for the same reward
-- 2. Each UserRewardProgress represents an independent stamp card
-- 3. Users can start new collection cycles even with existing completed cards
