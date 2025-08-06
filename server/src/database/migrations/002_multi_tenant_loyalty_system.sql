-- Multi-Tenant Loyalty System Database Migration
-- This migration creates all tables for the complete loyalty system
-- Note: Users are managed by Supabase Auth, with roles for different user types

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS users CASCADE;

DROP TABLE IF EXISTS store_staff CASCADE;

DROP TABLE IF EXISTS customer_loyalty CASCADE;

DROP TABLE IF EXISTS loyalty_transactions CASCADE;

DROP TABLE IF EXISTS rewards CASCADE;

DROP TABLE IF EXISTS customer_rewards CASCADE;

DROP TABLE IF EXISTS stamp_cards CASCADE;

DROP TABLE IF EXISTS stamp_transactions CASCADE;

DROP TABLE IF EXISTS purchases CASCADE;

DROP TABLE IF EXISTS purchase_items CASCADE;

DROP TABLE IF EXISTS financial_reports CASCADE;

DROP TABLE IF EXISTS roles CASCADE;

DROP TABLE IF EXISTS user_roles CASCADE;

DROP TABLE IF EXISTS access_tokens CASCADE;

DROP TABLE IF EXISTS audit_logs CASCADE;

DROP TABLE IF EXISTS system_logs CASCADE;

DROP TABLE IF EXISTS tenant_configurations CASCADE;

DROP TABLE IF EXISTS stores CASCADE;

DROP TABLE IF EXISTS tenants CASCADE;

-- 1. TENANTS TABLE (Businesses)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    business_name VARCHAR(255) NOT NULL,
    business_email VARCHAR(255) UNIQUE NOT NULL,
    business_phone VARCHAR(50),
    business_address TEXT,
    business_logo_url TEXT,
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    subscription_status VARCHAR(20) DEFAULT 'active',
    max_stores INTEGER DEFAULT 1,
    max_customers INTEGER DEFAULT 1000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- 2. USERS TABLE (Single table for all user types with Supabase Auth integration)
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

-- 3. STORES TABLE
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'UK',
    postal_code VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255),
    store_manager_id UUID REFERENCES users (id),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    opening_hours JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. STORE STAFF TABLE
CREATE TABLE store_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores (id) ON DELETE CASCADE,
    user_id UUID REFERENCES users (id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'staff',
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (store_id, user_id)
);

-- 5. CUSTOMER LOYALTY TABLE
CREATE TABLE customer_loyalty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    user_id UUID REFERENCES users (id) ON DELETE CASCADE,
    loyalty_number VARCHAR(50) UNIQUE,
    current_points INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    level_name VARCHAR(50) DEFAULT 'Bronze',
    total_points_earned INTEGER DEFAULT 0,
    total_points_redeemed INTEGER DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. LOYALTY TRANSACTIONS TABLE
CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    customer_loyalty_id UUID REFERENCES customer_loyalty (id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- 'earn', 'redeem', 'expire', 'adjust'
    points INTEGER NOT NULL,
    description TEXT,
    store_id UUID REFERENCES stores (id),
    staff_user_id UUID REFERENCES users (id),
    reference_id UUID, -- For linking to purchases, rewards, etc.
    reference_type VARCHAR(50), -- 'purchase', 'reward', 'manual'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. REWARDS TABLE
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points_cost INTEGER NOT NULL,
    reward_type VARCHAR(50) NOT NULL, -- 'discount', 'free_item', 'cashback'
    discount_percentage DECIMAL(5, 2),
    discount_amount DECIMAL(10, 2),
    free_item_description TEXT,
    is_active BOOLEAN DEFAULT true,
    max_redemptions INTEGER,
    current_redemptions INTEGER DEFAULT 0,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. CUSTOMER REWARDS TABLE
CREATE TABLE customer_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    customer_loyalty_id UUID REFERENCES customer_loyalty (id) ON DELETE CASCADE,
    reward_id UUID REFERENCES rewards (id) ON DELETE CASCADE,
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    is_used BOOLEAN DEFAULT false,
    store_id UUID REFERENCES stores (id),
    staff_user_id UUID REFERENCES users (id)
);

-- 9. STAMP CARDS TABLE
CREATE TABLE stamp_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    customer_loyalty_id UUID REFERENCES customer_loyalty (id) ON DELETE CASCADE,
    card_name VARCHAR(255) NOT NULL,
    total_stamps INTEGER NOT NULL,
    current_stamps INTEGER DEFAULT 0,
    reward_description TEXT,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. STAMP TRANSACTIONS TABLE
