import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  tokenStorage,
  isTokenValid,
  getUserFromToken,
  isTokenExpiringSoon,
  refreshToken as refreshJWTToken,
} from "../utils/jwt.js";
import { authAPI, apiErrorHandler } from "../utils/api.js";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(null);
  const navigate = useNavigate();

  // Security constants
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  const TOKEN_REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutes (refresh before 5-min expiry)

  useEffect(() => {
    // Check for existing authentication on app load
    checkAuthStatus();
  }, []);

  useEffect(() => {
    // Auto-unlock after lockout duration
    if (isLocked && lockoutTime) {
      const timer = setTimeout(() => {
        setIsLocked(false);
        setLoginAttempts(0);
        setLockoutTime(null);
      }, LOCKOUT_DURATION);
      return () => clearTimeout(timer);
    }
  }, [isLocked, lockoutTime]);

  useEffect(() => {
    // Set up token refresh interval
    if (isAuthenticated) {
      const interval = setInterval(handleTokenRefresh, TOKEN_REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      const token = tokenStorage.getToken();

      if (token && isTokenValid(token)) {
        // Extract user data from token
        const tokenUser = getUserFromToken(token);
        if (tokenUser) {
          try {
            // Fetch complete user profile from API
            const profileResponse = await authAPI.getProfile();
            const completeUser = {
              ...tokenUser,
              // Merge with profile data
              internalUserId: profileResponse.data?.id,
              tenantId: profileResponse.data?.tenant_id ?? null,
              phone: profileResponse.data?.phone ?? tokenUser.phone,
              avatarUrl: profileResponse.data?.avatar_url ?? null,
              isActive: profileResponse.data?.is_active ?? true,
              emailVerified:
                tokenUser?.emailVerified ??
                profileResponse.data?.email_verified ??
                false,
              createdAt:
                tokenUser?.createdAt || profileResponse.data?.created_at,
              updatedAt: profileResponse.data?.updated_at || null,
              permissions: profileResponse.data?.permissions || {},
            };

            setUser(completeUser);
            setIsAuthenticated(true);
            // Update stored user data with complete profile
            tokenStorage.setUser(completeUser);
          } catch (profileError) {
            console.warn(
              "Failed to fetch user profile, using token data only:",
              profileError
            );
            // Fallback to token data if profile fetch fails
            setUser(tokenUser);
            setIsAuthenticated(true);
            tokenStorage.setUser(tokenUser);
          }
        } else {
          // Token is valid but no user data, clear storage
          clearAuthData();
        }
      } else {
        // No token or invalid token, clear storage
        clearAuthData();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenRefresh = async () => {
    try {
      const token = tokenStorage.getToken();
      if (token && isTokenExpiringSoon(token)) {
        // Try to refresh token via API first
        try {
          await authAPI.refreshToken();
        } catch (error) {
          // If API refresh fails, try local refresh
          const newToken = refreshJWTToken(token);
          if (newToken) {
            tokenStorage.setToken(newToken);
          } else {
            // Token refresh failed, logout user
            logout();
          }
        }
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
    }
  };

  const login = async (email, password) => {
    if (isLocked) {
      throw new Error("Account temporarily locked. Please try again later.");
    }

    try {
      // Call API for authentication
      const response = await authAPI.login(email, password);

      // Update state
      setUser(response.user);
      setIsAuthenticated(true);
      setLoginAttempts(0);

      return { success: true, user: response.user };
    } catch (error) {
      // Handle login failures
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        setIsLocked(true);
        setLockoutTime(Date.now());
        throw new Error(
          "Too many failed attempts. Account locked for 15 minutes."
        );
      } else {
        throw new Error(
          apiErrorHandler.handleError(error) ||
            `Invalid credentials. ${
              MAX_LOGIN_ATTEMPTS - newAttempts
            } attempts remaining.`
        );
      }
    }
  };

  const signup = async (userData) => {
    try {
      // Call API for user registration
      const response = await authAPI.register(userData);

      // Merge auth user and db profile if available
      const mergedUser = {
        ...response.user,
        // Flatten important DB profile fields onto the user object
        internalUserId: response.dbUser?.id,
        tenantId: response.dbUser?.tenant_id ?? null,
        phone: response.dbUser?.phone ?? response.user.phone,
        avatarUrl: response.dbUser?.avatar_url ?? null,
        isActive: response.dbUser?.is_active ?? true,
        emailVerified:
          response.user?.emailVerified ??
          response.dbUser?.email_verified ??
          false,
        createdAt: response.user?.createdAt || response.dbUser?.created_at,
        updatedAt: response.dbUser?.updated_at || null,
        permissions: response.dbUser?.permissions || {},
      };

      // Update state
      setUser(mergedUser);
      setIsAuthenticated(true);

      return { success: true, user: mergedUser };
    } catch (error) {
      throw new Error(
        apiErrorHandler.handleError(error) ||
          "Account creation failed. Please try again."
      );
    }
  };

  const logout = async () => {
    try {
      // Call API logout endpoint
      await authAPI.logout();
    } catch (error) {
      console.warn("Logout API call failed:", error);
    } finally {
      // Always clear local data
      clearAuthData();
      navigate("/");
    }
  };

  const clearAuthData = () => {
    tokenStorage.clearAll();
    setUser(null);
    setIsAuthenticated(false);
    setLoginAttempts(0);
    setIsLocked(false);
    setLockoutTime(null);
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await authAPI.changePassword(
        currentPassword,
        newPassword
      );
      return { success: true, message: "Password changed successfully" };
    } catch (error) {
      throw new Error(
        apiErrorHandler.handleError(error) || "Failed to change password"
      );
    }
  };

  const resetPassword = async (email) => {
    try {
      const response = await authAPI.resetPassword(email);
      return { success: true, message: "Password reset email sent" };
    } catch (error) {
      throw new Error(
        apiErrorHandler.handleError(error) || "Failed to send reset email"
      );
    }
  };

  const verifyResetToken = async (token) => {
    try {
      const response = await authAPI.verifyResetToken(token);
      return { success: true, valid: true };
    } catch (error) {
      throw new Error(
        apiErrorHandler.handleError(error) || "Invalid reset token"
      );
    }
  };

  const setNewPassword = async (token, newPassword) => {
    try {
      const response = await authAPI.setNewPassword(token, newPassword);
      return { success: true, message: "Password reset successfully" };
    } catch (error) {
      throw new Error(
        apiErrorHandler.handleError(error) || "Failed to reset password"
      );
    }
  };

  const getProfile = async () => {
    try {
      const profile = await authAPI.getProfile();
      // Update user state with latest profile data
      setUser(profile);
      tokenStorage.setUser(profile);
      return profile;
    } catch (error) {
      throw new Error(
        apiErrorHandler.handleError(error) || "Failed to get profile"
      );
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const updatedProfile = await authAPI.updateProfile(profileData);
      // Update user state with new profile data
      setUser(updatedProfile);
      tokenStorage.setUser(updatedProfile);
      return { success: true, user: updatedProfile };
    } catch (error) {
      throw new Error(
        apiErrorHandler.handleError(error) || "Failed to update profile"
      );
    }
  };

  const getSecurityStatus = () => {
    return {
      isLocked,
      loginAttempts,
      remainingAttempts: MAX_LOGIN_ATTEMPTS - loginAttempts,
      lockoutTime,
      isAuthenticated,
      tokenValid: isTokenValid(tokenStorage.getToken()),
      tokenExpiringSoon: isTokenExpiringSoon(tokenStorage.getToken()),
    };
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    changePassword,
    resetPassword,
    verifyResetToken,
    setNewPassword,
    getProfile,
    updateProfile,
    getSecurityStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
