const { db } = require("../config/database");
const { logger } = require("../utils/logger");

class StampCard {
  constructor(data) {
    this.id = data.id;
    this.tenant_id = data.tenant_id;
    this.customer_loyalty_id = data.customer_loyalty_id;
    this.card_name = data.card_name;
    this.total_stamps = data.total_stamps;
    this.current_stamps = data.current_stamps || 0;
    this.reward_description = data.reward_description;
    this.is_completed = data.is_completed || false;
    this.completed_at = data.completed_at;
    this.expires_at = data.expires_at;
    this.is_active = data.is_active !== false;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  static async create(stampCardData) {
    try {
      const query = `
        INSERT INTO stamp_cards (
          tenant_id, customer_loyalty_id, card_name, total_stamps,
          current_stamps, reward_description, expires_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const params = [
        stampCardData.tenant_id,
        stampCardData.customer_loyalty_id,
        stampCardData.card_name,
        stampCardData.total_stamps,
        stampCardData.current_stamps || 0,
        stampCardData.reward_description,
        stampCardData.expires_at,
      ];

      const result = await db.getOne(query, params);
      return new StampCard(result);
    } catch (error) {
      logger.error("Error creating stamp card:", error);
      throw error;
    }
  }

  static async findById(id, tenantId = null) {
    try {
      let query = `
        SELECT sc.*, cl.loyalty_number, u.first_name, u.last_name, u.email
        FROM stamp_cards sc
        INNER JOIN customer_loyalty cl ON sc.customer_loyalty_id = cl.id
        INNER JOIN users u ON cl.user_id = u.id
        WHERE sc.id = $1 AND sc.is_active = true
      `;
      const params = [id];

      if (tenantId) {
        query += ` AND sc.tenant_id = $2`;
        params.push(tenantId);
      }

      const result = await db.getOne(query, params);
      return result ? new StampCard(result) : null;
    } catch (error) {
      logger.error("Error finding stamp card by ID:", error);
      throw error;
    }
  }

  static async findByCustomerLoyaltyId(customerLoyaltyId, tenantId) {
    try {
      const query = `
        SELECT sc.*, cl.loyalty_number, u.first_name, u.last_name, u.email
        FROM stamp_cards sc
        INNER JOIN customer_loyalty cl ON sc.customer_loyalty_id = cl.id
        INNER JOIN users u ON cl.user_id = u.id
        WHERE sc.customer_loyalty_id = $1 AND sc.tenant_id = $2 AND sc.is_active = true
        ORDER BY sc.created_at DESC
      `;

      const results = await db.getMany(query, [customerLoyaltyId, tenantId]);
      return results.map((row) => new StampCard(row));
    } catch (error) {
      logger.error("Error finding stamp cards by customer loyalty ID:", error);
      throw error;
    }
  }

  static async findActiveByCustomerLoyaltyId(customerLoyaltyId, tenantId) {
    try {
      const query = `
        SELECT sc.*, cl.loyalty_number, u.first_name, u.last_name, u.email
        FROM stamp_cards sc
        INNER JOIN customer_loyalty cl ON sc.customer_loyalty_id = cl.id
        INNER JOIN users u ON cl.user_id = u.id
        WHERE sc.customer_loyalty_id = $1 
          AND sc.tenant_id = $2 
          AND sc.is_active = true 
          AND sc.is_completed = false
          AND (sc.expires_at IS NULL OR sc.expires_at > CURRENT_TIMESTAMP)
        ORDER BY sc.created_at DESC
      `;

      const results = await db.getMany(query, [customerLoyaltyId, tenantId]);
      return results.map((row) => new StampCard(row));
    } catch (error) {
      logger.error("Error finding active stamp cards:", error);
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
        UPDATE stamp_cards 
        SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
      `;

      if (tenantId) {
        query += ` AND tenant_id = $${paramCount + 1}`;
        values.push(tenantId);
      }

      query += ` RETURNING *`;

      const result = await db.getOne(query, values);
      return result ? new StampCard(result) : null;
    } catch (error) {
      logger.error("Error updating stamp card:", error);
      throw error;
    }
  }

  static async addStamp(
    stampCardId,
    stampsToAdd,
    reason,
    storeId,
    processedBy,
    tenantId
  ) {
    try {
      const client = await db.getClient();

      try {
        await client.query("BEGIN");

        // Get current stamp card
        const cardQuery = `
          SELECT * FROM stamp_cards 
          WHERE id = $1 AND tenant_id = $2 AND is_active = true
          FOR UPDATE
        `;
        const cardResult = await client.query(cardQuery, [
          stampCardId,
          tenantId,
        ]);

        if (!cardResult.rows[0]) {
          throw new Error("Stamp card not found");
        }

        const stampCard = cardResult.rows[0];

        if (stampCard.is_completed) {
          throw new Error("Stamp card is already completed");
        }

        if (
          stampCard.expires_at &&
          new Date() > new Date(stampCard.expires_at)
        ) {
          throw new Error("Stamp card has expired");
        }

        const newStamps = stampCard.current_stamps + stampsToAdd;
        const isCompleted = newStamps >= stampCard.total_stamps;

        // Update stamp card
        const updateQuery = `
          UPDATE stamp_cards 
          SET 
            current_stamps = $1,
            is_completed = $2,
            completed_at = $3,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $4 AND tenant_id = $5
          RETURNING *
        `;

        const completedAt = isCompleted ? new Date() : null;
        const updateResult = await client.query(updateQuery, [
          newStamps,
          isCompleted,
          completedAt,
          stampCardId,
          tenantId,
        ]);

        // Record stamp transaction
        const transactionQuery = `
          INSERT INTO stamp_transactions (
            tenant_id, stamp_card_id, stamps_added, stamps_before, 
            stamps_after, reason, store_id, added_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `;

        await client.query(transactionQuery, [
          tenantId,
          stampCardId,
          stampsToAdd,
          stampCard.current_stamps,
          newStamps,
          reason,
          storeId,
          processedBy,
        ]);

        await client.query("COMMIT");
        return new StampCard(updateResult.rows[0]);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error("Error adding stamp:", error);
      throw error;
    }
  }

  static async completeCard(
    stampCardId,
    rewardDescription,
    storeId,
    processedBy,
    tenantId
  ) {
    try {
      const client = await db.getClient();

      try {
        await client.query("BEGIN");

        // Get current stamp card
        const cardQuery = `
          SELECT * FROM stamp_cards 
          WHERE id = $1 AND tenant_id = $2 AND is_active = true
          FOR UPDATE
        `;
        const cardResult = await client.query(cardQuery, [
          stampCardId,
          tenantId,
        ]);

        if (!cardResult.rows[0]) {
          throw new Error("Stamp card not found");
        }

        const stampCard = cardResult.rows[0];

        if (stampCard.is_completed) {
          throw new Error("Stamp card is already completed");
        }

        if (stampCard.current_stamps < stampCard.total_stamps) {
          throw new Error("Stamp card is not full");
        }

        // Update stamp card as completed
        const updateQuery = `
          UPDATE stamp_cards 
          SET 
            is_completed = true,
            completed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1 AND tenant_id = $2
          RETURNING *
        `;

        const updateResult = await client.query(updateQuery, [
          stampCardId,
          tenantId,
        ]);

        // Record completion transaction
        const transactionQuery = `
          INSERT INTO stamp_transactions (
            tenant_id, stamp_card_id, stamps_added, stamps_before, 
            stamps_after, reason, store_id, added_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `;

        await client.query(transactionQuery, [
          tenantId,
          stampCardId,
          0,
          stampCard.current_stamps,
          stampCard.current_stamps,
          `Card completed: ${rewardDescription}`,
          storeId,
          processedBy,
        ]);

        await client.query("COMMIT");
        return new StampCard(updateResult.rows[0]);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error("Error completing stamp card:", error);
      throw error;
    }
  }

  static async getStampHistory(stampCardId, options = {}, tenantId) {
    try {
      let query = `
        SELECT st.*, s.name as store_name, u.first_name as added_by_name
        FROM stamp_transactions st
        LEFT JOIN stores s ON st.store_id = s.id
        LEFT JOIN users u ON st.added_by = u.id
        WHERE st.stamp_card_id = $1 AND st.tenant_id = $2
      `;
      const values = [stampCardId, tenantId];
      let paramCount = 3;

      if (options.start_date) {
        query += ` AND st.created_at >= $${paramCount}`;
        values.push(options.start_date);
        paramCount++;
      }

      if (options.end_date) {
        query += ` AND st.created_at <= $${paramCount}`;
        values.push(options.end_date);
        paramCount++;
      }

      query += " ORDER BY st.created_at DESC";

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
      logger.error("Error getting stamp history:", error);
      throw error;
    }
  }

  static async findAll(options = {}, tenantId = null) {
    try {
      let query = `
        SELECT sc.*, cl.loyalty_number, u.first_name, u.last_name, u.email
        FROM stamp_cards sc
        INNER JOIN customer_loyalty cl ON sc.customer_loyalty_id = cl.id
        INNER JOIN users u ON cl.user_id = u.id
        WHERE sc.is_active = true
      `;
      const values = [];
      let paramCount = 1;

      if (tenantId) {
        query += ` AND sc.tenant_id = $${paramCount}`;
        values.push(tenantId);
        paramCount++;
      }

      if (options.is_completed !== undefined) {
        query += ` AND sc.is_completed = $${paramCount}`;
        values.push(options.is_completed);
        paramCount++;
      }

      if (options.search) {
        query += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR cl.loyalty_number ILIKE $${paramCount})`;
        values.push(`%${options.search}%`);
        paramCount++;
      }

      if (options.expired === true) {
        query += ` AND sc.expires_at < CURRENT_TIMESTAMP`;
      } else if (options.expired === false) {
        query += ` AND (sc.expires_at IS NULL OR sc.expires_at >= CURRENT_TIMESTAMP)`;
      }

      query += " ORDER BY sc.created_at DESC";

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
      return results.map((row) => new StampCard(row));
    } catch (error) {
      logger.error("Error finding all stamp cards:", error);
      throw error;
    }
  }

  static async getStampCardStats(tenantId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_cards,
          COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_cards,
          COUNT(CASE WHEN is_completed = false THEN 1 END) as active_cards,
          COUNT(CASE WHEN expires_at < CURRENT_TIMESTAMP THEN 1 END) as expired_cards,
          AVG(current_stamps) as avg_stamps,
          SUM(current_stamps) as total_stamps
        FROM stamp_cards 
        WHERE tenant_id = $1 AND is_active = true
      `;

      const result = await db.getOne(query, [tenantId]);
      return result;
    } catch (error) {
      logger.error("Error getting stamp card stats:", error);
      throw error;
    }
  }

  static async getStoreStampStats(
    storeId,
    tenantId,
    startDate = null,
    endDate = null
  ) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_stamps_added,
          COUNT(DISTINCT st.stamp_card_id) as unique_cards,
          COUNT(DISTINCT st.added_by) as unique_staff
        FROM stamp_transactions st
        WHERE st.store_id = $1 AND st.tenant_id = $2
      `;
      const values = [storeId, tenantId];
      let paramCount = 3;

      if (startDate) {
        query += ` AND st.created_at >= $${paramCount}`;
        values.push(startDate);
        paramCount++;
      }

      if (endDate) {
        query += ` AND st.created_at <= $${paramCount}`;
        values.push(endDate);
        paramCount++;
      }

      const result = await db.getOne(query, values);
      return result;
    } catch (error) {
      logger.error("Error getting store stamp stats:", error);
      throw error;
    }
  }

  static async getStaffStampStats(
    staffId,
    tenantId,
    startDate = null,
    endDate = null
  ) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_stamps_added,
          COUNT(DISTINCT st.stamp_card_id) as unique_cards,
          COUNT(DISTINCT st.store_id) as unique_stores
        FROM stamp_transactions st
        WHERE st.added_by = $1 AND st.tenant_id = $2
      `;
      const values = [staffId, tenantId];
      let paramCount = 3;

      if (startDate) {
        query += ` AND st.created_at >= $${paramCount}`;
        values.push(startDate);
        paramCount++;
      }

      if (endDate) {
        query += ` AND st.created_at <= $${paramCount}`;
        values.push(endDate);
        paramCount++;
      }

      const result = await db.getOne(query, values);
      return result;
    } catch (error) {
      logger.error("Error getting staff stamp stats:", error);
      throw error;
    }
  }

  // Check if stamp card is full
  isFull() {
    return this.current_stamps >= this.total_stamps;
  }

  // Check if stamp card is expired
  isExpired() {
    return this.expires_at && new Date() > new Date(this.expires_at);
  }

  // Get progress percentage
  getProgressPercentage() {
    return Math.min((this.current_stamps / this.total_stamps) * 100, 100);
  }

  // Get remaining stamps needed
  getRemainingStamps() {
    return Math.max(this.total_stamps - this.current_stamps, 0);
  }

  toJSON() {
    return {
      id: this.id,
      tenant_id: this.tenant_id,
      customer_loyalty_id: this.customer_loyalty_id,
      card_name: this.card_name,
      total_stamps: this.total_stamps,
      current_stamps: this.current_stamps,
      reward_description: this.reward_description,
      is_completed: this.is_completed,
      completed_at: this.completed_at,
      expires_at: this.expires_at,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at,
      progress_percentage: this.getProgressPercentage(),
      remaining_stamps: this.getRemainingStamps(),
      is_full: this.isFull(),
      is_expired: this.isExpired(),
    };
  }

  async save() {
    if (this.id) {
      return await StampCard.update(this.id, this, this.tenant_id);
    } else {
      const newStampCard = await StampCard.create(this);
      this.id = newStampCard.id;
      return newStampCard;
    }
  }
}

module.exports = StampCard;
