const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt");
const ApiResponse = require("../utils/response");
const { logger } = require("../utils/logger");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return ApiResponse.unauthorized(res, "Access token required");
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });

    req.user = decoded;
    next();
  } catch (error) {
    logger.error("Token verification failed:", error.message);

    if (error.name === "TokenExpiredError") {
      return ApiResponse.unauthorized(res, "Token expired");
    } else if (error.name === "JsonWebTokenError") {
      return ApiResponse.unauthorized(res, "Invalid token");
    }

    return ApiResponse.unauthorized(res, "Token verification failed");
  }
};

const authenticateRefreshToken = (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return ApiResponse.badRequest(res, "Refresh token required");
  }

  try {
    const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });

    req.user = decoded;
    next();
  } catch (error) {
    logger.error("Refresh token verification failed:", error.message);

    if (error.name === "TokenExpiredError") {
      return ApiResponse.unauthorized(res, "Refresh token expired");
    } else if (error.name === "JsonWebTokenError") {
      return ApiResponse.unauthorized(res, "Invalid refresh token");
    }

    return ApiResponse.unauthorized(res, "Refresh token verification failed");
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, "Authentication required");
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return ApiResponse.forbidden(res, "Insufficient permissions");
    }

    next();
  };
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return ApiResponse.unauthorized(res, "Authentication required");
  }

  const userRole = req.user.role;
  const adminRoles = ["super_admin", "admin"];

  if (!adminRoles.includes(userRole)) {
    return ApiResponse.forbidden(res, "Admin access required");
  }

  next();
};

module.exports = {
  authenticateToken,
  authenticateRefreshToken,
  requireRole,
  requireAdmin,
};
