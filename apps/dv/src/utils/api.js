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
      throw new Error("TOKEN_EXPIRED");
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
 * Refresh token using direct fetch (to avoid infinite loops)
 * @returns {Promise<Object>} Refresh result
 */
const refreshTokenDirect = async () => {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const url = `${API_BASE_URL}/auth/refresh-token`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Token refresh failed");
  }

  const data = await response.json();
  if (data.data && data.data.session) {
    tokenStorage.setToken(data.data.session.accessToken);
    tokenStorage.setRefreshToken(data.data.session.refreshToken);
  }

  return data.data;
};

/**
 * Make an authenticated API request with automatic token refresh
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @param {boolean} isRetry - Whether this is a retry attempt after token refresh
 * @returns {Promise<Object>} API response
 */
const makeRequest = async (endpoint, options = {}, isRetry = false) => {
  try {
    // Check if token needs refresh before making request
    const token = tokenStorage.getToken();
    if (token && isTokenExpiringSoon(token)) {
      console.log("Token expiring soon, attempting refresh...");
      try {
        const refreshResult = await refreshTokenDirect();
        if (refreshResult && refreshResult.session) {
          console.log("Token refreshed successfully");
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Continue with current token if refresh fails
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

    console.log("Making request to:", url);
    const response = await fetch(url, requestOptions);
    clearTimeout(timeoutId);

    return await handleResponse(response);
  } catch (error) {
    console.error("Request failed:", error);

    // Handle token expiration with automatic refresh
    if (error.message === "TOKEN_EXPIRED" && !isRetry) {
      console.log("Token expired, attempting refresh...");
      try {
        const refreshResult = await refreshTokenDirect();
        if (refreshResult && refreshResult.session) {
          console.log("Token refreshed, retrying request...");

          // Retry the original request with new token
          return await makeRequest(endpoint, options, true);
        } else {
          // Refresh failed, clear tokens and redirect to login
          tokenStorage.clearAll();
          throw new Error("Authentication failed. Please log in again.");
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Clear tokens and redirect to login
        tokenStorage.clearAll();
        throw new Error("Authentication failed. Please log in again.");
      }
    }

    // Handle other authentication errors
    if (error.message.includes("Authentication failed") && !isRetry) {
      tokenStorage.clearAll();
      throw new Error("Authentication failed. Please log in again.");
    }

    if (error.name === "AbortError") {
      throw new Error("Request timeout. Please try again.");
    }

    // Handle network errors
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("fetch")
    ) {
      throw new Error(
        "Unable to connect to the server. Please check your internet connection and try again."
      );
    }

    // Re-throw other errors
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

  // Register user (phone is mandatory)
  register: async (userData) => {
    if (!userData.phone) {
      throw new Error("Phone number is required for signup.");
    }

    const response = await makeRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
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

    // Use direct fetch to avoid infinite loop with makeRequest
    const url = `${API_BASE_URL}/auth/refresh-token`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
      timeout: API_TIMEOUT,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Token refresh failed");
    }

    const data = await response.json();
    if (data.data && data.data.session) {
      tokenStorage.setToken(data.data.session.accessToken);
      tokenStorage.setRefreshToken(data.data.session.refreshToken);
    }

    return data.data;
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
 * API methods for user management (admin only)
 */
export const userAPI = {
  // Get all users with pagination and filters
  getAllUsers: async (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      search: params.search || "",
      role: params.role || "",
    }).toString();

    return await makeRequest(`/auth/users?${queryParams}`);
  },

  // Create new user
  createUser: async (userData) => {
    return await makeRequest("/auth/users", {
      method: "POST",
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        phone: userData.phone,
      }),
    });
  },

  // Update existing user
  updateUser: async (userId, userData) => {
    return await makeRequest(`/auth/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify({
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        phone: userData.phone,
      }),
    });
  },

  // Delete user
  deleteUser: async (userId) => {
    return await makeRequest(`/auth/users/${userId}`, {
      method: "DELETE",
    });
  },

  // Get user by ID
  getUserById: async (userId) => {
    return await makeRequest(`/auth/users/${userId}`);
  },
};

/**
 * API methods for store management (admin only)
 */
export const storeAPI = {
  // Get all stores with pagination and filters
  getAllStores: async (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      search: params.search || "",
      city: params.city || "",
    }).toString();

    return await makeRequest(`/stores?${queryParams}`);
  },

  // Create new store
  createStore: async (storeData) => {
    return await makeRequest("/stores", {
      method: "POST",
      body: JSON.stringify({
        name: storeData.name,
        address: storeData.address,
        city: storeData.city,
        country: storeData.country,
        postal_code: storeData.postal_code,
        phone: storeData.phone,
        email: storeData.email,
        is_active: storeData.is_active,
      }),
    });
  },

  // Update existing store
  updateStore: async (storeId, storeData) => {
    return await makeRequest(`/stores/${storeId}`, {
      method: "PUT",
      body: JSON.stringify({
        name: storeData.name,
        address: storeData.address,
        city: storeData.city,
        country: storeData.country,
        postal_code: storeData.postal_code,
        phone: storeData.phone,
        email: storeData.email,
        is_active: storeData.is_active,
      }),
    });
  },

  // Delete store
  deleteStore: async (storeId) => {
    return await makeRequest(`/stores/${storeId}`, {
      method: "DELETE",
    });
  },

  // Get store by ID
  getStoreById: async (storeId) => {
    return await makeRequest(`/stores/${storeId}`);
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

    // Failed to fetch errors (network/server issues)
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("fetch")
    ) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }

    // Timeout errors
    if (
      error.message.includes("timeout") ||
      error.message.includes("AbortError")
    ) {
      return "Request timed out. Please try again.";
    }

    // Authentication errors
    if (
      error.message.includes("Authentication failed") ||
      error.message.includes("401")
    ) {
      return "Your session has expired. Please log in again.";
    }

    // Server errors (5xx)
    if (
      error.message.includes("HTTP 5") ||
      error.message.includes("500") ||
      error.message.includes("502") ||
      error.message.includes("503")
    ) {
      return "Server error. Please try again later.";
    }

    // Client errors (4xx)
    if (
      error.message.includes("HTTP 4") ||
      error.message.includes("400") ||
      error.message.includes("403") ||
      error.message.includes("404")
    ) {
      if (error.message.includes("400")) {
        return "Invalid request. Please check your information and try again.";
      }
      if (error.message.includes("403")) {
        return "Access denied. You don't have permission to perform this action.";
      }
      if (error.message.includes("404")) {
        return "The requested resource was not found.";
      }
      return "Request error. Please check your information and try again.";
    }

    // Specific validation errors
    if (error.message.includes("Phone number is required")) {
      return "Phone number is required for signup.";
    }

    if (error.message.includes("email") && error.message.includes("already")) {
      return "An account with this email already exists. Please use a different email or try signing in.";
    }

    if (error.message.includes("password")) {
      return "Password must be at least 8 characters long and contain letters and numbers.";
    }

    // Return original error message if it's user-friendly
    if (
      error.message &&
      !error.message.includes("fetch") &&
      !error.message.includes("Failed to fetch")
    ) {
      return error.message;
    }

    // Generic fallback
    return "An unexpected error occurred. Please try again.";
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
