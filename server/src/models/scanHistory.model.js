const { db } = require("../config/database");
const { logger } = require("../utils/logger");

class ScanHistory {
  constructor(data) {
    this.id = data.id;
    this.user_reward_progress_id = data.user_reward_progress_id;
    this.user_id = data.user_id;
    this.reward_id = data.reward_id;
    this.scanned_by_user_id = data.scanned_by_user_id;
    this.store_id = data.store_id;
    this.stamps_before_scan = data.stamps_before_scan || 0;
    this.stamps_after_scan = data.stamps_after_scan || 0;
    this.stamps_added = data.stamps_added || 1;
    this.scan_method = data.scan_method || 'qr_code';
    this.scan_location = data.scan_location;
    this.notes = data.notes;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  /**
   * Create a new scan history record
   */
  static async create(progressId, userId, rewardId, scannedByUserId, storeId = null, stampsAdded = 1, stampsBeforeScan = 0, stampsAfterScan = null) {
    try {
      // Calculate stamps after scan if not provided
      const finalStampsAfterScan = stampsAfterScan !== null ? stampsAfterScan : stampsBeforeScan + stampsAdded;
      
      const query = `
        INSERT INTO scan_history (
          user_reward_progress_id, user_id, reward_id, scanned_by_user_id, 
          store_id, stamps_added, stamps_before_scan, stamps_after_scan, scan_method
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      const params = [progressId, userId, rewardId, scannedByUserId, storeId, stampsAdded, stampsBeforeScan, finalStampsAfterScan, 'qr_code'];

      const result = await db.getOne(query, params);
      return result ? new ScanHistory(result) : null;
    } catch (error) {
      logger.error("Error creating scan history:", error);
      throw error;
    }
  }

  /**
   * Get scan history for a specific user reward progress
   */
  static async findByProgressId(progressId, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      
      const query = `
        SELECT sh.*, 
               u.first_name || ' ' || u.last_name as customer_name,
               r.name as reward_name,
               s.name as store_name
        FROM scan_history sh
        LEFT JOIN users u ON sh.user_id::UUID = u.id
        LEFT JOIN rewards r ON sh.reward_id::UUID = r.id
        LEFT JOIN stores s ON sh.store_id = s.id
        WHERE sh.user_reward_progress_id = $1
        ORDER BY sh.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const params = [progressId, limit, offset];

      const results = await db.getMany(query, params);
      return results.map(result => ({
        ...new ScanHistory(result),
        customer_name: result.customer_name,
        reward_name: result.reward_name,
        store_name: result.store_name
      }));
    } catch (error) {
      logger.error("Error finding scan history by progress ID:", error);
      throw error;
    }
  }

  /**
   * Get scan history for a specific user across all rewards
   */
  static async findByUserId(userId, options = {}) {
    try {
      const { limit = 100, offset = 0, rewardId = null } = options;
      
      let query = `
        SELECT sh.*, 
               u.first_name || ' ' || u.last_name as customer_name,
               r.name as reward_name,
               s.name as store_name,
               urp.stamps_collected,
               urp.stamps_required
        FROM scan_history sh
        LEFT JOIN users u ON sh.user_id::UUID = u.id
        LEFT JOIN rewards r ON sh.reward_id::UUID = r.id
        LEFT JOIN stores s ON sh.store_id = s.id
        LEFT JOIN user_reward_progress urp ON sh.user_reward_progress_id = urp.id
        WHERE sh.user_id = $1
      `;
      const params = [userId];

      if (rewardId) {
        query += ` AND sh.reward_id = $${params.length + 1}`;
        params.push(rewardId);
      }

      query += ` ORDER BY sh.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const results = await db.getMany(query, params);
      return results.map(result => ({
        ...new ScanHistory(result),
        customer_name: result.customer_name,
        reward_name: result.reward_name,
        store_name: result.store_name,
        stamps_collected: result.stamps_collected,
        stamps_required: result.stamps_required
      }));
    } catch (error) {
      logger.error("Error finding scan history by user ID:", error);
      throw error;
    }
  }

  /**
   * Get scan history for admin view (all scans)
   */
  static async findAll(options = {}) {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        userId = null, 
        rewardId = null, 
        storeId = null,
        scannedByUserId = null,
        dateFrom = null,
        dateTo = null 
      } = options;
      
      let query = `
        SELECT sh.*, 
               u.first_name || ' ' || u.last_name as customer_name,
               r.name as reward_name,
               s.name as store_name,
               urp.stamps_collected,
               urp.stamps_required,
               urp.is_completed
        FROM scan_history sh
        LEFT JOIN users u ON sh.user_id::UUID = u.id
        LEFT JOIN rewards r ON sh.reward_id::UUID = r.id
        LEFT JOIN stores s ON sh.store_id = s.id
        LEFT JOIN user_reward_progress urp ON sh.user_reward_progress_id = urp.id
        WHERE 1=1
      `;
      const params = [];

      if (userId) {
        query += ` AND sh.user_id = $${params.length + 1}`;
        params.push(userId);
      }

      if (rewardId) {
        query += ` AND sh.reward_id = $${params.length + 1}`;
        params.push(rewardId);
      }

      if (storeId) {
        query += ` AND sh.store_id = $${params.length + 1}`;
        params.push(storeId);
      }

      if (scannedByUserId) {
        query += ` AND sh.scanned_by_user_id = $${params.length + 1}`;
        params.push(scannedByUserId);
      }

      if (dateFrom) {
        query += ` AND sh.created_at >= $${params.length + 1}`;
        params.push(dateFrom);
      }

      if (dateTo) {
        query += ` AND sh.created_at <= $${params.length + 1}`;
        params.push(dateTo);
      }

      query += ` ORDER BY sh.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const results = await db.getMany(query, params);
      return results.map(result => ({
        ...new ScanHistory(result),
        customer_name: result.customer_name,
        reward_name: result.reward_name,
        store_name: result.store_name,
        stamps_collected: result.stamps_collected,
        stamps_required: result.stamps_required,
        is_completed: result.is_completed
      }));
    } catch (error) {
      logger.error("Error finding all scan history:", error);
      throw error;
    }
  }

  /**
   * Count scan history records with filters
   */
  static async count(options = {}) {
    try {
      const { 
        userId = null, 
        rewardId = null, 
        storeId = null,
        scannedByUserId = null,
        dateFrom = null,
        dateTo = null 
      } = options;
      
      let query = `SELECT COUNT(*) as count FROM scan_history WHERE 1=1`;
      const params = [];

      if (userId) {
        query += ` AND user_id = $${params.length + 1}`;
        params.push(userId);
      }

      if (rewardId) {
        query += ` AND reward_id = $${params.length + 1}`;
        params.push(rewardId);
      }

      if (storeId) {
        query += ` AND store_id = $${params.length + 1}`;
        params.push(storeId);
      }

      if (scannedByUserId) {
        query += ` AND scanned_by_user_id = $${params.length + 1}`;
        params.push(scannedByUserId);
      }

      if (dateFrom) {
        query += ` AND created_at >= $${params.length + 1}`;
        params.push(dateFrom);
      }

      if (dateTo) {
        query += ` AND created_at <= $${params.length + 1}`;
        params.push(dateTo);
      }

      const result = await db.getOne(query, params);
      return result ? parseInt(result.count) : 0;
    } catch (error) {
      logger.error("Error counting scan history:", error);
      throw error;
    }
  }

  /**
   * Get scan statistics for admin dashboard
   */
  static async getStatistics(options = {}) {
    try {
      const { 
        dateFrom = null, 
        dateTo = null,
        storeId = null
      } = options;
      
      let baseWhere = "WHERE 1=1";
      const params = [];

      if (dateFrom) {
        baseWhere += ` AND created_at >= $${params.length + 1}`;
        params.push(dateFrom);
      }

      if (dateTo) {
        baseWhere += ` AND created_at <= $${params.length + 1}`;
        params.push(dateTo);
      }

      if (storeId) {
        baseWhere += ` AND store_id = $${params.length + 1}`;
        params.push(storeId);
      }

      const query = `
        SELECT 
          COUNT(*) as total_scans,
          COUNT(DISTINCT user_id) as unique_customers,
          COUNT(DISTINCT reward_id) as rewards_scanned,
          COUNT(DISTINCT scanned_by_user_id) as staff_members,
          SUM(stamps_added) as total_stamps_added,
          COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as scans_today,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as scans_this_week
        FROM scan_history 
        ${baseWhere}
      `;

      const result = await db.getOne(query, params);
      return {
        total_scans: parseInt(result.total_scans) || 0,
        unique_customers: parseInt(result.unique_customers) || 0,
        rewards_scanned: parseInt(result.rewards_scanned) || 0,
        staff_members: parseInt(result.staff_members) || 0,
        total_stamps_added: parseInt(result.total_stamps_added) || 0,
        scans_today: parseInt(result.scans_today) || 0,
        scans_this_week: parseInt(result.scans_this_week) || 0
      };
    } catch (error) {
      logger.error("Error getting scan statistics:", error);
      throw error;
    }
  }
}

module.exports = { ScanHistory };
