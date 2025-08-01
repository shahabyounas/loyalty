const { supabase, supabaseAnon } = require("../config/supabase");
const { logger } = require("../utils/logger");

class SupabaseAuthService {
  /**
   * Sign up a new user
   */
  static async signUp(email, password, userData = {}) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email for development
        user_metadata: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role || "user",
        },
      });

      if (error) {
        logger.error("Sign up error:", error);
        throw new Error(error.message);
      }

      // After creating the user, sign them in to get a session
      const signInResult = await this.signIn(email, password);

      logger.info(`User signed up successfully: ${email}`);
      return signInResult;
    } catch (error) {
      logger.error("Sign up failed:", error.message);
      throw error;
    }
  }

  /**
   * Sign in a user
   */
  static async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.error("Sign in error:", error);
        throw new Error(error.message);
      }

      logger.info(`User signed in successfully: ${email}`);
      return {
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      logger.error("Sign in failed:", error.message);
      throw error;
    }
  }

  /**
   * Sign out a user
   */
  static async signOut(accessToken) {
    try {
      const { error } = await supabase.auth.admin.signOut(accessToken);

      if (error) {
        logger.error("Sign out error:", error);
        throw new Error(error.message);
      }

      logger.info("User signed out successfully");
      return { message: "Signed out successfully" };
    } catch (error) {
      logger.error("Sign out failed:", error.message);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken) {
    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) {
        logger.error("Token refresh error:", error);
        throw new Error(error.message);
      }

      logger.info("Token refreshed successfully");
      return {
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      logger.error("Token refresh failed:", error.message);
      throw error;
    }
  }

  /**
   * Get user by access token
   */
  static async getUser(accessToken) {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(accessToken);

      if (error) {
        logger.error("Get user error:", error);
        throw new Error(error.message);
      }

      return user;
    } catch (error) {
      logger.error("Get user failed:", error.message);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateUser(userId, updates) {
    try {
      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: updates,
      });

      if (error) {
        logger.error("Update user error:", error);
        throw new Error(error.message);
      }

      logger.info(`User updated successfully: ${userId}`);
      return data.user;
    } catch (error) {
      logger.error("Update user failed:", error.message);
      throw error;
    }
  }

  /**
   * Change user password
   */
  static async changePassword(userId, newPassword) {
    try {
      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (error) {
        logger.error("Change password error:", error);
        throw new Error(error.message);
      }

      logger.info(`Password changed successfully for user: ${userId}`);
      return { message: "Password changed successfully" };
    } catch (error) {
      logger.error("Change password failed:", error.message);
      throw error;
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(userId) {
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) {
        logger.error("Delete user error:", error);
        throw new Error(error.message);
      }

      logger.info(`User deleted successfully: ${userId}`);
      return { message: "User deleted successfully" };
    } catch (error) {
      logger.error("Delete user failed:", error.message);
      throw error;
    }
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers() {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();

      if (error) {
        logger.error("Get all users error:", error);
        throw new Error(error.message);
      }

      return data.users;
    } catch (error) {
      logger.error("Get all users failed:", error.message);
      throw error;
    }
  }

  /**
   * Verify JWT token
   */
  static async verifyToken(accessToken) {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(accessToken);

      if (error) {
        logger.error("Token verification error:", error);
        throw new Error(error.message);
      }

      return user;
    } catch (error) {
      logger.error("Token verification failed:", error.message);
      throw error;
    }
  }

  /**
   * Create a new session for a user (admin only)
   */
  static async createSession(userId) {
    try {
      const { data, error } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: userId,
        options: {
          redirectTo: process.env.FRONTEND_URL,
        },
      });

      if (error) {
        logger.error("Create session error:", error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      logger.error("Create session failed:", error.message);
      throw error;
    }
  }
}

module.exports = SupabaseAuthService;
