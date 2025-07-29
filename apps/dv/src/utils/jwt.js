// JWT Token Utilities
// This module handles JWT token operations for authentication

// JWT Token Structure (for demo purposes)
// In a real app, you would use a proper JWT library like 'jsonwebtoken'
// This is a simplified implementation for demonstration

const JWT_SECRET = "your-secret-key-change-in-production";
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Create a JWT token
 * @param {Object} payload - The data to encode in the token
 * @param {number} expiresIn - Token expiry time in milliseconds (default: 1 hour)
 * @returns {string} JWT token
 */
export const createToken = (payload, expiresIn = TOKEN_EXPIRY) => {
  try {
    const header = {
      alg: "HS256",
      typ: "JWT",
    };

    const now = Date.now();
    const exp = now + expiresIn;

    const tokenPayload = {
      ...payload,
      iat: now, // issued at
      exp: exp, // expires at
    };

    // In a real app, you would use a proper JWT library
    // This is a simplified base64 encoding for demo purposes
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(tokenPayload));

    // Simple signature (in real app, use proper HMAC)
    const signature = btoa(JWT_SECRET + encodedPayload);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  } catch (error) {
    console.error("Token creation failed:", error);
    throw new Error("Failed to create authentication token");
  }
};

/**
 * Decode and validate a JWT token
 * @param {string} token - The JWT token to decode
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export const decodeToken = (token) => {
  try {
    if (!token || typeof token !== "string") {
      return null;
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, signature] = parts;

    // Decode payload
    const payload = JSON.parse(atob(encodedPayload));

    // Validate signature (simplified for demo)
    const expectedSignature = btoa(JWT_SECRET + encodedPayload);
    if (signature !== expectedSignature) {
      return null;
    }

    return payload;
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
    if (payload.exp && now >= payload.exp) {
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
    return payload?.exp || null;
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
export const isTokenExpiringSoon = (token, threshold = 5 * 60 * 1000) => {
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
 * Refresh a token (create new token with same payload but new expiry)
 * @param {string} token - The current JWT token
 * @param {number} expiresIn - New expiry time in milliseconds
 * @returns {string|null} New JWT token or null if original is invalid
 */
export const refreshToken = (token, expiresIn = TOKEN_EXPIRY) => {
  try {
    const payload = decodeToken(token);
    if (!payload) {
      return null;
    }

    // Remove timestamp fields from payload
    const { iat, exp, ...userData } = payload;

    // Create new token with same user data
    return createToken(userData, expiresIn);
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
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

    // Remove JWT-specific fields
    const { iat, exp, ...userData } = payload;
    return userData;
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

  // Clear all auth data
  clearAll: () => {
    try {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
    } catch (error) {
      console.error("Failed to clear auth data:", error);
    }
  },
};
