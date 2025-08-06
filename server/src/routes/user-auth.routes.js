const express = require("express");
const UserAuthController = require("../controllers/user-auth.controller");

const router = express.Router();

/**
 * @route POST /api/auth/signup
 * @desc Sign up a new user
 * @access Public
 */
router.post("/signup", UserAuthController.signUp);

/**
 * @route POST /api/auth/signin
 * @desc Sign in user
 * @access Public
 */
router.post("/signin", UserAuthController.signIn);

/**
 * @route POST /api/auth/signout
 * @desc Sign out user
 * @access Private
 */
router.post("/signout", UserAuthController.signOut);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh user session
 * @access Public
 */
router.post("/refresh", UserAuthController.refreshSession);

/**
 * @route GET /api/auth/me
 * @desc Get current user
 * @access Private
 */
router.get("/me", UserAuthController.getCurrentUser);

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile
 * @access Private
 */
router.put("/profile", UserAuthController.updateProfile);

/**
 * @route PUT /api/auth/password
 * @desc Change user password
 * @access Private
 */
router.put("/password", UserAuthController.changePassword);

/**
 * @route GET /api/auth/tenants/:tenant_id/users
 * @desc Get users for a tenant (admin only)
 * @access Private (Admin)
 */
router.get("/tenants/:tenant_id/users", UserAuthController.getTenantUsers);

/**
 * @route POST /api/auth/tenants/:tenant_id/users
 * @desc Create user for a tenant (admin only)
 * @access Private (Admin)
 */
router.post("/tenants/:tenant_id/users", UserAuthController.createTenantUser);

module.exports = router; 