import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  tokenStorage,
  isTokenValid,
  getUserFromToken,
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

  // Security constants
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  // Load lockout state from localStorage on startup
  function loadLockoutState() {
    try {
      const lockoutData = localStorage.getItem('authLockout');
      if (lockoutData) {
        const { attempts, isLocked: wasLocked, lockoutTime: savedLockoutTime } = JSON.parse(lockoutData);
        const now = Date.now();
        
        if (wasLocked && savedLockoutTime && (now - savedLockoutTime < LOCKOUT_DURATION)) {
          setLoginAttempts(attempts || 0);
          setIsLocked(true);
          setLockoutTime(savedLockoutTime);
        } else {
          // Lockout expired, clear state
          clearLockout();
        }
      }
    } catch (error) {
      console.error('Failed to load lockout state:', error);
      clearLockout();
    }
  }

  // Save lockout state to localStorage
  function saveLockoutState(attempts, locked, time) {
    try {
      localStorage.setItem('authLockout', JSON.stringify({
        attempts,
        isLocked: locked,
        lockoutTime: time
      }));
    } catch (error) {
      console.error('Failed to save lockout state:', error);
    }
  }

  // Clear lockout state
  const clearLockout = useCallback(() => {
    setIsLocked(false);
    setLoginAttempts(0);
    setLockoutTime(null);
    localStorage.removeItem('authLockout');
  }, []);

  // Clear auth errors
  const clearAuthErrors = useCallback(() => {
    setAuthErrors([]);
  }, []);

  // Add auth error
  const addAuthError = useCallback((error) => {
    setAuthErrors(prev => [...prev, {
      id: Date.now(),
      message: error,
      timestamp: new Date()
    }]);
  }, []);

  // Clear auth data
  const clearAuthData = useCallback(() => {
    tokenStorage.clearAll();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Simple logout function without timers
  const logout = useCallback(() => {
    try {
      // Call API logout endpoint (don't await to avoid blocking)
      authAPI.logout().catch(error => console.warn("Logout API call failed:", error));
    } catch (error) {
      console.warn("Logout API call failed:", error);
    } finally {
      // Always clear local data immediately
      clearAuthData();
      clearAuthErrors();
      clearLockout();
      navigate("/");
    }
  }, [clearAuthData, clearAuthErrors, clearLockout, navigate]);

  // Simple initialization - only run once on mount
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        loadLockoutState();
        
        const token = tokenStorage.getToken();
        if (token && isTokenValid(token)) {
          // Extract user data from token
          const tokenUser = getUserFromToken(token);
          if (tokenUser && mounted) {
            setUser(tokenUser);
            setIsAuthenticated(true);
            console.log("User authenticated:", tokenUser.email);
          } else {
            console.warn("Token valid but no user data found");
            if (mounted) {
              clearAuthData();
            }
          }
        } else {
          // Token is missing or invalid - just clear data, don't show errors on startup
          console.log("No valid token found");
          if (mounted) {
            clearAuthData();
          }
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        if (mounted) {
          clearAuthData();
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  const login = useCallback(async (email, password) => {
    if (isLocked) {
      const remainingTime = Math.ceil((LOCKOUT_DURATION - (Date.now() - lockoutTime)) / 60000);
      throw new Error(`Account temporarily locked. Please try again in ${remainingTime} minutes.`);
    }

    try {
      clearAuthErrors();
      
      // Call API for authentication
      const response = await authAPI.login(email, password);

      // Merge auth user and db profile if available (same as signup)
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
      clearLockout(); // Clear any previous lockout state

      console.log('Login successful for user:', mergedUser.email);
      
      // Role-based redirection
      if (isAdmin(mergedUser)) {
        console.log('Redirecting admin user to admin dashboard');
        navigate('/admin');
      }
      
      return { success: true, user: mergedUser };
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
  }, [isLocked, lockoutTime, loginAttempts, clearAuthErrors, clearLockout, addAuthError]);

  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = tokenStorage.getToken();

      if (token && isTokenValid(token)) {
        // Extract user data from token
        const tokenUser = getUserFromToken(token);
        if (tokenUser) {
          setUser(tokenUser);
          setIsAuthenticated(true);
          console.log("User authenticated:", tokenUser.email);
        } else {
          console.warn("Token valid but no user data found");
          clearAuthData();
        }
      } else {
        // Token is missing or invalid - just clear data, don't show errors on startup
        console.log("No valid token found");
        clearAuthData();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthData]);

  const signup = useCallback(async (userData) => {
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
      
      // Role-based redirection
      if (isAdmin(mergedUser)) {
        console.log('Redirecting admin user to admin dashboard');
        navigate('/admin');
      }
      
      return { success: true, user: mergedUser };
    } catch (error) {
      const errorMessage = apiErrorHandler.handleError(error) || "Account creation failed. Please try again.";
      addAuthError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [clearAuthErrors, addAuthError]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
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
  }, []);

  const resetPassword = useCallback(async (email) => {
    try {
      const response = await authAPI.resetPassword(email);
      return { success: true, message: "Password reset email sent" };
    } catch (error) {
      throw new Error(
        apiErrorHandler.handleError(error) || "Failed to send reset email"
      );
    }
  }, []);

  const verifyResetToken = useCallback(async (token) => {
    try {
      const response = await authAPI.verifyResetToken(token);
      return { success: true, valid: true };
    } catch (error) {
      throw new Error(
        apiErrorHandler.handleError(error) || "Invalid reset token"
      );
    }
  }, []);

  const setNewPassword = useCallback(async (token, newPassword) => {
    try {
      const response = await authAPI.setNewPassword(token, newPassword);
      return { success: true, message: "Password reset successfully" };
    } catch (error) {
      throw new Error(
        apiErrorHandler.handleError(error) || "Failed to reset password"
      );
    }
  }, []);

  const getProfile = useCallback(async () => {
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
  }, []);

  const updateProfile = useCallback(async (profileData) => {
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
  }, []);

  const getSecurityStatus = useCallback(() => {
    return {
      isLocked,
      loginAttempts,
      remainingAttempts: MAX_LOGIN_ATTEMPTS - loginAttempts,
      lockoutTime,
      isAuthenticated,
      tokenValid: isTokenValid(tokenStorage.getToken()),
    };
  }, [isLocked, loginAttempts, lockoutTime, isAuthenticated]);

  const refreshUserSession = useCallback(async () => {
    try {
      console.log("Refreshing user session...");
      await checkAuthStatus();
      return { success: true, message: "User session refreshed" };
    } catch (error) {
      console.error("Failed to refresh user session:", error);
      return { success: false, message: "Failed to refresh session" };
    }
  }, [checkAuthStatus]);

  // Simple session validation - just check if user is authenticated and token is valid
  const validateSession = useCallback(() => {
    try {
      const token = tokenStorage.getToken();
      const isValid = token && isTokenValid(token) && isAuthenticated;
      return { 
        success: isValid, 
        message: isValid ? "Session is valid" : "Session is invalid" 
      };
    } catch (error) {
      console.error("Session validation failed:", error);
      return { success: false, message: "Session validation failed" };
    }
  }, [isAuthenticated]);

  // Helper methods
  const getRemainingLockoutTime = useCallback(() => {
    if (!isLocked || !lockoutTime) return 0;
    return Math.max(0, LOCKOUT_DURATION - (Date.now() - lockoutTime));
  }, [isLocked, lockoutTime]);
  
  const getRemainingAttempts = useCallback(() => {
    return Math.max(0, MAX_LOGIN_ATTEMPTS - loginAttempts);
  }, [loginAttempts]);

  // Check if user is admin
  const isAdmin = useCallback((userObj = user) => {
    if (!userObj) return false;
    return ['super_admin', 'admin', 'tenant_admin', 'store_manager'].includes(userObj.role);
  }, [user]);

  // Check if user is super admin
  const isSuperAdmin = useCallback((userObj = user) => {
    if (!userObj) return false;
    return userObj.role === 'super_admin';
  }, [user]);

  // Check if user has specific permission
  const hasPermission = useCallback((permission, userObj = user) => {
    if (!userObj) return false;
    
    // Super admin has all permissions
    if (userObj.role === 'super_admin') return true;
    
    // Check if user has wildcard permission
    if (userObj.permissions && userObj.permissions.includes('*')) return true;
    
    // Check specific permission
    return userObj.permissions && userObj.permissions.includes(permission);
  }, [user]);

  // Log security events
  const logSecurityEvent = useCallback((event, details = {}) => {
    const securityLog = {
      event,
      timestamp: new Date().toISOString(),
      userId: user?.id || 'anonymous',
      userEmail: user?.email || 'anonymous', 
      userRole: user?.role || 'none',
      ...details
    };
    
    // Log to console for development (remove in production)
    console.warn('🚨 Security Event:', securityLog);
    
    // In production, send to security monitoring service
    // Example: sendToSecurityService(securityLog);
  }, [user]);

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
    validateSession,
    clearAuthErrors,
    
    // Helper methods
    getRemainingLockoutTime,
    getRemainingAttempts,
    isAdmin,
    isSuperAdmin,
    hasPermission,
    logSecurityEvent,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
