const express = require("express");
const { body } = require("express-validator");
const { StampTransaction } = require("../models/stampTransaction.model");
const { UserRewardProgress } = require("../models/userRewardProgress.model");
const {
  authenticateUser,
  requireAdmin,
} = require("../middleware/supabase-auth.middleware");
const { validate } = require("../middleware/validation.middleware");
const { logger } = require("../utils/logger");
const User = require("../models/user.model");
const Reward = require("../models/reward.model");

const router = express.Router();

// Validation rules
const createTransactionValidation = [
  body("rewardId").isInt({ min: 1 }).withMessage("Valid reward ID is required"),
  body("storeId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Valid store ID is required"),
  body("stampsAdded")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Stamps added must be between 1 and 10"),
];

const scanTransactionValidation = [
  body("transactionCode")
    .isString()
    .notEmpty()
    .withMessage("Transaction code is required"),
  body("storeId").isInt({ min: 1 }).withMessage("Valid store ID is required"),
  body("qrData").optional().isObject().withMessage("QR data must be an object"),
];

/**
 * @route POST /api/stamp-transactions
 * @desc Create new stamp transaction (generate QR code)
 * @access Private
 */
router.post(
  "/",
  createTransactionValidation,
  validate,
  authenticateUser,
  async (req, res) => {
    try {
      const authUserId = req.user.id; // Supabase auth user ID
      const { rewardId, storeId, stampsAdded = 1 } = req.body;

      // Get the database user by auth user ID
      const dbUser = await User.findByAuthUserId(authUserId);
      if (!dbUser) {
        return res.status(404).json({
          success: false,
          message: "User not found in database",
        });
      }

      // Create stamp transaction using database user ID
      const transaction = await StampTransaction.create(
        dbUser.id, // Use internal database user ID
        rewardId,
        storeId,
        stampsAdded
      );

      if (!transaction) {
        return res.status(500).json({
          success: false,
          message: "Failed to create stamp transaction",
        });
      }

      logger.info(
        `Created stamp transaction: ${transaction.transaction_code} for auth user ${authUserId} (db user ${dbUser.id}), reward ${rewardId}`
      );

      res.status(201).json({
        success: true,
        data: {
          transaction_code: transaction.transaction_code,
          expires_at: transaction.expires_at,
          qr_data: JSON.stringify({
            code: transaction.transaction_code,
            user_id: authUserId, // Send auth user ID in QR data
            reward_id: rewardId,
            expires_at: transaction.expires_at,
          }),
        },
        message: "Stamp transaction created successfully",
      });
    } catch (error) {
      logger.error("Create stamp transaction error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create stamp transaction",
      });
    }
  }
);

/**
 * @route POST /api/stamp-transactions/scan
 * @desc Scan QR code and complete transaction (staff only)
 * @access Private (Staff)
 */
