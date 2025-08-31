const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

// Get dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Calculate date range based on period
    const getDateRange = (period) => {
      const now = new Date();
      const ranges = {
        week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        quarter: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      };
      return ranges[period] || ranges.month;
    };

    const startDate = getDateRange(period);
    const previousPeriodStart = new Date(startDate.getTime() - (new Date() - startDate));

    // Get user analytics
    const userAnalytics = await getUserAnalytics(startDate, previousPeriodStart);
    
    // Get store analytics
    const storeAnalytics = await getStoreAnalytics(startDate, previousPeriodStart);
    
    // Get reward analytics
    const rewardAnalytics = await getRewardAnalytics(startDate, previousPeriodStart);
    
    // Get business analytics
    const businessAnalytics = await getBusinessAnalytics(startDate, previousPeriodStart);
    
    // Get recent activity
    const recentActivity = await getRecentActivity();

    res.json({
      success: true,
      data: {
        period,
        users: userAnalytics,
        stores: storeAnalytics,
        rewards: rewardAnalytics,
        business: businessAnalytics,
        activity: recentActivity,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: error.message
    });
  }
});

// User analytics helper
async function getUserAnalytics(startDate, previousPeriodStart) {
  try {
    // Total users
    const totalUsersResult = await db.getOne('SELECT COUNT(*) as count FROM users WHERE is_active = true OR is_active IS NULL');
    const totalUsers = parseInt(totalUsersResult.count);

    // Active users (logged in within period)
    const activeUsersResult = await db.getOne(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM user_reward_progress 
      WHERE updated_at >= $1::timestamp
    `, [startDate]);
    const activeUsers = parseInt(activeUsersResult.count);

    // New users this period
    const newUsersResult = await db.getOne(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE created_at >= $1::timestamp AND (is_active = true OR is_active IS NULL)
    `, [startDate]);
    const newUsers = parseInt(newUsersResult.count);

    // Previous period new users for growth calculation
    const previousNewUsersResult = await db.getOne(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE created_at >= $1::timestamp AND created_at < $2::timestamp AND (is_active = true OR is_active IS NULL)
    `, [previousPeriodStart, startDate]);
    const previousNewUsers = parseInt(previousNewUsersResult.count);

    // Calculate growth
    const growth = previousNewUsers > 0 ? 
      ((newUsers - previousNewUsers) / previousNewUsers * 100) : 
      (newUsers > 0 ? 100 : 0);

    // Top roles distribution
    const topRoles = await db.getMany(`
      SELECT 
        role,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / $1, 1) as percentage
      FROM users 
      WHERE is_active = true OR is_active IS NULL
      GROUP BY role
      ORDER BY count DESC
      LIMIT 5
    `, [totalUsers]);

    // User engagement metrics
    const engagementResult = await db.getOne(`
      SELECT 
        COUNT(DISTINCT user_id) as active_scanners,
        CASE 
          WHEN COUNT(*) > 0 THEN COUNT(*)::float / COUNT(DISTINCT user_id)
          ELSE 0 
        END as avg_scans_per_user
      FROM scan_history 
      WHERE created_at >= $1::timestamp
    `, [startDate]);

    return {
      total: totalUsers,
      active: activeUsers,
      newThisPeriod: newUsers,
      growth: Math.round(growth * 10) / 10,
      topRoles: topRoles.map(role => ({
        role: role.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count: parseInt(role.count),
        percentage: parseFloat(role.percentage)
      })),
      engagement: {
        activeScanners: parseInt(engagementResult?.active_scanners || 0),
        avgScansPerUser: parseFloat(engagementResult?.avg_scans_per_user || 0)
      }
    };
  } catch (error) {
    console.error('Error in getUserAnalytics:', error);
    throw error;
  }
}

// Store analytics helper
async function getStoreAnalytics(startDate, previousPeriodStart) {
  try {
    // Total stores
    const totalStoresResult = await db.getOne('SELECT COUNT(*) as count FROM stores');
    const totalStores = parseInt(totalStoresResult.count);

    // Active stores (with recent scans)
    const activeStoresResult = await db.getOne(`
      SELECT COUNT(DISTINCT store_id) as count 
      FROM scan_history 
      WHERE created_at >= $1::timestamp AND store_id IS NOT NULL
    `, [startDate]);
    const activeStores = parseInt(activeStoresResult.count);

    // New stores this period
    const newStoresResult = await db.getOne(`
      SELECT COUNT(*) as count 
      FROM stores 
      WHERE created_at >= $1::timestamp
    `, [startDate]);
    const newStores = parseInt(newStoresResult.count);

    // Previous period new stores
    const previousNewStoresResult = await db.getOne(`
      SELECT COUNT(*) as count 
      FROM stores 
      WHERE created_at >= $1::timestamp AND created_at < $2::timestamp
    `, [previousPeriodStart, startDate]);
    const previousNewStores = parseInt(previousNewStoresResult.count);

    // Calculate growth
    const growth = previousNewStores > 0 ? 
      ((newStores - previousNewStores) / previousNewStores * 100) : 
      (newStores > 0 ? 100 : 0);

    // Top cities/locations
    const topCities = await db.getMany(`
      SELECT 
        city,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / $1, 1) as percentage
      FROM stores 
      WHERE city IS NOT NULL
      GROUP BY city
      ORDER BY count DESC
      LIMIT 5
    `, [totalStores]);

    // Store performance metrics
    const performanceResult = await db.getOne(`
      SELECT 
        COUNT(DISTINCT store_id) as stores_with_activity,
        CASE 
          WHEN COUNT(DISTINCT store_id) > 0 THEN COUNT(*)::float / COUNT(DISTINCT store_id)
          ELSE 0 
        END as avg_scans_per_store
      FROM scan_history 
      WHERE created_at >= $1::timestamp AND store_id IS NOT NULL
    `, [startDate]);

    return {
      total: totalStores,
      active: activeStores,
      newThisPeriod: newStores,
      growth: Math.round(growth * 10) / 10,
      topCities: topCities.map(city => ({
        city: city.city,
        count: parseInt(city.count),
        percentage: parseFloat(city.percentage)
      })),
      performance: {
        storesWithActivity: parseInt(performanceResult?.stores_with_activity || 0),
        avgScansPerStore: parseFloat(performanceResult?.avg_scans_per_store || 0)
      }
    };
  } catch (error) {
    console.error('Error in getStoreAnalytics:', error);
    throw error;
  }
}

// Reward analytics helper
async function getRewardAnalytics(startDate, previousPeriodStart) {
  try {
    // Total rewards
    const totalRewardsResult = await db.getOne('SELECT COUNT(*) as count FROM rewards WHERE is_active = true');
    const totalRewards = parseInt(totalRewardsResult.count);

    // Active rewards (being used)
    const activeRewardsResult = await db.getOne(`
      SELECT COUNT(DISTINCT reward_id) as count 
      FROM user_reward_progress 
      WHERE updated_at >= $1::timestamp
    `, [startDate]);
    const activeRewards = parseInt(activeRewardsResult.count);

    // Completed rewards this period
    const completedRewardsResult = await db.getOne(`
      SELECT COUNT(*) as count 
      FROM user_reward_progress 
      WHERE is_completed = true AND completed_at >= $1::timestamp
    `, [startDate]);
    const completedRewards = parseInt(completedRewardsResult.count);

    // Previous period completed rewards
    const previousCompletedResult = await db.getOne(`
      SELECT COUNT(*) as count 
      FROM user_reward_progress 
      WHERE is_completed = true AND completed_at >= $1::timestamp AND completed_at < $2::timestamp
    `, [previousPeriodStart, startDate]);
    const previousCompleted = parseInt(previousCompletedResult.count);

    // Calculate growth
    const growth = previousCompleted > 0 ? 
      ((completedRewards - previousCompleted) / previousCompleted * 100) : 
      (completedRewards > 0 ? 100 : 0);

    // Top reward types/categories
    const topTypes = await db.getMany(`
      SELECT 
        r.reward_type as type,
        COUNT(urp.id) as count,
        ROUND(COUNT(urp.id) * 100.0 / NULLIF((
          SELECT COUNT(*) FROM user_reward_progress 
          WHERE updated_at >= $1::timestamp
        ), 0), 1) as percentage
      FROM rewards r
      LEFT JOIN user_reward_progress urp ON r.id::text = urp.reward_id 
        AND urp.updated_at >= $1::timestamp
      WHERE r.is_active = true
      GROUP BY r.reward_type
      ORDER BY count DESC
      LIMIT 5
    `, [startDate]);

    // Reward engagement metrics
    const engagementResult = await db.getOne(`
      SELECT 
        AVG(urp.stamps_collected::float / NULLIF(urp.stamps_required, 0) * 100) as avg_completion_rate,
        COUNT(CASE WHEN urp.is_completed = true THEN 1 END) as total_completions
      FROM user_reward_progress urp
      WHERE urp.updated_at >= $1::timestamp
    `, [startDate]);

    return {
      total: totalRewards,
      active: activeRewards,
      completedThisPeriod: completedRewards,
      growth: Math.round(growth * 10) / 10,
      topTypes: topTypes.map(type => ({
        type: type.type || 'Other',
        count: parseInt(type.count || 0),
        percentage: parseFloat(type.percentage || 0)
      })),
      engagement: {
        avgCompletionRate: parseFloat(engagementResult?.avg_completion_rate || 0),
        totalCompletions: parseInt(engagementResult?.total_completions || 0)
      }
    };
  } catch (error) {
    console.error('Error in getRewardAnalytics:', error);
    throw error;
  }
}

// Business analytics helper
async function getBusinessAnalytics(startDate, previousPeriodStart) {
  try {
    // Total scans (proxy for business activity)
    const totalScansResult = await db.getOne(`
      SELECT COUNT(*) as count 
      FROM scan_history 
      WHERE created_at >= $1::timestamp
    `, [startDate]);
    const totalScans = parseInt(totalScansResult.count);

    // Previous period scans
    const previousScansResult = await db.getOne(`
      SELECT COUNT(*) as count 
      FROM scan_history 
      WHERE created_at >= $1::timestamp AND created_at < $2::timestamp
    `, [previousPeriodStart, startDate]);
    const previousScans = parseInt(previousScansResult.count);

    // Calculate activity growth
    const activityGrowth = previousScans > 0 ? 
      ((totalScans - previousScans) / previousScans * 100) : 
      (totalScans > 0 ? 100 : 0);

    // Customer retention (users with multiple scans)
    const retentionResult = await db.getOne(`
      SELECT 
        COUNT(CASE WHEN scan_count > 1 THEN 1 END) as returning_users,
        COUNT(*) as total_users
      FROM (
        SELECT user_id, COUNT(*) as scan_count
        FROM scan_history 
        WHERE created_at >= $1::timestamp
        GROUP BY user_id
      ) user_activity
    `, [startDate]);

    const retentionRate = retentionResult.total_users > 0 ? 
      (retentionResult.returning_users / retentionResult.total_users * 100) : 0;

    // Peak activity hours
    const peakHoursResult = await db.getMany(`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as scan_count
      FROM scan_history 
      WHERE created_at >= $1::timestamp
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY scan_count DESC
      LIMIT 3
    `, [startDate]);

    // Customer satisfaction (placeholder - can be enhanced with actual feedback data)
    const satisfactionScore = 4.2 + (Math.random() * 0.6); // Simulated for now

    return {
      totalActivity: totalScans,
      activityGrowth: Math.round(activityGrowth * 10) / 10,
      customerRetention: Math.round(retentionRate * 10) / 10,
      customerSatisfaction: Math.round(satisfactionScore * 10) / 10,
      peakHours: peakHoursResult.map(row => ({
        hour: parseInt(row.hour),
        activity: parseInt(row.scan_count)
      }))
    };
  } catch (error) {
    console.error('Error in getBusinessAnalytics:', error);
    throw error;
  }
}

// Recent activity helper
async function getRecentActivity() {
  try {
    const activities = await db.getMany(`
      SELECT 
        'scan' as type,
        sh.created_at,
        u.first_name || ' ' || u.last_name as user_name,
        s.name as store_name,
        r.name as reward_name
      FROM scan_history sh
      LEFT JOIN users u ON sh.user_id::uuid = u.id
      LEFT JOIN stores s ON sh.store_id = s.id
      LEFT JOIN user_reward_progress urp ON sh.user_reward_progress_id = urp.id
      LEFT JOIN rewards r ON urp.reward_id = r.id::text
      WHERE sh.created_at >= NOW() - INTERVAL '24 hours'
      
      UNION ALL
      
      SELECT 
        'user_registration' as type,
        u.created_at,
        u.first_name || ' ' || u.last_name as user_name,
        NULL as store_name,
        NULL as reward_name
      FROM users u
      WHERE u.created_at >= NOW() - INTERVAL '24 hours'
      AND (u.is_active = true OR u.is_active IS NULL)
      
      UNION ALL
      
      SELECT 
        'reward_completion' as type,
        urp.completed_at as created_at,
        u.first_name || ' ' || u.last_name as user_name,
        NULL as store_name,
        r.name as reward_name
      FROM user_reward_progress urp
      JOIN users u ON urp.user_id::uuid = u.id
      JOIN rewards r ON urp.reward_id = r.id::text
      WHERE urp.is_completed = true 
      AND urp.completed_at >= NOW() - INTERVAL '24 hours'
      
      ORDER BY created_at DESC
      LIMIT 10
    `);

    return activities.map(activity => ({
      type: activity.type,
      timestamp: activity.created_at,
      user: activity.user_name,
      store: activity.store_name,
      reward: activity.reward_name,
      timeAgo: getTimeAgo(activity.created_at)
    }));
  } catch (error) {
    console.error('Error in getRecentActivity:', error);
    return [];
  }
}

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInMinutes = Math.floor((now - new Date(date)) / 60000);
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
}

// Get detailed user analytics
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const { period = 'month', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Calculate date range based on period
    const getDateRange = (period) => {
      const now = new Date();
      const ranges = {
        week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        quarter: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      };
      return ranges[period] || ranges.month;
    };
    
    const startDate = getDateRange(period);
    
    // Detailed user metrics
    const userMetrics = await db.getMany(`
      SELECT 
        u.id,
        u.first_name || ' ' || u.last_name as name,
        u.email,
        u.role,
        u.created_at,
        COUNT(sh.id) as total_scans,
        COUNT(DISTINCT urp.reward_id) as rewards_in_progress,
        COUNT(CASE WHEN urp.is_completed = true THEN 1 END) as completed_rewards,
        MAX(sh.created_at) as last_activity
      FROM users u
      LEFT JOIN scan_history sh ON u.id::text = sh.user_id AND sh.created_at >= $1::timestamp
      LEFT JOIN user_reward_progress urp ON u.id::text = urp.user_id
      WHERE (u.is_active = true OR u.is_active IS NULL)
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.role, u.created_at
      ORDER BY total_scans DESC
      LIMIT $2 OFFSET $3
    `, [startDate, limit, offset]);

    const totalCount = await db.getOne(`
      SELECT COUNT(*) as count FROM users WHERE (is_active = true OR is_active IS NULL)
    `);

    res.json({
      success: true,
      data: {
        users: userMetrics,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(totalCount.count),
          totalPages: Math.ceil(totalCount.count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user analytics',
      error: error.message
    });
  }
});

module.exports = router;
