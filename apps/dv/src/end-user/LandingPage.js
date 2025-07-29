import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ParticleBackground } from "../../../../libs/animations";
import "./LandingPage.css";

function LandingPage() {
  const heroRef = useRef(null);
  const { isAuthenticated, isLoading, login, signup } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (isAuthenticated && !isLoading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="landing-page">
        <ParticleBackground />
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // Don't render the full landing page for authenticated users
  if (isAuthenticated) {
    return null;
  }

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

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await signup(formData);
      }
      // Success - user will be redirected by useEffect
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError("");
    setFormData({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    });
  };

  return (
    <div className="landing-page">
      {/* Animated Background */}
      <ParticleBackground />

      {/* Hero Section with Auth Forms */}
      <section className="hero-section" ref={heroRef}>
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                <span className="title-line">The Future of</span>
                <span className="title-line highlight">AI Development</span>
                <span className="title-line">is Here</span>
              </h1>

              <p className="hero-subtitle">
                Unleash the power of artificial intelligence with our
                cutting-edge platform. Build, deploy, and scale AI solutions
                that transform industries.
              </p>
            </div>

            <div className="auth-form-container">
              <div className="auth-form">
                <div className="form-header">
                  <h2>{isLogin ? "Welcome Back" : "Join Us"}</h2>
                  <p>
                    {isLogin
                      ? "Sign in to your account"
                      : "Create your account"}
                  </p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                  {!isLogin && (
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="firstName">First Name</label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required={!isLogin}
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
                          required={!isLogin}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  )}

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

                  <button
                    type="submit"
                    className="btn-primary btn-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="loading-text">Processing...</span>
                    ) : (
                      <span>{isLogin ? "Sign In" : "Create Account"}</span>
                    )}
                  </button>
                </form>

                <div className="form-footer">
                  <p>
                    {isLogin
                      ? "Don't have an account?"
                      : "Already have an account?"}
                    <button
                      type="button"
                      className="link-button"
                      onClick={toggleForm}
                      disabled={isSubmitting}
                    >
                      {isLogin ? "Sign up" : "Sign in"}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose AIConsole?</h2>
            <p className="section-subtitle">
              Experience the next generation of AI development with our
              comprehensive platform
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3>Intelligent Automation</h3>
              <p>
                Streamline your workflow with AI-powered automation that learns
                and adapts to your needs.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3>Lightning Fast</h3>
              <p>
                Experience blazing-fast performance with our optimized AI
                algorithms and infrastructure.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3>Enterprise Security</h3>
              <p>
                Bank-grade security with end-to-end encryption and compliance
                with industry standards.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3>User-Friendly</h3>
              <p>
                Intuitive interface designed for both beginners and advanced AI
                developers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">99.9%</div>
              <div className="stat-label">Uptime</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">10M+</div>
              <div className="stat-label">API Calls</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50K+</div>
              <div className="stat-label">Developers</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Transform Your AI Journey?</h2>
            <p>
              Join thousands of developers building the future with AIConsole
            </p>
            <div className="cta-actions">
              <button className="btn-primary btn-large">
                Get Started Free
              </button>
              <button className="btn-outline btn-large">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
