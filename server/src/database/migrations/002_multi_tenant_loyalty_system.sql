-- Migration: Multi-Tenant Loyalty System
-- This migration creates the complete multi-tenant loyalty system

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100),
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    max_stores INTEGER DEFAULT 1,
    max_users INTEGER DEFAULT 10,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'UK',
    postal_code VARCHAR(20),
    tax_id VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    trial_ends_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
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

-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
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

-- Create customer_loyalty table
CREATE TABLE IF NOT EXISTS customer_loyalty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    user_id UUID REFERENCES users (id) ON DELETE CASCADE,
    loyalty_number VARCHAR(50) UNIQUE,
    total_points INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    current_level VARCHAR(50) DEFAULT 'Bronze',
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create loyalty_transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    customer_loyalty_id UUID REFERENCES customer_loyalty (id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- 'earn', 'redeem', 'expire', 'adjust'
    points_change INTEGER NOT NULL,
    points_before INTEGER NOT NULL,
    points_after INTEGER NOT NULL,
    description TEXT,
    reference_type VARCHAR(50), -- 'purchase', 'reward', 'manual', 'expiry'
    reference_id UUID,
    staff_user_id UUID REFERENCES users (id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points_cost INTEGER NOT NULL,
    discount_amount DECIMAL(10, 2),
    discount_percentage DECIMAL(5, 2),
    reward_type VARCHAR(50) DEFAULT 'discount', -- 'discount', 'free_item', 'cashback'
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    max_redemptions INTEGER,
    current_redemptions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create customer_rewards table
CREATE TABLE IF NOT EXISTS customer_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    customer_loyalty_id UUID REFERENCES customer_loyalty (id) ON DELETE CASCADE,
    reward_id UUID REFERENCES rewards (id) ON DELETE CASCADE,
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP,
    staff_user_id UUID REFERENCES users (id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create stamp_cards table
CREATE TABLE IF NOT EXISTS stamp_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    customer_loyalty_id UUID REFERENCES customer_loyalty (id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    total_stamps INTEGER NOT NULL,
    current_stamps INTEGER DEFAULT 0,
    reward_description TEXT,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create stamp_transactions table
CREATE TABLE IF NOT EXISTS stamp_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    stamp_card_id UUID REFERENCES stamp_cards (id) ON DELETE CASCADE,
    stamps_added INTEGER NOT NULL,
    stamps_before INTEGER NOT NULL,
    stamps_after INTEGER NOT NULL,
    description TEXT,
    staff_user_id UUID REFERENCES users (id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores (id) ON DELETE CASCADE,
    customer_loyalty_id UUID REFERENCES customer_loyalty (id) ON DELETE CASCADE,
    transaction_number VARCHAR(50) UNIQUE,
    total_amount DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    final_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    staff_user_id UUID REFERENCES users (id),
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create purchase_items table
CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    purchase_id UUID REFERENCES purchases (id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create financial_reports table
CREATE TABLE IF NOT EXISTS financial_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
    report_date DATE NOT NULL,
    total_sales DECIMAL(12, 2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    average_transaction DECIMAL(10, 2) DEFAULT 0,
    total_rewards_redeemed INTEGER DEFAULT 0,
    total_rewards_value DECIMAL(10, 2) DEFAULT 0,
    report_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create store_staff table
CREATE TABLE IF NOT EXISTS store_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores (id) ON DELETE CASCADE,
    user_id UUID REFERENCES users (id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'staff', -- 'manager', 'staff', 'cashier'
    is_active BOOLEAN DEFAULT true,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (store_id, user_id)
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
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

-- Create system_logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    level VARCHAR(20) NOT NULL, -- 'info', 'warning', 'error', 'debug'
    message TEXT NOT NULL,
    context JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tenant_configurations table
CREATE TABLE IF NOT EXISTS tenant_configurations (
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
    customer_loyalty_id
)
WHERE
    is_completed = false;

CREATE INDEX idx_stamp_transactions_tenant_date ON stamp_transactions (tenant_id, created_at);

CREATE INDEX idx_purchases_tenant_date ON purchases (tenant_id, created_at);

CREATE INDEX idx_purchases_store ON purchases (store_id);

CREATE INDEX idx_purchase_items_tenant ON purchase_items (tenant_id);

CREATE INDEX idx_store_staff_tenant ON store_staff (tenant_id, store_id);

CREATE INDEX idx_audit_logs_tenant_date ON audit_logs (tenant_id, created_at);

-- Create triggers for updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_loyalty_updated_at BEFORE UPDATE ON customer_loyalty FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stamp_cards_updated_at BEFORE UPDATE ON stamp_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_reports_updated_at BEFORE UPDATE ON financial_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_staff_updated_at BEFORE UPDATE ON store_staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_configurations_updated_at BEFORE UPDATE ON tenant_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - after all tables are created
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

ALTER TABLE customer_loyalty ENABLE ROW LEVEL SECURITY;

ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

ALTER TABLE customer_rewards ENABLE ROW LEVEL SECURITY;

ALTER TABLE stamp_cards ENABLE ROW LEVEL SECURITY;

ALTER TABLE stamp_transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;

ALTER TABLE store_staff ENABLE ROW LEVEL SECURITY;

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE tenant_configurations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - after all tables are created
CREATE POLICY tenants_tenant_policy ON tenants FOR ALL USING (id IS NOT NULL);

CREATE POLICY users_tenant_policy ON users FOR ALL USING (
    tenant_id IS NOT NULL
    OR role = 'super_admin'
);

CREATE POLICY stores_tenant_policy ON stores FOR ALL USING (tenant_id IS NOT NULL);

CREATE POLICY customer_loyalty_tenant_policy ON customer_loyalty FOR ALL USING (tenant_id IS NOT NULL);

CREATE POLICY loyalty_transactions_tenant_policy ON loyalty_transactions FOR ALL USING (tenant_id IS NOT NULL);

CREATE POLICY rewards_tenant_policy ON rewards FOR ALL USING (tenant_id IS NOT NULL);

CREATE POLICY customer_rewards_tenant_policy ON customer_rewards FOR ALL USING (tenant_id IS NOT NULL);

CREATE POLICY stamp_cards_tenant_policy ON stamp_cards FOR ALL USING (tenant_id IS NOT NULL);

CREATE POLICY stamp_transactions_tenant_policy ON stamp_transactions FOR ALL USING (tenant_id IS NOT NULL);

CREATE POLICY purchases_tenant_policy ON purchases FOR ALL USING (tenant_id IS NOT NULL);

CREATE POLICY purchase_items_tenant_policy ON purchase_items FOR ALL USING (tenant_id IS NOT NULL);

CREATE POLICY financial_reports_tenant_policy ON financial_reports FOR ALL USING (tenant_id IS NOT NULL);

CREATE POLICY store_staff_tenant_policy ON store_staff FOR ALL USING (tenant_id IS NOT NULL);

CREATE POLICY audit_logs_tenant_policy ON audit_logs FOR ALL USING (tenant_id IS NOT NULL);

CREATE POLICY system_logs_tenant_policy ON system_logs FOR ALL USING (tenant_id IS NOT NULL);

CREATE POLICY tenant_configurations_tenant_policy ON tenant_configurations FOR ALL USING (tenant_id IS NOT NULL);