const { logger } = require("../utils/logger");
const ApiResponse = require("../utils/response");

const errorHandler = (err, req, res, next) => {
  logger.error("Error occurred:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Handle validation errors
  if (err.name === "ValidationError") {
    return ApiResponse.validationError(res, err.errors);
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return ApiResponse.unauthorized(res, "Invalid token");
  }

  if (err.name === "TokenExpiredError") {
    return ApiResponse.unauthorized(res, "Token expired");
  }

  // Handle duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return ApiResponse.conflict(res, `${field} already exists`);
  }

  // Handle cast errors (invalid ObjectId, etc.)
  if (err.name === "CastError") {
    return ApiResponse.badRequest(res, "Invalid ID format");
  }

  // Handle syntax errors
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return ApiResponse.badRequest(res, "Invalid JSON format");
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  return ApiResponse.error(res, message, statusCode);
};

module.exports = { errorHandler };
