const SupabaseAuthService = require("./supabase-auth.service");
const { User } = require("../models");
const { logger } = require("../utils/logger");

class UserAuthService {
  /**
   * Create a new user in Supabase Auth and link to database
   */
  static async createUser(userData, role = "customer", tenantId = null) {
    try {
      // 1. Create user in Supabase Auth first
      const authUserData = {
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: role,
      };

      const authResult = await SupabaseAuthService.signUp(
        userData.email,
        userData.password,
        authUserData
      );

      const authUserId = authResult.user.id;

      // 2. Create user in our database with reference to Supabase Auth user
      let dbUser;
      switch (role) {
        case "super_admin":
          dbUser = await User.createSuperAdmin(authUserId, userData);
          break;
        case "tenant_admin":
          dbUser = await User.createTenantAdmin(authUserId, userData, tenantId);
          break;
        case "store_manager":
        case "staff":
          dbUser = await User.create({
            auth_user_id: authUserId,
            tenant_id: tenantId,
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone: userData.phone,
            avatar_url: userData.avatar_url,
            role: role,
            email_verified: true,
          });
          break;
        case "customer":
        default:
          dbUser = await User.createCustomer(authUserId, userData, tenantId);
          break;
      }

      logger.info(`User created successfully: ${userData.email} (${role})`);
      return {
        auth_user: authResult.user,
        db_user: dbUser,
        session: authResult.session,
      };
    } catch (error) {
      logger.error("User creation failed:", error);
      throw error;
    }
  }

  /**
   * Create a super admin user
   */
  static async createSuperAdmin(userData) {
    return await this.createUser(userData, "super_admin");
  }

  /**
   * Create a tenant admin user
   */
  static async createTenantAdmin(userData, tenantId) {
    return await this.createUser(userData, "tenant_admin", tenantId);
  }

  /**
   * Create a store manager user
   */
  static async createStoreManager(userData, tenantId) {
    return await this.createUser(userData, "store_manager", tenantId);
  }

  /**
   * Create a staff user
   */
  static async createStaff(userData, tenantId) {
    return await this.createUser(userData, "staff", tenantId);
  }

  /**
   * Create a customer user
   */
  static async createCustomer(userData, tenantId) {
    return await this.createUser(userData, "customer", tenantId);
  }

  /**
   * Sign in user and get database user info
   */
  static async signIn(email, password) {
    try {
      // 1. Sign in with Supabase Auth
      const authResult = await SupabaseAuthService.signIn(email, password);

      // 2. Get user from our database
      const dbUser = await User.findByAuthUserId(authResult.user.id);
      if (!dbUser) {
        throw new Error("User not found in database");
      }

      // 3. Update last login
      await User.updateLastLogin(dbUser.id, dbUser.tenant_id);

      logger.info(`User signed in successfully: ${email}`);
      return {
        auth_user: authResult.user,
        db_user: dbUser,
        session: authResult.session,
      };
    } catch (error) {
      logger.error("Sign in failed:", error);
      throw error;
    }
  }

  /**
   * Get user by access token
   */
  static async getUserByToken(accessToken) {
    try {
      // 1. Verify token with Supabase Auth
      const authUser = await SupabaseAuthService.getUser(accessToken);

      // 2. Get user from our database
      const dbUser = await User.findByAuthUserId(authUser.id);
      if (!dbUser) {
        throw new Error("User not found in database");
      }

      return {
        auth_user: authUser,
        db_user: dbUser,
      };
    } catch (error) {
      logger.error("Get user by token failed:", error);
      throw error;
    }
  }

