import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

export function LoginTest() {
  const { login, signup } = useAuth();
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult("Testing login...");

    try {
      const response = await login("testuser2@example.com", "TestPassword123!");
      setResult(`✅ Login successful! User: ${response.user.email}`);
    } catch (error) {
      setResult(`❌ Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSignup = async () => {
    setLoading(true);
    setResult("Testing signup...");

    try {
      const testEmail = `test-${Date.now()}@example.com`;
      const response = await signup({
        email: testEmail,
        password: "TestPassword123!",
        firstName: "Test",
        lastName: "User",
      });
      setResult(`✅ Signup successful! User: ${response.user.email}`);
    } catch (error) {
      setResult(`❌ Signup failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2em", maxWidth: "600px", margin: "0 auto" }}>
      <h2>🔐 Auth API Test</h2>
      <p>Testing login and signup with backend API</p>

      <div style={{ marginBottom: "1em" }}>
        <button
          onClick={testLogin}
          disabled={loading}
          style={{
            padding: "0.5em 1em",
            marginRight: "1em",
            background: "#667eea",
            color: "white",
            border: "none",
            borderRadius: "0.5em",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Testing..." : "Test Login"}
        </button>

        <button
          onClick={testSignup}
          disabled={loading}
          style={{
            padding: "0.5em 1em",
            background: "#764ba2",
            color: "white",
            border: "none",
            borderRadius: "0.5em",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Testing..." : "Test Signup"}
        </button>
      </div>

      {result && (
        <div
          style={{
            padding: "1em",
            background: result.includes("✅") ? "#d4edda" : "#f8d7da",
            border: `1px solid ${
              result.includes("✅") ? "#c3e6cb" : "#f5c6cb"
            }`,
            borderRadius: "0.5em",
            color: result.includes("✅") ? "#155724" : "#721c24",
          }}
        >
          <pre>{result}</pre>
        </div>
      )}

      <div style={{ marginTop: "2em", fontSize: "0.9em", color: "#666" }}>
        <h3>Test Credentials:</h3>
        <p>
          <strong>Email:</strong> testuser2@example.com
        </p>
        <p>
          <strong>Password:</strong> TestPassword123!
        </p>
      </div>
    </div>
  );
}
