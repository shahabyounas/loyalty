import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./reset-password.css";

export function ResetPassword() {
  const navigate = useNavigate();
  const { verifyResetToken, setNewPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(null);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [error, setError] = useState("");
  const [currentToken, setCurrentToken] = useState(null);
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false,
  });

  const accessToken = searchParams.get("access_token");

  useEffect(() => {
    // Debug: Log all URL parameters and hash
    console.log("Full URL:", window.location.href);
    console.log("Search params:", window.location.search);
    console.log("Hash:", window.location.hash);
    console.log("Access token from query:", accessToken);
    
    // Check if token is in hash fragment (common for Supabase)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hashAccessToken = hashParams.get("access_token");
    console.log("Access token from hash:", hashAccessToken);
    
    const tokenToUse = accessToken || hashAccessToken;
    
    if (tokenToUse) {
      setCurrentToken(tokenToUse);
      verifyToken(tokenToUse);
    } else {
      setError("Invalid reset link. Please request a new password reset.");
      setIsTokenValid(false);
    }
  }, [accessToken]);

  const verifyToken = async (token) => {
    try {
      const result = await verifyResetToken(token);
      if (result.success) {
        setIsTokenValid(true);
      }
    } catch (err) {
      console.error("Token verification error:", err);
      setError(err.message || "Invalid or expired reset token");
      setIsTokenValid(false);
    }
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.password) {
      errors.push("Password is required");
    } else if (formData.password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    } else {
      // Check for uppercase letter
      if (!/[A-Z]/.test(formData.password)) {
        errors.push("Password must contain at least one uppercase letter");
      }
      // Check for lowercase letter
      if (!/[a-z]/.test(formData.password)) {
        errors.push("Password must contain at least one lowercase letter");
      }
      // Check for number
      if (!/\d/.test(formData.password)) {
        errors.push("Password must contain at least one number");
      }
    }

    if (!formData.confirmPassword) {
      errors.push("Please confirm your password");
    } else if (formData.password !== formData.confirmPassword) {
      errors.push("Passwords do not match");
    }

    return errors;
  };

  const getPasswordStrength = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
    };
    
    const metRequirements = Object.values(requirements).filter(Boolean).length;
    return { requirements, metRequirements, total: 4 };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await setNewPassword(currentToken, formData.password);
      if (result.success) {
        setIsPasswordReset(true);
      }
    } catch (err) {
      console.error("Password reset error:", err);
      setError(err.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/");
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (isTokenValid === null) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-form">
            <div className="form-header">
              <h2>Verifying Reset Link...</h2>
              <div className="loading-spinner"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isTokenValid === false) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-form">
            <div className="form-header">
              <div className="error-icon">❌</div>
              <h2>Invalid Reset Link</h2>
              <p>This password reset link is invalid or has expired.</p>
            </div>

            <div className="error-content">
              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}
              
              <p>Please request a new password reset link to continue.</p>
            </div>

            <button
              type="button"
              className="btn-full"
              onClick={() => navigate("/auth/forgot-password")}
            >
              Request New Reset Link
            </button>

            <div className="form-footer">
              <button
                type="button"
                className="link-button"
                onClick={handleBackToLogin}
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isPasswordReset) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-form">
            <div className="form-header">
              <div className="success-icon">✅</div>
              <h2>Password Reset Successful</h2>
              <p>Your password has been successfully updated.</p>
            </div>

            <div className="success-content">
              <p>You can now log in with your new password.</p>
            </div>

            <button
              type="button"
              className="btn-full"
              onClick={handleBackToLogin}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-form">
          <div className="form-header">
            <h2>Reset Password</h2>
            <p>Enter your new password below</p>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <div className="password-input-container">
                <input
                  type={showPasswords.password ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your new password"
                  required
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  className={error && error.includes('Password') ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('password')}
                  disabled={isSubmitting}
                  aria-label={showPasswords.password ? "Hide password" : "Show password"}
                >
                  {showPasswords.password ? "🙈" : "👁️"}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="password-strength">
                  {(() => {
                    const strength = getPasswordStrength(formData.password);
                    return (
                      <div className="password-requirements">
                        <div className={`requirement ${strength.requirements.length ? 'met' : 'unmet'}`}>
                          {strength.requirements.length ? '✅' : '❌'} At least 8 characters
                        </div>
                        <div className={`requirement ${strength.requirements.uppercase ? 'met' : 'unmet'}`}>
                          {strength.requirements.uppercase ? '✅' : '❌'} One uppercase letter
                        </div>
                        <div className={`requirement ${strength.requirements.lowercase ? 'met' : 'unmet'}`}>
                          {strength.requirements.lowercase ? '✅' : '❌'} One lowercase letter
                        </div>
                        <div className={`requirement ${strength.requirements.number ? 'met' : 'unmet'}`}>
                          {strength.requirements.number ? '✅' : '❌'} One number
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <div className="password-input-container">
                <input
                  type={showPasswords.confirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your new password"
                  required
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  className={error && error.includes('match') ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  disabled={isSubmitting}
                  aria-label={showPasswords.confirmPassword ? "Hide password" : "Show password"}
                >
                  {showPasswords.confirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="loading-text">Resetting Password...</span>
              ) : (
                <span>Reset Password</span>
              )}
            </button>
          </form>

          <div className="form-footer">
            <p>
              Remember your password?{" "}
              <button
                type="button"
                className="link-button"
                onClick={handleBackToLogin}
                disabled={isSubmitting}
              >
                Back to Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
