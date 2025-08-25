-- Seed rewards for testing
INSERT INTO
    rewards (
        tenant_id,
        name,
        description,
        points_cost,
        discount_amount,
        discount_percentage,
        reward_type,
        valid_from,
        valid_until,
        max_redemptions,
        is_active,
        created_at,
        updated_at
    )
VALUES (
        1, -- Assuming tenant_id 1 exists
        'Free Coffee',
        'Get a free coffee with any purchase',
        100,
        NULL,
        NULL,
        'free_item',
        CURRENT_TIMESTAMP,
        '2029-12-31 23:59:59',
        NULL,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        1,
        '20% Off',
        '20% discount on all items',
        200,
        NULL,
        20,
        'discount',
        CURRENT_TIMESTAMP,
        '2029-11-30 23:59:59',
        NULL,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        1,
        'Double Points',
        'Earn double points on your next purchase',
        50,
        NULL,
        NULL,
        'points',
        CURRENT_TIMESTAMP,
        '2029-10-15 23:59:59',
        NULL,
        false,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );