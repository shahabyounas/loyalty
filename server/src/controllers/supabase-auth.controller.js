const SupabaseAuthService = require("../services/supabase-auth.service");
const ApiResponse = require("../utils/response");
const { logger } = require("../utils/logger");
const User = require("../models/user.model");

class SupabaseAuthController {
  /**
   * Sign up a new user
   */
  static async signUp(req, res, next) {
    try {
      const { email, password, firstName, lastName, role, phone } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName || !phone) {
        return ApiResponse.badRequest(
          res,
          "Email, password, first name, last name, and phone number are required"
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

      // Validate phone number format (basic validation for international numbers)
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
        return ApiResponse.badRequest(res, "Invalid phone number format");
      }

      // Check if user already exists in our database (efficient check)
      // Using database check instead of Supabase Auth to avoid fetching all users
      const existingDbUser = await User.findByEmail(email);
      if (existingDbUser) {
        return ApiResponse.conflict(
          res,
          "An account with this email already exists. Please login instead."
        );
      }

      // Check if phone number already exists
      const existingPhoneUser = await User.findByPhone(phone);
      if (existingPhoneUser) {
        return ApiResponse.conflict(
          res,
          "An account with this phone number already exists. Please use a different phone number."
        );
      }

      const result = await SupabaseAuthService.signUp(email, password, {
        firstName,
        lastName,
        role: role || "customer",
        phone: phone,
      });

      // Create a corresponding profile record in our database users table
      let dbUserRecord = null;
      try {
        dbUserRecord = await User.create({
          auth_user_id: result.user.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          role: role || "customer",
          phone: phone,
          email_verified: result.user.email_confirmed_at ? true : false,
        });
      } catch (dbErr) {
        // If user record creation fails, attempt to delete the auth user
        try {
          await SupabaseAuthService.deleteUser(result.user.id);
        } catch (deleteErr) {``
          logger.error("Failed to cleanup auth user after DB error:", deleteErr.message);
        }
        logger.error("User profile creation failed during signup:", dbErr.message);
        throw new Error("Failed to create user profile. Please try again.");
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
            phone: result.user.phone,
            emailVerified: result.user.email_confirmed_at ? true : false,
            createdAt: result.user.created_at,
          },
          session: {
            accessToken: result.session.access_token,
            refreshToken: result.session.refresh_token,
            expiresAt: result.session.expires_at,
          },
          dbUser: dbUserRecord ? dbUserRecord.toJSON() : null,
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
      if (!email || !password || !firstName || !lastName || !phone) {
        return ApiResponse.badRequest(
          res,
          "Email, password, first name, last name, and phone number are required"
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

      // Validate phone number format (basic validation for international numbers)
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
        return ApiResponse.badRequest(res, "Invalid phone number format");
      }

      // Check if user already exists in our database (efficient check)
      // Using database check instead of Supabase Auth to avoid fetching all users
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return ApiResponse.conflict(res, "User with this email already exists");
      }

      // Check if phone number already exists
      const existingPhoneUser = await User.findByPhone(phone);
      if (existingPhoneUser) {
        return ApiResponse.conflict(
          res,
          "User with this phone number already exists"
        );
      }

      // First create the user in Supabase Auth
      const authResult = await SupabaseAuthService.signUp(email, password, {
        firstName,
        lastName,
        role: role || "staff",
        phone: phone,
      });

      if (!authResult?.user?.id) {
        throw new Error("Failed to create user in Supabase Auth");
      }

      // Then create the user record in our database
      const userRecord = await User.create({
        auth_user_id: authResult.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        role: role || "staff",
        phone: phone,
        email_verified: authResult.user.email_confirmed_at ? true : false,
      });

      if (!userRecord) {
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
          dbUser: userRecord.toJSON(),
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

      // Update last login time in our database
      try {
        const dbUser = await User.findByAuthUserId(result.user.id);
        if (dbUser) {
          await User.updateLastLogin(dbUser.id, dbUser.tenant_id);
        }
      } catch (dbErr) {
        // Log but don't fail login if last login update fails
        logger.warn("Failed to update last login:", dbErr.message);
      }

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
