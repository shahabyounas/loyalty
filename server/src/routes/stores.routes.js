const express = require("express");
const router = express.Router();
const Store = require("../models/store.model");
const {
  authenticateUser,
  requireAdmin,
} = require("../middleware/supabase-auth.middleware");
const { validateRequest } = require("../middleware/validation.middleware");
const Joi = require("joi");

// Validation schemas
const createStoreValidation = Joi.object({
  name: Joi.string().required().min(1).max(255),
  address: Joi.string().optional().max(500),
  city: Joi.string().optional().max(100),
  country: Joi.string().optional().max(100).default("UK"),
  postal_code: Joi.string().optional().max(20),
  phone: Joi.string().optional().max(20),
  email: Joi.string().email().optional().max(255),
  is_active: Joi.boolean().default(true),
});

const updateStoreValidation = Joi.object({
  name: Joi.string().optional().min(1).max(255),
  address: Joi.string().optional().max(500),
  city: Joi.string().optional().max(100),
  country: Joi.string().optional().max(100),
  postal_code: Joi.string().optional().max(20),
  phone: Joi.string().optional().max(20),
  email: Joi.string().email().optional().max(255),
  is_active: Joi.boolean().optional(),
});

// Get all stores (admin only)
router.get("/", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, city } = req.query;
    const offset = (page - 1) * limit;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
    };

    if (search) {
      options.search = search;
    }

    if (city) {
      options.city = city;
    }

    const stores = await Store.findAll(options);
    const totalCount = await Store.count(options);

    res.json({
      stores,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page),
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching stores:", error);
    res.status(500).json({ error: "Failed to fetch stores" });
  }
});

// Get store by ID (admin only)
router.get("/:id", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }
    res.json(store);
  } catch (error) {
    console.error("Error fetching store:", error);
    res.status(500).json({ error: "Failed to fetch store" });
  }
});

// Create new store (admin only)
router.post(
  "/",
  authenticateUser,
  requireAdmin,
  validateRequest(createStoreValidation),
  async (req, res) => {
    try {
      console.log("req.user--", req.user);
      const storeData = {
        ...req.body,
        tenant_id: req.user.tenant_id || req.user.id, // Default tenant for now
      };

      const store = await Store.create(storeData);
      res.status(201).json(store);
    } catch (error) {
      console.error("Error creating store:", error);
      res.status(500).json({ error: "Failed to create store" });
    }
  }
);

// Update store (admin only)
router.put(
  "/:id",
  authenticateUser,
  requireAdmin,
  validateRequest(updateStoreValidation),
  async (req, res) => {
    try {
      const store = await Store.update(req.params.id, req.body);
      if (!store) {
        return res.status(404).json({ error: "Store not found" });
      }
      res.json(store);
    } catch (error) {
      console.error("Error updating store:", error);
      res.status(500).json({ error: "Failed to update store" });
    }
  }
);

// Delete store (admin only)
router.delete("/:id", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const store = await Store.delete(req.params.id);
    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }
    res.json({ message: "Store deleted successfully" });
  } catch (error) {
    console.error("Error deleting store:", error);
    res.status(500).json({ error: "Failed to delete store" });
  }
});

module.exports = router;
