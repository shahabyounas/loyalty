const { db } = require("../config/database");
const { logger } = require("../utils/logger");
const crypto = require("crypto");

class StampTransaction {
  constructor(data) {
    this.id = data.id;
    this.transaction_code = data.transaction_code;
    this.user_id = data.user_id;
    this.reward_id = data.reward_id;
    this.staff_id = data.staff_id;
    this.store_id = data.store_id;
    this.stamps_added = data.stamps_added || 1;
    this.transaction_status = data.transaction_status || "pending";
    this.expires_at = data.expires_at;
    this.scanned_at = data.scanned_at;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  // Generate unique transaction code
  static generateTransactionCode(userId, rewardId) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString("hex");
    return `STAMP_${userId}_${rewardId}_${timestamp}_${random}`.toUpperCase();
  }

  // Create new stamp transaction
  static async create(userId, rewardId, storeId = null, stampsAdded = 1) {
    try {
      const transactionCode = this.generateTransactionCode(userId, rewardId);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

      const query = `
        INSERT INTO stamp_transactions (
          transaction_code, user_id, reward_id, store_id, stamps_added, 
          transaction_status, expires_at
        )
        VALUES ($1, $2, $3, $4, $5, 'pending', $6)
        RETURNING *
      `;
      const params = [
        transactionCode,
        userId,
        rewardId,
        storeId,
        stampsAdded,
        expiresAt,
      ];

      const result = await db.getOne(query, params);
      return result ? new StampTransaction(result) : null;
    } catch (error) {
      logger.error("Error creating stamp transaction:", error);
      throw error;
    }
  }

  // Find transaction by code
  static async findByCode(transactionCode) {
    try {
      const query = `
        SELECT st.*, 
               u.first_name as user_first_name, u.last_name as user_last_name,
               r.name as reward_name, r.description as reward_description,
               s.name as store_name,
               staff.first_name as staff_first_name, staff.last_name as staff_last_name
        FROM stamp_transactions st
        LEFT JOIN users u ON st.user_id = u.id
        LEFT JOIN rewards r ON st.reward_id = r.id
        LEFT JOIN stores s ON st.store_id = s.id
        LEFT JOIN users staff ON st.staff_id = staff.id
        WHERE st.transaction_code = $1
      `;
      const result = await db.getOne(query, [transactionCode]);
      return result ? new StampTransaction(result) : null;
    } catch (error) {
      logger.error("Error finding stamp transaction:", error);
      throw error;
    }
  }

  // Complete transaction (when staff scans)
  static async completeTransaction(transactionCode, staffId, storeId) {
    try {
      const query = `
        UPDATE stamp_transactions 
        SET staff_id = $1, 
            store_id = $2,
            transaction_status = 'completed',
            scanned_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE transaction_code = $3 
          AND transaction_status = 'pending'
          AND expires_at > CURRENT_TIMESTAMP
        RETURNING *
      `;
      const result = await db.getOne(query, [
        staffId,
        storeId,
        transactionCode,
      ]);
      return result ? new StampTransaction(result) : null;
    } catch (error) {
      logger.error("Error completing stamp transaction:", error);
      throw error;
    }
  }

