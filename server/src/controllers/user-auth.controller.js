const UserAuthService = require("../services/user-auth.service");
const { logger } = require("../utils/logger");
const { successResponse, errorResponse } = require("../utils/response");

class UserAuthController {
  /**
   * Sign up a new user
   */
  static async signUp(req, res) {
    try {
      const { email, password, first_name, last_name, phone, role, tenant_id } =
        req.body;

      // Validate required fields
      if (!email || !password || !first_name || !last_name) {
        return errorResponse(res, "Missing required fields", 400);
      }

      // Validate role
      const validRoles = ["customer", "staff", "store_manager", "tenant_admin"];
      if (role && !validRoles.includes(role)) {
        return errorResponse(res, "Invalid role", 400);
      }

      const userData = {
        email,
        password,
        first_name,
        last_name,
        phone,
      };

      const result = await UserAuthService.createUser(
        userData,
        role || "customer",
        tenant_id
      );

      return successResponse(res, {
        message: "User created successfully",
        user: {
          id: result.db_user.id,
          email: result.db_user.email,
          first_name: result.db_user.first_name,
          last_name: result.db_user.last_name,
          role: result.db_user.role,
          tenant_id: result.db_user.tenant_id,
        },
        session: result.session,
      });
    } catch (error) {
      logger.error("Sign up error:", error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Sign in user
   */
  static async signIn(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return errorResponse(res, "Email and password are required", 400);
      }

      const result = await UserAuthService.signIn(email, password);

      return successResponse(res, {
        message: "Signed in successfully",
        user: {
          id: result.db_user.id,
          email: result.db_user.email,
          first_name: result.db_user.first_name,
          last_name: result.db_user.last_name,
          role: result.db_user.role,
          tenant_id: result.db_user.tenant_id,
          permissions: result.db_user.permissions,
        },
        session: result.session,
      });
    } catch (error) {
      logger.error("Sign in error:", error);
      return errorResponse(res, error.message, 401);
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return errorResponse(res, "Access token required", 401);
      }

      const accessToken = authHeader.substring(7);
      const result = await UserAuthService.getUserByToken(accessToken);

      return successResponse(res, {
        user: {
          id: result.db_user.id,
          email: result.db_user.email,
          first_name: result.db_user.first_name,
          last_name: result.db_user.last_name,
          role: result.db_user.role,
          tenant_id: result.db_user.tenant_id,
          permissions: result.db_user.permissions,
          avatar_url: result.db_user.avatar_url,
          phone: result.db_user.phone,
        },
      });
    } catch (error) {
      logger.error("Get current user error:", error);
      return errorResponse(res, error.message, 401);
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return errorResponse(res, "Access token required", 401);
      }

      const accessToken = authHeader.substring(7);
      const { first_name, last_name, phone, avatar_url } = req.body;

      // Get current user to get auth_user_id
      const currentUser = await UserAuthService.getUserByToken(accessToken);
      const authUserId = currentUser.auth_user.id;

      const updates = {};
      if (first_name) updates.first_name = first_name;
      if (last_name) updates.last_name = last_name;
      if (phone !== undefined) updates.phone = phone;
      if (avatar_url !== undefined) updates.avatar_url = avatar_url;

      if (Object.keys(updates).length === 0) {
        return errorResponse(res, "No updates provided", 400);
      }

      const result = await UserAuthService.updateUser(authUserId, updates);

      return successResponse(res, {
        message: "Profile updated successfully",
        user: {
          id: result.db_user.id,
          email: result.db_user.email,
          first_name: result.db_user.first_name,
          last_name: result.db_user.last_name,
          role: result.db_user.role,
          tenant_id: result.db_user.tenant_id,
          avatar_url: result.db_user.avatar_url,
          phone: result.db_user.phone,
        },
      });
    } catch (error) {
      logger.error("Update profile error:", error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Change password
   */
  static async changePassword(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return errorResponse(res, "Access token required", 401);
      }

      const accessToken = authHeader.substring(7);
      const { newPassword } = req.body;

      if (!newPassword) {
        return errorResponse(res, "New password is required", 400);
      }

      // Get current user to get auth_user_id
      const currentUser = await UserAuthService.getUserByToken(accessToken);
      const authUserId = currentUser.auth_user.id;

      await UserAuthService.changePassword(authUserId, newPassword);

      return successResponse(res, {
        message: "Password changed successfully",
      });
    } catch (error) {
      logger.error("Change password error:", error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Sign out user
   */
  static async signOut(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return errorResponse(res, "Access token required", 401);
      }

      const accessToken = authHeader.substring(7);
      await UserAuthService.signOut(accessToken);

      return successResponse(res, {
        message: "Signed out successfully",
      });
    } catch (error) {
      logger.error("Sign out error:", error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Refresh session
   */
  static async refreshSession(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return errorResponse(res, "Refresh token is required", 400);
      }

      const result = await UserAuthService.refreshSession(refresh_token);

      return successResponse(res, {
        message: "Session refreshed successfully",
        user: {
          id: result.db_user.id,
          email: result.db_user.email,
          first_name: result.db_user.first_name,
          last_name: result.db_user.last_name,
          role: result.db_user.role,
          tenant_id: result.db_user.tenant_id,
          permissions: result.db_user.permissions,
        },
        session: result.session,
      });
    } catch (error) {
      logger.error("Refresh session error:", error);
      return errorResponse(res, error.message, 401);
    }
  }

  /**
   * Get tenant users (admin only)
   */
  static async getTenantUsers(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return errorResponse(res, "Access token required", 401);
      }

      const accessToken = authHeader.substring(7);
      const currentUser = await UserAuthService.getUserByToken(accessToken);

      // Check if user has permission to view users
      if (!currentUser.db_user.hasPermission("user_manage")) {
        return errorResponse(res, "Insufficient permissions", 403);
      }

      const { tenant_id } = req.params;
      const { role, search, limit, offset } = req.query;

      const options = {};
      if (role) options.role = role;
      if (search) options.search = search;
      if (limit) options.limit = parseInt(limit);
      if (offset) options.offset = parseInt(offset);

      const users = await UserAuthService.getTenantUsers(tenant_id, options);

      return successResponse(res, {
        users: users.map((user) => ({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          is_active: user.is_active,
          email_verified: user.email_verified,
          last_login: user.last_login,
          created_at: user.created_at,
        })),
      });
    } catch (error) {
      logger.error("Get tenant users error:", error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Create user for tenant (admin only)
   */
  static async createTenantUser(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return errorResponse(res, "Access token required", 401);
      }

      const accessToken = authHeader.substring(7);
      const currentUser = await UserAuthService.getUserByToken(accessToken);

      // Check if user has permission to create users
      if (!currentUser.db_user.hasPermission("user_manage")) {
        return errorResponse(res, "Insufficient permissions", 403);
      }

      const { tenant_id } = req.params;
      const { email, password, first_name, last_name, phone, role } = req.body;

      if (!email || !password || !first_name || !last_name || !role) {
        return errorResponse(res, "Missing required fields", 400);
      }

      const userData = {
        email,
        password,
        first_name,
        last_name,
        phone,
      };

      const result = await UserAuthService.createUser(
        userData,
        role,
        tenant_id
      );

      return successResponse(res, {
        message: "User created successfully",
        user: {
          id: result.db_user.id,
          email: result.db_user.email,
          first_name: result.db_user.first_name,
          last_name: result.db_user.last_name,
          role: result.db_user.role,
          tenant_id: result.db_user.tenant_id,
        },
      });
    } catch (error) {
      logger.error("Create tenant user error:", error);
      return errorResponse(res, error.message, 500);
    }
  }
}

module.exports = UserAuthController;
