const { db } = require("../config/database");
const { logger } = require("../utils/logger");

class UserRewardProgress {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.reward_id = data.reward_id;
    this.stamps_collected = data.stamps_collected || 0;
    this.stamps_required = data.stamps_required;
    this.is_completed = data.is_completed || false;
    this.status = data.status || "in_progress";
    this.completed_at = data.completed_at;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  static async create(userId, rewardId, stampsRequired) {
    try {
      const query = `
        INSERT INTO user_reward_progress (
          user_id, reward_id, stamps_required, stamps_collected, is_completed, status
        )
        VALUES ($1, $2, $3, 0, FALSE, 'in_progress')
        ON CONFLICT (user_id, reward_id) DO UPDATE SET
          stamps_required = EXCLUDED.stamps_required,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      const params = [userId, rewardId, stampsRequired];

      const result = await db.getOne(query, params);
      return result ? new UserRewardProgress(result) : null;
    } catch (error) {
      logger.error("Error creating user reward progress:", error);
      throw error;
    }
  }

  static async findByUserAndReward(userId, rewardId) {
    try {
      const query = `
        SELECT * FROM user_reward_progress 
        WHERE user_id = $1 AND reward_id = $2
      `;
      const result = await db.getOne(query, [userId, rewardId]);
      return result ? new UserRewardProgress(result) : null;
    } catch (error) {
      logger.error("Error finding user reward progress:", error);
      throw error;
    }
  }

  static async findByUserId(userId) {
    try {
      const query = `
        SELECT * FROM user_reward_progress 
        WHERE user_id = $1 
        ORDER BY updated_at DESC
      `;
      const results = await db.getMany(query, [userId]);
      return results.map((result) => new UserRewardProgress(result));
    } catch (error) {
      console.log("Error finding user reward progress:", error);
      throw error;
    }
  }

  static async addStamp(userId, rewardId) {
    try {
      const query = `
        UPDATE user_reward_progress 
        SET stamps_collected = stamps_collected + 1,
            is_completed = CASE 
              WHEN stamps_collected + 1 >= stamps_required THEN TRUE 
              ELSE FALSE 
            END,
            completed_at = CASE 
              WHEN stamps_collected + 1 >= stamps_required THEN CURRENT_TIMESTAMP 
              ELSE completed_at 
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND reward_id = $2
        RETURNING *
      `;
      const result = await db.getOne(query, [userId, rewardId]);
      return result ? new UserRewardProgress(result) : null;
    } catch (error) {
      logger.error("Error adding stamp:", error);
      throw error;
    }
  }

  static async getProgress(userId, rewardId) {
    try {
      const query = `
        SELECT urp.*, r.name as reward_name, r.description as reward_description,
               r.type as reward_type, r.value as reward_value, r.points_required as reward_points_required
        FROM user_reward_progress urp
        JOIN rewards r ON urp.reward_id = r.id
        WHERE urp.user_id = $1 AND urp.reward_id = $2
      `;
      const result = await db.getOne(query, [userId, rewardId]);
      return result
        ? {
            ...new UserRewardProgress(result),
            reward_name: result.reward_name,
            reward_description: result.reward_description,
            reward_type: result.reward_type,
            reward_value: result.reward_value,
            reward_points_required: result.reward_points_required,
          }
        : null;
    } catch (error) {
      logger.error("Error getting progress:", error);
      throw error;
    }
  }

  static async resetProgress(userId, rewardId) {
    try {
      const query = `
        UPDATE user_reward_progress 
        SET stamps_collected = 0,
            is_completed = FALSE,
            completed_at = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND reward_id = $2
        RETURNING *
      `;
      const result = await db.getOne(query, [userId, rewardId]);
      return result ? new UserRewardProgress(result) : null;
    } catch (error) {
      logger.error("Error resetting progress:", error);
      throw error;
    }
  }

  static async delete(userId, rewardId) {
    try {
      const query = `
        DELETE FROM user_reward_progress 
        WHERE user_id = $1 AND reward_id = $2
        RETURNING *
      `;
      const result = await db.getOne(query, [userId, rewardId]);
      return result ? new UserRewardProgress(result) : null;
    } catch (error) {
      logger.error("Error deleting user reward progress:", error);
      throw error;
    }
  }

  // Get completion percentage
  getCompletionPercentage() {
    if (this.stamps_required === 0) return 0;
    return Math.min((this.stamps_collected / this.stamps_required) * 100, 100);
  }

  // Check if reward is ready for redemption
  isReadyForRedemption() {
    return this.is_completed && this.stamps_collected >= this.stamps_required;
  }

  // Get remaining stamps needed
  getRemainingStamps() {
    return Math.max(0, this.stamps_required - this.stamps_collected);
  }

  // Save instance changes
  async save() {
    try {
      const query = `
        UPDATE user_reward_progress 
        SET stamps_collected = $1,
            is_completed = $2,
            status = $3,
            completed_at = $4,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $5 AND reward_id = $6
        RETURNING *
      `;
      const params = [
        this.stamps_collected,
        this.is_completed,
        this.status,
        this.completed_at,
        this.user_id,
        this.reward_id,
      ];

      const result = await db.getOne(query, params);
      if (result) {
        Object.assign(this, result);
        return this;
      }
      return null;
    } catch (error) {
      logger.error("Error saving user reward progress:", error);
      throw error;
    }
  }

  // Get scan history for this progress
  async getScanHistory(options = {}) {
    try {
      const { ScanHistory } = require("./scanHistory.model");
      return await ScanHistory.findByProgressId(this.id, options);
    } catch (error) {
      logger.error("Error getting scan history for progress:", error);
      throw error;
    }
  }

  // Get progress with scan history included
  static async getProgressWithHistory(userId, rewardId, scanOptions = {}) {
    try {
      const progress = await UserRewardProgress.findByUserAndReward(userId, rewardId);
      if (!progress) return null;

      const scanHistory = await progress.getScanHistory(scanOptions);
      return {
        ...progress,
        scan_history: scanHistory
      };
    } catch (error) {
      logger.error("Error getting progress with history:", error);
      throw error;
    }
  }
}

module.exports = { UserRewardProgress };
