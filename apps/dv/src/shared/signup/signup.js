import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import PhoneInput from "../components/PhoneInput";
import "./signup.css";

export function Signup({ onToggleToLogin, isEmbedded = false }) {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "+44 ",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(""); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Client-side validation
    if (!formData.firstName.trim()) {
      setError("First name is required.");
      setIsSubmitting(false);
      return;
    }

    if (!formData.lastName.trim()) {
      setError("Last name is required.");
      setIsSubmitting(false);
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required.");
      setIsSubmitting(false);
      return;
    }

    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address.");
      setIsSubmitting(false);
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsSubmitting(false);
      return;
    }

    if (!formData.phone || formData.phone.trim() === "+44 ") {
      setError("Please enter a valid phone number.");
      setIsSubmitting(false);
      return;
    }

    try {
      await signup(formData);
      // Success - user will be redirected to home page
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleToLogin = () => {
    if (isEmbedded && onToggleToLogin) {
      onToggleToLogin();
    } else {
      navigate("/auth/login");
    }
  };

  return (
    <div className="signup-form">
      <div className="form-header">
        <h2>Join Us</h2>
        <p>Create your account</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
          />
        </div>

        <PhoneInput
          value={formData.phone}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, phone: value }))
          }
          error={error}
          disabled={isSubmitting}
          required
        />

        <button
          type="submit"
          className="btn-primary btn-submit-signup"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="loading-text">Processing...</span>
          ) : (
            <div>Create Account</div>
          )}
        </button>
      </form>

      <div className="form-footer">
        <p>
          Already have an account?{" "}
          <button
            type="button"
            className="link-button"
            onClick={handleToggleToLogin}
            disabled={isSubmitting}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

export default Signup;
