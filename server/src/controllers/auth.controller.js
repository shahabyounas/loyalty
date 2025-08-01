const AuthService = require("../services/auth.service");
const ApiResponse = require("../utils/response");
const { logger } = require("../utils/logger");

class AuthController {
  static async register(req, res, next) {
    try {
      const { email, password, firstName, lastName } = req.body;

      const result = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
      });

      logger.info(`User registered successfully: ${email}`);
      return ApiResponse.created(res, result, "User registered successfully");
    } catch (error) {
      logger.error("Registration error:", error.message);
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login(email, password);

      logger.info(`User logged in successfully: ${email}`);
      return ApiResponse.success(res, result, "Login successful");
    } catch (error) {
      logger.error("Login error:", error.message);
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      const result = await AuthService.refreshToken(refreshToken);

      logger.info(
        `Token refreshed successfully for user: ${result.user.email}`
      );
      return ApiResponse.success(res, result, "Token refreshed successfully");
    } catch (error) {
      logger.error("Token refresh error:", error.message);
      next(error);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      const result = await AuthService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      logger.info(`Password changed successfully for user: ${req.user.email}`);
      return ApiResponse.success(res, result, "Password changed successfully");
    } catch (error) {
      logger.error("Password change error:", error.message);
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      // In a real application, you might want to blacklist the token
      // For now, we'll just return a success response
      logger.info(`User logged out: ${req.user.email}`);
      return ApiResponse.success(res, null, "Logout successful");
    } catch (error) {
      logger.error("Logout error:", error.message);
      next(error);
    }
  }

  static async getProfile(req, res, next) {
    try {
      // Return the user profile from the authenticated request
      return ApiResponse.success(
        res,
        req.user,
        "Profile retrieved successfully"
      );
    } catch (error) {
      logger.error("Get profile error:", error.message);
      next(error);
    }
  }
}

module.exports = AuthController;
