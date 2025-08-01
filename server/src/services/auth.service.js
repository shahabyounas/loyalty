const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt");
const User = require("../models/user.model");
const { logger } = require("../utils/logger");

class AuthService {
  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static generateTokens(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });

    const refreshToken = jwt.sign(payload, jwtConfig.refreshSecret, {
      expiresIn: jwtConfig.refreshExpiresIn,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });

    return { accessToken, refreshToken };
  }

  static async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findByEmail(userData.email);
      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);

      // Create user
      const user = await User.create({
        email: userData.email,
        password_hash: hashedPassword,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role || "user",
      });

      // Generate tokens
      const tokens = this.generateTokens(user);

      return {
        user: user.toJSON(),
        ...tokens,
      };
    } catch (error) {
      logger.error("Registration failed:", error.message);
      throw error;
    }
  }

  static async login(email, password) {
    try {
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        throw new Error("Invalid credentials");
      }

      // Check if user is active
      if (!user.is_active) {
        throw new Error("Account is deactivated");
      }

      // Verify password
      const isPasswordValid = await this.comparePassword(
        password,
        user.password_hash
      );
      if (!isPasswordValid) {
        throw new Error("Invalid credentials");
      }

      // Update last login
      await User.updateLastLogin(user.id);

      // Generate tokens
      const tokens = this.generateTokens(user);

      return {
        user: user.toJSON(),
        ...tokens,
      };
    } catch (error) {
      logger.error("Login failed:", error.message);
      throw error;
    }
  }

  static async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      });

      // Find user
      const user = await User.findById(decoded.id);
      if (!user || !user.is_active) {
        throw new Error("User not found or inactive");
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);

      return {
        user: user.toJSON(),
        ...tokens,
      };
    } catch (error) {
      logger.error("Token refresh failed:", error.message);
      throw error;
    }
  }

  static async changePassword(userId, currentPassword, newPassword) {
    try {
      // Find user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Verify current password
      const isCurrentPasswordValid = await this.comparePassword(
        currentPassword,
        user.password_hash
      );
      if (!isCurrentPasswordValid) {
        throw new Error("Current password is incorrect");
      }

      // Hash new password
      const hashedNewPassword = await this.hashPassword(newPassword);

      // Update password
      await User.update(userId, { password_hash: hashedNewPassword });

      return { message: "Password changed successfully" };
    } catch (error) {
      logger.error("Password change failed:", error.message);
      throw error;
    }
  }

  static async verifyEmail(userId) {
    try {
      const user = await User.verifyEmail(userId);
      if (!user) {
        throw new Error("User not found");
      }
      return { message: "Email verified successfully" };
    } catch (error) {
      logger.error("Email verification failed:", error.message);
      throw error;
    }
  }

  static async getProfile(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      return user.toJSON();
    } catch (error) {
      logger.error("Get profile failed:", error.message);
      throw error;
    }
  }

  static async updateProfile(userId, updateData) {
    try {
      // Remove sensitive fields that shouldn't be updated via profile
      const { password_hash, role, email, ...safeUpdateData } = updateData;

      const user = await User.update(userId, safeUpdateData);
      if (!user) {
        throw new Error("User not found");
      }
      return user.toJSON();
    } catch (error) {
      logger.error("Update profile failed:", error.message);
      throw error;
    }
  }
}

module.exports = AuthService;
