// API Utilities for JWT Authentication
// This module handles HTTP requests with automatic token management

import {
  tokenStorage,
  isTokenValid,
  isTokenExpiringSoon,
  refreshToken,
} from "./jwt.js";

// API Configuration
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3000/api";
const API_TIMEOUT = 10000; // 10 seconds

/**
 * Create headers with authentication token
 * @param {Object} additionalHeaders - Additional headers to include
 * @returns {Object} Headers object
 */
const createHeaders = (additionalHeaders = {}) => {
  const token = tokenStorage.getToken();
  const headers = {
    "Content-Type": "application/json",
    ...additionalHeaders,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Handle API response
 * @param {Response} response - Fetch response object
 * @returns {Promise<Object>} Parsed response data
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Handle authentication errors
    if (response.status === 401) {
      tokenStorage.clearAll();
      throw new Error("Authentication failed. Please log in again.");
    }

    // Handle other errors
    const errorMessage =
      errorData.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  // Handle empty responses
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }

  return await response.text();
};

/**
 * Make an authenticated API request with automatic token refresh
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} API response
 */
const makeRequest = async (endpoint, options = {}) => {
  try {
    // Check if token needs refresh before making request
    const token = tokenStorage.getToken();
    if (token && isTokenExpiringSoon(token)) {
      const newToken = refreshToken(token);
      if (newToken) {
        tokenStorage.setToken(newToken);
      }
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const headers = createHeaders(options.headers);

    const requestOptions = {
      ...options,
      headers,
      timeout: API_TIMEOUT,
    };

    // Add timeout to fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    requestOptions.signal = controller.signal;

    console.log("requestOptions", url, headers);
    const response = await fetch(url, requestOptions);
    clearTimeout(timeoutId);

    return await handleResponse(response);
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timeout. Please try again.");
    }
    throw error;
  }
};

/**
 * API methods for authentication
 */
export const authAPI = {
  // Login user
  login: async (email, password) => {
    const response = await makeRequest("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    // Store token and user data from Supabase response
    if (response.data && response.data.session) {
      tokenStorage.setToken(response.data.session.accessToken);
      tokenStorage.setRefreshToken(response.data.session.refreshToken);
      tokenStorage.setUser(response.data.user);
    }

    return response.data;
  },

  // Register user
  register: async (userData) => {
    const response = await makeRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
      }),
    });

    // Store token and user data from Supabase response
    if (response.data && response.data.session) {
      tokenStorage.setToken(response.data.session.accessToken);
      tokenStorage.setRefreshToken(response.data.session.refreshToken);
      tokenStorage.setUser(response.data.user);
    }

    return response.data;
  },

  // Logout user
  logout: async () => {
    try {
      await makeRequest("/auth/signout", {
        method: "POST",
      });
    } catch (error) {
      console.warn("Logout API call failed:", error);
    } finally {
      // Always clear local storage
      tokenStorage.clearAll();
    }
  },

  // Refresh token
  refreshToken: async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await makeRequest("/auth/refresh-token", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });

    if (response.data && response.data.session) {
      tokenStorage.setToken(response.data.session.accessToken);
      tokenStorage.setRefreshToken(response.data.session.refreshToken);
    }

    return response.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    return await makeRequest("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // Reset password
  resetPassword: async (email) => {
    return await makeRequest("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  // Verify reset token
  verifyResetToken: async (token) => {
    return await makeRequest("/auth/verify-reset-token", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },

  // Set new password with reset token
  setNewPassword: async (token, newPassword) => {
    return await makeRequest("/auth/set-new-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  },

  // Get current user profile
  getProfile: async () => {
    return await makeRequest("/auth/profile");
  },

  // Update user profile
  updateProfile: async (profileData) => {
    return await makeRequest("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  },
};

/**
 * Generic API methods for other endpoints
 */
export const api = {
  // GET request
  get: (endpoint) => makeRequest(endpoint, { method: "GET" }),

  // POST request
  post: (endpoint, data) =>
    makeRequest(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // PUT request
  put: (endpoint, data) =>
    makeRequest(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // PATCH request
  patch: (endpoint, data) =>
    makeRequest(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // DELETE request
  delete: (endpoint) => makeRequest(endpoint, { method: "DELETE" }),

  // Upload file
  upload: (endpoint, file, additionalData = {}) => {
    const formData = new FormData();
    formData.append("file", file);

    // Add additional data
    Object.keys(additionalData).forEach((key) => {
      formData.append(key, additionalData[key]);
    });

    return makeRequest(endpoint, {
      method: "POST",
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  },
};

/**
 * Error handling utilities
 */
export const apiErrorHandler = {
  // Handle common API errors
  handleError: (error) => {
    console.error("API Error:", error);

    // Network errors
    if (!navigator.onLine) {
      return "No internet connection. Please check your network.";
    }

    // Timeout errors
    if (error.message.includes("timeout")) {
      return "Request timed out. Please try again.";
    }

    // Authentication errors
    if (error.message.includes("Authentication failed")) {
      return "Your session has expired. Please log in again.";
    }

    // Server errors
    if (error.message.includes("HTTP 5")) {
      return "Server error. Please try again later.";
    }

    // Return original error message
    return error.message || "An unexpected error occurred.";
  },

  // Check if error is retryable
  isRetryable: (error) => {
    const retryableErrors = ["timeout", "network", "HTTP 5"];

    return retryableErrors.some((type) =>
      error.message.toLowerCase().includes(type)
    );
  },
};

/**
 * Request interceptor for adding common functionality
 */
export const requestInterceptor = {
  // Add request ID for tracking
  addRequestId: (options = {}) => {
    const requestId = `req_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;
    return {
      ...options,
      headers: {
        ...options.headers,
        "X-Request-ID": requestId,
      },
    };
  },

  // Add user agent
  addUserAgent: (options = {}) => {
    return {
      ...options,
      headers: {
        ...options.headers,
        "User-Agent": navigator.userAgent,
      },
    };
  },
};
