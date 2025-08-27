import React, { createContext, useContext, useState, useEffect, useRef } from "react";
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
  const [authErrors, setAuthErrors] = useState([]);
  const navigate = useNavigate();
  const refreshTimerRef = useRef(null);
  const lockoutTimerRef = useRef(null);

  // Security constants
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  const TOKEN_REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutes (refresh before 5-min expiry)
  const SESSION_CHECK_INTERVAL = 30 * 1000; // Check session every 30 seconds

  // Load lockout state from localStorage on startup
  const loadLockoutState = () => {
    try {
      const lockoutData = localStorage.getItem('authLockout');
      if (lockoutData) {
        const { attempts, isLocked: wasLocked, lockoutTime: savedLockoutTime } = JSON.parse(lockoutData);
        const now = Date.now();
        
        if (wasLocked && savedLockoutTime && (now - savedLockoutTime < LOCKOUT_DURATION)) {
          setLoginAttempts(attempts || 0);
          setIsLocked(true);
          setLockoutTime(savedLockoutTime);
          
          // Set timer for remaining lockout time
          const remainingTime = LOCKOUT_DURATION - (now - savedLockoutTime);
          lockoutTimerRef.current = setTimeout(() => {
            clearLockout();
          }, remainingTime);
        } else {
          // Lockout expired, clear state
          clearLockout();
        }
      }
    } catch (error) {
      console.error('Failed to load lockout state:', error);
      clearLockout();
    }
  };

  // Save lockout state to localStorage
  const saveLockoutState = (attempts, locked, time) => {
    try {
      localStorage.setItem('authLockout', JSON.stringify({
        attempts,
        isLocked: locked,
        lockoutTime: time
      }));
    } catch (error) {
      console.error('Failed to save lockout state:', error);
    }
  };

  // Clear lockout state
  const clearLockout = () => {
    setIsLocked(false);
    setLoginAttempts(0);
    setLockoutTime(null);
    localStorage.removeItem('authLockout');
    if (lockoutTimerRef.current) {
      clearTimeout(lockoutTimerRef.current);
      lockoutTimerRef.current = null;
    }
  };

  // Clear auth errors
  const clearAuthErrors = () => {
    setAuthErrors([]);
  };

  // Add auth error
  const addAuthError = (error) => {
    setAuthErrors(prev => [...prev, {
      id: Date.now(),
      message: error,
      timestamp: new Date()
    }]);
  };

  // Initialize auth state
  useEffect(() => {
    loadLockoutState();
    checkAuthStatus();
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      if (lockoutTimerRef.current) {
        clearTimeout(lockoutTimerRef.current);
      }
    };
  }, []);

  // Handle lockout timer
  useEffect(() => {
    if (isLocked && lockoutTime) {
      const remainingTime = LOCKOUT_DURATION - (Date.now() - lockoutTime);
      
      if (remainingTime > 0) {
        lockoutTimerRef.current = setTimeout(() => {
          clearLockout();
        }, remainingTime);
      } else {
        clearLockout();
      }
    }
  }, [isLocked, lockoutTime]);

  // Set up periodic token refresh and session check
  useEffect(() => {
    if (isAuthenticated) {
      // Clear any existing timer
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }

      // Set up new refresh timer
      refreshTimerRef.current = setInterval(() => {
        checkAndRefreshToken();
      }, SESSION_CHECK_INTERVAL);

      return () => {
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
        }
      };
    }
  }, [isAuthenticated]);

  const checkAndRefreshToken = async () => {
    try {
      const token = tokenStorage.getToken();
      if (!token) {
        logout();
        return;
      }

      if (!isTokenValid(token)) {
        console.log('Token is invalid, attempting refresh...');
        await handleTokenRefresh();
        return;
      }

      if (isTokenExpiringSoon(token)) {
        console.log('Token expiring soon, refreshing...');
        await handleTokenRefresh();
      }
    } catch (error) {
      console.error('Token check failed:', error);
      // Don't logout immediately, just log the error
    }
  };

  const login = async (email, password) => {
    if (isLocked) {
      const remainingTime = Math.ceil((LOCKOUT_DURATION - (Date.now() - lockoutTime)) / 60000);
      throw new Error(`Account temporarily locked. Please try again in ${remainingTime} minutes.`);
    }

    try {
      clearAuthErrors();
      
      // Call API for authentication
      const response = await authAPI.login(email, password);

      // Update state
      setUser(response.user);
      setIsAuthenticated(true);
      clearLockout(); // Clear any previous lockout state

      console.log('Login successful for user:', response.user?.email);
      return { success: true, user: response.user };
    } catch (error) {
      // Handle login failures
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      let errorMessage = apiErrorHandler.handleError(error);

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockTime = Date.now();
        setIsLocked(true);
        setLockoutTime(lockTime);
        saveLockoutState(newAttempts, true, lockTime);
        
        errorMessage = "Too many failed attempts. Account locked for 15 minutes.";
      } else {
        // Save current attempt count
        saveLockoutState(newAttempts, false, null);
        
        const remainingAttempts = MAX_LOGIN_ATTEMPTS - newAttempts;
        errorMessage = `${errorMessage} (${remainingAttempts} attempts remaining)`;
      }

      addAuthError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const token = tokenStorage.getToken();

      if (token && isTokenValid(token)) {
        // Extract user data from token
        const tokenUser = getUserFromToken(token);
        if (tokenUser) {
          // Use token data directly - no need to fetch profile every time
          setUser(tokenUser);
          setIsAuthenticated(true);
          console.log("User authentication verified from token:", tokenUser.email);
        } else {
          console.error("Token is valid but no user data found");
          clearAuthData();
        }
      } else {
        console.log("No valid token found, user needs to login");
        clearAuthData();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      addAuthError("Authentication check failed");
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenRefresh = async () => {
    try {
      const token = tokenStorage.getToken();
      if (!token) {
        logout();
        return;
      }

      console.log("Attempting token refresh...");
      
      try {
        const refreshResponse = await authAPI.refreshToken();
        if (refreshResponse && refreshResponse.user) {
          // Update user data with refreshed token
          setUser(refreshResponse.user);
          setIsAuthenticated(true);
          tokenStorage.setUser(refreshResponse.user);
          console.log("Token refreshed successfully via API");
          return true;
        }
      } catch (refreshError) {
        console.error("API token refresh failed:", refreshError);
        
        // If refresh fails, logout user
        addAuthError("Session expired. Please log in again.");
        logout();
        return false;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      addAuthError("Failed to refresh session");
      logout();
      return false;
    }
  };

  const signup = async (userData) => {
    try {
      clearAuthErrors();
      
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

      console.log('Signup successful for user:', mergedUser.email);
      return { success: true, user: mergedUser };
    } catch (error) {
      const errorMessage = apiErrorHandler.handleError(error) || "Account creation failed. Please try again.";
      addAuthError(errorMessage);
      throw new Error(errorMessage);
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
      clearAuthErrors();
      clearLockout();
      navigate("/");
    }
  };

  const clearAuthData = () => {
    tokenStorage.clearAll();
    setUser(null);
    setIsAuthenticated(false);
    
    // Clear timers
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
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

  const refreshUserSession = async () => {
    try {
      console.log("Manually refreshing user session...");
      await checkAuthStatus();
      return { success: true, message: "User session refreshed" };
    } catch (error) {
      console.error("Failed to refresh user session:", error);
      return { success: false, message: "Failed to refresh session" };
    }
  };

  const value = {
    // Core state
    user,
    isAuthenticated,
    isLoading,
    token: tokenStorage.getToken(),
    
    // Security state
    loginAttempts,
    isLocked,
    lockoutTime,
    authErrors,
    
    // Auth methods
    login,
    signup,
    logout,
    
    // Password methods
    changePassword,
    resetPassword,
    verifyResetToken,
    setNewPassword,
    
    // Profile methods
    getProfile,
    updateProfile,
    
    // Utility methods
    getSecurityStatus,
    checkAuthStatus,
    refreshUserSession,
    clearAuthErrors,
    
    // Helper methods
    getRemainingLockoutTime: () => {
      if (!isLocked || !lockoutTime) return 0;
      return Math.max(0, LOCKOUT_DURATION - (Date.now() - lockoutTime));
    },
    
    getRemainingAttempts: () => Math.max(0, MAX_LOGIN_ATTEMPTS - loginAttempts),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
