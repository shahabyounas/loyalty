module.exports = {
  secret:
    process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production",
  expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  refreshSecret:
    process.env.JWT_REFRESH_SECRET ||
    "your-super-secret-refresh-key-change-in-production",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  issuer: process.env.JWT_ISSUER || "loyalty-api",
  audience: process.env.JWT_AUDIENCE || "loyalty-users",
};
