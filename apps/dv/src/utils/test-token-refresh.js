// Test script for token refresh functionality
import { tokenStorage, isTokenExpiringSoon } from "./jwt.js";
import { storeAPI } from "./api.js";

// Mock token for testing
const mockToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

// Test token storage
console.log("Testing token storage...");
tokenStorage.setToken(mockToken);
const storedToken = tokenStorage.getToken();
console.log("Stored token:", storedToken === mockToken ? "✅ PASS" : "❌ FAIL");

// Test token expiration check
console.log("\nTesting token expiration check...");
const isExpiring = isTokenExpiringSoon(mockToken);
console.log("Token expiring soon:", isExpiring ? "✅ YES" : "❌ NO");

// Test API call with token refresh
console.log("\nTesting API call with token refresh...");
try {
  const result = await storeAPI.getAllStores();
  console.log("API call successful:", result ? "✅ PASS" : "❌ FAIL");
} catch (error) {
  console.log("API call failed (expected if no valid token):", error.message);
}

console.log("\nToken refresh functionality test completed!");