CREATE TABLE stamp_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    stamp_card_id UUID REFERENCES stamp_cards (id) ON DELETE CASCADE,
    stamps_added INTEGER NOT NULL,
    description TEXT,
    store_id UUID REFERENCES stores (id),
    staff_user_id UUID REFERENCES users (id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. PURCHASES TABLE
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    customer_loyalty_id UUID REFERENCES customer_loyalty (id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores (id) ON DELETE CASCADE,
    staff_user_id UUID REFERENCES users (id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL,
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    payment_method VARCHAR(50),
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. PURCHASE ITEMS TABLE
CREATE TABLE purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    purchase_id UUID REFERENCES purchases (id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. FINANCIAL REPORTS TABLE
CREATE TABLE financial_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
    report_date DATE NOT NULL,
    total_sales DECIMAL(12, 2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    total_customers INTEGER DEFAULT 0,
    points_issued INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    rewards_redeemed INTEGER DEFAULT 0,
    average_transaction_value DECIMAL(10, 2) DEFAULT 0,
    top_products JSONB,
    top_stores JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (
        tenant_id,
        report_type,
        report_date
    )
);

-- 14. ROLES TABLE
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, name)
);

-- 15. USER ROLES TABLE
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    user_id UUID REFERENCES users (id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles (id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users (id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, role_id)
);

-- 16. AUDIT LOGS TABLE
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    user_id UUID REFERENCES users (id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. SYSTEM LOGS TABLE
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    level VARCHAR(20) NOT NULL, -- 'info', 'warning', 'error', 'debug'
    message TEXT NOT NULL,
    context JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. TENANT CONFIGURATIONS TABLE
CREATE TABLE tenant_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT,
    config_type VARCHAR(50) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, config_key)
);

-- Create indexes for performance
CREATE INDEX idx_users_tenant_email ON users (tenant_id, email);

CREATE INDEX idx_users_tenant_role ON users (tenant_id, role);

CREATE INDEX idx_users_auth_user_id ON users (auth_user_id);

CREATE INDEX idx_stores_tenant_active ON stores (tenant_id, is_active);

CREATE INDEX idx_stores_tenant_city ON stores (tenant_id, city);

CREATE INDEX idx_customer_loyalty_tenant_user ON customer_loyalty (tenant_id, user_id);

CREATE INDEX idx_customer_loyalty_number ON customer_loyalty (loyalty_number);

CREATE INDEX idx_loyalty_transactions_tenant_date ON loyalty_transactions (tenant_id, created_at);

CREATE INDEX idx_loyalty_transactions_customer ON loyalty_transactions (customer_loyalty_id);

CREATE INDEX idx_rewards_tenant_active ON rewards (tenant_id, is_active);

CREATE INDEX idx_rewards_tenant_points ON rewards (tenant_id, points_cost);

CREATE INDEX idx_stamp_cards_tenant_customer ON stamp_cards (
    tenant_id,
    customer_loyalty_id,
    is_completed
);

CREATE INDEX idx_stamp_cards_active ON stamp_cards (
    tenant_id,
    is_completed,
    expires_at
)
WHERE
    is_completed = false;

CREATE INDEX idx_stamp_transactions_tenant_date ON stamp_transactions (tenant_id, created_at);

CREATE INDEX idx_purchases_tenant_date ON purchases (tenant_id, created_at);

CREATE INDEX idx_purchases_store ON purchases (store_id);

CREATE INDEX idx_store_staff_tenant ON store_staff (tenant_id, store_id);

CREATE INDEX idx_audit_logs_tenant_date ON audit_logs (tenant_id, created_at);

-- Partial indexes for active records
CREATE INDEX idx_active_users ON users (tenant_id)
WHERE
    is_active = true;

CREATE INDEX idx_active_stores ON stores (tenant_id)
WHERE
    is_active = true;

CREATE INDEX idx_active_rewards ON rewards (tenant_id)
WHERE
    is_active = true;

CREATE INDEX idx_active_stamp_cards ON stamp_cards (tenant_id)
WHERE
    is_completed = false;

-- Composite indexes for common queries
CREATE INDEX idx_users_tenant_id ON users (tenant_id);

CREATE INDEX idx_stores_tenant_id ON stores (tenant_id);

CREATE INDEX idx_customer_loyalty_tenant_id ON customer_loyalty (tenant_id);

CREATE INDEX idx_loyalty_transactions_tenant_id ON loyalty_transactions (tenant_id);

CREATE INDEX idx_rewards_tenant_id ON rewards (tenant_id);

CREATE INDEX idx_stamp_cards_tenant_id ON stamp_cards (tenant_id);

CREATE INDEX idx_stamp_transactions_tenant_id ON stamp_transactions (tenant_id);

CREATE INDEX idx_purchases_tenant_id ON purchases (tenant_id);

CREATE INDEX idx_store_staff_tenant_id ON store_staff (tenant_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_staff_updated_at BEFORE UPDATE ON store_staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_loyalty_updated_at BEFORE UPDATE ON customer_loyalty FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stamp_cards_updated_at BEFORE UPDATE ON stamp_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_configurations_updated_at BEFORE UPDATE ON tenant_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) on all tenant-specific tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

ALTER TABLE store_staff ENABLE ROW LEVEL SECURITY;

ALTER TABLE customer_loyalty ENABLE ROW LEVEL SECURITY;

ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

ALTER TABLE customer_rewards ENABLE ROW LEVEL SECURITY;

ALTER TABLE stamp_cards ENABLE ROW LEVEL SECURITY;

ALTER TABLE stamp_transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE tenant_configurations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
-- Note: These policies will be applied when the application sets the tenant context
-- For now, we'll create basic policies that allow all operations (they can be tightened later)

-- Tenants table - only super admins can access
CREATE POLICY tenants_super_admin_policy ON tenants FOR ALL USING (true);

-- Users table - tenant isolation (super admins can access all)
CREATE POLICY users_tenant_policy ON users FOR ALL USING (
    tenant_id IS NOT NULL
    OR role = 'super_admin'
);

-- Stores table - tenant isolation
CREATE POLICY stores_tenant_policy ON stores FOR ALL USING (tenant_id IS NOT NULL);

-- Store staff table - tenant isolation
CREATE POLICY store_staff_tenant_policy ON store_staff FOR ALL USING (tenant_id IS NOT NULL);

-- Customer loyalty table - tenant isolation
CREATE POLICY customer_loyalty_tenant_policy ON customer_loyalty FOR ALL USING (tenant_id IS NOT NULL);

-- Loyalty transactions table - tenant isolation
CREATE POLICY loyalty_transactions_tenant_policy ON loyalty_transactions FOR ALL USING (tenant_id IS NOT NULL);

-- Rewards table - tenant isolation
CREATE POLICY rewards_tenant_policy ON rewards FOR ALL USING (tenant_id IS NOT NULL);

-- Customer rewards table - tenant isolation
CREATE POLICY customer_rewards_tenant_policy ON customer_rewards FOR ALL USING (tenant_id IS NOT NULL);

-- Stamp cards table - tenant isolation
CREATE POLICY stamp_cards_tenant_policy ON stamp_cards FOR ALL USING (tenant_id IS NOT NULL);

-- Stamp transactions table - tenant isolation
CREATE POLICY stamp_transactions_tenant_policy ON stamp_transactions FOR ALL USING (tenant_id IS NOT NULL);

-- Purchases table - tenant isolation
CREATE POLICY purchases_tenant_policy ON purchases FOR ALL USING (tenant_id IS NOT NULL);

-- Purchase items table - tenant isolation (via purchases)
CREATE POLICY purchase_items_tenant_policy ON purchase_items FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM purchases p
        WHERE
            p.id = purchase_items.purchase_id
            AND p.tenant_id IS NOT NULL
    )
);

