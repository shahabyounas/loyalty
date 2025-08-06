-- Seed: Additional system configuration
-- This file contains any additional SQL seeding that might be needed
-- The main seeding is now handled by the JavaScript seeder

-- Insert default tenant configurations (if needed)
-- These will be created automatically by the JavaScript seeder

-- Insert any additional system-wide settings
-- Note: Most seeding is now handled by the JavaScript seeder for better control

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