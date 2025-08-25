const SupabaseAuthService = require("../services/supabase-auth.service");
const ApiResponse = require("../utils/response");
const { logger } = require("../utils/logger");
const { db } = require("../config/database");

class SupabaseAuthController {
  /**
   * Sign up a new user
   */
  static async signUp(req, res, next) {
    try {
      const { email, password, firstName, lastName, role, phone } = req.body;

      const result = await SupabaseAuthService.signUp(email, password, {
        firstName,
        lastName,
        role: role || "user",
        phone: phone || "",
      });

      // Persist a corresponding profile record in our database users table
      let dbUserRecord = null;
      try {
        const insertResult = await db.query(
          `INSERT INTO users (
            auth_user_id,
            email,
            first_name,
            last_name,
            role,
            phone,
            email_verified,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
          ON CONFLICT (auth_user_id) DO UPDATE SET
            email = EXCLUDED.email,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            role = EXCLUDED.role,
            phone = EXCLUDED.phone,
            email_verified = EXCLUDED.email_verified,
            updated_at = EXCLUDED.updated_at
          RETURNING *`,
          [
            result.user.id,
            email,
            firstName,
            lastName,
            role || "user",
            phone || "",
            result.user.email_confirmed_at ? true : false,
            new Date(),
          ]
        );
        dbUserRecord = insertResult.rows ? insertResult.rows[0] : null;
      } catch (dbErr) {
        // Log but do not fail signup if profile insert has an issue
        logger.error(
          "User profile creation failed during signup:",
          dbErr.message
        );
      }

      logger.info(`User registered successfully: ${email}`);
      return ApiResponse.created(
        res,
        {
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.user_metadata?.first_name,
            lastName: result.user.user_metadata?.last_name,
            role: result.user.user_metadata?.role,
            phone: result.user.user_metadata?.phone,
            emailVerified: result.user.email_confirmed_at ? true : false,
            createdAt: result.user.created_at,
          },
          session: {
            accessToken: result.session.access_token,
            refreshToken: result.session.refresh_token,
            expiresAt: result.session.expires_at,
          },
          dbUser: dbUserRecord,
        },
        "User registered successfully"
      );
    } catch (error) {
      logger.error("Registration error:", error.message);
      next(error);
    }
  }

  /**
   * Create a new user (admin only)
   */
  static async createUser(req, res, next) {
    try {
      const { email, password, firstName, lastName, role, phone } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        return ApiResponse.badRequest(
          res,
          "Email, password, first name, and last name are required"
        );
      }

      // Validate password strength
      if (password.length < 6) {
        return ApiResponse.badRequest(
          res,
          "Password must be at least 6 characters long"
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return ApiResponse.badRequest(res, "Invalid email format");
      }

      // Check if user already exists
      const existingUser = await SupabaseAuthService.getUserByEmail(email);
      if (existingUser) {
        return ApiResponse.conflict(res, "User with this email already exists");
      }

      // First create the user in Supabase Auth
      const authResult = await SupabaseAuthService.signUp(email, password, {
        firstName,
        lastName,
        role: role || "staff",
        phone: phone || "",
      });

      if (!authResult?.user?.id) {
        throw new Error("Failed to create user in Supabase Auth");
      }

      // Then create the user record in our database
      const userRecord = await db.query(
        `INSERT INTO users (
          auth_user_id,
          email,
          first_name,
          last_name,
          role,
          phone,
          email_verified,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
        RETURNING *`,
        [
          authResult.user.id,
          email,
          firstName,
          lastName,
          role || "staff",
          phone || "",
          authResult.user.email_confirmed_at ? true : false,
          new Date(),
        ]
      );

      if (!userRecord.rows[0]) {
        // If user record creation fails, attempt to delete the auth user
        await SupabaseAuthService.deleteUser(authResult.user.id);
        throw new Error("Failed to create user record in database");
      }

      logger.info(`Admin created user successfully: ${email}`);
      return ApiResponse.created(
        res,
        {
          user: {
            id: authResult.user.id,
            email: authResult.user.email,
            firstName: authResult.user.user_metadata?.first_name,
            lastName: authResult.user.user_metadata?.last_name,
            role: authResult.user.user_metadata?.role,
            phone: authResult.user.user_metadata?.phone,
            emailVerified: authResult.user.email_confirmed_at ? true : false,
            createdAt: authResult.user.created_at,
          },
          dbUser: userRecord.rows[0],
        },
        "User created successfully"
      );
    } catch (error) {
      logger.error("Create user error:", error.message);
      next(error);
    }
  }

  /**
   * Sign in a user
   */
  static async signIn(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await SupabaseAuthService.signIn(email, password);

      logger.info(`User logged in successfully: ${email}`);
      return ApiResponse.success(
        res,
        {
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.user_metadata?.first_name,
            lastName: result.user.user_metadata?.last_name,
            role: result.user.user_metadata?.role,
            emailVerified: result.user.email_confirmed_at ? true : false,
          },
          session: {
            accessToken: result.session.access_token,
            refreshToken: result.session.refresh_token,
            expiresAt: result.session.expires_at,
          },
        },
        "Login successful"
      );
    } catch (error) {
      logger.error("Login error:", error.message);
      next(error);
    }
  }

  /**
   * Sign out a user
   */
  static async signOut(req, res, next) {
    try {
      const authHeader = req.headers["authorization"];
      const accessToken = authHeader?.split(" ")[1];

      if (accessToken) {
        await SupabaseAuthService.signOut(accessToken);
      }

      logger.info("User logged out successfully");
      return ApiResponse.success(res, null, "Logout successful");
    } catch (error) {
      logger.error("Logout error:", error.message);
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      const result = await SupabaseAuthService.refreshToken(refreshToken);

      logger.info("Token refreshed successfully");
      return ApiResponse.success(
        res,
        {
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.user_metadata?.first_name,
            lastName: result.user.user_metadata?.last_name,
            role: result.user.user_metadata?.role,
            emailVerified: result.user.email_confirmed_at ? true : false,
          },
          session: {
            accessToken: result.session.access_token,
            refreshToken: result.session.refresh_token,
            expiresAt: result.session.expires_at,
          },
        },
        "Token refreshed successfully"
      );
    } catch (error) {
      logger.error("Token refresh error:", error.message);
      next(error);
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req, res, next) {
    try {
      const user = req.user;

      return ApiResponse.success(
        res,
        {
          id: user.id,
          email: user.email,
          firstName: user.user_metadata?.first_name,
          lastName: user.user_metadata?.last_name,
          role: user.user_metadata?.role,
          emailVerified: user.email_confirmed_at ? true : false,
          createdAt: user.created_at,
          lastSignIn: user.last_sign_in_at,
        },
        "Profile retrieved successfully"
      );
    } catch (error) {
      logger.error("Get profile error:", error.message);
      next(error);
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req, res, next) {
    try {
      const { firstName, lastName } = req.body;
      const userId = req.user.id;

      const updatedUser = await SupabaseAuthService.updateUser(userId, {
        first_name: firstName,
        last_name: lastName,
      });

      logger.info(`Profile updated successfully for user: ${userId}`);
      return ApiResponse.success(
        res,
        {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.user_metadata?.first_name,
          lastName: updatedUser.user_metadata?.last_name,
          role: updatedUser.user_metadata?.role,
          emailVerified: updatedUser.email_confirmed_at ? true : false,
        },
        "Profile updated successfully"
      );
    } catch (error) {
      logger.error("Update profile error:", error.message);
      next(error);
    }
  }

  /**
   * Change user password
   */
  static async changePassword(req, res, next) {
    try {
      const { newPassword } = req.body;
      const userId = req.user.id;

      await SupabaseAuthService.changePassword(userId, newPassword);

      logger.info(`Password changed successfully for user: ${userId}`);
      return ApiResponse.success(res, null, "Password changed successfully");
    } catch (error) {
      logger.error("Change password error:", error.message);
      next(error);
    }
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers(req, res, next) {
    try {
      const users = await SupabaseAuthService.getAllUsers();

      const formattedUsers = users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.user_metadata?.first_name,
        lastName: user.user_metadata?.last_name,
        role: user.user_metadata?.role,
        phone: user.user_metadata?.phone,
        emailVerified: user.email_confirmed_at ? true : false,
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at,
        isActive: user.banned_until ? false : true,
      }));

      return ApiResponse.success(
        res,
        formattedUsers,
        "Users retrieved successfully"
      );
    } catch (error) {
      logger.error("Get all users error:", error.message);
      next(error);
    }
  }

  /**
   * Update user (admin only)
   */
  static async updateUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { firstName, lastName, role, phone } = req.body;

      const updatedUser = await SupabaseAuthService.updateUser(userId, {
        first_name: firstName,
        last_name: lastName,
        role: role,
        phone: phone,
      });

      logger.info(`User updated successfully: ${userId}`);
      return ApiResponse.success(
        res,
        {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.user_metadata?.first_name,
          lastName: updatedUser.user_metadata?.last_name,
          role: updatedUser.user_metadata?.role,
          phone: updatedUser.user_metadata?.phone,
          emailVerified: updatedUser.email_confirmed_at ? true : false,
        },
        "User updated successfully"
      );
    } catch (error) {
      logger.error("Update user error:", error.message);
      next(error);
    }
  }

  /**
   * Delete user (admin only)
   */
  static async deleteUser(req, res, next) {
    try {
      const { userId } = req.params;

      await SupabaseAuthService.deleteUser(userId);

      logger.info(`User deleted successfully: ${userId}`);
      return ApiResponse.success(res, null, "User deleted successfully");
    } catch (error) {
      logger.error("Delete user error:", error.message);
      next(error);
    }
  }
}

module.exports = SupabaseAuthController;