  /**
   * Update user profile in both Supabase Auth and database
   */
  static async updateUser(authUserId, updates) {
    try {
      // 1. Update in Supabase Auth
      const authUpdates = {};
      if (updates.first_name) authUpdates.first_name = updates.first_name;
      if (updates.last_name) authUpdates.last_name = updates.last_name;

      if (Object.keys(authUpdates).length > 0) {
        await SupabaseAuthService.updateUser(authUserId, authUpdates);
      }

      // 2. Update in our database
      const dbUser = await User.findByAuthUserId(authUserId);
      if (!dbUser) {
        throw new Error("User not found in database");
      }

      const updatedDbUser = await User.update(
        dbUser.id,
        updates,
        dbUser.tenant_id
      );

      logger.info(`User updated successfully: ${authUserId}`);
      return {
        auth_user: { id: authUserId, ...authUpdates },
        db_user: updatedDbUser,
      };
    } catch (error) {
      logger.error("User update failed:", error);
      throw error;
    }
  }

  /**
   * Delete user from both Supabase Auth and database
   */
  static async deleteUser(authUserId) {
    try {
      // 1. Get user from database first
      const dbUser = await User.findByAuthUserId(authUserId);
      if (!dbUser) {
        throw new Error("User not found in database");
      }

      // 2. Delete from Supabase Auth
      await SupabaseAuthService.deleteUser(authUserId);

      // 3. Soft delete from our database
      await User.delete(dbUser.id, dbUser.tenant_id);

      logger.info(`User deleted successfully: ${authUserId}`);
      return { message: "User deleted successfully" };
    } catch (error) {
      logger.error("User deletion failed:", error);
      throw error;
    }
  }

  /**
   * Change user password in Supabase Auth
   */
  static async changePassword(authUserId, newPassword) {
    try {
      await SupabaseAuthService.changePassword(authUserId, newPassword);
      logger.info(`Password changed successfully for user: ${authUserId}`);
      return { message: "Password changed successfully" };
    } catch (error) {
      logger.error("Password change failed:", error);
      throw error;
    }
  }

  /**
   * Get all users for a tenant
   */
  static async getTenantUsers(tenantId, options = {}) {
    try {
      const users = await User.findAll(options, tenantId);
      return users;
    } catch (error) {
      logger.error("Get tenant users failed:", error);
      throw error;
    }
  }

  /**
   * Get users by role for a tenant
   */
  static async getUsersByRole(role, tenantId) {
    try {
      const users = await User.getUsersByRole(role, tenantId);
      return users;
    } catch (error) {
      logger.error("Get users by role failed:", error);
      throw error;
    }
  }

  /**
   * Verify user permissions
   */
  static async verifyPermissions(authUserId, requiredPermission) {
    try {
      const dbUser = await User.findByAuthUserId(authUserId);
      if (!dbUser) {
        throw new Error("User not found");
      }

      return dbUser.hasPermission(requiredPermission);
    } catch (error) {
      logger.error("Permission verification failed:", error);
      throw error;
    }
  }

  /**
   * Refresh user session
   */
  static async refreshSession(refreshToken) {
    try {
      const authResult = await SupabaseAuthService.refreshToken(refreshToken);

      // Get updated database user info
      const dbUser = await User.findByAuthUserId(authResult.user.id);

      return {
        auth_user: authResult.user,
        db_user: dbUser,
        session: authResult.session,
      };
    } catch (error) {
      logger.error("Session refresh failed:", error);
      throw error;
    }
  }

  /**
   * Sign out user
   */
  static async signOut(accessToken) {
    try {
      await SupabaseAuthService.signOut(accessToken);
      logger.info("User signed out successfully");
      return { message: "Signed out successfully" };
    } catch (error) {
      logger.error("Sign out failed:", error);
      throw error;
    }
  }

  /**
   * Get all users from Supabase Auth (admin only)
   */
  static async getAllAuthUsers() {
    try {
      const authUsers = await SupabaseAuthService.getAllUsers();
      return authUsers;
    } catch (error) {
      logger.error("Get all auth users failed:", error);
      throw error;
    }
  }

  /**
   * Verify JWT token
   */
  static async verifyToken(accessToken) {
    try {
      const authUser = await SupabaseAuthService.verifyToken(accessToken);
      return authUser;
    } catch (error) {
      logger.error("Token verification failed:", error);
      throw error;
    }
  }
}

module.exports = UserAuthService;
