-- Migration: Create scan_history table
-- This table tracks individual scans for each user reward progress

CREATE TABLE scan_history (
    id SERIAL PRIMARY KEY,
    user_reward_progress_id INTEGER NOT NULL,
    user_id VARCHAR NOT NULL,
    reward_id TEXT NOT NULL,
    scanned_by_user_id UUID NOT NULL,
    store_id UUID,
    stamps_before_scan INTEGER DEFAULT 0,
    stamps_after_scan INTEGER DEFAULT 0,
    stamps_added INTEGER DEFAULT 1,
    scan_method VARCHAR(50) DEFAULT 'qr_code',
    scan_location JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_scan_history_progress 
        FOREIGN KEY (user_reward_progress_id) 
        REFERENCES user_reward_progress(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_scan_history_scanned_by 
        FOREIGN KEY (scanned_by_user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_scan_history_store 
        FOREIGN KEY (store_id) 
        REFERENCES stores(id) 
        ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_scan_history_progress_id ON scan_history(user_reward_progress_id);
CREATE INDEX idx_scan_history_user_id ON scan_history(user_id);
CREATE INDEX idx_scan_history_reward_id ON scan_history(reward_id);
CREATE INDEX idx_scan_history_scanned_by ON scan_history(scanned_by_user_id);
CREATE INDEX idx_scan_history_store_id ON scan_history(store_id);
CREATE INDEX idx_scan_history_created_at ON scan_history(created_at);
CREATE INDEX idx_scan_history_scan_method ON scan_history(scan_method);
CREATE INDEX idx_scan_history_user_reward ON scan_history(user_id, reward_id);

-- Comments for documentation
COMMENT ON TABLE scan_history IS 'Tracks individual QR code scans for user reward progress';
COMMENT ON COLUMN scan_history.user_reward_progress_id IS 'Links to the specific user reward progress record';
COMMENT ON COLUMN scan_history.user_id IS 'Customer who received the stamp';
COMMENT ON COLUMN scan_history.reward_id IS 'Reward that was scanned for';
COMMENT ON COLUMN scan_history.scanned_by_user_id IS 'Staff member who performed the scan';
COMMENT ON COLUMN scan_history.store_id IS 'Store location where scan occurred';
COMMENT ON COLUMN scan_history.stamps_added IS 'Number of stamps added in this scan (usually 1)';
COMMENT ON COLUMN scan_history.created_at IS 'When the scan occurred';
