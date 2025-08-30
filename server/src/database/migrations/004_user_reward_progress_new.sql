-- Create user_reward_progress table
CREATE TABLE IF NOT EXISTS user_reward_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_id INTEGER NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
    stamps_collected INTEGER DEFAULT 0 NOT NULL,
    stamps_required INTEGER NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    status VARCHAR(50) DEFAULT 'in_progress' NOT NULL CHECK (status IN ('in_progress', 'ready_to_redeem', 'redeemed')),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one progress record per user per reward
    UNIQUE(user_id, reward_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_reward_progress_user_id ON user_reward_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reward_progress_reward_id ON user_reward_progress(reward_id);
CREATE INDEX IF NOT EXISTS idx_user_reward_progress_status ON user_reward_progress(status);
CREATE INDEX IF NOT EXISTS idx_user_reward_progress_is_completed ON user_reward_progress(is_completed);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_reward_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_reward_progress_updated_at
    BEFORE UPDATE ON user_reward_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_user_reward_progress_updated_at();
