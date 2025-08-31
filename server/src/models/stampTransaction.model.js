const { db } = require("../config/database");
const { logger } = require("../utils/logger");
const crypto = require("crypto");

class StampTransaction {
  constructor(data) {
    this.id = data.id;
    this.tenant_id = data.tenant_id;
    this.stamp_card_id = data.stamp_card_id;
    this.stamps_added = data.stamps_added || 1;
    this.stamps_before = data.stamps_before || 0;
    this.stamps_after = data.stamps_after || 0;
    this.description = data.description;
    this.staff_user_id = data.staff_user_id;
    this.created_at = data.created_at || new Date();
  }

  // Create new stamp transaction
  static async create(tenantId, stampCardId, stampsAdded = 1, description = null, staffUserId = null) {
    try {
      const query = `
        INSERT INTO stamp_transactions (
          tenant_id, stamp_card_id, stamps_added, stamps_before, stamps_after, 
          description, staff_user_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const params = [
        tenantId,
        stampCardId,
        stampsAdded,
        0, // stamps_before - will be updated based on current progress
        stampsAdded, // stamps_after - will be updated based on current progress
        description,
        staffUserId,
      ];

      const result = await db.getOne(query, params);
      return result ? new StampTransaction(result) : null;
    } catch (error) {
      logger.error("Error creating stamp transaction:", error);
      throw error;
    }
  }

  // Get all transactions for admin
  static async findAll(options = {}) {
    try {
      const {
        tenantId,
        stampCardId,
        staffUserId,
        dateFrom,
        dateTo,
        search,
        limit = 20,
        offset = 0
      } = options;

      // Build WHERE conditions
      const conditions = [];
      const params = [];

      if (tenantId) {
        conditions.push(`st.tenant_id = $${params.length + 1}`);
        params.push(tenantId);
      }

      if (stampCardId) {
        conditions.push(`st.stamp_card_id = $${params.length + 1}`);
        params.push(stampCardId);
      }

      if (staffUserId) {
        conditions.push(`st.staff_user_id = $${params.length + 1}`);
        params.push(staffUserId);
      }

      if (dateFrom) {
        conditions.push(`st.created_at >= $${params.length + 1}`);
        params.push(dateFrom);
      }

      if (dateTo) {
        conditions.push(`st.created_at <= $${params.length + 1}`);
        params.push(dateTo);
      }

      if (search) {
        conditions.push(`(
          st.description ILIKE $${params.length + 1} OR
          st.id::text ILIKE $${params.length + 1}
        )`);
        params.push(`%${search}%`);
      }

      // Build final query
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      const query = `
        SELECT st.* 
        FROM stamp_transactions st
        ${whereClause}
        ORDER BY st.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      params.push(limit, offset);
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
      const {
        tenantId,
        stampCardId,
        staffUserId,
        dateFrom,
        dateTo,
        search
      } = options;

      // Build WHERE conditions (same as findAll)
      const conditions = [];
      const params = [];

      if (tenantId) {
        conditions.push(`st.tenant_id = $${params.length + 1}`);
        params.push(tenantId);
      }

      if (stampCardId) {
        conditions.push(`st.stamp_card_id = $${params.length + 1}`);
        params.push(stampCardId);
      }

      if (staffUserId) {
        conditions.push(`st.staff_user_id = $${params.length + 1}`);
        params.push(staffUserId);
      }

      if (dateFrom) {
        conditions.push(`st.created_at >= $${params.length + 1}`);
        params.push(dateFrom);
      }

      if (dateTo) {
        conditions.push(`st.created_at <= $${params.length + 1}`);
        params.push(dateTo);
      }

      if (search) {
        conditions.push(`(
          st.description ILIKE $${params.length + 1} OR
          st.id::text ILIKE $${params.length + 1}
        )`);
        params.push(`%${search}%`);
      }

      // Build final query
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      const query = `
        SELECT COUNT(*) as count
        FROM stamp_transactions st
        ${whereClause}
      `;

      const result = await db.getOne(query, params);
      return parseInt(result.count);
    } catch (error) {
      logger.error("Error counting stamp transactions:", error);
      throw error;
    }
  }

  // Get transactions by stamp card
  static async findByStampCardId(stampCardId, options = {}) {
    try {
      const query = `
        SELECT st.* 
        FROM stamp_transactions st
        WHERE st.stamp_card_id = $1
        ORDER BY st.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const limit = options.limit || 20;
      const offset = options.offset || 0;

      const results = await db.getMany(query, [stampCardId, limit, offset]);
      return results.map((result) => new StampTransaction(result));
    } catch (error) {
      logger.error("Error finding stamp card transactions:", error);
      throw error;
    }
  }
}

module.exports = { StampTransaction };
