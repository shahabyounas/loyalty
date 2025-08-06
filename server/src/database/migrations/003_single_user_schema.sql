-- Migration: Update to Single User Schema
-- This migration updates the schema to use a single users table for all user types

-- Drop old tables if they exist
DROP TABLE IF EXISTS user_profiles CASCADE;

DROP TABLE IF EXISTS super_admins CASCADE;

-- Create the new users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    auth_user_id UUID NOT NULL, -- Supabase Auth user ID
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    role VARCHAR(50) NOT NULL, -- 'super_admin', 'tenant_admin', 'store_manager', 'staff', 'customer'
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (auth_user_id),
    UNIQUE (tenant_id, email)
);

-- Rename existing columns to match new schema
ALTER TABLE store_staff RENAME COLUMN user_profile_id TO user_id;

ALTER TABLE customer_loyalty
RENAME COLUMN user_profile_id TO user_id;

ALTER TABLE loyalty_transactions
RENAME COLUMN staff_user_profile_id TO staff_user_id;

ALTER TABLE customer_rewards
RENAME COLUMN staff_user_profile_id TO staff_user_id;

ALTER TABLE stamp_transactions
RENAME COLUMN staff_user_profile_id TO staff_user_id;

ALTER TABLE purchases
RENAME COLUMN staff_user_profile_id TO staff_user_id;

ALTER TABLE user_roles RENAME COLUMN user_profile_id TO user_id;

ALTER TABLE audit_logs RENAME COLUMN user_profile_id TO user_id;

-- Update foreign key references in other tables
ALTER TABLE stores
DROP CONSTRAINT IF EXISTS stores_store_manager_id_fkey;

ALTER TABLE stores
ADD CONSTRAINT stores_store_manager_id_fkey FOREIGN KEY (store_manager_id) REFERENCES users (id);

ALTER TABLE store_staff
DROP CONSTRAINT IF EXISTS store_staff_user_profile_id_fkey;

ALTER TABLE store_staff
ADD CONSTRAINT store_staff_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id);

ALTER TABLE customer_loyalty
DROP CONSTRAINT IF EXISTS customer_loyalty_user_profile_id_fkey;

ALTER TABLE customer_loyalty
ADD CONSTRAINT customer_loyalty_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id);

ALTER TABLE loyalty_transactions
DROP CONSTRAINT IF EXISTS loyalty_transactions_staff_user_profile_id_fkey;

ALTER TABLE loyalty_transactions
ADD CONSTRAINT loyalty_transactions_staff_user_id_fkey FOREIGN KEY (staff_user_id) REFERENCES users (id);

ALTER TABLE customer_rewards
DROP CONSTRAINT IF EXISTS customer_rewards_staff_user_profile_id_fkey;

ALTER TABLE customer_rewards
ADD CONSTRAINT customer_rewards_staff_user_id_fkey FOREIGN KEY (staff_user_id) REFERENCES users (id);

ALTER TABLE stamp_transactions
DROP CONSTRAINT IF EXISTS stamp_transactions_staff_user_profile_id_fkey;

ALTER TABLE stamp_transactions
ADD CONSTRAINT stamp_transactions_staff_user_id_fkey FOREIGN KEY (staff_user_id) REFERENCES users (id);

ALTER TABLE purchases
DROP CONSTRAINT IF EXISTS purchases_staff_user_profile_id_fkey;

ALTER TABLE purchases
ADD CONSTRAINT purchases_staff_user_id_fkey FOREIGN KEY (staff_user_id) REFERENCES users (id);

ALTER TABLE user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_profile_id_fkey;

ALTER TABLE user_roles
ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id);

ALTER TABLE user_roles
DROP CONSTRAINT IF EXISTS user_roles_assigned_by_fkey;

ALTER TABLE user_roles
ADD CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES users (id);

ALTER TABLE audit_logs
DROP CONSTRAINT IF EXISTS audit_logs_user_profile_id_fkey;

ALTER TABLE audit_logs
ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id);

-- Create indexes for the new users table
CREATE INDEX idx_users_tenant_email ON users (tenant_id, email);

CREATE INDEX idx_users_tenant_role ON users (tenant_id, role);

CREATE INDEX idx_users_auth_user_id ON users (auth_user_id);

CREATE INDEX idx_active_users ON users (tenant_id)
WHERE
    is_active = true;

CREATE INDEX idx_users_tenant_id ON users (tenant_id);

-- Create trigger for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users table
CREATE POLICY users_tenant_policy ON users FOR ALL USING (
    tenant_id IS NOT NULL
    OR role = 'super_admin'
);