router.post(
  "/scan",
  scanTransactionValidation,
  validate,
  authenticateUser,
  async (req, res) => {
    try {
      const staffId = req.user.id;
      const { transactionCode, storeId, qrData } = req.body;

      let transaction;

      // If qrData is provided, create transaction from QR data
      if (qrData) {
        // Check if QR code is expired
        const expiresAt = new Date(qrData.expires_at);
        if (expiresAt < new Date()) {
          return res.status(400).json({
            success: false,
            message: "QR code has expired",
          });
        }

        // Create transaction from QR data
        transaction = await StampTransaction.create(
          qrData.user_id,
          qrData.reward_id,
          storeId,
          1
        );

        if (!transaction) {
          return res.status(500).json({
            success: false,
            message: "Failed to create transaction from QR data",
          });
        }
      } else {
        // Legacy flow: find existing transaction
        transaction = await StampTransaction.findByCode(transactionCode);

        if (!transaction) {
          return res.status(404).json({
            success: false,
            message: "Transaction not found",
          });
        }

        if (!transaction.isValid()) {
          return res.status(400).json({
            success: false,
            message:
              transaction.transaction_status === "pending"
                ? "Transaction has expired"
                : "Transaction is no longer valid",
          });
        }
      }

      // Complete transaction
      const completedTransaction = await StampTransaction.completeTransaction(
        transaction.transaction_code,
        staffId,
        storeId
      );

      if (!completedTransaction) {
        return res.status(500).json({
          success: false,
          message: "Failed to complete transaction",
        });
      }

      // Add stamp to user's reward progress
      const progress = await UserRewardProgress.addStamp(
        transaction.user_id,
        transaction.reward_id
      );

      if (!progress) {
        return res.status(500).json({
          success: false,
          message: "Failed to update user progress",
        });
      }

      logger.info(
        `Completed stamp transaction: ${transaction.transaction_code} by staff ${staffId} at store ${storeId}`
      );

      res.status(200).json({
        success: true,
        data: {
          transaction: completedTransaction,
          progress: progress,
          user_name: `${transaction.user_first_name} ${transaction.user_last_name}`,
          reward_name: transaction.reward_name,
          stamps_collected: progress.stamps_collected,
          stamps_required: progress.stamps_required,
          is_completed: progress.is_completed,
        },
        message: progress.is_completed
          ? "Stamp added! Reward completed!"
          : "Stamp added successfully",
      });
    } catch (error) {
      logger.error("Scan stamp transaction error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to scan transaction",
      });
    }
  }
);

/**
 * @route GET /api/stamp-transactions
 * @desc Get all stamp transactions (admin only)
 * @access Private (Admin)
 */
router.get("/", requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      userId,
      rewardId,
      storeId,
      staffId,
      status,
      dateFrom,
      dateTo,
    } = req.query;

    const offset = (page - 1) * limit;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      search,
      userId: userId ? parseInt(userId) : null,
      rewardId: rewardId ? parseInt(rewardId) : null,
      storeId: storeId ? parseInt(storeId) : null,
      staffId: staffId ? parseInt(staffId) : null,
      status,
      dateFrom,
      dateTo,
    };

    const [transactions, totalCount] = await Promise.all([
      StampTransaction.findAll(options),
      StampTransaction.count(options),
    ]);

    logger.info(
      `Retrieved ${transactions.length} stamp transactions for admin`
    );

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      message: "Stamp transactions retrieved successfully",
    });
  } catch (error) {
    logger.error("Get stamp transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve stamp transactions",
    });
  }
});

/**
 * @route GET /api/stamp-transactions/user
 * @desc Get user's transaction history
 * @access Private
 */
router.get("/user", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
    };

    const transactions = await StampTransaction.findByUserId(userId, options);

    logger.info(
      `Retrieved ${transactions.length} transactions for user ${userId}`
    );

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
      },
      message: "User transaction history retrieved successfully",
    });
  } catch (error) {
    logger.error("Get user transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user transactions",
    });
  }
});

/**
 * @route GET /api/stamp-transactions/:transactionCode
 * @desc Get specific transaction details
 * @access Private
 */
router.get("/:transactionCode", authenticateUser, async (req, res) => {
  try {
    const { transactionCode } = req.params;
    const transaction = await StampTransaction.findByCode(transactionCode);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Only allow user to view their own transactions or admin to view any
    if (
      transaction.user_id !== req.user.id &&
      req.user.role !== "super_admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
      message: "Transaction details retrieved successfully",
    });
  } catch (error) {
    logger.error("Get transaction details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve transaction details",
    });
  }
});

/**
 * @route PUT /api/stamp-transactions/:transactionCode/cancel
 * @desc Cancel pending transaction
 * @access Private
 */
router.put("/:transactionCode/cancel", authenticateUser, async (req, res) => {
  try {
    const { transactionCode } = req.params;
    const transaction = await StampTransaction.findByCode(transactionCode);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Only allow user to cancel their own transactions
    if (transaction.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const cancelledTransaction = await StampTransaction.cancelTransaction(
      transactionCode
    );

    if (!cancelledTransaction) {
      return res.status(400).json({
        success: false,
        message: "Transaction cannot be cancelled",
      });
    }

    logger.info(
      `Cancelled stamp transaction: ${transactionCode} by user ${req.user.id}`
    );

    res.status(200).json({
      success: true,
      data: cancelledTransaction,
      message: "Transaction cancelled successfully",
    });
  } catch (error) {
    logger.error("Cancel transaction error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel transaction",
    });
  }
});

