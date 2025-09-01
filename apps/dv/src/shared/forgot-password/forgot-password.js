import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import "./forgot-password.css";

export function ForgotPassword() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await resetPassword(email.trim().toLowerCase());
      if (result.success) {
        setIsEmailSent(true);
      }
    } catch (err) {
      console.error("Password reset error:", err);
      setError(err.message || "Failed to send reset email");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/");
  };

  if (isEmailSent) {
    return (
      <div className="forgot-password-page">
        <div className="forgot-password-container">
          <div className="forgot-password-form">
            <div className="form-header">
              <div className="success-icon">📧</div>
              <h2>Check Your Email</h2>
              <p>We've sent a password reset link to <strong>{email}</strong></p>
            </div>

            <div className="email-sent-content">
              <p>
                Click the link in the email to reset your password. If you don't see the email,
                check your spam folder.
              </p>
              
              <div className="resend-info">
                <p>Didn't receive the email?</p>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setIsEmailSent(false);
                    setEmail("");
                  }}
                >
                  Try again with a different email
                </button>
              </div>
            </div>

            <button
              type="button"
              className="btn-full btn-secondary"
              onClick={handleBackToLogin}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-form">
          <div className="form-header">
            <h2>Forgot Password</h2>
            <p>Enter your email address and we'll send you a link to reset your password</p>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                disabled={isSubmitting}
                autoComplete="email"
                autoFocus
                className={error && error.includes('email') ? 'error' : ''}
              />
            </div>

            <button
              type="submit"
              className="btn-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="loading-text">Sending Reset Link...</span>
              ) : (
                <span>Send Reset Link</span>
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

export default ForgotPassword;