  // Get all transactions for admin
  static async findAll(options = {}) {
    try {
      let query = `
        SELECT st.*, 
               u.first_name as user_first_name, u.last_name as user_last_name,
               r.name as reward_name, r.description as reward_description,
               s.name as store_name,
               staff.first_name as staff_first_name, staff.last_name as staff_last_name
        FROM stamp_transactions st
        LEFT JOIN users u ON st.user_id = u.id
        LEFT JOIN rewards r ON st.reward_id = r.id
        LEFT JOIN stores s ON st.store_id = s.id
        LEFT JOIN users staff ON st.staff_id = staff.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 1;

      // Add filters
      if (options.userId) {
        query += ` AND st.user_id = $${paramCount}`;
        params.push(options.userId);
        paramCount++;
      }

      if (options.rewardId) {
        query += ` AND st.reward_id = $${paramCount}`;
        params.push(options.rewardId);
        paramCount++;
      }

      if (options.storeId) {
        query += ` AND st.store_id = $${paramCount}`;
        params.push(options.storeId);
        paramCount++;
      }

      if (options.staffId) {
        query += ` AND st.staff_id = $${paramCount}`;
        params.push(options.staffId);
        paramCount++;
      }

      if (options.status) {
        query += ` AND st.transaction_status = $${paramCount}`;
        params.push(options.status);
        paramCount++;
      }

      if (options.dateFrom) {
        query += ` AND st.created_at >= $${paramCount}`;
        params.push(options.dateFrom);
        paramCount++;
      }

      if (options.dateTo) {
        query += ` AND st.created_at <= $${paramCount}`;
        params.push(options.dateTo);
        paramCount++;
      }

      // Add search
      if (options.search) {
        query += ` AND (
          st.transaction_code ILIKE $${paramCount} OR
          u.first_name ILIKE $${paramCount} OR
          u.last_name ILIKE $${paramCount} OR
          r.name ILIKE $${paramCount} OR
          s.name ILIKE $${paramCount}
        )`;
        params.push(`%${options.search}%`);
        paramCount++;
      }

      // Add ordering
      query += ` ORDER BY st.created_at DESC`;

      // Add pagination
      if (options.limit) {
        query += ` LIMIT $${paramCount}`;
        params.push(options.limit);
        paramCount++;
      }

      if (options.offset) {
        query += ` OFFSET $${paramCount}`;
        params.push(options.offset);
      }

      const results = await db.getMany(query, params);
      return results.map((result) => new StampTransaction(result));
    } catch (error) {
      logger.error("Error finding stamp transactions:", error);
      throw error;
    }
  }

  // Count transactions for pagination
  static async count(options = {}) {
    try {
      let query = `
        SELECT COUNT(*) as count
        FROM stamp_transactions st
        LEFT JOIN users u ON st.user_id = u.id
        LEFT JOIN rewards r ON st.reward_id = r.id
        LEFT JOIN stores s ON st.store_id = s.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 1;

      // Add same filters as findAll
      if (options.userId) {
        query += ` AND st.user_id = $${paramCount}`;
        params.push(options.userId);
        paramCount++;
      }

      if (options.rewardId) {
        query += ` AND st.reward_id = $${paramCount}`;
        params.push(options.rewardId);
        paramCount++;
      }

      if (options.storeId) {
        query += ` AND st.store_id = $${paramCount}`;
        params.push(options.storeId);
        paramCount++;
      }

      if (options.staffId) {
        query += ` AND st.staff_id = $${paramCount}`;
        params.push(options.staffId);
        paramCount++;
      }

      if (options.status) {
        query += ` AND st.transaction_status = $${paramCount}`;
        params.push(options.status);
        paramCount++;
      }

      if (options.dateFrom) {
        query += ` AND st.created_at >= $${paramCount}`;
        params.push(options.dateFrom);
        paramCount++;
      }

      if (options.dateTo) {
        query += ` AND st.created_at <= $${paramCount}`;
        params.push(options.dateTo);
        paramCount++;
      }

      if (options.search) {
        query += ` AND (
          st.transaction_code ILIKE $${paramCount} OR
          u.first_name ILIKE $${paramCount} OR
          u.last_name ILIKE $${paramCount} OR
          r.name ILIKE $${paramCount} OR
          s.name ILIKE $${paramCount}
        )`;
        params.push(`%${options.search}%`);
      }

      const result = await db.getOne(query, params);
      return parseInt(result.count);
    } catch (error) {
      logger.error("Error counting stamp transactions:", error);
      throw error;
    }
  }

  // Get user's transaction history
  static async findByUserId(userId, options = {}) {
    try {
      const query = `
        SELECT st.*, 
               r.name as reward_name, r.description as reward_description,
               s.name as store_name,
               staff.first_name as staff_first_name, staff.last_name as staff_last_name
        FROM stamp_transactions st
        LEFT JOIN rewards r ON st.reward_id = r.id
        LEFT JOIN stores s ON st.store_id = s.id
        LEFT JOIN users staff ON st.staff_id = staff.id
        WHERE st.user_id = $1
        ORDER BY st.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const limit = options.limit || 20;
      const offset = options.offset || 0;

      const results = await db.getMany(query, [userId, limit, offset]);
      return results.map((result) => new StampTransaction(result));
    } catch (error) {
      logger.error("Error finding user stamp transactions:", error);
      throw error;
    }
  }

  // Cancel transaction
  static async cancelTransaction(transactionCode) {
    try {
      const query = `
        UPDATE stamp_transactions 
        SET transaction_status = 'cancelled',
            updated_at = CURRENT_TIMESTAMP
        WHERE transaction_code = $1 
          AND transaction_status = 'pending'
        RETURNING *
      `;
      const result = await db.getOne(query, [transactionCode]);
      return result ? new StampTransaction(result) : null;
    } catch (error) {
      logger.error("Error cancelling stamp transaction:", error);
      throw error;
    }
  }

  // Clean up expired transactions
  static async cleanupExpired() {
    try {
      const query = `
        UPDATE stamp_transactions 
        SET transaction_status = 'expired',
            updated_at = CURRENT_TIMESTAMP
        WHERE transaction_status = 'pending' 
          AND expires_at < CURRENT_TIMESTAMP
      `;
      const result = await db.query(query);
      return result.rowCount;
    } catch (error) {
      logger.error("Error cleaning up expired transactions:", error);
      throw error;
    }
  }

  // Check if transaction is valid
  isValid() {
    return (
      this.transaction_status === "pending" &&
      new Date(this.expires_at) > new Date()
    );
  }

  // Get time until expiration
  getTimeUntilExpiration() {
    const now = new Date();
    const expiresAt = new Date(this.expires_at);
    return Math.max(0, expiresAt - now);
  }
}

module.exports = { StampTransaction };
