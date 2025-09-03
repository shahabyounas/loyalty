const SupabaseAuthService = require("../services/supabase-auth.service");
const ApiResponse = require("../utils/response");
const { logger } = require("../utils/logger");
const { User } = require("../models");

/**
 * Middleware to authenticate user using Supabase JWT token
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return ApiResponse.unauthorized(res, "Access token required");
    }

    const accessToken = authHeader.split(" ")[1];

    // Verify the token with Supabase
    const user = await SupabaseAuthService.verifyToken(accessToken);

    if (!user) {
      return ApiResponse.unauthorized(res, "Invalid or expired token");
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    logger.error("Authentication error:", error.message);

    if (error.message.includes("JWT")) {
      return ApiResponse.unauthorized(res, "Invalid token");
    }

    if (error.message.includes("expired")) {
      return ApiResponse.unauthorized(res, "Token expired");
    }

    return ApiResponse.unauthorized(res, "Authentication failed");
  }
};

/**
 * Middleware to require specific user role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, "Authentication required");
    }

    const userRole = req.user.user_metadata?.role || "admin";
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return ApiResponse.forbidden(res, "Insufficient permissions");
    }

    next();
  };
};

/**
 * Middleware to require admin role
 */
const requireAdmin = (req, res, next) => {
  return requireRole(["super_admin", "admin"])(req, res, next);
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const accessToken = authHeader.split(" ")[1];
      const user = await SupabaseAuthService.verifyToken(accessToken);

      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Don't fail the request, just continue without user
    logger.warn("Optional auth failed:", error.message);
    next();
  }
};


const mergeUserTenant = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const user = await User.findByAuthUserId(req.user.id);
    if (user) {
      req.user.tenant_id = user.tenant_id;
    }

    next();
  } catch (error) {
    logger.error("Error merging user tenant:", error.message);
    next();
  }
};

module.exports = {
  authenticateUser,
  requireRole,
  requireAdmin,
  optionalAuth,
  mergeUserTenant,
};
