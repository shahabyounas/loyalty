import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import "./login.css";

export function Login({ onToggleToSignup, isEmbedded = false }) {
  const { 
    login, 
    isLocked, 
    authErrors, 
    clearAuthErrors, 
    getRemainingLockoutTime,
    getRemainingAttempts 
  } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [localErrors, setLocalErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  // Update remaining lockout time
  useEffect(() => {
    if (isLocked) {
      const updateTimer = () => {
        const remaining = getRemainingLockoutTime();
        setRemainingTime(remaining);
        
        if (remaining <= 0) {
          clearInterval(timer);
        }
      };
      
      updateTimer();
      const timer = setInterval(updateTimer, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isLocked, getRemainingLockoutTime]);

  // Clear errors when component mounts or user starts typing
  useEffect(() => {
    return () => {
      clearAuthErrors();
      setLocalErrors([]);
    };
  }, [clearAuthErrors]);

  const validateForm = () => {
    const errors = [];
    
    if (!formData.email.trim()) {
      errors.push("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("Please enter a valid email address");
    }
    
    if (!formData.password) {
      errors.push("Password is required");
    } else if (formData.password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    
    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear errors when user starts typing
    setLocalErrors([]);
    clearAuthErrors();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLocked) {
      return;
    }
    
    setIsSubmitting(true);
    setLocalErrors([]);
    clearAuthErrors();

    // Client-side validation
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setLocalErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await login(formData.email.trim().toLowerCase(), formData.password);
      // Success - user will be redirected
      if (!isEmbedded) {
        navigate("/home");
      }
    } catch (err) {
      console.error("Login error:", err);
      // Error is handled by AuthContext and will appear in authErrors
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleToSignup = () => {
    clearAuthErrors();
    setLocalErrors([]);
    
    if (isEmbedded && onToggleToSignup) {
      onToggleToSignup();
    } else {
      navigate("/auth/signup");
    }
  };

  const formatRemainingTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Combine all errors
  const allErrors = [...localErrors, ...authErrors.map(e => e.message)];

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-form">
          <div className="form-header">
            <h2>Welcome Back</h2>
            <p>Sign in to your account</p>
          </div>

          {/* Lockout Warning */}
          {isLocked && (
            <div className="lockout-message">
              <div className="lockout-icon">🔒</div>
              <div className="lockout-content">
                <h4>Account Temporarily Locked</h4>
                <p>Too many failed login attempts.</p>
                <p className="lockout-timer">
                  Try again in: <strong>{formatRemainingTime(remainingTime)}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Error Messages */}
          {allErrors.length > 0 && (
            <div className="error-messages">
              {allErrors.map((error, index) => (
                <div key={index} className="error-message">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              ))}
            </div>
          )}

          {/* Attempts Warning */}
          {!isLocked && getRemainingAttempts() <= 2 && getRemainingAttempts() > 0 && (
            <div className="attempts-warning">
              <span className="warning-icon">⚠️</span>
              Warning: {getRemainingAttempts()} attempts remaining before account lockout
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
                disabled={isSubmitting || isLocked}
                autoComplete="email"
                className={localErrors.some(e => e.includes('email')) ? 'error' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                  disabled={isSubmitting || isLocked}
                  autoComplete="current-password"
                  className={localErrors.some(e => e.includes('Password')) ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting || isLocked}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  tabIndex={0}
                >
                  {showPassword ? "�" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`btn-full ${isLocked ? 'locked' : ''}`}
              disabled={isSubmitting || isLocked}
            >
              {isSubmitting ? (
                <span className="loading-text">Signing In...</span>
              ) : isLocked ? (
                <span>Account Locked</span>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="form-footer">
            <p>
              Don't have an account?{" "}
              <button
                type="button"
                className="link-button"
                onClick={handleToggleToSignup}
                disabled={isSubmitting}
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
