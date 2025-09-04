const express = require("express");
const { StampTransaction } = require("../models/stampTransaction.model");
const {
  authenticateUser,
  requireAdmin,
} = require("../middleware/supabase-auth.middleware");
const { logger } = require("../utils/logger");
const { db } = require("../config/database");
const User = require("../models/user.model");
const Reward = require("../models/reward.model");
const { UserRewardProgress } = require("../models/userRewardProgress.model");
const { ScanHistory } = require("../models/scanHistory.model");

const router = express.Router();

/**
 * @route GET /api/stamp-transactions
 * @desc Get all stamp transactions (admin only)
 * @access Private (Admin)
 */
router.get("/", async (req, res) => {
  try {
    // Validate and sanitize query parameters
    const {
      page = 1,
      limit = 20,
      search = "",
      tenantId,
      stampCardId,
      staffUserId,
      dateFrom,
      dateTo,
    } = req.query;

    // Ensure page and limit are positive integers
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(Math.max(1, parseInt(limit) || 20), 100); // Cap at 100
    const offset = (validatedPage - 1) * validatedLimit;

    // Build options object with validated data
    const options = {
      limit: validatedLimit,
      offset: offset,
      search: typeof search === 'string' ? search.trim() : '',
      tenantId: tenantId || null,
      stampCardId: stampCardId || null,
      staffUserId: staffUserId || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
    };

    // Execute both queries with proper error handling
    let transactions = [];
    let totalCount = 0;

    try {
      const [transactionsResult, totalCountResult] = await Promise.all([
        StampTransaction.findAll(options).catch(error => {
          logger.error("Error fetching transactions:", error);
          throw new Error("Failed to fetch transactions");
        }),
        StampTransaction.count(options).catch(error => {
          logger.error("Error counting transactions:", error);
          throw new Error("Failed to count transactions");
        })
      ]);

      transactions = Array.isArray(transactionsResult) ? transactionsResult : [];
      totalCount = typeof totalCountResult === 'number' ? totalCountResult : 0;

    } catch (dbError) {
      logger.error("Database error in stamp transactions:", dbError);
      return res.status(500).json({
        success: false,
        message: "Database error occurred while retrieving transactions",
        data: [],
        pagination: {
          page: validatedPage,
          limit: validatedLimit,
          total: 0,
          pages: 0,
        }
      });
    }

    // Ensure transactions is an array and totalCount is a number
    if (!Array.isArray(transactions)) {
      transactions = [];
    }
    if (typeof totalCount !== 'number' || totalCount < 0) {
      totalCount = 0;
    }

    const totalPages = Math.ceil(totalCount / validatedLimit);

    logger.info(
      `Retrieved ${transactions.length} stamp transactions for admin (page ${validatedPage}/${totalPages})`
    );

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total: totalCount,
        pages: totalPages,
        hasNext: validatedPage < totalPages,
        hasPrev: validatedPage > 1,
      },
      message: transactions.length > 0 
        ? "Stamp transactions retrieved successfully" 
        : "No stamp transactions found",
    });

  } catch (error) {
    logger.error("Unexpected error in GET stamp transactions:", error);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while retrieving stamp transactions",
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
      }
    });
  }
});

/**
 * @route POST /api/stamp-transactions
 * @desc Create a new stamp transaction
 * @access Private
 */
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { 
      tenantId, 
      stampCardId, 
      stampsAdded = 1, 
      description,
      staffUserId 
    } = req.body;

    // Validate required fields
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Valid tenant ID is required",
      });
    }

    if (!stampCardId || typeof stampCardId !== 'string' || stampCardId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Valid stamp card ID is required",
      });
    }

    const validStampsAdded = parseInt(stampsAdded);
    if (isNaN(validStampsAdded) || validStampsAdded < 1) {
      return res.status(400).json({
        success: false,
        message: "Stamps added must be a positive number",
      });
    }

    let transaction;
    try {
      transaction = await StampTransaction.create(
        tenantId.trim(),
        stampCardId.trim(),
        validStampsAdded,
        description || null,
        staffUserId || null
      );
    } catch (dbError) {
      logger.error("Database error creating stamp transaction:", dbError);
      return res.status(500).json({
        success: false,
        message: "Failed to create stamp transaction",
      });
    }

    if (!transaction) {
      return res.status(500).json({
        success: false,
        message: "Failed to create stamp transaction",
      });
    }

    logger.info(`Created stamp transaction: ${transaction.id} for stamp card ${stampCardId}`);

    res.status(201).json({
      success: true,
      data: transaction,
      message: "Stamp transaction created successfully",
    });

  } catch (error) {
    logger.error("Unexpected error creating stamp transaction:", error);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while creating the stamp transaction",
    });
  }
});

