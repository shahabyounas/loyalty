-- Seed: Create admin user
-- Password: Admin123! (bcrypt hash)
-- Only run this in development/test environment

INSERT INTO
    users (
        email,
        password_hash,
        first_name,
        last_name,
        role,
        email_verified,
        is_active
    )
VALUES (
        'admin@loyalty.com',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G', -- Admin123!
        'Admin',
        'User',
        'admin',
        true,
        true
    ) ON CONFLICT (email) DO NOTHING;

-- Seed: Create test user
-- Password: Test123! (bcrypt hash)

INSERT INTO
    users (
        email,
        password_hash,
        first_name,
        last_name,
        role,
        email_verified,
        is_active
    )
VALUES (
        'test@loyalty.com',
        '$2a$12$8K1p/a0dL1LXMIgoEDFrwOfgqwAGcwZQh3UPHz6M8CgHpVqKqKqKq', -- Test123!
        'Test',
        'User',
        'user',
        true,
        true
    ) ON CONFLICT (email) DO NOTHING;