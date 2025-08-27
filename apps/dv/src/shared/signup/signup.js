import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import PhoneInput from "../components/PhoneInput";
import "./signup.css";

export function Signup({ onToggleToLogin, isEmbedded = false }) {
  const { signup, authErrors, clearAuthErrors } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "+44 ",
  });
  const [localErrors, setLocalErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  });

  // Clear errors when component mounts
  useEffect(() => {
    return () => {
      clearAuthErrors();
      setLocalErrors([]);
    };
  }, [clearAuthErrors]);

  // Calculate password strength
  useEffect(() => {
    const calculatePasswordStrength = (password) => {
      let score = 0;
      const feedback = [];

      if (password.length >= 8) {
        score += 1;
      } else {
        feedback.push("At least 8 characters");
      }

      if (/[a-z]/.test(password)) {
        score += 1;
      } else {
        feedback.push("Include lowercase letters");
      }

      if (/[A-Z]/.test(password)) {
        score += 1;
      } else {
        feedback.push("Include uppercase letters");
      }

      if (/[0-9]/.test(password)) {
        score += 1;
      } else {
        feedback.push("Include numbers");
      }

      if (/[^A-Za-z0-9]/.test(password)) {
        score += 1;
      } else {
        feedback.push("Include special characters");
      }

      return { score, feedback };
    };

    if (formData.password) {
      setPasswordStrength(calculatePasswordStrength(formData.password));
    } else {
      setPasswordStrength({ score: 0, feedback: [] });
    }
  }, [formData.password]);

  const validateForm = () => {
    const errors = [];
    
    // Name validation
    if (!formData.firstName.trim()) {
      errors.push("First name is required");
    } else if (formData.firstName.trim().length < 2) {
      errors.push("First name must be at least 2 characters");
    }

    if (!formData.lastName.trim()) {
      errors.push("Last name is required");
    } else if (formData.lastName.trim().length < 2) {
      errors.push("Last name must be at least 2 characters");
    }
    
    // Email validation
    if (!formData.email.trim()) {
      errors.push("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("Please enter a valid email address");
    }
    
    // Password validation
    if (!formData.password) {
      errors.push("Password is required");
    } else if (passwordStrength.score < 3) {
      errors.push("Password is too weak. " + passwordStrength.feedback.join(", "));
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.push("Please confirm your password");
    } else if (formData.password !== formData.confirmPassword) {
      errors.push("Passwords do not match");
    }
    
    // Phone validation
    if (!formData.phone || formData.phone.trim() === "+44 " || formData.phone.trim().length < 8) {
      errors.push("Please enter a valid phone number");
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
      const userData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
      };
      
      await signup(userData);
      
      // Success - user will be redirected
      if (!isEmbedded) {
        navigate("/home");
      }
    } catch (err) {
      console.error("Signup error:", err);
      // Error is handled by AuthContext and will appear in authErrors
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleToLogin = () => {
    clearAuthErrors();
    setLocalErrors([]);
    
    if (isEmbedded && onToggleToLogin) {
      onToggleToLogin();
    } else {
      navigate("/auth/login");
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 1) return '#ef4444'; // red
    if (passwordStrength.score <= 2) return '#f97316'; // orange
    if (passwordStrength.score <= 3) return '#eab308'; // yellow
    if (passwordStrength.score <= 4) return '#22c55e'; // green
    return '#16a34a'; // dark green
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 1) return 'Weak';
    if (passwordStrength.score <= 2) return 'Fair';
    if (passwordStrength.score <= 3) return 'Good';
    if (passwordStrength.score <= 4) return 'Strong';
    return 'Very Strong';
  };

  // Combine all errors
  const allErrors = [...localErrors, ...authErrors.map(e => e.message)];

  return (
    <div className="signup-container">
      <div className="signup-form">
        <h2>Create Account</h2>
        
        {/* Error Display */}
        {allErrors.length > 0 && (
          <div className="error-container">
            {allErrors.map((error, index) => (
              <div key={index} className="error-message">
                {error}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="signup-form-content">
          {/* Name Fields */}
          <div className="name-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="form-input"
                disabled={isSubmitting}
                autoComplete="given-name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="form-input"
                disabled={isSubmitting}
                autoComplete="family-name"
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="form-input"
              disabled={isSubmitting}
              autoComplete="email"
              placeholder="your@email.com"
            />
          </div>

          {/* Phone Field */}
          <div className="form-group">
            <PhoneInput
              value={formData.phone}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, phone: value }))
              }
              disabled={isSubmitting}
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="form-input password-input"
                disabled={isSubmitting}
                autoComplete="new-password"
                placeholder="Enter a strong password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                tabIndex={0}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="password-strength">
                <div className="password-strength-bar">
                  <div 
                    className="password-strength-fill"
                    style={{
                      width: `${(passwordStrength.score / 5) * 100}%`,
                      backgroundColor: getPasswordStrengthColor()
                    }}
                  />
                </div>
                <span 
                  className="password-strength-text"
                  style={{ color: getPasswordStrengthColor() }}
                >
                  {getPasswordStrengthText()}
                </span>
                {passwordStrength.feedback.length > 0 && (
                  <div className="password-feedback">
                    {passwordStrength.feedback.join(", ")}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="form-input password-input"
                disabled={isSubmitting}
                autoComplete="new-password"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isSubmitting}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                aria-pressed={showConfirmPassword}
                tabIndex={0}
              >
                {showConfirmPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <div className="password-mismatch">
                Passwords do not match
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Toggle to Login */}
        <div className="auth-toggle">
          <p>
            Already have an account?{" "}
            <button
              type="button"
              className="link-button"
              onClick={handleToggleToLogin}
              disabled={isSubmitting}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
