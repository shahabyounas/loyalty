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
    this.redeemed_at = data.redeemed_at;
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
        WHERE user_id = $1 AND reward_id = $2 AND status = 'in_progress'
        ORDER BY created_at DESC
        LIMIT 1
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
      // Return all records, allowing frontend to handle multiple records per reward
      const query = `
        SELECT * FROM user_reward_progress 
        WHERE user_id = $1 
        ORDER BY reward_id, created_at DESC
      `;
      const results = await db.getMany(query, [userId]);
      return results.map((result) => new UserRewardProgress(result));
    } catch (error) {
      console.log("Error finding user reward progress:", error);
      throw error;
    }
  }

  static async findAllByUserAndReward(userId, rewardId) {
    try {
      const query = `
        SELECT * FROM user_reward_progress 
        WHERE user_id = $1 AND reward_id = $2
        ORDER BY created_at DESC
      `;
      const results = await db.getMany(query, [userId, rewardId]);
      return results.map((result) => new UserRewardProgress(result));
    } catch (error) {
      logger.error("Error finding all user reward progress:", error);
      throw error;
    }
  }

  static async getUserStatistics(userId) {
    try {
      // Get comprehensive statistics including all historical data
      const query = `
        SELECT 
          COUNT(CASE WHEN status = 'in_progress' AND stamps_collected > 0 THEN 1 END) as rewards_in_progress,
          COUNT(CASE WHEN status = 'ready_to_redeem' THEN 1 END) as rewards_ready_to_redeem,
          COUNT(CASE WHEN status IN ('redeemed', 'availed') THEN 1 END) as total_rewards_completed,
          SUM(COALESCE(stamps_collected, 0)) as total_stamps_collected
        FROM user_reward_progress 
        WHERE user_id = $1
      `;
      const result = await db.getOne(query, [userId]);
      return {
        rewards_in_progress: parseInt(result?.rewards_in_progress || 0),
        rewards_ready_to_redeem: parseInt(result?.rewards_ready_to_redeem || 0),
        total_rewards_completed: parseInt(result?.total_rewards_completed || 0),
        total_stamps_collected: parseInt(result?.total_stamps_collected || 0),
      };
    } catch (error) {
      logger.error("Error getting user statistics:", error);
      throw error;
    }
  }

  static async addStamp(userId, rewardId) {
    try {
      // Only update the latest in_progress record for this user and reward
      const query = `
        UPDATE user_reward_progress 
        SET stamps_collected = stamps_collected + 1,
            is_completed = CASE 
              WHEN stamps_collected + 1 >= stamps_required THEN TRUE 
              ELSE FALSE 
            END,
            status = CASE 
              WHEN stamps_collected + 1 >= stamps_required AND status = 'in_progress' THEN 'ready_to_redeem'
              ELSE status 
            END,
            completed_at = CASE 
              WHEN stamps_collected + 1 >= stamps_required THEN CURRENT_TIMESTAMP 
              ELSE completed_at 
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND reward_id = $2 AND status = 'in_progress'
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
               r.reward_type as reward_type, r.value as reward_value, r.points_cost as reward_points_required
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

  // Redeem a progress record (ready_to_redeem -> availed)
  static async redeemProgress(progressId) {
    try {
      const query = `
        UPDATE user_reward_progress 
        SET status = 'availed',
            redeemed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND status = 'ready_to_redeem'
        RETURNING *
      `;
      const result = await db.getOne(query, [progressId]);
      return result ? new UserRewardProgress(result) : null;
    } catch (error) {
      logger.error("Error redeeming progress:", error);
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
            redeemed_at = $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $6 AND reward_id = $7
        RETURNING *
      `;
      const params = [
        this.stamps_collected,
        this.is_completed,
        this.status,
        this.completed_at,
        this.redeemed_at,
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
