const express = require("express");
const { UserRewardProgress } = require("../models/userRewardProgress.model");
const { ScanHistory } = require("../models/scanHistory.model");
const User = require("../models/user.model");
const { Reward } = require("../models/reward.model");
const { authenticateUser, requireAdmin } = require("../middleware/supabase-auth.middleware");
const { logger } = require("../utils/logger");
const { db } = require("../config/database");

const router = express.Router();

/**
 * @route GET /api/admin/progress-rewards
 * @desc Get all user progress rewards for admin (simplified)
 * @access Private (Admin)
 */
router.get("/progress-rewards", authenticateUser, requireAdmin, async (req, res) => {
  try {
    // Query with JOINs to get actual user and reward details (with type casting)
    const query = `
      SELECT 
        urp.id,
        urp.user_id,
        urp.reward_id,
        urp.stamps_collected,
        urp.stamps_required,
        urp.is_completed,
        urp.status,
        urp.completed_at,
        urp.created_at,
        urp.updated_at,
        COALESCE(u.first_name || ' ' || u.last_name, 'Unknown Customer') as customer_name,
        u.email as customer_email,
        COALESCE(r.name, 'Unknown Reward') as reward_name,
        r.description as reward_description
      FROM user_reward_progress urp
      LEFT JOIN users u ON urp.user_id::text = u.id::text
      LEFT JOIN rewards r ON urp.reward_id::text = r.id::text
      ORDER BY urp.updated_at DESC
      LIMIT 100
    `;

    // Execute query
    const results = await db.getMany(query, []);

    // Format the results with actual user and reward data
    const formattedResults = results.map(row => ({
      id: row.id,
      user_id: row.user_id,
      reward_id: row.reward_id,
      stamps_collected: row.stamps_collected || 0,
      stamps_required: row.stamps_required || 0,
      is_completed: row.is_completed,
      status: row.status || 'in_progress',
      completed_at: row.completed_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      
      // Customer info from JOIN
      customer_name: row.customer_name,
      customer_email: row.customer_email || '',
      
      // Reward info from JOIN
      reward_name: row.reward_name,
      reward_description: row.reward_description || '',
      
      // Calculated fields
      completion_percentage: row.stamps_required > 0 
        ? Math.min((row.stamps_collected / row.stamps_required) * 100, 100) 
        : 0,
      remaining_stamps: Math.max(0, (row.stamps_required || 0) - (row.stamps_collected || 0))
    }));

    logger.info(`Retrieved ${formattedResults.length} progress rewards for admin`);

    res.status(200).json({
      success: true,
      data: formattedResults,
      message: formattedResults.length > 0 
        ? "Progress rewards retrieved successfully" 
        : "No progress rewards found",
    });

  } catch (error) {
    console.error("Error retrieving admin progress rewards:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving progress rewards",
      data: [],
      error
    });
  }
});

/**
 * @route GET /api/admin/progress-rewards/:progressId/scan-history
 * @desc Get scan history for a specific progress reward (simplified)
 * @access Private (Admin)
 */
router.get("/progress-rewards/:progressId/scan-history", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { progressId } = req.params;

    // Validate progress ID
    if (!progressId || isNaN(parseInt(progressId))) {
      return res.status(400).json({
        success: false,
        message: "Valid progress ID is required",
      });
    }

    // Get the progress details with JOINs for user and reward info (with type casting)
    const progressQuery = `
      SELECT 
        urp.*,
        COALESCE(u.first_name || ' ' || u.last_name, 'Unknown Customer') as customer_name,
        u.email as customer_email,
        COALESCE(r.name, 'Unknown Reward') as reward_name,
        r.description as reward_description
      FROM user_reward_progress urp
      LEFT JOIN users u ON urp.user_id::text = u.id::text
      LEFT JOIN rewards r ON urp.reward_id::text = r.id::text
      WHERE urp.id = $1
    `;
    
    const progressResult = await db.getOne(progressQuery, [progressId]);
    
    if (!progressResult) {
      return res.status(404).json({
        success: false,
        message: "Progress reward not found",
      });
    }

    // Get scan history with staff user information (with type casting)
    const scanQuery = `
      SELECT 
        sh.*,
        COALESCE(staff.first_name || ' ' || staff.last_name, 'System/Anonymous') as scanned_by_name,
        staff.email as scanned_by_email
      FROM scan_history sh
      LEFT JOIN users staff ON sh.scanned_by_user_id::text = staff.id::text
      WHERE sh.user_reward_progress_id = $1
      ORDER BY sh.created_at DESC
      LIMIT 50
    `;

    const scanHistory = await db.getMany(scanQuery, [progressId]);

    // Format the scan history with actual staff names
    const formattedScans = scanHistory.map(scan => ({
      id: scan.id,
      stamps_before_scan: scan.stamps_before_scan || 0,
      stamps_after_scan: scan.stamps_after_scan || 0,
      stamps_added: scan.stamps_added || 1,
      scan_method: scan.scan_method || 'manual',
      created_at: scan.created_at,
      scanned_by_name: scan.scanned_by_name,
      scanned_by_email: scan.scanned_by_email || '',
      notes: scan.notes
    }));

    res.status(200).json({
      success: true,
      data: {
        progress: {
          id: progressResult.id,
          customer_name: progressResult.customer_name,
          customer_email: progressResult.customer_email || '',
          reward_name: progressResult.reward_name,
          reward_description: progressResult.reward_description || '',
          stamps_collected: progressResult.stamps_collected,
          stamps_required: progressResult.stamps_required,
          is_completed: progressResult.is_completed,
          status: progressResult.status,
          created_at: progressResult.created_at,
          updated_at: progressResult.updated_at
        },
        scan_history: formattedScans
      },
      message: "Progress scan history retrieved successfully",
    });

  } catch (error) {
    console.error("Error retrieving progress scan history:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving scan history",

    });
  }
});

module.exports = router;
