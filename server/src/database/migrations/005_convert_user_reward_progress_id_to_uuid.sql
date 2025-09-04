-- Migration: Convert user_reward_progress.id from integer to UUID
-- This migration changes the primary key from integer to UUID format
-- and updates all foreign key references

-- Step 1: Add UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Add a temporary UUID column
ALTER TABLE user_reward_progress 
ADD COLUMN new_id UUID DEFAULT uuid_generate_v4();

-- Step 3: Update all records to have UUIDs
UPDATE user_reward_progress 
SET new_id = uuid_generate_v4() 
WHERE new_id IS NULL;

-- Step 4: Add a temporary column to scan_history to store new UUID references
ALTER TABLE scan_history 
ADD COLUMN new_user_reward_progress_id UUID;

-- Step 5: Update scan_history to reference the new UUIDs
UPDATE scan_history 
SET new_user_reward_progress_id = urp.new_id
FROM user_reward_progress urp
WHERE scan_history.user_reward_progress_id = urp.id;

-- Step 6: Drop foreign key constraint from scan_history (if exists)
ALTER TABLE scan_history 
DROP CONSTRAINT IF EXISTS fk_scan_history_user_reward_progress;

-- Step 7: Drop the old integer columns
ALTER TABLE scan_history 
DROP COLUMN user_reward_progress_id;

ALTER TABLE user_reward_progress 
DROP COLUMN id;

-- Step 8: Rename the new UUID columns to the original names
ALTER TABLE scan_history 
RENAME COLUMN new_user_reward_progress_id TO user_reward_progress_id;

ALTER TABLE user_reward_progress 
RENAME COLUMN new_id TO id;

-- Step 9: Set the UUID column as primary key
ALTER TABLE user_reward_progress 
ADD PRIMARY KEY (id);

-- Step 10: Add foreign key constraint back to scan_history
ALTER TABLE scan_history 
ADD CONSTRAINT fk_scan_history_user_reward_progress 
FOREIGN KEY (user_reward_progress_id) REFERENCES user_reward_progress(id) ON DELETE CASCADE;

-- Step 11: Add comments for documentation
COMMENT ON COLUMN user_reward_progress.id IS 'Primary key (UUID format)';
COMMENT ON COLUMN scan_history.user_reward_progress_id IS 'Foreign key reference to user_reward_progress.id (UUID format)';

-- Step 12: Drop the old sequence since we're now using UUIDs
DROP SEQUENCE IF EXISTS user_reward_progress_id_seq;
