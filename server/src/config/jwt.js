module.exports = {
  secret:
    process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production",
  // Short-lived access token for security
  expiresIn: process.env.JWT_EXPIRES_IN || "2h", 
  refreshSecret:
    process.env.JWT_REFRESH_SECRET ||
    "your-super-secret-refresh-key-change-in-production",
  // Long-lived refresh token for persistence
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "90d", // 3 months
  // Remember me tokens for even longer persistence
  rememberMeExpiresIn: process.env.JWT_REMEMBER_ME_EXPIRES_IN || "365d", // 1 year
  issuer: process.env.JWT_ISSUER || "loyalty-api",
  audience: process.env.JWT_AUDIENCE || "loyalty-users",
};