/**
 * @route GET /api/stamp-transactions/scan-history
 * @desc Get all scan history (admin only)
 * @access Private (Admin)
 */
router.get("/scan-history", requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      rewardId,
      storeId,
      scannedByUserId,
      dateFrom,
      dateTo,
    } = req.query;

    // Validate and sanitize query parameters
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(Math.max(1, parseInt(limit) || 50), 100);
    const offset = (validatedPage - 1) * validatedLimit;

    const options = {
      limit: validatedLimit,
      offset: offset,
      userId: userId || null,
      rewardId: rewardId || null,
      storeId: storeId || null,
      scannedByUserId: scannedByUserId || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
    };

    let scanHistory = [];
    let totalCount = 0;

    try {
      const [historyResult, countResult] = await Promise.all([
        ScanHistory.findAll(options).catch(error => {
          logger.error("Error fetching scan history:", error);
          throw new Error("Failed to fetch scan history");
        }),
        ScanHistory.count(options).catch(error => {
          logger.error("Error counting scan history:", error);
          throw new Error("Failed to count scan history");
        })
      ]);

      scanHistory = Array.isArray(historyResult) ? historyResult : [];
      totalCount = typeof countResult === 'number' ? countResult : 0;

    } catch (dbError) {
      logger.error("Database error in scan history:", dbError);
      return res.status(500).json({
        success: false,
        message: "Database error occurred while retrieving scan history",
        data: [],
        pagination: {
          page: validatedPage,
          limit: validatedLimit,
          total: 0,
          pages: 0,
        }
      });
    }

    const totalPages = Math.ceil(totalCount / validatedLimit);

    logger.info(`Retrieved ${scanHistory.length} scan history records for admin (page ${validatedPage}/${totalPages})`);

    res.status(200).json({
      success: true,
      data: scanHistory,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total: totalCount,
        pages: totalPages,
        hasNext: validatedPage < totalPages,
        hasPrev: validatedPage > 1,
      },
      message: scanHistory.length > 0 
        ? "Scan history retrieved successfully" 
        : "No scan history found",
    });

  } catch (error) {
    logger.error("Unexpected error in GET scan history:", error);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while retrieving scan history",
      data: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0,
      }
    });
  }
});

/**
 * @route GET /api/stamp-transactions/scan-history/progress/:progressId
 * @desc Get scan history for a specific user reward progress
 * @access Private (Admin)
 */
router.get("/scan-history/progress/:progressId", requireAdmin, async (req, res) => {
  try {
    const { progressId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Validate progress ID
    if (!progressId || isNaN(parseInt(progressId))) {
      return res.status(400).json({
        success: false,
        message: "Valid progress ID is required",
      });
    }

    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(Math.max(1, parseInt(limit) || 50), 100);
    const offset = (validatedPage - 1) * validatedLimit;

    const options = {
      limit: validatedLimit,
      offset: offset,
    };

    let scanHistory;
    try {
      scanHistory = await ScanHistory.findByProgressId(parseInt(progressId), options);
    } catch (dbError) {
      logger.error(`Database error finding scan history for progress ${progressId}:`, dbError);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve scan history for this progress",
      });
    }

    if (!Array.isArray(scanHistory)) {
      scanHistory = [];
    }

    logger.info(`Retrieved ${scanHistory.length} scan records for progress ${progressId}`);

    res.status(200).json({
      success: true,
      data: scanHistory,
      message: scanHistory.length > 0 
        ? "Scan history retrieved successfully" 
        : "No scan history found for this progress",
    });

  } catch (error) {
    logger.error("Unexpected error retrieving progress scan history:", error);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while retrieving scan history",
    });
  }
});

/**
 * @route GET /api/stamp-transactions/scan-history/statistics
 * @desc Get scan statistics for admin dashboard
 * @access Private (Admin)
 */
router.get("/scan-history/statistics", requireAdmin, async (req, res) => {
  try {
    const { dateFrom, dateTo, storeId } = req.query;

    const options = {
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      storeId: storeId || null,
    };

    let statistics;
    try {
      statistics = await ScanHistory.getStatistics(options);
    } catch (dbError) {
      logger.error("Database error getting scan statistics:", dbError);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve scan statistics",
      });
    }

    logger.info("Retrieved scan statistics for admin dashboard");

    res.status(200).json({
      success: true,
      data: statistics,
      message: "Scan statistics retrieved successfully",
    });

  } catch (error) {
    logger.error("Unexpected error retrieving scan statistics:", error);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while retrieving scan statistics",
    });
  }
});

