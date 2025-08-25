const express = require("express");
const { body } = require("express-validator");
const { UserRewardProgress } = require("../models/userRewardProgress.model");
const { authenticateUser } = require("../middleware/supabase-auth.middleware");
const { validate } = require("../middleware/validation.middleware");
const { logger } = require("../utils/logger");

const router = express.Router();

// Validation rules
const addStampValidation = [
  body("rewardId").isInt({ min: 1 }).withMessage("Valid reward ID is required"),
];

const createProgressValidation = [
  body("rewardId").isInt({ min: 1 }).withMessage("Valid reward ID is required"),
  body("stampsRequired")
    .isInt({ min: 1, max: 100 })
    .withMessage("Stamps required must be between 1 and 100"),
];

/**
 * @route GET /api/user-reward-progress
 * @desc Get all user reward progress
 * @access Private
 */
router.get("/", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const progress = await UserRewardProgress.findByUserId(userId);

    logger.info(`Retrieved reward progress for user: ${userId}`);
    res.status(200).json({
      success: true,
      data: progress,
      message: "User reward progress retrieved successfully",
    });
  } catch (error) {
    logger.error("Get user reward progress error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user reward progress",
    });
  }
});

/**
 * @route GET /api/user-reward-progress/:rewardId
 * @desc Get specific reward progress for user
 * @access Private
 */
router.get("/:rewardId", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const rewardId = parseInt(req.params.rewardId);

    const progress = await UserRewardProgress.getProgress(userId, rewardId);

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Reward progress not found",
      });
    }

    logger.info(`Retrieved progress for user ${userId}, reward ${rewardId}`);
    res.status(200).json({
      success: true,
      data: progress,
      message: "Reward progress retrieved successfully",
    });
  } catch (error) {
    logger.error("Get specific reward progress error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve reward progress",
    });
  }
});

/**
 * @route POST /api/user-reward-progress
 * @desc Create or update user reward progress
 * @access Private
 */
router.post(
  "/",
  createProgressValidation,
  validate,
  authenticateUser,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { rewardId, stampsRequired } = req.body;

      const progress = await UserRewardProgress.create(
        userId,
        rewardId,
        stampsRequired
      );

      logger.info(
        `Created/updated progress for user ${userId}, reward ${rewardId}`
      );
      res.status(201).json({
        success: true,
        data: progress,
        message: "Reward progress created successfully",
      });
    } catch (error) {
      logger.error("Create reward progress error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create reward progress",
      });
    }
  }
);

/**
 * @route POST /api/user-reward-progress/:rewardId/add-stamp
 * @desc Add a stamp to user's reward progress
 * @access Private
 */
router.post(
  "/:rewardId/add-stamp",
  addStampValidation,
  validate,
  authenticateUser,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const rewardId = parseInt(req.params.rewardId);

      // Check if progress exists, create if not
      let progress = await UserRewardProgress.findByUserAndReward(
        userId,
        rewardId
      );
      if (!progress) {
        // Default to 10 stamps if not specified
        progress = await UserRewardProgress.create(userId, rewardId, 10);
      }

      // Add stamp
      const updatedProgress = await UserRewardProgress.addStamp(
        userId,
        rewardId
      );

      if (!updatedProgress) {
        return res.status(404).json({
          success: false,
          message: "Reward progress not found",
        });
      }

      logger.info(
        `Added stamp for user ${userId}, reward ${rewardId}. Progress: ${updatedProgress.stamps_collected}/${updatedProgress.stamps_required}`
      );

      res.status(200).json({
        success: true,
        data: updatedProgress,
        message: updatedProgress.is_completed
          ? "Reward completed! You can now redeem it."
          : "Stamp added successfully",
      });
    } catch (error) {
      logger.error("Add stamp error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add stamp",
      });
    }
  }
);

/**
 * @route PUT /api/user-reward-progress/:rewardId/reset
 * @desc Reset user's reward progress
 * @access Private
 */
router.put("/:rewardId/reset", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const rewardId = parseInt(req.params.rewardId);

    const progress = await UserRewardProgress.resetProgress(userId, rewardId);

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Reward progress not found",
      });
    }

    logger.info(`Reset progress for user ${userId}, reward ${rewardId}`);
    res.status(200).json({
      success: true,
      data: progress,
      message: "Reward progress reset successfully",
    });
  } catch (error) {
    logger.error("Reset progress error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset reward progress",
    });
  }
});

/**
 * @route DELETE /api/user-reward-progress/:rewardId
 * @desc Delete user's reward progress
 * @access Private
 */
router.delete("/:rewardId", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const rewardId = parseInt(req.params.rewardId);

    const progress = await UserRewardProgress.delete(userId, rewardId);

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Reward progress not found",
      });
    }

    logger.info(`Deleted progress for user ${userId}, reward ${rewardId}`);
    res.status(200).json({
      success: true,
      message: "Reward progress deleted successfully",
    });
  } catch (error) {
    logger.error("Delete progress error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete reward progress",
    });
  }
});

module.exports = router;
