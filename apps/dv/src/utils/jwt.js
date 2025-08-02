// JWT Token Utilities
// This module handles JWT token operations for authentication

import { jwtDecode } from "jwt-decode";

// Token expiry threshold for refresh
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes

/**
 * Decode a JWT token
 * @param {string} token - The JWT token to decode
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export const decodeToken = (token) => {
  try {
    if (!token || typeof token !== "string") {
      return null;
    }

    return jwtDecode(token);
  } catch (error) {
    console.error("Token decoding failed:", error);
    return null;
  }
};

/**
 * Validate if a token is still valid (not expired)
 * @param {string} token - The JWT token to validate
 * @returns {boolean} True if token is valid, false otherwise
 */
export const isTokenValid = (token) => {
  try {
    const payload = decodeToken(token);
    if (!payload) {
      return false;
    }

    // Check if token is expired
    const now = Date.now();
    if (payload.exp && now >= payload.exp * 1000) {
      // JWT exp is in seconds
      return false;
    }

    return true;
  } catch (error) {
    console.error("Token validation failed:", error);
    return false;
  }
};

/**
 * Get token expiry time
 * @param {string} token - The JWT token
 * @returns {number|null} Expiry timestamp or null if invalid
 */
export const getTokenExpiry = (token) => {
  try {
    const payload = decodeToken(token);
    return payload?.exp ? payload.exp * 1000 : null; // Convert to milliseconds
  } catch (error) {
    console.error("Failed to get token expiry:", error);
    return null;
  }
};

/**
 * Check if token will expire soon (within 5 minutes)
 * @param {string} token - The JWT token
 * @param {number} threshold - Time threshold in milliseconds (default: 5 minutes)
 * @returns {boolean} True if token expires soon
 */
export const isTokenExpiringSoon = (
  token,
  threshold = TOKEN_REFRESH_THRESHOLD
) => {
  try {
    const expiry = getTokenExpiry(token);
    if (!expiry) {
      return true; // Consider invalid tokens as expiring soon
    }

    const now = Date.now();
    return expiry - now <= threshold;
  } catch (error) {
    console.error("Failed to check token expiry:", error);
    return true;
  }
};

/**
 * Refresh a token via API (not local refresh since we can't create new Supabase tokens)
 * @param {string} token - The current JWT token
 * @returns {string|null} New JWT token or null if refresh failed
 */
export const refreshToken = (token) => {
  // For Supabase tokens, we need to use the API refresh endpoint
  // Local refresh is not possible since we don't have the signing key
  console.warn(
    "Local token refresh not supported for Supabase tokens. Use API refresh instead."
  );
  return null;
};

/**
 * Extract user data from token
 * @param {string} token - The JWT token
 * @returns {Object|null} User data or null if invalid
 */
export const getUserFromToken = (token) => {
  try {
    const payload = decodeToken(token);
    if (!payload) {
      return null;
    }

    // Extract user data from Supabase JWT
    return {
      id: payload.sub,
      email: payload.email,
      firstName: payload.user_metadata?.first_name || payload.first_name,
      lastName: payload.user_metadata?.last_name || payload.last_name,
      role: payload.user_metadata?.role || payload.role || "user",
      emailVerified: payload.email_verified || false,
    };
  } catch (error) {
    console.error("Failed to extract user data from token:", error);
    return null;
  }
};

/**
 * Token storage utilities
 */
export const tokenStorage = {
  // Store token in localStorage
  setToken: (token) => {
    try {
      localStorage.setItem("authToken", token);
    } catch (error) {
      console.error("Failed to store token:", error);
    }
  },

  // Get token from localStorage
  getToken: () => {
    try {
      return localStorage.getItem("authToken");
    } catch (error) {
      console.error("Failed to get token:", error);
      return null;
    }
  },

  // Remove token from localStorage
  removeToken: () => {
    try {
      localStorage.removeItem("authToken");
    } catch (error) {
      console.error("Failed to remove token:", error);
    }
  },

  // Store user data
  setUser: (userData) => {
    try {
      localStorage.setItem("userData", JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to store user data:", error);
    }
  },

  // Get user data
  getUser: () => {
    try {
      const userData = localStorage.getItem("userData");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Failed to get user data:", error);
      return null;
    }
  },

  // Remove user data
  removeUser: () => {
    try {
      localStorage.removeItem("userData");
    } catch (error) {
      console.error("Failed to remove user data:", error);
    }
  },

  // Store refresh token
  setRefreshToken: (refreshToken) => {
    try {
      localStorage.setItem("refreshToken", refreshToken);
    } catch (error) {
      console.error("Failed to store refresh token:", error);
    }
  },

  // Get refresh token
  getRefreshToken: () => {
    try {
      return localStorage.getItem("refreshToken");
    } catch (error) {
      console.error("Failed to get refresh token:", error);
      return null;
    }
  },

  // Remove refresh token
  removeRefreshToken: () => {
    try {
      localStorage.removeItem("refreshToken");
    } catch (error) {
      console.error("Failed to remove refresh token:", error);
    }
  },

  // Clear all auth data
  clearAll: () => {
    try {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
      localStorage.removeItem("refreshToken");
    } catch (error) {
      console.error("Failed to clear auth data:", error);
    }
  },
};