/**
 * @route POST /api/stamp-transactions/cleanup
 * @desc Clean up expired transactions (admin only)
 * @access Private (Admin)
 */
router.post("/cleanup", requireAdmin, async (req, res) => {
  try {
    const cleanedCount = await StampTransaction.cleanupExpired();

    logger.info(`Cleaned up ${cleanedCount} expired stamp transactions`);

    res.status(200).json({
      success: true,
      data: { cleaned_count: cleanedCount },
      message: `Cleaned up ${cleanedCount} expired transactions`,
    });
  } catch (error) {
    logger.error("Cleanup transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cleanup expired transactions",
    });
  }
});

// Process QR code scan (any authenticated staff member)
router.post("/process-scan", authenticateUser, async (req, res) => {
  try {
    const { user_id, reward_id, scanned_by, store_id } = req.body;

    // Validate required fields
    if (!user_id || !reward_id || !scanned_by) {
      return res.status(400).json({
        success: false,
        message: "user_id, reward_id, and scanned_by are required",
      });
    }

    console.log(`Processing QR scan - Auth User ID: ${typeof user_id}, Reward ID: ${typeof reward_id}`);

    // Get user by Supabase auth ID (user_id from QR code is the auth user ID)
    const user = await User.findByAuthUserId(user_id);
    const reward = await Reward.findById(reward_id);

    if (!user) {
      logger.error(`User not found for auth ID: ${user_id}`);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!reward) {
      logger.error(`Reward not found for ID: ${reward_id}`);
      return res.status(404).json({
        success: false,
        message: "Reward not found",
      });
    }

    // // Use the database user ID for reward progress
    // const dbUserId = user.id;
    // logger.info(`Found database user ID: ${dbUserId} for auth user ID: ${user_id}`);

    // // Get or create user reward progress using database user ID
    // let progress = await UserRewardProgress.findByUserAndReward(
    //   dbUserId,
    //   reward_id
    // );

    // if (!progress) {
    //   // Create new progress record
    //   progress = await UserRewardProgress.create(
    //     dbUserId,
    //     reward_id,
    //     reward.points_required || reward.stamps_required || 10
    //   );
      
    //   // Add the first stamp
    //   progress = await UserRewardProgress.addStamp(dbUserId, reward_id);
    // } else {
    //   // Add stamp to existing progress
    //   progress = await UserRewardProgress.addStamp(dbUserId, reward_id);
    // }

    // if (!progress) {
    //   return res.status(500).json({
    //     success: false,
    //     message: "Failed to update user progress",
    //   });
    // }

    // Update status if completed
    // if (progress.is_completed && progress.status !== "ready_to_redeem") {
    //   progress.status = "ready_to_redeem";
    //   progress.completed_at = new Date();
    //   await progress.save();
    // }

    // logger.info(
    //   `Stamp added for auth user ${user_id} (db user ${dbUserId}), reward ${reward_id}. Progress: ${progress.stamps_collected}/${progress.stamps_required}`
    // );

    // Return success response with updated progress
    // res.json({
    //   success: true,
    //   message: progress.is_completed 
    //     ? "Stamp added! Reward completed!" 
    //     : "Stamp added successfully",
    //   data: {
    //     customer_name: `${user.first_name} ${user.last_name}`,
    //     reward_name: reward.name,
    //     stamps_collected: progress.stamps_collected,
    //     stamps_required: progress.stamps_required,
    //     is_completed: progress.is_completed,
    //     status: progress.status,
    //     transaction_id: `SCAN_${Date.now()}`, // Generate a simple transaction ID
    //   },
    // });
  } catch (error) {
    logger.error("Error processing QR scan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process scan",
      error: error.message,
    });
  }
});

module.exports = router;
