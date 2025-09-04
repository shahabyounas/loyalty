// JWT Token Utilities - Enhanced for Persistent Login
// This module handles JWT token operations for authentication

import { jwtDecode } from "jwt-decode";

// Token refresh thresholds
const ACCESS_TOKEN_REFRESH_THRESHOLD = 15 * 60 * 1000; // 15 minutes before expiry
const REFRESH_TOKEN_WARNING_THRESHOLD = 7 * 24 * 60 * 60 * 1000; // 7 days before expiry

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: "authToken",
  REFRESH_TOKEN: "refreshToken", 
  USER_DATA: "userData",
  REMEMBER_ME: "rememberMe",
  LAST_ACTIVITY: "lastActivity",
  TOKEN_EXPIRY: "tokenExpiry"
};

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

    // Check if token is expired (with 30 second buffer for network delays)
    const now = Date.now() + 30000; // 30 second buffer
    if (payload.exp && now >= payload.exp * 1000) {
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
 * Check if access token needs refresh (within 15 minutes of expiry)
 * @param {string} token - The JWT token
 * @returns {boolean} True if token needs refresh
 */
export const isTokenExpiringSoon = (token) => {
  try {
    const expiry = getTokenExpiry(token);
    if (!expiry) {
      return true; // Consider invalid tokens as needing refresh
    }

    const now = Date.now();
    return expiry - now <= ACCESS_TOKEN_REFRESH_THRESHOLD;
  } catch (error) {
    console.error("Failed to check token expiry:", error);
    return true;
  }
};

/**
 * Check if refresh token is expiring soon (within 7 days)
 * @param {string} refreshToken - The refresh token
 * @returns {boolean} True if refresh token is expiring soon
 */
export const isRefreshTokenExpiringSoon = (refreshToken) => {
  try {
    const expiry = getTokenExpiry(refreshToken);
    if (!expiry) {
      return true;
    }

    const now = Date.now();
    return expiry - now <= REFRESH_TOKEN_WARNING_THRESHOLD;
  } catch (error) {
    console.error("Failed to check refresh token expiry:", error);
    return true;
  }
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

    // Extract user data from JWT payload
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
 * Update last activity timestamp
 */
export const updateLastActivity = () => {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
  } catch (error) {
    console.error("Failed to update last activity:", error);
  }
};

/**
 * Get last activity timestamp
 * @returns {number|null} Last activity timestamp or null
 */
export const getLastActivity = () => {
  try {
    const activity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
    return activity ? parseInt(activity) : null;
  } catch (error) {
    console.error("Failed to get last activity:", error);
    return null;
  }
};

/**
 * Enhanced token storage utilities with persistence features
 */
export const tokenStorage = {
  // Store access token
  setToken: (token) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      
      // Store expiry for quick access
      const expiry = getTokenExpiry(token);
      if (expiry) {
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiry.toString());
      }
      
      updateLastActivity();
    } catch (error) {
      console.error("Failed to store token:", error);
    }
  },

  // Get access token
  getToken: () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error("Failed to get token:", error);
      return null;
    }
  },

  // Remove access token
  removeToken: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    } catch (error) {
      console.error("Failed to remove token:", error);
    }
  },

  // Store refresh token
  setRefreshToken: (refreshToken) => {
    try {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      updateLastActivity();
    } catch (error) {
      console.error("Failed to store refresh token:", error);
    }
  },

  // Get refresh token
  getRefreshToken: () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error("Failed to get refresh token:", error);
      return null;
    }
  },

  // Remove refresh token
  removeRefreshToken: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error("Failed to remove refresh token:", error);
    }
  },

  // Store user data
  setUser: (userData) => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      updateLastActivity();
    } catch (error) {
      console.error("Failed to store user data:", error);
    }
  },

  // Get user data
  getUser: () => {
    try {
      const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Failed to get user data:", error);
      return null;
    }
  },

  // Remove user data
  removeUser: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error("Failed to remove user data:", error);
    }
  },

  // Set remember me preference
  setRememberMe: (remember) => {
    try {
      localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, remember.toString());
    } catch (error) {
      console.error("Failed to store remember me:", error);
    }
  },

  // Get remember me preference
  getRememberMe: () => {
    try {
      const remember = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
      return remember === "true";
    } catch (error) {
      console.error("Failed to get remember me:", error);
      return false;
    }
  },

  // Check if user has valid session
  hasValidSession: () => {
    try {
      const token = tokenStorage.getToken();
      const refreshToken = tokenStorage.getRefreshToken();
      
      // If we have a valid access token, session is valid
      if (token && isTokenValid(token)) {
        return true;
      }
      
      // If access token is invalid but we have refresh token, session can be restored
      if (refreshToken && isTokenValid(refreshToken)) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Failed to check session validity:", error);
      return false;
    }
  },

  // Get quick token expiry without decoding
  getTokenExpiryFast: () => {
    try {
      const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
      return expiry ? parseInt(expiry) : null;
    } catch (error) {
      console.error("Failed to get token expiry:", error);
      return null;
    }
  },

  // Clear all auth data
  clearAll: () => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error("Failed to clear auth data:", error);
    }
  },

  // Sync tokens across tabs (for multi-tab consistency)
  syncTokensAcrossTabs: () => {
    try {
      // Listen for storage changes from other tabs
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEYS.ACCESS_TOKEN || e.key === STORAGE_KEYS.REFRESH_TOKEN) {
          // Token changed in another tab, trigger re-authentication check
          window.dispatchEvent(new CustomEvent('tokenSyncRequired'));
        }
      });
    } catch (error) {
      console.error("Failed to setup token sync:", error);
    }
  }
};
