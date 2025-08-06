-- Migration: Access Control System
-- This migration creates the access control management system

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    is_system_role BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, name)
);

-- Create access_controls table
CREATE TABLE IF NOT EXISTS access_controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID REFERENCES tenants (id) ON DELETE CASCADE,
    user_id UUID REFERENCES users (id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles (id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    granted_by UUID REFERENCES users (id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    revoked_by UUID REFERENCES users (id),
    revoked_at TIMESTAMP,
    revocation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, user_id, role_id)
);

-- Create indexes for performance
CREATE INDEX idx_roles_tenant_id ON roles (tenant_id);

CREATE INDEX idx_roles_name ON roles (name);

CREATE INDEX idx_roles_system ON roles (is_system_role)
WHERE
    is_system_role = true;

CREATE INDEX idx_roles_active ON roles (tenant_id)
WHERE
    is_active = true;

CREATE INDEX idx_access_controls_tenant_id ON access_controls (tenant_id);

CREATE INDEX idx_access_controls_user_id ON access_controls (user_id);

CREATE INDEX idx_access_controls_role_id ON access_controls (role_id);

CREATE INDEX idx_access_controls_active ON access_controls (tenant_id, user_id)
WHERE
    is_active = true;

CREATE INDEX idx_access_controls_granted_by ON access_controls (granted_by);

CREATE INDEX idx_access_controls_granted_at ON access_controls (granted_at);

CREATE INDEX idx_access_controls_expires_at ON access_controls (expires_at)
WHERE
    expires_at IS NOT NULL;

-- Create triggers for updated_at
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_access_controls_updated_at BEFORE UPDATE ON access_controls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

ALTER TABLE access_controls ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for roles table
CREATE POLICY roles_tenant_policy ON roles FOR ALL USING (
    tenant_id IS NOT NULL
    OR is_system_role = true
);

-- Create RLS policies for access_controls table
CREATE POLICY access_controls_tenant_policy ON access_controls FOR ALL USING (tenant_id IS NOT NULL);

-- Create composite indexes for common queries
CREATE INDEX idx_access_controls_tenant_user_role ON access_controls (tenant_id, user_id, role_id);

CREATE INDEX idx_access_controls_tenant_role ON access_controls (tenant_id, role_id);

CREATE INDEX idx_roles_tenant_active ON roles (tenant_id, is_active)
WHERE
    is_active = true;

-- Insert default system roles
INSERT INTO
    roles (
        name,
        description,
        permissions,
        is_system_role,
        is_active
    )
VALUES (
        'super_admin',
        'System-wide administrator with full access',
        '["*"]',
        true,
        true
    ),
    (
        'tenant_admin',
        'Tenant administrator with full tenant access',
        '["tenant_manage", "user_manage", "store_manage", "loyalty_manage", "reward_manage", "report_view", "stamp_scan", "purchase_process"]',
        true,
        true
    ),
    (
        'store_manager',
        'Store manager with store-level access',
        '["store_manage", "staff_manage", "stamp_scan", "purchase_process", "report_view", "customer_view"]',
        true,
        true
    ),
    (
        'staff',
        'Store staff with basic operational access',
        '["stamp_scan", "purchase_process", "customer_view"]',
        true,
        true
    ),
    (
        'customer',
        'Customer with limited access',
        '["profile_view", "loyalty_view", "reward_redeem"]',
        true,
        true
    ) ON CONFLICT (tenant_id, name) DO NOTHING;