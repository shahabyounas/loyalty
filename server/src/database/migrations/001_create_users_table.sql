-- Migration: Create users table
-- Created: 2024-01-01

-- Drop existing table if it exists (for development)
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (
        role IN ('user', 'admin', 'moderator')
    ),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP
    WITH
        TIME ZONE,
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users (email);

-- Create index on role for role-based queries
CREATE INDEX idx_users_role ON users (role);

-- Create index on is_active for filtering active users
CREATE INDEX idx_users_is_active ON users (is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON
TABLE users IS 'User accounts for the loyalty application';

COMMENT ON COLUMN users.id IS 'Unique identifier for the user';

COMMENT ON COLUMN users.email IS 'User email address (unique)';

COMMENT ON COLUMN users.password_hash IS 'Hashed password using bcrypt';

COMMENT ON COLUMN users.role IS 'User role: user, admin, or moderator';

COMMENT ON COLUMN users.is_active IS 'Whether the user account is active';

COMMENT ON COLUMN users.email_verified IS 'Whether the email has been verified';

COMMENT ON COLUMN users.last_login IS 'Timestamp of last login';