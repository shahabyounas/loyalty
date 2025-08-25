-- Migration: Add stamp transaction tracking
-- This table tracks all stamp collection transactions for admin purposes

CREATE TABLE IF NOT EXISTS stamp_transactions (
    id SERIAL PRIMARY KEY,
    transaction_code VARCHAR(50) UNIQUE NOT NULL, -- QR code identifier
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_id INTEGER NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
    staff_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Staff who scanned
    store_id INTEGER REFERENCES stores(id) ON DELETE SET NULL, -- Store where scanned
    stamps_added INTEGER DEFAULT 1,
    transaction_status VARCHAR(20) DEFAULT 'pending', -- pending, completed, expired, cancelled
    expires_at TIMESTAMP NOT NULL, -- QR code expiration
    scanned_at TIMESTAMP, -- When staff scanned it
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

-- Indexes for faster queries
INDEX idx_stamp_transactions_code (transaction_code),
    INDEX idx_stamp_transactions_user (user_id),
    INDEX idx_stamp_transactions_reward (reward_id),
    INDEX idx_stamp_transactions_staff (staff_id),
    INDEX idx_stamp_transactions_store (store_id),
    INDEX idx_stamp_transactions_status (transaction_status),
    INDEX idx_stamp_transactions_created (created_at)
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stamp_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stamp_transactions_updated_at
    BEFORE UPDATE ON stamp_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_stamp_transactions_updated_at();

-- Add some sample data for testing
INSERT INTO
    stamp_transactions (
        transaction_code,
        user_id,
        reward_id,
        store_id,
        stamps_added,
        transaction_status,
        expires_at
    )
VALUES (
        'STAMP_001_20241201_001',
        1,
        1,
        1,
        1,
        'pending',
        CURRENT_TIMESTAMP + INTERVAL '15 minutes'
    ),
    (
        'STAMP_002_20241201_002',
        1,
        2,
        1,
        1,
        'completed',
        CURRENT_TIMESTAMP + INTERVAL '15 minutes'
    ) ON CONFLICT (transaction_code) DO NOTHING;