-- Financial reports table - tenant isolation
CREATE POLICY financial_reports_tenant_policy ON financial_reports FOR ALL USING (tenant_id IS NOT NULL);

-- Roles table - tenant isolation
CREATE POLICY roles_tenant_policy ON roles FOR ALL USING (tenant_id IS NOT NULL);

-- User roles table - tenant isolation
CREATE POLICY user_roles_tenant_policy ON user_roles FOR ALL USING (tenant_id IS NOT NULL);

-- Audit logs table - tenant isolation
CREATE POLICY audit_logs_tenant_policy ON audit_logs FOR ALL USING (tenant_id IS NOT NULL);

-- Tenant configurations table - tenant isolation
CREATE POLICY tenant_configurations_tenant_policy ON tenant_configurations FOR ALL USING (tenant_id IS NOT NULL);

-- Insert default system roles
INSERT INTO
    roles (
        tenant_id,
        name,
        description,
        permissions
    )
VALUES (
        NULL,
        'super_admin',
        'System-wide administrator with full access',
        '["*"]'
    ),
    (
        NULL,
        'tenant_admin',
        'Tenant administrator with full tenant access',
        '["tenant_manage", "user_manage", "store_manage", "loyalty_manage", "reward_manage", "report_view"]'
    ),
    (
        NULL,
        'store_manager',
        'Store manager with store-level access',
        '["store_manage", "staff_manage", "stamp_scan", "purchase_process", "report_view"]'
    ),
    (
        NULL,
        'staff',
        'Store staff with basic operations',
        '["stamp_scan", "purchase_process", "customer_view"]'
    ),
    (
        NULL,
        'customer',
        'Customer with limited access',
        '["profile_view", "loyalty_view", "reward_redeem"]'
    ) ON CONFLICT DO NOTHING;

-- Insert default tenant configurations
-- These will be used as templates for new tenants
INSERT INTO
    tenant_configurations (
        tenant_id,
        config_key,
        config_value,
        config_type
    )
VALUES (
        NULL,
        'default_points_per_pound',
        '1',
        'number'
    ),
    (
        NULL,
        'default_loyalty_level',
        'Bronze',
        'string'
    ),
    (
        NULL,
        'points_expiry_days',
        '365',
        'number'
    ),
    (
        NULL,
        'stamp_card_expiry_days',
        '30',
        'number'
    ),
    (
        NULL,
        'max_stamps_per_card',
        '10',
        'number'
    ) ON CONFLICT DO NOTHING;