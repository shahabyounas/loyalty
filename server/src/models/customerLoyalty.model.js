const { db } = require("../config/database");
const { logger } = require("../utils/logger");

class CustomerLoyalty {
  constructor(data) {
    this.id = data.id;
    this.tenant_id = data.tenant_id;
    this.user_id = data.user_id;
    this.loyalty_number = data.loyalty_number;
    this.current_points = data.current_points || 0;
    this.total_points_earned = data.total_points_earned || 0;
    this.total_points_redeemed = data.total_points_redeemed || 0;
    this.current_level = data.current_level || 1;
    this.level_name = data.level_name || "Bronze";
    this.join_date = data.join_date || new Date();
    this.last_activity_at = data.last_activity_at || new Date();
    // Note: customer_loyalty table doesn't have is_active column
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  static async create(loyaltyData) {
    try {
      const query = `
        INSERT INTO customer_loyalty (
          tenant_id, user_id, loyalty_number, current_points, 
          total_points_earned, total_points_redeemed, current_level, level_name
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const params = [
        loyaltyData.tenant_id,
        loyaltyData.user_id,
        loyaltyData.loyalty_number,
        loyaltyData.current_points || 0,
        loyaltyData.total_points_earned || 0,
        loyaltyData.total_points_redeemed || 0,
        loyaltyData.current_level || 1,
        loyaltyData.level_name || "Bronze",
      ];

      const result = await db.getOne(query, params);
      return new CustomerLoyalty(result);
    } catch (error) {
      logger.error("Error creating customer loyalty:", error);
      throw error;
    }
  }

  static async findById(id, tenantId = null) {
    try {
      let query = `
        SELECT cl.*, u.first_name, u.last_name, u.email, u.phone
        FROM customer_loyalty cl
        INNER JOIN users u ON cl.user_id = u.id
        WHERE cl.id = $1
      `;
      const params = [id];

      if (tenantId) {
        query += ` AND cl.tenant_id = $2`;
        params.push(tenantId);
      }

      const result = await db.getOne(query, params);
      return result ? new CustomerLoyalty(result) : null;
    } catch (error) {
      logger.error("Error finding customer loyalty by ID:", error);
      throw error;
    }
  }

  static async findByUserId(userId, tenantId) {
    try {
      const query = `
        SELECT cl.*, u.first_name, u.last_name, u.email, u.phone
        FROM customer_loyalty cl
        INNER JOIN users u ON cl.user_id = u.id
        WHERE cl.user_id = $1 AND cl.tenant_id = $2
      `;

      const result = await db.getOne(query, [userId, tenantId]);
      return result ? new CustomerLoyalty(result) : null;
    } catch (error) {
      logger.error("Error finding customer loyalty by user ID:", error);
      throw error;
    }
  }

  static async findByLoyaltyNumber(loyaltyNumber, tenantId) {
    try {
      const query = `
        SELECT cl.*, u.first_name, u.last_name, u.email, u.phone
        FROM customer_loyalty cl
        INNER JOIN users u ON cl.user_id = u.id
        WHERE cl.loyalty_number = $1 AND cl.tenant_id = $2
      `;

      const result = await db.getOne(query, [loyaltyNumber, tenantId]);
      return result ? new CustomerLoyalty(result) : null;
    } catch (error) {
      logger.error("Error finding customer loyalty by number:", error);
      throw error;
    }
  }

  static async update(id, updateData, tenantId = null) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updateData).forEach((key) => {
        if (key !== "id" && key !== "created_at" && key !== "tenant_id") {
          fields.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
          paramCount++;
        }
      });

      if (fields.length === 0) {
        throw new Error("No valid fields to update");
      }

      values.push(id);
      let query = `
        UPDATE customer_loyalty 
        SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
      `;

      if (tenantId) {
        query += ` AND tenant_id = $${paramCount + 1}`;
        values.push(tenantId);
      }

      query += ` RETURNING *`;

      const result = await db.getOne(query, values);
      return result ? new CustomerLoyalty(result) : null;
    } catch (error) {
      logger.error("Error updating customer loyalty:", error);
      throw error;
    }
  }

  static async addPoints(
    loyaltyId,
    points,
    reason,
    storeId = null,
    processedBy = null,
    tenantId
  ) {
    try {
      const client = await db.getClient();

      try {
        await client.query("BEGIN");

        // Get current loyalty account
        const loyaltyQuery = `
          SELECT * FROM customer_loyalty 
          WHERE id = $1 AND tenant_id = $2
          FOR UPDATE
        `;
        const loyaltyResult = await client.query(loyaltyQuery, [
          loyaltyId,
          tenantId,
        ]);

        if (!loyaltyResult.rows[0]) {
          throw new Error("Loyalty account not found");
        }

        const loyalty = loyaltyResult.rows[0];
        const newPoints = loyalty.current_points + points;
        const newTotalEarned = loyalty.total_points_earned + points;

        // Update loyalty account
        const updateQuery = `
          UPDATE customer_loyalty 
          SET 
            current_points = $1,
            total_points_earned = $2,
            last_activity_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $3 AND tenant_id = $4
          RETURNING *
        `;

        const updateResult = await client.query(updateQuery, [
          newPoints,
          newTotalEarned,
          loyaltyId,
          tenantId,
        ]);

        // Record transaction
        const transactionQuery = `
          INSERT INTO loyalty_transactions (
            tenant_id, customer_loyalty_id, transaction_type, points_change,
            points_before, points_after, description, store_id, processed_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `;

        await client.query(transactionQuery, [
          tenantId,
          loyaltyId,
          "earn",
          points,
          loyalty.current_points,
          newPoints,
          reason,
          storeId,
          processedBy,
        ]);

        await client.query("COMMIT");
        return new CustomerLoyalty(updateResult.rows[0]);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error("Error adding points:", error);
      throw error;
    }
  }

  static async redeemPoints(
    loyaltyId,
    points,
    reason,
    storeId = null,
    processedBy = null,
    tenantId
  ) {
    try {
      const client = await db.getClient();

      try {
        await client.query("BEGIN");

        // Get current loyalty account
        const loyaltyQuery = `
          SELECT * FROM customer_loyalty 
          WHERE id = $1 AND tenant_id = $2
          FOR UPDATE
        `;
        const loyaltyResult = await client.query(loyaltyQuery, [
          loyaltyId,
          tenantId,
        ]);

        if (!loyaltyResult.rows[0]) {
          throw new Error("Loyalty account not found");
        }

        const loyalty = loyaltyResult.rows[0];

        if (loyalty.current_points < points) {
          throw new Error("Insufficient points");
        }

        const newPoints = loyalty.current_points - points;
        const newTotalRedeemed = loyalty.total_points_redeemed + points;

        // Update loyalty account
        const updateQuery = `
          UPDATE customer_loyalty 
          SET 
            current_points = $1,
            total_points_redeemed = $2,
            last_activity_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $3 AND tenant_id = $4
          RETURNING *
        `;

        const updateResult = await client.query(updateQuery, [
          newPoints,
          newTotalRedeemed,
          loyaltyId,
          tenantId,
        ]);

        // Record transaction
        const transactionQuery = `
          INSERT INTO loyalty_transactions (
            tenant_id, customer_loyalty_id, transaction_type, points_change,
            points_before, points_after, description, store_id, processed_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `;

        await client.query(transactionQuery, [
          tenantId,
          loyaltyId,
          "redeem",
          -points,
          loyalty.current_points,
          newPoints,
          reason,
          storeId,
          processedBy,
        ]);

        await client.query("COMMIT");
        return new CustomerLoyalty(updateResult.rows[0]);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error("Error redeeming points:", error);
      throw error;
    }
  }

  static async updateLevel(loyaltyId, newLevel, levelName, tenantId) {
    try {
      const query = `
        UPDATE customer_loyalty 
        SET 
          current_level = $1,
          level_name = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3 AND tenant_id = $4
        RETURNING *
      `;

      const result = await db.getOne(query, [
        newLevel,
        levelName,
        loyaltyId,
        tenantId,
      ]);
      return result ? new CustomerLoyalty(result) : null;
    } catch (error) {
      logger.error("Error updating loyalty level:", error);
      throw error;
    }
  }

  static async getTransactionHistory(loyaltyId, options = {}, tenantId) {
    try {
      let query = `
        SELECT lt.*, s.name as store_name, u.first_name as processed_by_name
        FROM loyalty_transactions lt
        LEFT JOIN stores s ON lt.store_id = s.id
        LEFT JOIN users u ON lt.processed_by = u.id
        WHERE lt.customer_loyalty_id = $1 AND lt.tenant_id = $2
      `;
      const values = [loyaltyId, tenantId];
      let paramCount = 3;

      if (options.transaction_type) {
        query += ` AND lt.transaction_type = $${paramCount}`;
        values.push(options.transaction_type);
        paramCount++;
      }

      if (options.start_date) {
        query += ` AND lt.created_at >= $${paramCount}`;
        values.push(options.start_date);
        paramCount++;
      }

      if (options.end_date) {
        query += ` AND lt.created_at <= $${paramCount}`;
        values.push(options.end_date);
        paramCount++;
      }

      query += " ORDER BY lt.created_at DESC";

      if (options.limit) {
        query += ` LIMIT $${paramCount}`;
        values.push(options.limit);
        paramCount++;
      }

      if (options.offset) {
        query += ` OFFSET $${paramCount}`;
        values.push(options.offset);
      }

      const results = await db.getMany(query, values);
      return results;
    } catch (error) {
      logger.error("Error getting transaction history:", error);
      throw error;
    }
  }

  static async findAll(options = {}, tenantId = null) {
    try {
      let query = `
        SELECT cl.*, u.first_name, u.last_name, u.email, u.phone
        FROM customer_loyalty cl
        INNER JOIN users u ON cl.user_id = u.id
        WHERE 1=1
      `;
      const values = [];
      let paramCount = 1;

      if (tenantId) {
        query += ` AND cl.tenant_id = $${paramCount}`;
        values.push(tenantId);
        paramCount++;
      }

      if (options.level) {
        query += ` AND cl.current_level = $${paramCount}`;
        values.push(options.level);
        paramCount++;
      }

      if (options.search) {
        query += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR cl.loyalty_number ILIKE $${paramCount})`;
        values.push(`%${options.search}%`);
        paramCount++;
      }

      if (options.min_points) {
        query += ` AND cl.current_points >= $${paramCount}`;
        values.push(options.min_points);
        paramCount++;
      }

      query += " ORDER BY cl.last_activity_at DESC";

      if (options.limit) {
        query += ` LIMIT $${paramCount}`;
        values.push(options.limit);
        paramCount++;
      }

      if (options.offset) {
        query += ` OFFSET $${paramCount}`;
        values.push(options.offset);
      }

      const results = await db.getMany(query, values);
      return results.map((row) => new CustomerLoyalty(row));
    } catch (error) {
      logger.error("Error finding all customer loyalty:", error);
      throw error;
    }
  }

  static async getLoyaltyStats(tenantId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_customers,
          COUNT(*) as total_customers,
          AVG(current_points) as avg_points,
          SUM(current_points) as total_points,
          SUM(total_points_earned) as total_earned,
          SUM(total_points_redeemed) as total_redeemed,
          COUNT(CASE WHEN current_level >= 5 THEN 1 END) as vip_customers
        FROM customer_loyalty 
        WHERE tenant_id = $1
      `;

      const result = await db.getOne(query, [tenantId]);
      return result;
    } catch (error) {
      logger.error("Error getting loyalty stats:", error);
      throw error;
    }
  }

  static async generateLoyaltyNumber(tenantId) {
    try {
      const prefix = "LV";
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      const loyaltyNumber = `${prefix}${timestamp}${random}`;

      // Check if number already exists
      const existing = await this.findByLoyaltyNumber(loyaltyNumber, tenantId);
      if (existing) {
        return await this.generateLoyaltyNumber(tenantId); // Recursive call for new number
      }

      return loyaltyNumber;
    } catch (error) {
      logger.error("Error generating loyalty number:", error);
      throw error;
    }
  }

  toJSON() {
    return {
      id: this.id,
      tenant_id: this.tenant_id,
      user_id: this.user_id,
      loyalty_number: this.loyalty_number,
      current_points: this.current_points,
      total_points_earned: this.total_points_earned,
      total_points_redeemed: this.total_points_redeemed,
      current_level: this.current_level,
      level_name: this.level_name,
      join_date: this.join_date,
      last_activity_at: this.last_activity_at,
      // Note: customer_loyalty table doesn't have is_active column
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  async save() {
    if (this.id) {
      return await CustomerLoyalty.update(this.id, this, this.tenant_id);
    } else {
      const newLoyalty = await CustomerLoyalty.create(this);
      this.id = newLoyalty.id;
      return newLoyalty;
    }
  }
}

module.exports = CustomerLoyalty;
