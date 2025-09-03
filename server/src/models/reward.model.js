const { db } = require("../config/database");
const { logger } = require("../utils/logger");

class Reward {
  constructor(data) {
    // Helper function to parse numeric values from PostgreSQL
    const parseNumeric = (value) => {
      if (value === null || value === undefined) return null;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    };

    this.id = data.id;
    this.tenant_id = data.tenant_id;
    this.name = data.name;
    this.description = data.description;
    this.points_cost = data.points_cost;  // These are required Stamps to redeem
    this.discount_amount = parseNumeric(data.discount_amount);
    this.discount_percentage = parseNumeric(data.discount_percentage);
    this.reward_type = data.reward_type || "discount";
    this.is_active = data.is_active !== false;
    this.start_date = data.start_date;
    this.end_date = data.end_date;
    this.valid_until = data.valid_until;
    this.max_redemptions = data.max_redemptions;
    this.current_redemptions = data.current_redemptions || 0;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  static async create(rewardData) {
    try {
      const query = `
        INSERT INTO rewards (
          tenant_id, name, description, points_cost, discount_amount,
          discount_percentage, reward_type, valid_from, valid_until, max_redemptions
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      const params = [
        rewardData.tenant_id,
        rewardData.name,
        rewardData.description,
        rewardData.points_cost,
        rewardData.discount_amount,
        rewardData.discount_percentage,
        rewardData.reward_type || "discount",
        rewardData.valid_from,
        rewardData.valid_until,
        rewardData.max_redemptions,
      ];

      const result = await db.getOne(query, params);

      return new Reward(result);
    } catch (error) {
      logger.error("Error creating reward:", error);
      throw error;
    }
  }

  static async findById(id, tenantId = null) {
    try {
      let query = `
        SELECT * FROM rewards 
        WHERE id = $1
      `;
      const params = [id];

      if (tenantId) {
        query += ` AND tenant_id = $2`;
        params.push(tenantId);
      }

      const result = await db.getOne(query, params);

      return result ? new Reward(result) : null;
    } catch (error) {
      logger.error("Error finding reward by ID:", error);
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

      // Add the ID parameter
      values.push(id);
      let query = `
        UPDATE rewards 
        SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
      `;

      // Add tenant_id condition if provided
      if (tenantId) {
        paramCount++;
        query += ` AND tenant_id = $${paramCount}`;
        values.push(tenantId);
      }

      query += ` RETURNING *`;

      // Use query method directly for UPDATE with RETURNING
      const result = await db.query(query, values);

      if (result.rowCount === 0) {
        return null;
      }

      return result.rows[0] ? new Reward(result.rows[0]) : null;
    } catch (error) {
      logger.error("Error updating reward:", error);
      throw error;
    }
  }
  // The delete method below only accepts the reward id and updates is_active to false for that id.
  static async delete(id) {
    try {
      const query = `
        UPDATE rewards 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id
      `;
      const params = [id];
      const result = await db.getOne(query, params);
      return result !== null;
    } catch (error) {
      logger.error("Error deleting reward:", error);
      throw error;
    }
  }
  // static async delete(id, tenantId = null) {
  //   try {
  //     let query = `
  //       UPDATE rewards
  //       SET is_active = false, updated_at = CURRENT_TIMESTAMP
  //       WHERE id = $1
  //     `;
  //     const params = [id];

  //     // if (tenantId) {
  //     //   query += ` AND tenant_id = $2`;
  //     //   params.push(tenantId);
  //     // }

  //     query += ` RETURNING id`;

  //     const result = await db.getOne(query);
  //     console.log("result", result);
  //     return result !== null;
  //   } catch (error) {
  //     logger.error("Error deleting reward:", error);
  //     throw error;
  //   }
  // }

  static async findAll(options = {}, tenantId = null) {
    try {
      let query = "SELECT * FROM rewards WHERE is_active = true";
      const values = [];
      let paramCount = 1;

      // if (tenantId) {
      //   query += ` AND tenant_id = $${paramCount}`;
      //   values.push(tenantId);
      //   paramCount++;
      // }

      const results = await db.getMany(query, values);
      return results.map((row) => new Reward(row));
    } catch (error) {
      logger.error("Error finding all rewards:", error);
      throw error;
    }
  }

  static async getAvailableRewards(customerPoints, tenantId) {
    try {
      const query = `
        SELECT * FROM rewards 
        WHERE tenant_id = $1 
          AND is_active = true
          AND points_cost <= $2
          AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)
          AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP)
          AND (max_redemptions IS NULL OR current_redemptions < max_redemptions)
        ORDER BY points_cost ASC
      `;

      const results = await db.getMany(query, [tenantId, customerPoints]);
      return results.map((row) => new Reward(row));
    } catch (error) {
      logger.error("Error getting available rewards:", error);
      throw error;
    }
  }

  static async redeemReward(
    rewardId,
    customerLoyaltyId,
    storeId,
    processedBy,
    tenantId
  ) {
    try {
      const client = await db.getClient();

      try {
        await client.query("BEGIN");

        // Get reward details
        const rewardQuery = `
          SELECT * FROM rewards 
          WHERE id = $1 AND tenant_id = $2 AND is_active = true
          FOR UPDATE
        `;
        const rewardResult = await client.query(rewardQuery, [
          rewardId,
          tenantId,
        ]);

        if (!rewardResult.rows[0]) {
          throw new Error("Reward not found");
        }

        const reward = rewardResult.rows[0];

        // Check if reward is available
        if (reward.start_date && new Date() < new Date(reward.start_date)) {
          throw new Error("Reward not yet available");
        }

        if (reward.end_date && new Date() > new Date(reward.end_date)) {
          throw new Error("Reward has expired");
        }

        if (
          reward.max_redemptions &&
          reward.current_redemptions >= reward.max_redemptions
        ) {
          throw new Error("Reward redemption limit reached");
        }

        // Get customer loyalty account
        const loyaltyQuery = `
          SELECT * FROM customer_loyalty 
          WHERE id = $1 AND tenant_id = $2 AND is_active = true
          FOR UPDATE
        `;
        const loyaltyResult = await client.query(loyaltyQuery, [
          customerLoyaltyId,
          tenantId,
        ]);

        if (!loyaltyResult.rows[0]) {
          throw new Error("Customer loyalty account not found");
        }

        const loyalty = loyaltyResult.rows[0];

        if (loyalty.current_points < reward.points_cost) {
          throw new Error("Insufficient points");
        }

        // Update reward redemption count
        const updateRewardQuery = `
          UPDATE rewards 
          SET current_redemptions = current_redemptions + 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1 AND tenant_id = $2
          RETURNING *
        `;

        await client.query(updateRewardQuery, [rewardId, tenantId]);

        // Deduct points from customer
        const newPoints = loyalty.current_points - reward.points_cost;
        const newTotalRedeemed =
          loyalty.total_points_redeemed + reward.points_cost;

        const updateLoyaltyQuery = `
          UPDATE customer_loyalty 
          SET 
            current_points = $1,
            total_points_redeemed = $2,
            last_activity_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $3 AND tenant_id = $4
          RETURNING *
        `;

        await client.query(updateLoyaltyQuery, [
          newPoints,
          newTotalRedeemed,
          customerLoyaltyId,
          tenantId,
        ]);

        // Record loyalty transaction
        const loyaltyTransactionQuery = `
          INSERT INTO loyalty_transactions (
            tenant_id, customer_loyalty_id, transaction_type, points_change,
            points_before, points_after, description, store_id, processed_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `;

        const loyaltyTransaction = await client.query(loyaltyTransactionQuery, [
          tenantId,
          customerLoyaltyId,
          "redeem",
          -reward.points_cost,
          loyalty.current_points,
          newPoints,
          `Redeemed: ${reward.name}`,
          storeId,
          processedBy,
        ]);

        // Create customer reward record
        const customerRewardQuery = `
          INSERT INTO customer_rewards (
            tenant_id, customer_loyalty_id, reward_id, status, used_at_store_id, used_by_staff_id
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;

        const customerReward = await client.query(customerRewardQuery, [
          tenantId,
          customerLoyaltyId,
          rewardId,
          "active",
          storeId,
          processedBy,
        ]);

        await client.query("COMMIT");

        return {
          reward: new Reward(rewardResult.rows[0]),
          loyaltyTransaction: loyaltyTransaction.rows[0],
          customerReward: customerReward.rows[0],
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error("Error redeeming reward:", error);
      throw error;
    }
  }

  static async getRewardStats(tenantId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_rewards,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_rewards,
          COUNT(CASE WHEN reward_type = 'discount' THEN 1 END) as discount_rewards,
          COUNT(CASE WHEN reward_type = 'free_item' THEN 1 END) as free_item_rewards,
          COUNT(CASE WHEN reward_type = 'cashback' THEN 1 END) as cashback_rewards,
          AVG(points_cost) as avg_points_cost,
          SUM(current_redemptions) as total_redemptions
        FROM rewards 
        WHERE tenant_id = $1
      `;

      const result = await db.getOne(query, [tenantId]);
      return result;
    } catch (error) {
      logger.error("Error getting reward stats:", error);
      throw error;
    }
  }

  static async getPopularRewards(tenantId, limit = 10) {
    try {
      const query = `
        SELECT r.*, COUNT(cr.id) as redemption_count
        FROM rewards r
        LEFT JOIN customer_rewards cr ON r.id = cr.reward_id
        WHERE r.tenant_id = $1 AND r.is_active = true
        GROUP BY r.id
        ORDER BY redemption_count DESC
        LIMIT $2
      `;

      const results = await db.getMany(query, [tenantId, limit]);
      return results.map((row) => new Reward(row));
    } catch (error) {
      logger.error("Error getting popular rewards:", error);
      throw error;
    }
  }

  static async count(options = {}, tenantId = null) {
    try {
      let query =
        "SELECT COUNT(*) as count FROM rewards WHERE is_active = true";
      const values = [];
      let paramCount = 1;

      if (tenantId) {
        query += ` AND tenant_id = $${paramCount}`;
        values.push(tenantId);
        paramCount++;
      }

      if (options.reward_type) {
        query += ` AND reward_type = $${paramCount}`;
        values.push(options.reward_type);
        paramCount++;
      }

      if (options.search) {
        query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
        values.push(`%${options.search}%`);
        paramCount++;
      }

      if (options.max_points) {
        query += ` AND points_cost <= $${paramCount}`;
        values.push(options.max_points);
        paramCount++;
      }

      if (options.available === true) {
        query += ` AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)`;
        query += ` AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP)`;
        query += ` AND (max_redemptions IS NULL OR current_redemptions < max_redemptions)`;
      }

      const result = await db.getOne(query, values);
      return parseInt(result.count);
    } catch (error) {
      logger.error("Error counting rewards:", error);
      throw error;
    }
  }

  // Check if reward is available for redemption
  isAvailable() {
    const now = new Date();

    if (this.start_date && now < new Date(this.start_date)) {
      return false;
    }

    if (this.end_date && now > new Date(this.end_date)) {
      return false;
    }

    if (
      this.max_redemptions &&
      this.current_redemptions >= this.max_redemptions
    ) {
      return false;
    }

    return this.is_active;
  }

  // Get reward value description
  getValueDescription() {
    if (this.reward_type === "discount") {
      if (this.discount_amount) {
        return `£${this.discount_amount.toFixed(2)} off`;
      } else if (this.discount_percentage) {
        return `${this.discount_percentage}% off`;
      }
    } else if (this.reward_type === "free_item") {
      return "Free item";
    } else if (this.reward_type === "cashback") {
      return `£${this.discount_amount.toFixed(2)} cashback`;
    }

    return this.description;
  }

  toJSON() {
    return {
      id: this.id,
      tenant_id: this.tenant_id,
      name: this.name,
      description: this.description,
      points_cost: this.points_cost,
      discount_amount: this.discount_amount,
      discount_percentage: this.discount_percentage,
      reward_type: this.reward_type,
      is_active: this.is_active,
      start_date: this.start_date,
      end_date: this.end_date,
      max_redemptions: this.max_redemptions,
      current_redemptions: this.current_redemptions,
      created_at: this.created_at,
      updated_at: this.updated_at,
      is_available: this.isAvailable(),
      value_description: this.getValueDescription(),
    };
  }

  async save() {
    if (this.id) {
      return await Reward.update(this.id, this, this.tenant_id);
    } else {
      const newReward = await Reward.create(this);
      this.id = newReward.id;
      return newReward;
    }
  }
}

module.exports = Reward;
