const express = require("express");
const router = express.Router();
const Reward = require("../models/reward.model");
const {
  authenticateUser,
  requireAdmin,
} = require("../middleware/supabase-auth.middleware");
const { validateRequest } = require("../middleware/validation.middleware");
const Joi = require("joi");

// Validation schemas
const createRewardValidation = Joi.object({
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().required().min(1).max(1000),
  type: Joi.string().valid("discount", "free_item", "cashback").required(),
  discount_amount: Joi.number().precision(2).optional(),
  discount_percentage: Joi.number().precision(2).optional(),
  points_required: Joi.number().integer().min(0).required(),
  is_active: Joi.boolean().default(true),
  expiry_date: Joi.date().iso().required(),
});

const updateRewardValidation = Joi.object({
  name: Joi.string().optional().min(1).max(255),
  description: Joi.string().optional().min(1).max(1000),
  type: Joi.string().valid("discount", "free_item", "cashback").optional(),
  discount_amount: Joi.number().precision(2).optional(),
  discount_percentage: Joi.number().precision(2).optional(),
  points_required: Joi.number().integer().min(0).optional(),
  is_active: Joi.boolean().optional(),
  expiry_date: Joi.date().iso().optional(),
});

// Helper function to convert frontend data to model format
const convertToModelFormat = (frontendData) => {
  console.log("frontendData=---", frontendData);
  const modelData = {
    name: frontendData.name,
    description: frontendData.description,
    reward_type: frontendData.type,
    points_cost: frontendData.points_required,
    is_active: frontendData.is_active,
    valid_from: new Date().toISOString(),
    valid_until: frontendData.expiry_date,
    max_redemptions: null, // Default to unlimited
  };

  // Add tenant_id if provided
  if (frontendData.tenant_id) {
    modelData.tenant_id = frontendData.tenant_id;
  }

  // Map discount fields based on reward type
  switch (frontendData.type) {
    case "discount":
      // For discount, use discount_percentage
      modelData.discount_percentage = frontendData.discount_percentage || 0;
      modelData.discount_amount = null;
      console.log(
        "Discount: discount_percentage =",
        modelData.discount_percentage
      );
      break;
    case "free_item":
      // For free item, no monetary value needed
      modelData.discount_amount = null;
      modelData.discount_percentage = null;
      console.log("Free item: no monetary value");
      break;
    case "cashback":
      // For cashback, use discount_amount
      modelData.discount_amount = frontendData.discount_amount || 0;
      modelData.discount_percentage = null;
      console.log("Cashback: discount_amount =", modelData.discount_amount);
      break;
    default:
      console.log("Unknown reward type:", frontendData.type);
  }

  console.log("Final modelData:", modelData);
  return modelData;
};

// Helper function to convert model data to frontend format
const convertToFrontendFormat = (modelData) => {
  // Convert PostgreSQL numeric fields to numbers
  const parseNumeric = (value) => {
    if (value === null || value === undefined) return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  return {
    id: modelData.id,
    name: modelData.name,
    description: modelData.description,
    type: modelData.reward_type,
    discount_amount: parseNumeric(modelData.discount_amount),
    discount_percentage: parseNumeric(modelData.discount_percentage),
    points_required: modelData.points_cost,
    is_active: modelData.is_active,
    expiry_date: modelData.valid_until,
    created_at: modelData.created_at,
  };
};

// Get all rewards (admin only)
router.get("/", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type, status } = req.query;
    const offset = (page - 1) * limit;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
    };

    if (search) {
      options.search = search;
    }

    if (type && type !== "all") {
      options.reward_type = type;
    }

    // Get tenant ID from user
    const tenantId = req.user.tenant_id || req.user.id;

    const rewards = await Reward.findAll(options, tenantId);
    const totalCount = await Reward.count(options, tenantId);

    // Convert to frontend format
    const formattedRewards = rewards.map(convertToFrontendFormat);

    res.json({
      data: formattedRewards,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page),
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching rewards:", error);
    res.status(500).json({ error: "Failed to fetch rewards" });
  }
});

// Get reward by ID (admin only)
router.get("/:id", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id || req.user.id;

    const reward = await Reward.findById(req.params.id, tenantId);

    if (!reward) {
      return res.status(404).json({ error: "Reward not found" });
    }

    const formattedReward = convertToFrontendFormat(reward);
    res.json(formattedReward);
  } catch (error) {
    console.error("Error fetching reward:", error);
    res.status(500).json({ error: "Failed to fetch reward" });
  }
});

// Create new reward (admin only)
router.post(
  "/",
  authenticateUser,
  requireAdmin,
  validateRequest(createRewardValidation),
  async (req, res) => {
    try {
      const tenantId = req.user.tenant_id || req.user.id;

      const modelData = convertToModelFormat({
        ...req.body,
        tenant_id: tenantId,
      });

      const reward = await Reward.create(modelData);

      const formattedReward = convertToFrontendFormat(reward);

      res.status(201).json(formattedReward);
    } catch (error) {
      console.error("Error creating reward:", error);
      res.status(500).json({ error: "Failed to create reward" });
    }
  }
);

// Update reward (admin only)
router.put(
  "/:id",
  authenticateUser,
  requireAdmin,
  validateRequest(updateRewardValidation),
  async (req, res) => {
    try {
      const tenantId = req.user.tenant_id || req.user.id;

      const modelData = convertToModelFormat(req.body);

      const reward = await Reward.update(req.params.id, modelData, tenantId);

      if (!reward) {
        return res.status(404).json({ error: "Reward not found" });
      }

      const formattedReward = convertToFrontendFormat(reward);
      res.json(formattedReward);
    } catch (error) {
      console.error("Error updating reward:", error);
      res.status(500).json({ error: "Failed to update reward" });
    }
  }
);

// Delete reward (admin only)
router.delete("/:id", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id || req.user.id;
    const success = await Reward.delete(req.params.id, tenantId);

    if (!success) {
      return res.status(404).json({ error: "Reward not found" });
    }

    res.json({ message: "Reward deleted successfully" });
  } catch (error) {
    console.error("Error deleting reward:", error);
    res.status(500).json({ error: "Failed to delete reward" });
  }
});

module.exports = router;
