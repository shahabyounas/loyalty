import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
  const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

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
      const interval = setInterval(refreshToken, TOKEN_REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const checkAuthStatus = () => {
    try {
      const token = localStorage.getItem("authToken");
      const userEmail = localStorage.getItem("userEmail");

      if (token && userEmail) {
        // In a real app, you would validate the token with your backend
        const isValid = validateToken(token);

        if (isValid) {
          setUser({ email: userEmail });
          setIsAuthenticated(true);
        } else {
          // Token is invalid, clear storage
          clearAuthData();
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const validateToken = (token) => {
    // In a real app, this would validate the token with your backend
    // For demo purposes, we'll do basic validation
    if (!token || token === "null" || token === "undefined") {
      return false;
    }

    // Check if token is expired (demo tokens expire after 1 hour)
    const tokenData = parseToken(token);
    if (tokenData && tokenData.exp) {
      return Date.now() < tokenData.exp;
    }

    return true;
  };

  const parseToken = (token) => {
    try {
      // In a real app, you would decode a JWT token
      // For demo purposes, we'll extract timestamp from our demo token
      const timestamp = token.split("-").pop();
      if (timestamp) {
        const tokenTime = parseInt(timestamp);
        const expiryTime = tokenTime + 60 * 60 * 1000; // 1 hour
        return { exp: expiryTime };
      }
    } catch (error) {
      console.error("Token parsing failed:", error);
    }
    return null;
  };

  const refreshToken = async () => {
    try {
      // In a real app, this would call your backend to refresh the token
      const currentToken = localStorage.getItem("authToken");
      if (currentToken && validateToken(currentToken)) {
        // Generate new token
        const newToken = "demo-token-" + Date.now();
        localStorage.setItem("authToken", newToken);
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
      // Simulate API call with security delay
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 1000)
      );

      // Demo credentials
      if (email === "demo@example.com" && password === "Demo123!") {
        // Success - store token and user data
        const token = "demo-token-" + Date.now();
        localStorage.setItem("authToken", token);
        localStorage.setItem("userEmail", email);

        setUser({ email });
        setIsAuthenticated(true);
        setLoginAttempts(0);

        return { success: true };
      } else {
        // Failed login
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
            `Invalid credentials. ${
              MAX_LOGIN_ATTEMPTS - newAttempts
            } attempts remaining.`
          );
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const signup = async (userData) => {
    try {
      // Simulate API call with security delay
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 1000)
      );

      // In a real app, this would create the account on your backend
      const token = "demo-token-" + Date.now();
      localStorage.setItem("authToken", token);
      localStorage.setItem("userEmail", userData.email);

      setUser({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
      });
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      throw new Error("Account creation failed. Please try again.");
    }
  };

  const logout = () => {
    clearAuthData();
    navigate("/");
  };

  const clearAuthData = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
    setUser(null);
    setIsAuthenticated(false);
    setLoginAttempts(0);
    setIsLocked(false);
    setLockoutTime(null);
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      // In a real app, this would call your backend
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Validate current password
      if (currentPassword !== "Demo123!") {
        throw new Error("Current password is incorrect");
      }

      // Update password (in real app, this would be stored securely on backend)
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      // In a real app, this would send a reset email
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (email === "demo@example.com") {
        return { success: true, message: "Password reset email sent" };
      } else {
        throw new Error("Email not found");
      }
    } catch (error) {
      throw error;
    }
  };

  const getSecurityStatus = () => {
    return {
      isLocked,
      loginAttempts,
      remainingAttempts: MAX_LOGIN_ATTEMPTS - loginAttempts,
      lockoutTime,
      isAuthenticated,
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
    getSecurityStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