// Process QR code scan (any authenticated staff member)
router.post("/process-scan", async (req, res) => {
  try {
    const { user_id, reward_id, scanned_by, store_id, action_type, progress_id } = req.body;

    // Validate required fields with type checking
    if (!user_id || typeof user_id !== 'string' || user_id.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Valid user_id is required",
      });
    }

    if (!reward_id || typeof reward_id !== 'string' || reward_id.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Valid reward_id is required",
      });
    }

    if (!scanned_by || typeof scanned_by !== 'string' || scanned_by.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Valid scanned_by identifier is required",
      });
    }

    const sanitizedUserId = user_id.trim();
    const validRewardId = reward_id.trim();
    const sanitizedScannedBy = scanned_by.trim();

    // Get user by Supabase auth ID with comprehensive error handling
    let user;
    try {
      user = await User.findByAuthUserId(sanitizedUserId);
      if (!user) {
        logger.error(`User not found for auth ID: ${sanitizedUserId}`);
        return res.status(404).json({
          success: false,
          message: "User not found in the system",
        });
      }
    } catch (userError) {
      logger.error(`Error finding user by auth ID ${sanitizedUserId}:`, userError);
      return res.status(500).json({
        success: false,
        message: "Failed to verify user information",
      });
    }

    // Get reward with error handling
    let reward;
    try {
      reward = await Reward.findById(validRewardId);
      if (!reward) {
        logger.error(`Reward not found for ID: ${validRewardId}`);
        return res.status(404).json({
          success: false,
          message: "Reward not found",
        });
      }
    } catch (rewardError) {
      logger.error(`Error finding reward ${validRewardId}:`, rewardError);
      return res.status(500).json({
        success: false,
        message: "Failed to verify reward information",
      });
    }

    // Validate user and reward data
    if (!user.id) {
      logger.error(`Invalid user ID structure for auth ID ${sanitizedUserId}:`, user);
      return res.status(500).json({
        success: false,
        message: "Invalid user data structure",
      });
    }

    
    console.log('Reward fetched:', reward);

    if (!reward.name) {
      logger.error(`Invalid reward structure for ID ${validRewardId}:`, reward);
      return res.status(500).json({
        success: false,
        message: "Invalid reward configuration",
      });
    }

    const dbUserId = user.id;
    logger.info(`Processing scan for database user ID: ${dbUserId}, auth user ID: ${sanitizedUserId}`);

    // Get or create user reward progress with enhanced error handling
    let progress;
    try {
      progress = await UserRewardProgress.findByUserAndReward(dbUserId, validRewardId);
    } catch (findError) {
      logger.error(`Error finding user reward progress for user ${dbUserId}, reward ${validRewardId}:`, findError);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve user reward progress",
      });
    }

    if (!progress) {
      logger.info(`No existing progress found. Creating new progress for user ${dbUserId}, reward ${validRewardId}`);
      try {
        
        const requiredStamps = reward.points_cost || 10; // Use points_cost field from reward model
        logger.info(`requiredStamps ${requiredStamps}, type ${typeof requiredStamps}, from reward.points_cost: ${reward.points_cost}`);
        
        // Validate required stamps
        if (typeof requiredStamps !== 'number' || requiredStamps <= 0) {
          logger.error(`Invalid stamps requirement for reward ${validRewardId}: ${requiredStamps}`);
          return res.status(500).json({
            success: false,
            message: "Invalid reward stamp configuration",
          });
        }

        progress = await UserRewardProgress.create(dbUserId, validRewardId, requiredStamps);
        
        if (!progress) {
          logger.error(`Failed to create progress record for user ${dbUserId}, reward ${validRewardId}`);
          return res.status(500).json({
            success: false,
            message: "Failed to create user reward progress",
          });
        }
        
        logger.info(`Created new progress record for user ${dbUserId}, reward ${validRewardId}`);
      } catch (createError) {
        console.error(`Error creating user reward progress:`, createError);
        return res.status(500).json({
          success: false,
          message: "Failed to initialize user reward progress",
        });
      }
    }

    // Validate progress data before processing
    if (!progress || typeof progress.stamps_collected !== 'number' || typeof progress.stamps_required !== 'number') {
      logger.error(`Invalid progress data structure:`, progress);
      return res.status(500).json({
        success: false,
        message: "Invalid user progress data",
      });
    }

    // Handle redemption scans first (if action_type is "redemption")
    if (action_type === "redemption") {
      logger.info(`Processing redemption scan for progress ${progress.id}`);
      
      if (progress.status === 'ready_to_redeem') {
        try {
          const redeemedProgress = await UserRewardProgress.redeemProgress(progress.id);
          
          if (redeemedProgress) {
            logger.info(`Successfully redeemed progress ${progress.id} for user ${dbUserId}, reward ${validRewardId}`);
            
            return res.status(200).json({
              success: true,
              message: "🎉 Reward successfully redeemed!",
              data: {
                customer_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown Customer',
                reward_name: reward.name || 'Unknown Reward',
                stamps_collected: redeemedProgress.stamps_collected,
                stamps_required: redeemedProgress.stamps_required,
                is_completed: true,
                status: redeemedProgress.status,
                redeemed_at: redeemedProgress.redeemed_at,
                progress_id: redeemedProgress.id,
                action: 'redeemed'
              },
            });
          } else {
            logger.error(`Failed to redeem progress ${progress.id} - may not be in ready_to_redeem status`);
            return res.status(400).json({
              success: false,
              message: "This reward is not ready for redemption or has already been redeemed",
            });
          }
        } catch (redemptionError) {
          logger.error(`Error redeeming progress ${progress.id}:`, redemptionError);
          return res.status(500).json({
            success: false,
            message: "Failed to redeem reward",
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: `Cannot redeem reward. Current status: ${progress.status}. Only ready_to_redeem rewards can be redeemed.`,
        });
      }
    }

    // Handle UserRewardProgress lifecycle (stamp collection)
    if (progress.stamps_collected >= progress.stamps_required) {
      // Current progress is already completed
      
      // Handle other completed statuses (availed, redeemed) - no redemption here since that's handled above
      const shouldReset = req.body.reset_progress || false;
      
      if (shouldReset) {
        // User wants to start a new cycle - create new UserRewardProgress
        try {
          const requiredStamps = reward.points_cost || 10;
          
          const newProgress = await UserRewardProgress.create(dbUserId, validRewardId, requiredStamps);
          if (newProgress) {
            progress = newProgress;
            logger.info(`Created new progress cycle for user ${dbUserId}, reward ${validRewardId}`);
          } else {
            logger.error(`Failed to create new progress cycle for user ${dbUserId}, reward ${validRewardId}`);
            return res.status(500).json({
              success: false,
              message: "Failed to create new reward cycle",
            });
          }
        } catch (createError) {
          logger.error(`Error creating new progress cycle:`, createError);
          return res.status(500).json({
            success: false,
            message: "Failed to create new reward cycle",
          });
        }
      } else {
        // Not a reset request - inform user about current status
        let statusMessage = "Reward already completed. Scan again to start a new collection cycle.";
        
        if (progress.status === 'ready_to_redeem') {
          statusMessage = "Reward is ready to redeem! Please use the redemption QR code to redeem this reward.";
        } else if (progress.status === 'availed') {
          statusMessage = "Reward already redeemed. Scan again to start a new collection cycle.";
        }
          
        return res.status(200).json({
          success: true,
          message: statusMessage,
          data: {
            customer_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown Customer',
            reward_name: reward.name || 'Unknown Reward',
            stamps_collected: progress.stamps_collected,
            stamps_required: progress.stamps_required,
            is_completed: true,
            status: progress.status || 'completed',
            can_start_new_cycle: progress.status !== 'ready_to_redeem',
          },
        });
      }
    }

    // Add stamp to progress with rollback capability
    let updatedProgress;
    const stampsBeforeScan = progress.stamps_collected;
    try {
      updatedProgress = await UserRewardProgress.addStamp(dbUserId, validRewardId);
      
      if (!updatedProgress) {
        logger.error(`addStamp returned null for user ${dbUserId}, reward ${validRewardId}`);
        return res.status(500).json({
          success: false,
          message: "Failed to update user progress",
        });
      }

      // Validate updated progress
      if (typeof updatedProgress.stamps_collected !== 'number' || typeof updatedProgress.stamps_required !== 'number') {
        logger.error(`Invalid updated progress data:`, updatedProgress);
        return res.status(500).json({
          success: false,
          message: "Progress update resulted in invalid data",
        });
      }

    } catch (addStampError) {
      logger.error(`Error adding stamp for user ${dbUserId}, reward ${validRewardId}:`, addStampError);
      return res.status(500).json({
        success: false,
        message: "Failed to add stamp to user progress",
      });
    }

    // Record scan history for tracking
    try {
      // Try to find staff user by the scanned_by identifier (could be email, ID, etc.)
      let staffUserId = null;
      if (sanitizedScannedBy) {
        try {
          // Try to find staff user by email or auth ID
          const staffUser = await User.findByEmail(sanitizedScannedBy).catch(() => 
            User.findByAuthUserId(sanitizedScannedBy).catch(() => null)
          );
          if (staffUser && (staffUser.role === 'staff' || staffUser.role === 'store_manager' || staffUser.role === 'tenant_admin')) {
            staffUserId = staffUser.id;
            logger.info(`Found staff user for scan: ${staffUser.email} (${staffUser.role})`);
          }
        } catch (staffLookupError) {
          logger.warn(`Could not find staff user for identifier: ${sanitizedScannedBy}`, staffLookupError);
        }
      }

      const scanRecord = await ScanHistory.create(
        progress.id, // user_reward_progress_id
        dbUserId, // user_id
        validRewardId, // reward_id
        staffUserId, // scanned_by_user_id (null if staff not found)
        store_id || null, // store_id
        1, // stamps_added
        stampsBeforeScan, // stamps_before_scan
        updatedProgress.stamps_collected // stamps_after_scan
      );
      
      if (scanRecord) {
        logger.info(`Scan history recorded: ${scanRecord.id} for progress ${progress.id}, scanned by: ${staffUserId ? 'staff-' + staffUserId : 'anonymous'}`);
      }
    } catch (scanHistoryError) {
      // Don't fail the main request if scan history fails, just log it
      logger.error(`Failed to record scan history for user ${dbUserId}, reward ${validRewardId}:`, scanHistoryError);
    }

    // Status is now automatically updated in the addStamp method
    logger.info(
      `Stamp added for auth user ${sanitizedUserId} (db user ${dbUserId}), reward ${validRewardId}. Progress: ${updatedProgress.stamps_collected}/${updatedProgress.stamps_required}, Status: ${updatedProgress.status}`
    );

    // Return success response with validated data
    const customerName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown Customer';
    const rewardName = reward.name || 'Unknown Reward';
    const stampsCollected = Math.max(0, updatedProgress.stamps_collected);
    const stampsRequired = Math.max(1, updatedProgress.stamps_required);
    const isCompleted = stampsCollected >= stampsRequired;

    res.status(200).json({
      success: true,
      message: isCompleted 
        ? "Stamp added! Reward completed!" 
        : "Stamp added successfully",
      data: {
        customer_name: customerName,
        reward_name: rewardName,
        stamps_collected: stampsCollected,
        stamps_required: stampsRequired,
        is_completed: isCompleted,
        status: updatedProgress.status || (isCompleted ? 'completed' : 'in_progress'),
        transaction_id: `SCAN_${Date.now()}_${dbUserId}_${validRewardId}`, // More unique transaction ID
      },
    });

  } catch (error) {
    logger.error("Unexpected error processing QR scan:", error);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while processing the scan. Please try again.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Process QR code scan for reward redemption (any authenticated staff member)
router.post("/process-redemption", async (req, res) => {
  try {
    const { user_id, reward_id, scanned_by, store_id } = req.body;
    console.log('Redemption request body:', req.body);

    // Validate required fields with type checking
    if (!user_id || typeof user_id !== 'string' || user_id.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Valid user_id is required",
      });
    }

    if (!reward_id || typeof reward_id !== 'string' || reward_id.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Valid reward_id is required",
      });
    }

    if (!scanned_by || typeof scanned_by !== 'string' || scanned_by.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Valid scanned_by identifier is required",
      });
    }

    const sanitizedUserId = user_id.trim();
    const validRewardId = reward_id.trim();
    const sanitizedScannedBy = scanned_by.trim();

    // Get user by Supabase auth ID
    let user;
    try {
      user = await User.findByAuthUserId(sanitizedUserId);
      if (!user) {
        logger.error(`User not found for auth ID: ${sanitizedUserId}`);
        return res.status(404).json({
          success: false,
          message: "User not found in the system",
        });
      }
    } catch (userError) {
      logger.error(`Error finding user by auth ID ${sanitizedUserId}:`, userError);
      return res.status(500).json({
        success: false,
        message: "Failed to verify user information",
      });
    }

    // Get reward
    let reward;
    try {
      reward = await Reward.findById(validRewardId);
      if (!reward) {
        logger.error(`Reward not found for ID: ${validRewardId}`);
        return res.status(404).json({
          success: false,
          message: "Reward not found",
        });
      }
    } catch (rewardError) {
      logger.error(`Error finding reward ${validRewardId}:`, rewardError);
      return res.status(500).json({
        success: false,
        message: "Failed to verify reward information",
      });
    }

    const dbUserId = user.id;
    logger.info(`Processing redemption for database user ID: ${dbUserId}, auth user ID: ${sanitizedUserId}`);

    // Get user reward progress
    let progress;
    try {
      progress = await UserRewardProgress.findByUserAndReward(dbUserId, validRewardId);
    } catch (findError) {
      logger.error(`Error finding user reward progress for user ${dbUserId}, reward ${validRewardId}:`, findError);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve user reward progress",
      });
    }

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "No progress found for this reward",
      });
    }

    // Check if reward is ready for redemption
    if (!progress.is_completed || progress.status !== "ready_to_redeem") {
      return res.status(400).json({
        success: false,
        message: "Reward is not ready for redemption",
        data: {
          customer_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown Customer',
          reward_name: reward.name || 'Unknown Reward',
          stamps_collected: progress.stamps_collected,
          stamps_required: progress.stamps_required,
          is_completed: progress.is_completed,
          status: progress.status,
        },
      });
    }

    // Check if already redeemed
    if (progress.status === "redeemed") {
      return res.status(400).json({
        success: false,
        message: "Reward has already been redeemed",
        data: {
          customer_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown Customer',
          reward_name: reward.name || 'Unknown Reward',
          stamps_collected: progress.stamps_collected,
          stamps_required: progress.stamps_required,
          is_completed: progress.is_completed,
          status: progress.status,
        },
      });
    }

    // Try to find staff user by the scanned_by identifier
    let staffUserId = null;
    if (sanitizedScannedBy) {
      try {
        const staffUser = await User.findByEmail(sanitizedScannedBy).catch(() => 
          User.findByAuthUserId(sanitizedScannedBy).catch(() => null)
        );
        if (staffUser && (staffUser.role === 'staff' || staffUser.role === 'store_manager' || staffUser.role === 'tenant_admin')) {
          staffUserId = staffUser.id;
          logger.info(`Found staff user for redemption scan: ${staffUser.email} (${staffUser.role})`);
        }
      } catch (staffLookupError) {
        logger.warn(`Could not find staff user for identifier: ${sanitizedScannedBy}`, staffLookupError);
      }
    }

    // Update progress to redeemed status
    try {
      progress.status = "redeemed";
      progress.redeemed_at = new Date();
      await progress.save();
      logger.info(`Reward ${validRewardId} redeemed for user ${dbUserId}`);
    } catch (updateError) {
      logger.error(`Error updating redemption status:`, updateError);
      return res.status(500).json({
        success: false,
        message: "Failed to process redemption",
      });
    }

    // Record scan history for redemption tracking
    try {
      const scanRecord = await ScanHistory.create(
        progress.id, // user_reward_progress_id
        dbUserId, // user_id
        validRewardId, // reward_id
        staffUserId, // scanned_by_user_id
        store_id || null, // store_id
        0, // stamps_added (0 for redemption)
        progress.stamps_collected, // stamps_before_scan
        progress.stamps_collected, // stamps_after_scan (no change for redemption)
        "redemption" // action_type
      );
      
      if (scanRecord) {
        logger.info(`Redemption scan history recorded: ${scanRecord.id} for progress ${progress.id}`);
      }
    } catch (scanHistoryError) {
      // Don't fail the main request if scan history fails
      logger.error(`Failed to record redemption scan history:`, scanHistoryError);
    }

    logger.info(`Reward ${validRewardId} successfully redeemed for user ${dbUserId}`);

    // Return success response
    const customerName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown Customer';
    const rewardName = reward.name || 'Unknown Reward';

    res.status(200).json({
      success: true,
      message: "Reward redeemed successfully!",
      data: {
        customer_name: customerName,
        reward_name: rewardName,
        stamps_collected: progress.stamps_collected,
        stamps_required: progress.stamps_required,
        is_completed: true,
        status: "redeemed",
        redeemed_at: progress.redeemed_at,
        transaction_id: `REDEEM_${Date.now()}_${dbUserId}_${validRewardId}`,
      },
    });

  } catch (error) {
    logger.error("Unexpected error processing reward redemption:", error);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while processing the redemption. Please try again.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

module.exports = router;
