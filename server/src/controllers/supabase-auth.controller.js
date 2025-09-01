const SupabaseAuthService = require("../services/supabase-auth.service");
const ApiResponse = require("../utils/response");
const { logger } = require("../utils/logger");
const User = require("../models/user.model");
const Tenant = require("../models/tenant.model");

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

      // Determine tenant from request domain
      let tenantId = null;
      try {
        const origin = req.headers.origin || req.headers.referer;
        if (origin) {
          // Extract and normalize domain from origin/referer
          const url = new URL(origin);
          const cleanDomain = url.host; // Just the hostname without protocol or path
          
          logger.info(`Signup request from domain: ${cleanDomain}`);
          
          // Find tenant by normalized domain
          const tenant = await Tenant.findByDomain(cleanDomain);
          console.log(`Assigned tenant ${tenant} (${tenantId}) for domain ${cleanDomain}`);
          
          if (tenant) {
            tenantId = tenant.id;
            console.log(`Assigned tenant ${tenant.business_name} (${tenantId}) for domain ${cleanDomain}`);
          } else {
            logger.warn(`No tenant found for domain: ${cleanDomain}`);
          }
        } else {
          logger.warn("No origin/referer header found in signup request");
        }
      } catch (domainErr) {
        logger.error("Error determining tenant from domain:", domainErr.message);
        // Continue without tenant assignment - don't fail signup
      }

      const result = await SupabaseAuthService.signUp(email, password, {
        firstName,
        lastName,
        role: role || "customer",
        phone: phone,
        tenant_id: tenantId, // Custom field to track tenant association
      });

      // Create a corresponding profile record in our database users table
      let dbUserRecord = null;
      try {
        dbUserRecord = await User.create({
          auth_user_id: result.user.id,
          tenant_id: tenantId,
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

      // Update last login time in our database and get user profile
      let dbUser = null;
      try {
        dbUser = await User.findByAuthUserId(result.user.id);
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
          dbUser, // Include database user profile
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
   * Request password reset
   */
  static async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body;

      // Validate email
      if (!email) {
        return ApiResponse.badRequest(res, "Email is required");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return ApiResponse.badRequest(res, "Invalid email format");
      }

      // Check if user exists in our database first
      const existingUser = await User.findByEmail(email);
      if (!existingUser) {
        return ApiResponse.notFound(
          res, 
          "No account found with this email address. Please check your email or create a new account."
        );
      }

      // Generate reset URL based on request origin
      const origin = req.headers.origin || req.headers.referer || process.env.FRONTEND_URL;
      const resetUrl = `${origin}/auth/reset-password`;

      // Send password reset email
      await SupabaseAuthService.requestPasswordReset(email, resetUrl);

      logger.info(`Password reset requested for: ${email}`);
      return ApiResponse.success(
        res,
        null,
        "Password reset email sent. Please check your inbox and follow the instructions."
      );
    } catch (error) {
      logger.error("Password reset request error:", error.message);
      next(error);
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(req, res, next) {
    try {
      const { password, access_token } = req.body;

      // Validate inputs
      if (!password || !access_token) {
        return ApiResponse.badRequest(res, "Password and access token are required");
      }

      if (password.length < 8) {
        return ApiResponse.badRequest(res, "Password must be at least 8 characters long");
      }

      // Check password complexity
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
      if (!passwordRegex.test(password)) {
        return ApiResponse.badRequest(res, "Password must contain at least one uppercase letter, one lowercase letter, and one number");
      }

      // Verify the reset token first
      const user = await SupabaseAuthService.verifyResetToken(access_token);
      if (!user) {
        return ApiResponse.unauthorized(res, "Invalid or expired reset token");
      }

      // Reset the password
      const result = await SupabaseAuthService.resetPassword(access_token, password);

      logger.info(`Password reset successfully for user: ${user.email}`);
      return ApiResponse.success(
        res,
        {
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.user_metadata?.first_name,
            lastName: result.user.user_metadata?.last_name,
          }
        },
        "Password reset successfully. You can now login with your new password."
      );
    } catch (error) {
      logger.error("Password reset error:", error.message);
      next(error);
    }
  }

  /**
   * Verify reset token
   */
  static async verifyResetToken(req, res, next) {
    try {
      const { access_token } = req.query;

      if (!access_token) {
        return ApiResponse.badRequest(res, "Access token is required");
      }

      // Verify the token
      const user = await SupabaseAuthService.verifyResetToken(access_token);

      return ApiResponse.success(
        res,
        {
          valid: true,
          user: {
            id: user.id,
            email: user.email,
          }
        },
        "Reset token is valid"
      );
    } catch (error) {
      logger.error("Reset token verification error:", error.message);
      return ApiResponse.unauthorized(
        res, 
        "Invalid or expired reset token. Please request a new password reset."
      );
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
